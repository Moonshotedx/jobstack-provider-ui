import { logout } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/profile"!
    <button onClick={logout} className=''> Logout </button>
  </div>
}
