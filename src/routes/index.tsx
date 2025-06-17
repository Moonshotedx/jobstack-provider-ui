import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const navigate = useNavigate()
  return (
    <div className="text-center h-dvh gap-4 flex justify-center items-center">
      <Button onClick={() => navigate({ to: '/auth/$action', params: { action: "login" } })}>Login</Button>
      <Button onClick={() => navigate({ to: '/auth/$action', params: { action: "signup" } })}>Signup</Button>
    </div>
  )
}
