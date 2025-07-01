'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';

type Message = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
};

export default function ProjectChatPage({ params }: { params: { id: string } }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const projectId = params.id;

    // Scroll to the bottom of the messages list
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch initial chat history
    useEffect(() => {
        const fetchHistory = async () => {
            const res = await fetch(`/api/projects/${projectId}/messages`);
            const data = await res.json();
            setMessages(data);
        };
        fetchHistory();
    }, [projectId]);

    // Handle sending a new message
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const res = await fetch(`/api/projects/${projectId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: input }),
        });

        if (res.ok) {
            const aiMessage = await res.json();
            setMessages(prev => [...prev, aiMessage]);
        }
        setIsLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '90vh', maxWidth: '768px', margin: 'auto' }}>
            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '16px' }}>Chat for Project {projectId}</h1>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                        margin: '8px 0',
                    }}>
                        <span style={{
                            background: msg.role === 'user' ? '#007bff' : '#333',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '16px',
                            display: 'inline-block',
                        }}>
                            {msg.content}
                        </span>
                    </div>
                ))}
                {isLoading && <div>Assistant is thinking...</div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', padding: '16px', borderTop: '1px solid #333' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your agent anything..."
                    style={{ flex: 1, padding: '8px', marginRight: '8px' }}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
        </div>
    );
}
'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';

// ... (keep Message type)

type Project = {
    id: number;
    name: string;
};

export default function ProjectChatPage({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<Project | null>(null); // State for project details
    const [messages, setMessages] = useState<Message[]>([]);
    // ... (other state variables)

    const projectId = params.id;

    // ... (keep scrollToBottom and useEffect for scrolling)

    useEffect(() => {
        const fetchProjectDetails = async () => {
            const res = await fetch(`/api/projects/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            }
        };

        const fetchHistory = async () => { /* ... */ };

        fetchProjectDetails();
        fetchHistory();
    }, [projectId]);

    const handleSubmit = async (e: FormEvent) => {
        // ... (keep existing handleSubmit logic)

        // When the AI responds, re-fetch project details in case it was renamed
        if (res.ok) {
            // ... (update messages state)
            const projectRes = await fetch(`/api/projects/${projectId}`);
            if (projectRes.ok) {
                const data = await res.json();
                setProject(data);
            }
        }
        // ...
    };

    return (
        <div style={{ /* ... */ }}>
            {/* Use dynamic project name in the header */}
            <h1 style={{ /* ... */ }}>
                Chat for Project: {project ? project.name : projectId}
            </h1>
            {/* ... (rest of the chat UI is the same) */}
        </div>
    );
}