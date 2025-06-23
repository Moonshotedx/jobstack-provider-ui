import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import OrganizationProfileDialog from '@/components/profile/OrganizationProfileDialog'
import PostJobDialog from '@/components/PostJobDialog'
import MyJobs from '@/components/MyJobs'
import CandidateManagement from '@/components/CandidateManagement'
import EmployerManagement from '@/components/employer/EmployerManagement'
import EmployerProfileDialog from '@/components/employer/EmployerProfileDialog'
import EmployerSelector from '@/components/employer/EmployerSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Briefcase, Users, Plus, Building2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
})

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('my-jobs')
  const [showOrgProfile, setShowOrgProfile] = useState(false)
  const [showEmployerDialog, setShowEmployerDialog] = useState(false)
  const [showPostJob, setShowPostJob] = useState(false)
  const { user, getSelectedEmployer } = useAuth()
  const selectedEmployer = getSelectedEmployer()

  // If user doesn't have organization profile, show profile creation
  if (user && !user.profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold">Welcome, {user.email}!</h1>
            <p className="text-muted-foreground text-lg">
              Let's set up your provider profile to start managing employers.
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Complete Your Provider Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowOrgProfile(true)}
              >
                Create Provider Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <OrganizationProfileDialog
          isOpen={showOrgProfile}
          onClose={() => setShowOrgProfile(false)}
        />
      </div>
    )
  }

  // Main dashboard for authenticated users with profiles
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <p className="text-muted-foreground">
            Manage employers, job postings, and candidate applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EmployerSelector onAddEmployer={() => setShowEmployerDialog(true)} />
          <Button 
            onClick={() => setShowPostJob(true)}
            disabled={!selectedEmployer}
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>
      </div>

      {/* Current Employer Info */}
      {selectedEmployer && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Current Employer: {selectedEmployer.name}</p>
              <p className="text-sm text-muted-foreground">{selectedEmployer.contactEmail}</p>
            </div>
          </div>
        </div>
      )}

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
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="candidates">Candidate Management</TabsTrigger>
          <TabsTrigger value="employers">Employer Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-jobs" className="mt-0">
          <MyJobs />
        </TabsContent>
        
        <TabsContent value="candidates" className="mt-0">
          <CandidateManagement />
        </TabsContent>
        
        <TabsContent value="employers" className="mt-0">
          <EmployerManagement />
        </TabsContent>
      </Tabs>

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