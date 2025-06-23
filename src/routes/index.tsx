import { createFileRoute } from '@tanstack/react-router'
import ProviderDashboard from '@/components/ProviderDashboard'
import Header from '@/components/Header'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProviderDashboard />
    </div>
  )
}
