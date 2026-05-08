'use client'

// 'use client' is required here because Amplify.configure() uses browser APIs
// layout.tsx is a server component by default — importing Amplify directly there would crash
// so we wrap it in this client component and render it inside layout.tsx instead

import { Amplify } from 'aws-amplify'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_iQY2juKJ5',         // which Cognito pool to talk to
      userPoolClientId: '4vfubuuruohh4sf1l2ihi57os7' // which app client to use within that pool
    }
  }
})

// this component doesn't render anything visible — it just ensures Amplify is configured
// before any page tries to call signIn(), signUp(), etc.
export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
