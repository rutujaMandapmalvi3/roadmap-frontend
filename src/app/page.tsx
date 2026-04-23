'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateRoadmap } from '@/lib/api'

// PIPELINE:                                                                                                                                
// 1. User types in any field → onChange fires → handleChange is called
//    handleChange reads which field changed (e.target.name) and what was typed (e.target.value)                                            
//    spreads existing form state, updates only that one field → setForm stores it                                                          
//                                                                                                                                          
// 2. User clicks "Generate Roadmap" → onSubmit fires → handleSubmit is called                                                              
//    e.preventDefault() stops the browser from reloading the page                                                                          
//                                                                                                                                          
// 3. handleSubmit calls generateRoadmap(form) from api.ts
//    api.ts sends a POST request to the Express backend with the form data                                                                 
//    waits for the backend to call OpenAI and return a roadmap JSON                                                                        
//
// 4. roadmap JSON received → router.push navigates to /roadmap page                                                                        
//    data is encoded and passed in the URL so the roadmap page can read and display it 

export default function Home() {
  const router = useRouter()
  const [form, setForm] = useState({
    userId: 'temp-user',
    topic: '',
    currentLevel: '',
    timeframe: '',
    goal: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // user types → e fires → spread existing form + update one field → setForm
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // user submits → stop reload → call backend → get roadmap → navigate to /roadmap with data   
  async function handleSubmit(e: React.FormEvent) {                                                                                           
    e.preventDefault()                                                                                                                        
    setLoading(true)                                                                                                                          
    setError('')                                            
    try {
      const data = await generateRoadmap(form)
      router.push(`/roadmap?data=${encodeURIComponent(JSON.stringify(data))}`)
    } catch (err) {                                                                                                                           
      setError('Failed to generate roadmap. Please try again.')
    } finally {                                                                                                                               
      setLoading(false)                                     
    }                                                                                                                                         
  }

  return (
    <main>
      <h1>myMap - Learning Path Planner</h1>
      <form onSubmit={handleSubmit}>
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
    </main>
  )
}