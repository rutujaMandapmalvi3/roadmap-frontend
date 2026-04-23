// contains functions that call your Express backend
//  fetch() → sends request + waits → gets raw response → check if ok → parse body → return JS object

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function generateRoadmap(formData: {
    userId: string;
    topic: string;
    currentLevel: string;
    timeframe: string;
    goal: string;
}) {
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT token from login
        },
        body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to generate roadmap');
    return response.json();
}

