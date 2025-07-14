import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Header from '@/components/Header'
import { useUserStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { CreateOrg } from '@/components/organisation/CreateOrg'
import PostJobDialog from '@/components/PostJobDialog'
import MyJobs from '@/components/MyJobs'
import EmployerManagementModal from '@/components/employer/EmployerManagementModal'
import EmployerProfileDialog from '@/components/employer/EmployerProfileDialog'
import EmployerSelector from '@/components/employer/EmployerSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Briefcase, 
  Users, 
  Plus, 
  Building2, 
  AlertCircle, 
  Mail, 
  RefreshCw,
  Menu,

  Home,
  BriefcaseIcon,
  Settings,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useCurrentOrganizationJobs } from '@/hooks/useJobsApi'
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
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

function DashboardContent() {
  const { t } = useTranslation('dashboard');
  const [showOrgProfile, setShowOrgProfile] = useState(false)
  const [showEmployerDialog, setShowEmployerDialog] = useState(false)
  const [showPostJob, setShowPostJob] = useState(false)
  const [showManageEmployers, setShowManageEmployers] = useState(false)
  const [isCheckingVerification, setIsCheckingVerification] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [hasCheckedInitialVerification, setHasCheckedInitialVerification] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();
  const { checkEmailVerification, resendVerificationEmail, checkSession } = useAuth();
  const isMobile = useIsMobile();
  
  // Get real-time jobs data
  const { data: jobs } = useCurrentOrganizationJobs();

  // Calculate real-time dashboard stats
  const dashboardStats = {
    activeJobs: jobs?.filter(job => {
      const status = job.metadata?.status;
      return status === 'active' || status === 'open';
    }).length || 0,
    totalApplications: jobs?.reduce((total, job) => {
      const applicationsCount = job.applicationsCount ? parseInt(job.applicationsCount) : 0;
      return total + applicationsCount;
    }, 0) || 0,
    candidatesShortlisted: 5 // TODO: Implement real-time shortlisted candidates count
  };

  // Safety check: If no user, they shouldn't be here
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  // Check verification status on mount and periodically
  useEffect(() => {
    if (!user) return

    const checkVerification = async () => {
      setIsCheckingVerification(true)
      try {
        const wasVerified = user.isVerified
        const isNowVerified = await checkEmailVerification()
        
        // Show success message if user just got verified
        if (!wasVerified && isNowVerified) {
          toast.success(t('verification.verificationSuccess'))
        }
        
        setHasCheckedInitialVerification(true)
        setIsCheckingVerification(false)
      } catch (error) {
        setIsCheckingVerification(false)
        setHasCheckedInitialVerification(true)
      }
    }

    // Always do initial verification check from server for security
    if (!hasCheckedInitialVerification) {
      // For new users or on fresh page load, always verify from server
      setIsCheckingVerification(true)
      checkVerification()
    } else {
      setIsCheckingVerification(false)
    }

    // Set up periodic checking only if user is not verified and we've done initial check
    let interval: number | null = null
    if (hasCheckedInitialVerification && !user.isVerified) {
      interval = setInterval(checkVerification, 10000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user?.id, user?.isVerified, hasCheckedInitialVerification, checkEmailVerification, t])

  const handleResendVerification = async () => {
    setIsResendingVerification(true)
    try {
      await resendVerificationEmail()
      toast.success(t('verification.resendSuccess'))
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email')
    } finally {
      setIsResendingVerification(false)
    }
  }

  const handleManageEmployers = () => {
    setShowManageEmployers(true)
    setMobileMenuOpen(false)
  }

  // Show loading state while checking verification (be more conservative)
  if (user && (isCheckingVerification || !hasCheckedInitialVerification)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-muted-foreground">{t('verification.checkingStatus')}</p>
        </div>
      </div>
    )
  }

  // Show verification required screen
  // IMPORTANT: All users must verify their email before accessing dashboard features
  if (user && !user.isVerified && !isCheckingVerification)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('verification.verificationRequired')}</h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {t('verification.verificationRequiredDesc')}
            </p>
          </div>

          <Card className="p-4 md:p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                {t('verification.verificationSent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('verification.verificationLinkSent', { email: user.email })}
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  {t('verification.verificationTip')}
                </p>
              </div>
              
              <Button 
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="w-full"
                variant="outline"
                size={isMobile ? "default" : "lg"}
              >
                {isResendingVerification ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('verification.resending')}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('verification.resendButton')}
                  </>
                )}
              </Button>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  {t('verification.cantFindEmail')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )

  // If user doesn't have organization profile, show profile creation
  if (user && !user.profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl md:text-3xl font-bold">{t('welcome.title', { email: user.email })}</h1>
            <p className="text-muted-foreground text-base md:text-lg">
              {t('welcome.subtitle')}
            </p>
          </div>

          <Card className="p-4 md:p-6">
            <CardHeader>
              <CardTitle className="text-lg">{t('welcome.createOrganization')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size={isMobile ? "default" : "lg"}
                onClick={() => setShowOrgProfile(true)}
              >
                {t('welcome.createOrganization')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <CreateOrg
          isOpen={showOrgProfile}
          onClose={() => setShowOrgProfile(false)}
          onSuccess={async () => {
            setShowOrgProfile(false);
            // Force session reload and invalidate all caches
            await checkSession();
            // Invalidate all queries to ensure fresh data
            queryClient.invalidateQueries();
            toast.success(t('welcome.organizationCreated'));
          }}
        />
      </div>
    )
  }

  // Mobile Navigation Menu
  const MobileNavMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-[280px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dashboard Menu
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => {
                  setShowPostJob(true)
                  setMobileMenuOpen(false)
                }}
              >
                <Plus className="h-4 w-4 mr-3" />
                Post New Job
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={handleManageEmployers}
              >
                <Building2 className="h-4 w-4 mr-3" />
                Manage Employers
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Navigation</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Home className="h-4 w-4 mr-3" />
                Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <BriefcaseIcon className="h-4 w-4 mr-3" />
                My Jobs
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-4 w-4 mr-3" />
                Candidates
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-3" />
                Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Main dashboard for authenticated users with profiles
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{t('title')}</h1>
                <p className="text-xs text-muted-foreground">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => setShowPostJob(true)}
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <EmployerSelector onAddEmployer={() => setShowEmployerDialog(true)} />
              <Button 
                onClick={() => setShowPostJob(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('quickActions.postNewJob')}
              </Button>
              <Button 
                variant="outline"
                onClick={handleManageEmployers}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {t('quickActions.manageEmployers')}
              </Button>
            </div>
          </div>
        )}

        {/* Current Employer Info */}
        {user && user.profile && 'contactEmail' in user.profile && (
          <div className="mb-6 p-3 md:p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm md:text-base truncate">
                  {t('currentOrganization.title')}: {user.profile.name}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {user.profile.contactEmail}
                </p>
                {user.profile.address && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.profile.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-4 md:p-6">
              <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-primary mr-3 md:mr-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xl md:text-2xl font-bold">{dashboardStats.activeJobs}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{t('stats.activeJobs')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-4 md:p-6">
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mr-3 md:mr-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xl md:text-2xl font-bold">{dashboardStats.totalApplications}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{t('stats.totalApplications')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="flex items-center p-4 md:p-6">
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-3 md:mr-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xl md:text-2xl font-bold">{dashboardStats.candidatesShortlisted}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{t('stats.candidatesShortlisted')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Postings Content */}
        <div className="space-y-6">
          <MyJobs />
        </div>

        {/* Mobile Navigation Menu */}
        <MobileNavMenu />

        {/* Dialogs */}
        <PostJobDialog 
          isOpen={showPostJob}
          onClose={() => setShowPostJob(false)}
          skipAuthSteps={true}
        />
        
        <EmployerProfileDialog
          isOpen={showEmployerDialog}
          onClose={() => setShowEmployerDialog(false)}
        />
        
        <EmployerManagementModal
          isOpen={showManageEmployers}
          onClose={() => setShowManageEmployers(false)}
        />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </div>
  )
}

function DashboardComponent() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DashboardContent />
    </div>
  )
} 