import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MoreHorizontal, MapPin, Calendar, DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JobPosting {
  id: string;
  title: string;
  location: string;
  postedDate: string;
  salary: string;
  jobType: string;
  status: 'active' | 'closed' | 'draft';
  applicationsCount: number;
}

const MyJobs = () => {
  const [jobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Senior React Developer',
      location: 'Mumbai, Maharashtra',
      postedDate: '2024-01-15',
      salary: '₹8,00,000 - ₹12,00,000',
      jobType: 'Full-time',
      status: 'active',
      applicationsCount: 24
    },
    {
      id: '2',
      title: 'UI/UX Designer',
      location: 'Bangalore, Karnataka',
      postedDate: '2024-01-10',
      salary: '₹6,00,000 - ₹9,00,000',
      jobType: 'Full-time',
      status: 'active',
      applicationsCount: 18
    },
    {
      id: '3',
      title: 'Product Manager',
      location: 'Delhi, Delhi',
      postedDate: '2024-01-08',
      salary: '₹15,00,000 - ₹20,00,000',
      jobType: 'Full-time',
      status: 'closed',
      applicationsCount: 45
    },
    {
      id: '4',
      title: 'DevOps Engineer',
      location: 'Pune, Maharashtra',
      postedDate: '2024-01-12',
      salary: '₹10,00,000 - ₹14,00,000',
      jobType: 'Full-time',
      status: 'draft',
      applicationsCount: 0
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Job Postings</h2>
          <p className="text-muted-foreground">Manage and track your job postings</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {jobs.length} Total Jobs
        </Badge>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Posted {formatDate(job.postedDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {job.jobType}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {job.applicationsCount} Applications
                    </span>
                    {job.status === 'active' && (
                      <span className="text-sm text-green-600">● Active</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Job
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        View Applications
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Duplicate Job
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Close Job
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No job postings yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first job posting to attract candidates.
            </p>
            <Button>Create Your First Job</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyJobs; 