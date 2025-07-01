import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/server/db'; // Adjust path to your Drizzle instance
import { profiles } from '@/server/db/schema'; // Adjust path to your Drizzle schema
import { eq } from 'drizzle-orm';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // If no session, return unauthorized error
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Fetch the profile data from your database using Drizzle
  const [userProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id));

  return NextResponse.json(userProfile || null);
}