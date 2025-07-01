// app/api/projects/[id]/generate-description/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const projectId = parseInt(params.id, 10);

    // 1. Fetch the project to ensure user owns it and get its name
    const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));

    if (!project || project.userId !== session.user.id) {
        return new NextResponse(JSON.stringify({ error: 'Project not found or access denied' }), { status: 404 });
    }

    // 2. Call OpenAI to generate a description
    const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // A fast and capable model
        messages: [{
            role: 'user',
            content: `Generate a short, creative, one-paragraph description for a project named "${project.name}".`
        }],
        max_tokens: 150,
    });

    const newDescription = aiResponse.choices[0].message.content;

    if (!newDescription) {
        return new NextResponse(JSON.stringify({ error: 'Failed to generate description' }), { status: 500 });
    }

    // 3. Update the project in the database with the new description
    const [updatedProject] = await db
        .update(projects)
        .set({ description: newDescription })
        .where(eq(projects.id, projectId))
        .returning();

    return NextResponse.json(updatedProject);
}