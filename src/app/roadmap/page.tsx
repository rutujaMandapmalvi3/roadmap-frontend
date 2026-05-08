// Reads roadmap JSON and conversationId from URL search params,
// renders it as a React Flow graph (phases on the left, milestones on the right),
// and provides a follow-up form that updates the roadmap in place.

'use client'

import { useState } from 'react'
import { ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { sendFollowUp } from '@/lib/api'

import { useSearchParams } from 'next/navigation'

export default function Roadmap() {
    const searchParams = useSearchParams()
    const raw = searchParams.get('data')
    const conversationId = searchParams.get('conversationId')
    const parsed = raw ? JSON.parse(decodeURIComponent(raw)) : null
    const [roadmap, setRoadmap] = useState(parsed?.roadmap ?? null)

    const [followUpMessage, setFollowUpMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    console.log('roadmap:', roadmap)

    if (!roadmap) return <p>No roadmap data found.</p>

    /** Converts a roadmap object into React Flow nodes and edges. Phases on x=0, milestones on x=300. */
    function buildGraph(roadmap: any) {
        const nodes: any[] = []
        const edges: any[] = []
        let y = 0

        roadmap.phases.forEach((phase: any, phaseIndex: number) => {
            const phaseId = `phase-${phaseIndex}`
            nodes.push({ id: phaseId, position: { x: 0, y }, data: { label: `${phase.title} (${phase.duration})` } })
            y += 100

            phase.milestones.forEach((milestone: any, mi: number) => {
                const milestoneId = `milestone-${phaseIndex}-${mi}`
                nodes.push({ id: milestoneId, position: { x: 300, y }, data: { label: milestone.title } })
                edges.push({ id: `e-${phaseId}-${milestoneId}`, source: phaseId, target: milestoneId })
                y += 100
            })
        })

        return { nodes, edges }
    }


  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await sendFollowUp({ conversationId: conversationId??'', followUpMessage: followUpMessage })
      setRoadmap(data.roadmap)
    } catch (err) {
      setError('Failed to send follow-up. Please try again.')
    } finally {
      setLoading(false)
    }
  }
    const { nodes, edges } = buildGraph(roadmap)

    return (
        <main style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow nodes={nodes} edges={edges} fitView />
            <form onSubmit={handleFollowUp}>
                <input name="followUpMessage" placeholder="Ask a follow-up question..." onChange={(e) => setFollowUpMessage(e.target.value)} />
                <button type="submit" disabled={loading || !followUpMessage}>
                    {loading ? 'Sending...' : 'Send Follow-Up'}
                </button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </main>
    )
}