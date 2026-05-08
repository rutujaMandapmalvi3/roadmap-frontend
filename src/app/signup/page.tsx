'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, confirmSignUp } from 'aws-amplify/auth'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState<'signup' | 'confirm'>('signup')
  // email is used as the username — Cognito User Pool is configured this way
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // username = email because the User Pool uses email as the sign-in identifier
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } }
      })
      setStep('confirm')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Confirmation failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'confirm') {
    return (
      <main>
        <h1>Confirm your account</h1>
        <p>We sent a confirmation code to {email}</p>
        <form onSubmit={handleConfirm}>
          <input
            type="text"
            placeholder="Confirmation code"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main>
      <h1>Sign up</h1>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
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
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
      <p>Already have an account? <Link href="/login">Login</Link></p>
    </main>
  )
}
