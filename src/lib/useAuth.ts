'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// call this at the top of any page that requires login
// if there's no token in localStorage, the user gets redirected to /login immediately
export function useAuth() {
  const router = useRouter()

  useEffect(() => {
    // useEffect runs on the client after the component mounts
    // we can't check localStorage during server-side rendering — it doesn't exist there
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])
}
