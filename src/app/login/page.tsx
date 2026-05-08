'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, fetchAuthSession } from 'aws-amplify/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // signIn() talks to Cognito and validates credentials
      // if wrong password/username, it throws and we catch below
      await signIn({ username, password })

      // signIn() succeeds but doesn't give us the token directly
      // fetchAuthSession() retrieves the current session which contains the tokens
      const session = await fetchAuthSession()

      // idToken contains user info (sub, email) — this is what our backend verifies
      // toString() converts the Amplify token object to a plain JWT string
      const token = session.tokens?.idToken?.toString()

      // store in localStorage so api.ts can attach it to every backend request
      if (token) localStorage.setItem('token', token)

      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>Don&apos;t have an account? <Link href="/signup">Sign up</Link></p>
    </main>
  )
}
