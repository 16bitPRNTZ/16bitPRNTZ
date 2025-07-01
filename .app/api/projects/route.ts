// app/api/projects/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// GET all projects for the current user
export async function GET() {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, session.user.id),
    });

    return NextResponse.json(userProjects);
}

// POST a new project for the current user
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
        return new NextResponse(JSON.stringify({ error: 'Project name is required' }), { status: 400 });
    }

    const [newProject] = await db
        .insert(projects)
        .values({ name, userId: session.user.id })
        .returning();

    return NextResponse.json(newProject);
}