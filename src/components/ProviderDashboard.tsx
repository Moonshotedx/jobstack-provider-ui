import { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
import MyJobs from './MyJobs';

import PostJobDialog from './PostJobDialog';
import { CreateOrg } from './organisation/CreateOrg';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, CheckCircle, Plus, Building2, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useUserStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { useCurrentOrganizationJobs, useOrganizationCandidateStats, useActiveOrganizationId, useGetOrganizationList } from '@/hooks/useJobsApi';
import { SelectOrg } from './organisation/SelectOrg';
import LoginDialog from './auth/LoginDialog';
import { useNavigate } from '@tanstack/react-router';

const ProviderDashboard = () => {
  const { t } = useTranslation('dashboard');
  const [showPostJob, setShowPostJob] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  
  // const { user } = useAuth();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  
  // Get real-time jobs data
  const { data: jobs } = useCurrentOrganizationJobs();
  const activeOrganizationId = useActiveOrganizationId();
  const { stats: candidateStats } = useOrganizationCandidateStats(activeOrganizationId || '');
  
  // Get organization list to display current organization name
  const { data: organizations } = useGetOrganizationList();
  const currentOrganization = organizations?.find(org => org.id === activeOrganizationId);

  // Calculate real-time dashboard stats
  const dashboardStats = {
    activeJobs: jobs?.filter(job => {
      const status = job.status || job.metadata?.status;
      return status === 'active' || status === 'open';
    }).length || 0,
    totalApplications: jobs?.reduce((total, job) => {
      const applicationsCount = job.applicationsCount ? parseInt(job.applicationsCount) : 0;
      return total + applicationsCount;
    }, 0) || 0,
    candidatesShortlisted: candidateStats.shortlisted
  };

  // If user is not logged in, show authentication flow
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">{t('landing.welcome')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('landing.subtitle')}
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t('landing.getStarted')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setShowAuthDialog(true)}
                >
                  {t('landing.loginButton')}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {t('landing.newUserMessage')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // IMPORTANT: Check email verification before allowing access
  if (user && !user.isVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold">{t('verification.verificationRequired')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('verification.verificationRequiredDesc')}
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t('verification.checkEmailTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t('verification.emailSentMessage', { email: user.email })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user doesn't have organization profile, show profile creation
  if (user && !user.profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold">{t('welcome.title', { email: user.email })}</h1>
            <p className="text-muted-foreground text-lg">
              {t('setup.setupMessage')}
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t('setup.completeProfileTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowCreateOrg(true)}
              >
                {t('setup.createProfileButton')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard for authenticated users with profiles
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">
              {t('subtitle')}
            </p>
            {currentOrganization && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Your Organization: {currentOrganization.name}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Organization Selector Dropdown */}
          {organizations && organizations.length > 1 && (
            <DropdownMenu open={showOrgSelector} onOpenChange={setShowOrgSelector}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {currentOrganization?.name || 'Select Organization'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[250px]">
                <SelectOrg 
                  isOpen={false} // Use as a component, not a dialog
                  onSuccess={() => setShowOrgSelector(false)}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button onClick={() => setShowPostJob(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('quickActions.postNewJob')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Briefcase className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-2xl font-bold">{dashboardStats.activeJobs}</p>
              <p className="text-muted-foreground">{t('stats.activeJobs')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{dashboardStats.totalApplications}</p>
              <p className="text-muted-foreground">{t('stats.totalApplications')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{dashboardStats.candidatesShortlisted}</p>
              <p className="text-muted-foreground">{t('stats.candidatesShortlisted')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Postings Content */}
      <MyJobs />

      {/* Post Job Dialog */}
      <PostJobDialog 
        isOpen={showPostJob}
        onClose={() => setShowPostJob(false)}
        skipAuthSteps={true}
      />

      {/* Create Organization Dialog */}
      <CreateOrg 
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
      />

      {/* Organization Selector Dialog */}
      <SelectOrg
        isOpen={showOrgSelector}
        onClose={() => setShowOrgSelector(false)}
        onSuccess={() => setShowOrgSelector(false)}
      />

      {/* Login Dialog (email + password) */}
      <LoginDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSwitchToRegister={() => {
          setShowAuthDialog(false);
          navigate({ to: '/auth/$action', params: { action: 'signup' } });
        }}
      />
    </div>
  );
};

export default ProviderDashboard; 