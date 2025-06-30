import { createFileRoute } from '@tanstack/react-router'
import ProviderDashboard from '@/components/ProviderDashboard'
import Header from '@/components/Header'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  beforeLoad: () => {
    // Clear any potential URL params that might interfere with modals
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('token') || url.searchParams.has('reset')) {
        url.searchParams.delete('token');
        url.searchParams.delete('reset');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProviderDashboard />
    </div>
  )
}
