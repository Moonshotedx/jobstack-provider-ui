import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import Header from '@/components/Header'
import { useUserStore, type OrganizationProfile } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, Building2, FileText, Loader2, AlertCircle } from 'lucide-react'
import { useAssociationOverview } from '@/hooks/useJobsApi'

export const Route = createFileRoute('/admin-dashboard')({
  component: AdminDashboardComponent,
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

function AdminDashboardComponent() {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const navigate = useNavigate();
  
  // Get organization slug from user profile - check if it's OrganizationProfile
  const organizationSlug = user?.profile && 'slug' in user.profile ? (user.profile as OrganizationProfile).slug : undefined;
  
  // Fetch association overview data
  const { data: overview, isLoading: isLoadingOverview, error } = useAssociationOverview(organizationSlug);

  // Check for auth token or user in store
  useEffect(() => {
    const checkAuth = async () => {
      // Don't redirect while still loading
      if (isLoading) {
        return;
      }
      
      const authToken = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      
      if (!user && !authToken) {
        // No user and no token, redirect to login
        navigate({ to: '/', replace: true });
        return;
      }
      
      // If user doesn't have a profile or slug, redirect to dashboard
      if (user && (!user.profile || !('slug' in user.profile) || !(user.profile as OrganizationProfile).slug)) {
        navigate({ to: '/dashboard', replace: true });
        return;
      }
    };
    
    checkAuth();
  }, [user, isLoading, navigate]);

  // Show loading while initializing session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user and not loading
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminDashboardContent 
        overview={overview} 
        isLoading={isLoadingOverview} 
        error={error}
        organizationName={overview?.name || (user?.profile && 'name' in user.profile ? user.profile.name : undefined)}
      />
    </div>
  )
}

interface AdminDashboardContentProps {
  overview?: {
    name: string;
    totalJobs: number;
    totalOpenings: number;
    totalMSMEs: number;
    totalApplications: number;
  };
  isLoading: boolean;
  error: Error | null;
  organizationName?: string;
}

function AdminDashboardContent({ overview, isLoading, error, organizationName }: AdminDashboardContentProps) {
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading association overview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Error loading association overview</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error.message || 'Failed to load association data. Please try again later.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No association data available.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Association Dashboard</h1>
          {organizationName && (
            <p className="text-muted-foreground">
              {organizationName}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{overview.totalJobs}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                Active Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{overview.totalOpenings}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-green-500" />
                Total MSMEs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{overview.totalMSMEs}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-500" />
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{overview.totalApplications}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

