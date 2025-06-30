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
  const [isOpen, setIsOpen] = useState(false)
  const [hasValidToken, setHasValidToken] = useState(false)

  useEffect(() => {
    // Validate token more strictly
    const isValidToken = token && 
                        token.trim() !== '' && 
                        token.length > 10 && // Basic token length validation
                        !token.includes('undefined') && 
                        !token.includes('null')
    
    if (!isValidToken) {
      // Redirect immediately without showing modal for invalid/missing tokens
      navigate({ 
        to: '/auth/$action', 
        params: { action: 'login' },
        replace: true 
      })
      return
    }
    
    // Only show modal if we have a valid token
    setHasValidToken(true)
    setIsOpen(true)
  }, [token, navigate])

  const handleClose = () => {
    setIsOpen(false)
    setHasValidToken(false)
    // Navigate back to home page and clear URL params
    navigate({ to: '/', replace: true })
  }

  // Don't render ANYTHING if no valid token - prevents any flash of modal
  if (!hasValidToken || !token || token.trim() === '') {
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