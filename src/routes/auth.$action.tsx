import Auth from '@/views/Auth'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { checkSession } from '@/lib/auth-client'

export const Route = createFileRoute('/auth/$action')({
  beforeLoad: async () => {
    const session = await checkSession()
    if (session.data) {
      return redirect({ to: '/profile' })
    }
  },
  component: Auth,
})

