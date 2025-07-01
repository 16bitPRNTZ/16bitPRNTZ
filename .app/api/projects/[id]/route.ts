// app/api/projects/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { projects } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const projectId = parseInt(params.id, 10);

    const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)));

    if (!project) {
        return new NextResponse('Project not found', { status: 404 });
    }

    return NextResponse.json(project);
}