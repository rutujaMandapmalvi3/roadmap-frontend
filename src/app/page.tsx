'use client'

// PIPELINE:
// 1. useAuth() runs on mount — redirects to /login if no token
//
// 2. useEffect fetches GET /conversations on load
//    → if results exist: show past roadmap list + "Create New" toggle
//    → if empty: show form directly (new user)
//
// 3. "Create New" button reveals the form for returning users
//
// 4. Form submit → POST /chat → backend generates roadmap → navigate to /roadmap
//
// 5. Clicking a past roadmap card → GET /conversations/:id → navigate to /roadmap

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import { generateRoadmap, getMyRoadmaps } from '@/lib/api'
import { useAuth } from '@/lib/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type PastRoadmap = {
  _id: string
  topic: string
  createdAt: string
  updatedAt: string
}

export default function Home() {
  useAuth()

  const router = useRouter()
  const [form, setForm] = useState({ topic: '', currentLevel: '', timeframe: '', goal: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pastRoadmaps, setPastRoadmaps] = useState<PastRoadmap[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getMyRoadmaps()
      .then(data => {
        setPastRoadmaps(data)
        // new user (no history) → show form immediately
        if (data.length === 0) setShowForm(true)
      })
      .catch(() => setShowForm(true)) // fallback: show form if fetch fails
      .finally(() => setLoadingHistory(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await generateRoadmap(form)
      router.push(`/roadmap?data=${encodeURIComponent(JSON.stringify(data))}&conversationId=${data._id}`)
    } catch {
      setError('Failed to generate roadmap. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenPastRoadmap(id: string) {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/conversations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/roadmap?data=${encodeURIComponent(JSON.stringify(data))}&conversationId=${data._id}`)
    } catch {
      setError('Failed to load roadmap. Please try again.')
    }
  }

  async function handleLogout() {
    await signOut()
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loadingHistory) return <p>Loading...</p>

  return (
    <main>
      <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>
      <h1>myMap - Learning Path Planner</h1>

      {pastRoadmaps.length > 0 && (
        <section>
          <h2>Your Roadmaps</h2>
          <ul>
            {pastRoadmaps.map(r => (
              <li key={r._id} style={{ marginBottom: '8px' }}>
                <button onClick={() => handleOpenPastRoadmap(r._id)}>
                  {r.topic} — last updated {new Date(r.updatedAt).toLocaleDateString()}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Hide Form' : 'Create New Roadmap'}
          </button>
        </section>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <input name="topic" placeholder="What do you want to learn?" onChange={handleChange} />
          <select name="currentLevel" onChange={handleChange}>
            <option value="">Select level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <input name="timeframe" placeholder="Timeframe (e.g. 3 months)" onChange={handleChange} />
          <textarea name="goal" placeholder="What's your goal?" onChange={handleChange} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Roadmap'}
          </button>
        </form>
      )}

      {error && !showForm && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  )
}
