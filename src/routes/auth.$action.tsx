import Auth from '@/views/Auth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/$action')({
  component: Auth,
})

