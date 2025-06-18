import { createFileRoute } from '@tanstack/react-router'
import ProviderDashboard from '@/components/ProviderDashboard'
import Header from '@/components/Header'
import { AuthProvider } from '@/contexts/AuthContext'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <ProviderDashboard />
      </div>
    </AuthProvider>
  )
}
