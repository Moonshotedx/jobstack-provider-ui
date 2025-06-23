import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useAuth } from '@/contexts/AuthContext';
import MyJobs from './MyJobs';
import CandidateManagement from './CandidateManagement';
import OrganizationProfileDialog from './profile/OrganizationProfileDialog';
import PostJobDialog from './PostJobDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, CheckCircle, Plus } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/authStore';
const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('my-jobs');
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);
  
  // const { user } = useAuth();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // If user is not logged in, show authentication flow
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to Job Provider Portal</h1>
            <p className="text-muted-foreground text-lg">
              Post jobs, manage applications, and find the perfect candidates for your organization.
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate({ to: "/auth/$action", params: { action: "login" } })}
                >
                  Login to Your Account
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate({ to: "/auth/$action", params: { action: "signup" } })}
                >
                  Create Provider Account
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                New to our platform? Create an account to start posting jobs and managing candidates.
              </div>
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
            <h1 className="text-3xl font-bold">Welcome, {user.email}!</h1>
            <p className="text-muted-foreground text-lg">
              Let's set up your organization profile to start posting jobs.
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Complete Your Organization Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowOrgProfile(true)}
              >
                Create Organization Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <OrganizationProfileDialog
          isOpen={showOrgProfile}
          onClose={() => setShowOrgProfile(false)}
        />
      </div>
    );
  }

  // Main dashboard for authenticated users with profiles
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your job postings and candidate applications
          </p>
        </div>
        <Button onClick={() => setShowPostJob(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Briefcase className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-muted-foreground">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">48</p>
              <p className="text-muted-foreground">Total Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-muted-foreground">Candidates Hired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="candidates">Candidate Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-jobs" className="mt-0">
          <MyJobs />
        </TabsContent>
        
        <TabsContent value="candidates" className="mt-0">
          <CandidateManagement />
        </TabsContent>
      </Tabs>

      {/* Post Job Dialog */}
      <PostJobDialog 
        isOpen={showPostJob}
        onClose={() => setShowPostJob(false)}
        skipAuthSteps={true}
      />
    </div>
  );
};

export default ProviderDashboard; 