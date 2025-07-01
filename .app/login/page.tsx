'use client'; // Required for App Router

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client'; // Adjust path for your setup
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Or 'next/router' for Pages Router

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/'); // Redirect to home page after sign-in
        router.refresh(); // Ensure server components are re-rendered
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div style={{ maxWidth: '420px', margin: '96px auto' }}>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['github', 'google']} // Optional: Add social logins
        theme="dark"
      />
    </div>
  );
}