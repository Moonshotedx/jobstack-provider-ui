import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import ResetPasswordDialog from '@/components/auth/ResetPasswordDialog'

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
})

function ResetPasswordRoute() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    // If no token provided, redirect to login
    if (!token) {
      navigate({ 
        to: '/auth/$action', 
        params: { action: 'login' },
        replace: true 
      })
    }
  }, [token, navigate])

  const handleClose = () => {
    setIsOpen(false)
    // Navigate back to home page
    navigate({ to: '/', replace: true })
  }

  // Don't render anything if no token
  if (!token) {
    return null
  }

  return (
    <ResetPasswordDialog
      isOpen={isOpen}
      onClose={handleClose}
      token={token}
    />
  )
} 