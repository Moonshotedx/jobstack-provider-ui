import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import LoginDialog from '@/components/auth/LoginDialog'
import RegistrationDialog from '@/components/auth/RegistrationDialog'
import OtpSignupDialog from '@/components/auth/OtpSignupDialog'
import { useSearch } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/$action')({
  component: AuthModalRoute,
  validateSearch: () => ({}),
})

function AuthModalRoute() {
  const { action } = Route.useParams()
  const search = useSearch({ from: '/auth/$action' })
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)

  const identifier = (search as any).identifier;
  const returnTo = (search as any).returnTo;

  // Ensure we have a valid action
  const isLogin = action.toLowerCase() === 'login'
  const isSignup = action.toLowerCase() === 'signup'

  // Reset modal state when action changes
  useEffect(() => {
    setIsOpen(true)
  }, [action])

  // Cleanup effect to prevent modal state issues
  useEffect(() => {
    return () => {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    // If invalid action, redirect to login
    if (!isLogin && !isSignup) {
      navigate({ 
        to: '/auth/$action', 
        params: { action: 'login' },
        replace: true 
      })
    }
  }, [action, isLogin, isSignup, navigate])

  const handleClose = () => {
    setIsOpen(false)
    // Navigate back to the previous page or home and clear any URL params
    if (returnTo) {
      navigate({ to: returnTo as any, replace: true })
    } else {
      navigate({ to: '/', replace: true })
    }
  }

  const handleSwitchToLogin = () => {
    navigate({ 
      to: '/auth/$action', 
      params: { action: 'login' },
      replace: true 
    })
  }

  const handleSwitchToSignup = () => {
    navigate({ 
      to: '/auth/$action', 
      params: { action: 'signup' },
      replace: true 
    })
  }

  // Don't render anything if invalid action
  if (!isLogin && !isSignup) {
    return null
  }

  return (
    <>
      <LoginDialog
        isOpen={isOpen && isLogin}
        onClose={handleClose}
        onSwitchToRegister={handleSwitchToSignup}
      />
      
      {identifier ? (
        <OtpSignupDialog
          isOpen={isOpen && isSignup}
          onClose={handleClose}
          identifier={identifier}
          returnTo={returnTo}
        />
      ) : (
        <RegistrationDialog
          isOpen={isOpen && isSignup}
          onClose={handleClose}
          onSwitchToLogin={handleSwitchToLogin}
          identifier={identifier}
        />
      )}
    </>
  )
}
