'use client'; // Required for App Router

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // or 'next/router' for Pages Router
import { useUser } from '@supabase/auth-helpers-react'; // If you've set up a context provider
import { createClient } from '@/lib/supabase/client'; // Your client-side Supabase instance

// Define a type for your profile data for type safety
type Profile = {
  id: string;
  full_name: string | null;
  // add other profile fields here
};

export default function DashboardPage() {
  const supabase = createClient();
  const user = useUser(); // A simple way to get the user if you've wrapped your app in SessionContextProvider
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if user is not logged in
    // A server-side check is more robust, but this is a good client-side start
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
        }
    };

    checkUser();

    // Fetch profile data
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
            throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  if (loading) {
    return <div>Loading your dashboard...</div>;
  }

  if (!profile) {
    return <div>Could not load profile. Please try logging in again.</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {profile.full_name || 'User'}!</p>
      <p>Your User ID is: {profile.id}</p>
    </div>
  );
}
'use client';

import { useEffect, useState, FormEvent } from 'react';

// Define a type for your Project
type Project = {
  id: number;
  name: string;
  user_id: string;
  created_at: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  // Function to fetch projects
  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  };

  // Fetch projects on initial load
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle form submission to create a new project
  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName }),
    });

    if (res.ok) {
      setNewProjectName('');
      fetchProjects(); // Re-fetch projects to update the list
    }
  };

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div>
      <h1>Your Projects</h1>

      {/* Create Project Form */}
      <form onSubmit={handleCreateProject}>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name"
          required
        />
        <button type="submit">Create Project</button>
      </form>

      {/* Projects List */}
      <hr style={{ margin: '24px 0' }} />
      {projects.length === 0 ? (
        <p>You don't have any projects yet. Create one!</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>{project.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState, FormEvent } from 'react';

type Project = {
  id: number;
  name: string;
  description: string | null; // Add description to the type
  // ... other fields
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch projects (no changes needed here)
  const fetchProjects = async () => { /* ... */ };
  useEffect(() => { fetchProjects(); }, []);

  // Handle project creation (no changes needed here)
  const handleCreateProject = async (e: FormEvent) => { /* ... */ };

  // --- ADD THIS NEW HANDLER ---
  const handleGenerateDescription = async (projectId: number) => {
    // Find the project in state and temporarily disable its button to prevent double-clicks
    // (Optional but good UX)

    const res = await fetch(`/api/projects/${projectId}/generate-description`, {
      method: 'POST',
    });

    if (res.ok) {
      const updatedProject = await res.json();
      // Update the specific project in our state
      setProjects(currentProjects =>
        currentProjects.map(p => (p.id === projectId ? updatedProject : p))
      );
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Your Projects</h1>
      <form onSubmit={handleCreateProject}>{/* ... */}</form>
      <hr style={{ margin: '24px 0' }} />
      {projects.length === 0 ? (
        <p>You don't have any projects yet.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id} style={{ marginBottom: '16px' }}>
              <strong>{project.name}</strong>
              {/* Display the description if it exists */}
              {project.description && (
                <p style={{ fontStyle: 'italic', color: '#ccc' }}>{project.description}</p>
              )}
              {/* Add the AI button */}
              <button onClick={() => handleGenerateDescription(project.id)}>
                Generate Description
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
// app/dashboard/page.tsx
'use client';

import Link from 'next/link';
// ... other imports

// ... inside your component's return statement
<ul>
  {projects.map((project) => (
    <li key={project.id} style={{ marginBottom: '16px' }}>
      <Link href={`/project/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <strong>{project.name}</strong>
      </Link>
      {/* ... rest of your list item content */}
    </li>
  ))}
</ul>