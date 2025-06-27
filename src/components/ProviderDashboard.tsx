import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useAuth } from '@/contexts/AuthContext';
import MyJobs from './MyJobs';
import CandidateManagement from './CandidateManagement';

import PostJobDialog from './PostJobDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, CheckCircle, Plus } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useUserStore } from '@/stores/authStore';
import { useActiveOrganizationId } from '@/hooks/useJobsApi';
import { authClient } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('my-jobs');
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);
  
  // const { user } = useAuth();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  
  // Debug: Get session information
  const activeOrganizationId = useActiveOrganizationId();
  const { data: session } = useQuery({
    queryKey: ['session-debug'],
    queryFn: () => authClient.getSession(),
    staleTime: 5 * 60 * 1000,
  });

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

      {/* Debug Section - Remove this after fixing the issue */}
      <Card className="mb-6 bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">Debug Information (Remove Later)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-2">
            <div>
              <strong>Active Organization ID:</strong> {activeOrganizationId || 'Not found'}
            </div>
            <div>
              <strong>Session Structure:</strong>
              <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
            <div>
              <strong>User from Store:</strong>
              <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-16">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            <div className="pt-2">
              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    try {
                      console.log('Testing auth session...');
                      const sessionResult = await authClient.getSession();
                      console.log('Auth Session Result:', sessionResult);
                      toast.success(`Session: ${sessionResult.data?.user ? 'Valid' : 'Invalid'}`);
                    } catch (error) {
                      console.error('Auth Session Error:', error);
                      toast.error('Auth session test failed');
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test Auth Session
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      console.log('Testing API call...');
                      
                      // Test with fetch first
                      const response = await fetch('http://localhost:3001/api/v1/jobs/test-org-id', {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                      
                      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                      console.log('Response status:', response.status);
                      
                      const data = await response.text();
                      console.log('API Response:', { status: response.status, data });
                      
                      if (response.status === 401) {
                        toast.error('Authentication failed - user not logged in or session expired');
                      } else {
                        toast.info(`API Test: ${response.status} - ${data.substring(0, 100)}`);
                      }
                    } catch (error) {
                      console.error('API Test Error:', error);
                      toast.error('API Test failed');
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test API Call
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      console.log('Testing auth endpoint...');
                      const response = await fetch('http://localhost:3001/api/v1/auth/session', {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                      const data = await response.json();
                      console.log('Auth endpoint response:', data);
                      toast.info(`Auth Test: ${response.status} - ${data.user ? 'Logged in' : 'Not logged in'}`);
                    } catch (error) {
                      console.error('Auth Test Error:', error);
                      toast.error('Auth Test failed');
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test Auth Endpoint
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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