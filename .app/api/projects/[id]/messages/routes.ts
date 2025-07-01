// app/api/projects/[id]/messages/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages, projects } from '@/server/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET chat history for a project
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const projectId = parseInt(params.id, 10);

    const chatHistory = await db.query.messages.findMany({
        where: and(
            eq(messages.projectId, projectId)
            // We should also ensure the user owns the project here in a real app
        ),
        orderBy: [asc(messages.createdAt)],
    });

    return NextResponse.json(chatHistory);
}

// POST a new message and get AI response
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const projectId = parseInt(params.id, 10);
    const { content } = await request.json();

    // 1. Save the user's new message to the database
    await db.insert(messages).values({
        projectId,
        content,
        role: 'user',
        // No need to specify userId here as project ownership implies message ownership
    });

    // 2. Retrieve the full conversation history
    const conversationHistory = await db.query.messages.findMany({
        where: eq(messages.projectId, projectId),
        orderBy: [asc(messages.createdAt)],
    });

    // 3. Call OpenAI with the full conversation context
    const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationHistory.map(({ role, content }) => ({ role, content })),
    });

    const aiContent = aiResponse.choices[0].message.content || 'Sorry, I could not generate a response.';

    // 4. Save the AI's response to the database
    const [newAiMessage] = await db.insert(messages).values({
        projectId,
        content: aiContent,
        role: 'assistant',
    }).returning();

    return NextResponse.json(newAiMessage);
}
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const projectId = parseInt(params.id, 10);
    const { content: userInput } = await request.json();

    // 1. Save user's message
    await db.insert(messages).values({ projectId, content: userInput, role: 'user' });

    // 2. Define the tool(s) the AI can use
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
            type: 'function',
            function: {
                name: 'rename_project',
                description: 'Renames the current project to a new name provided by the user.',
                parameters: {
                    type: 'object',
                    properties: {
                        newName: {
                            type: 'string',
                            description: 'The new name for the project.',
                        },
                    },
                    required: ['newName'],
                },
            },
        },
    ];

    // 3. Make the initial call to OpenAI
    const conversationHistory = await db.query.messages.findMany({ where: eq(messages.projectId, projectId), orderBy: [asc(messages.createdAt)] });

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationHistory.map(({ role, content }) => ({ role, content })),
        tools: tools,
        tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // 4. Check if the AI wants to use a tool
    if (toolCalls) {
        // Save the AI's intent to call a tool
        await db.insert(messages).values({ projectId, content: JSON.stringify(toolCalls), role: 'assistant' });

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            if (functionName === 'rename_project') {
                // --- EXECUTE THE TOOL ---
                await db.update(projects)
                    .set({ name: functionArgs.newName })
                    .where(eq(projects.id, projectId));

                // --- SEND RESULT BACK TO AI ---
                const toolResponseMessage = {
                    tool_call_id: toolCall.id,
                    role: 'tool' as const,
                    name: functionName,
                    content: JSON.stringify({ status: 'success', newName: functionArgs.newName }),
                };

                // Save the tool's result to the history
                await db.insert(messages).values({ projectId, content: toolResponseMessage.content, role: 'tool' });

                // Call OpenAI *again* with the tool's result to get a natural language response
                const finalHistory = [...conversationHistory, responseMessage, toolResponseMessage];
                const finalResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: finalHistory.map(({ role, content }) => ({ role, content })),
                });

                const finalContent = finalResponse.choices[0].message.content;
                const [newAiMessage] = await db.insert(messages).values({ projectId, content: finalContent, role: 'assistant' }).returning();
                return NextResponse.json(newAiMessage);
            }
        }
    }