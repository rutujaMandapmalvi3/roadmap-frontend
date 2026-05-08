// contains functions that call your Express backend
// fetch() → sends request + waits → gets raw response → checks if ok → parses body → returns JS object

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function generateRoadmap(formData: {
    topic: string;
    currentLevel: string;
    timeframe: string;
    goal: string;
}) {
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // attach the Cognito ID token — backend verifies this to identify the user
            // userId is no longer sent in the body; backend extracts it from this token
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to generate roadmap');
    return response.json();
}

export async function getMyRoadmaps(): Promise<{ _id: string; topic: string; createdAt: string; updatedAt: string }[]> {
    const response = await fetch(`${API_URL}/conversations`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch roadmaps');
    return response.json();
}

export async function sendFollowUp(formData: {
    conversationId: string;
    followUpMessage: string;
}){
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ conversationId: formData.conversationId, followUpMessage: formData.followUpMessage })
    });

    if (!response.ok) throw new Error('Failed to send follow-up');
    return response.json();
}
