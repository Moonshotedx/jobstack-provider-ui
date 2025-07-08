import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin,
  Star,
  TrendingUp,
  Users,
  ArrowLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { JobApplicant } from '@/types/jobPost';
import CandidateDetails from '@/components/CandidateDetails';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import React from 'react';
import Header from '@/components/Header';

// Dummy data for job applicants
const generateDummyApplicants = (jobTitle: string): JobApplicant[] => [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    age: 28,
    appliedFor: jobTitle,
    applicationDate: '2024-01-15',
    status: 'shortlisted',
    trustScore: 85,
    matchScore: 92,
    experience: '5 years',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    resume: 'https://example.com/resume1.pdf',
    coverLetter: 'Experienced developer with strong background in...',
    expectedSalary: '₹8,00,000 - ₹12,00,000',
    noticePeriod: '30 days',
    currentCompany: 'TechCorp India',
    currentRole: 'Senior Frontend Developer',
    education: 'B.Tech Computer Science',
    languages: ['English', 'Hindi', 'Marathi'],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
    portfolio: 'https://rahulsharma.dev',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/rahul',
      github: 'https://github.com/rahulsharma',
      portfolio: 'https://rahulsharma.dev'
    },
    applicationNotes: 'Strong technical skills, good communication',
    interviewScheduled: '2024-01-20',
    interviewNotes: 'Performed well in technical round',
    feedback: 'Excellent problem-solving skills',
    lastContacted: '2024-01-18',
    tags: ['Senior', 'React Expert', 'Good Communication']
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91 87654 32109',
    location: 'Bangalore, Karnataka',
    age: 25,
    appliedFor: jobTitle,
    applicationDate: '2024-01-14',
    status: 'applied',
    trustScore: 78,
    matchScore: 88,
    experience: '3 years',
    skills: ['JavaScript', 'React', 'Python', 'Django'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    resume: 'https://example.com/resume2.pdf',
    coverLetter: 'Passionate developer looking for growth opportunities...',
    expectedSalary: '₹6,00,000 - ₹9,00,000',
    noticePeriod: '15 days',
    currentCompany: 'StartupXYZ',
    currentRole: 'Full Stack Developer',
    education: 'B.E Information Technology',
    languages: ['English', 'Hindi', 'Kannada'],
    certifications: ['Microsoft Certified: Azure Developer'],
    portfolio: 'https://priyapatel.dev',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/priyapatel',
      github: 'https://github.com/priyapatel'
    },
    applicationNotes: 'Good potential, needs technical assessment',
    lastContacted: '2024-01-16',
    tags: ['Mid-level', 'Full Stack', 'Quick Learner']
  },
  {
    id: '3',
    name: 'Amit Kumar',
    email: 'amit.kumar@email.com',
    phone: '+91 76543 21098',
    location: 'Delhi, NCR',
    age: 32,
    appliedFor: jobTitle,
    applicationDate: '2024-01-13',
    status: 'interview',
    trustScore: 92,
    matchScore: 95,
    experience: '7 years',
    skills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    resume: 'https://example.com/resume3.pdf',
    coverLetter: 'Senior developer with extensive experience in enterprise applications...',
    expectedSalary: '₹15,00,000 - ₹20,00,000',
    noticePeriod: '60 days',
    currentCompany: 'Enterprise Solutions Ltd',
    currentRole: 'Tech Lead',
    education: 'M.Tech Computer Science',
    languages: ['English', 'Hindi'],
    certifications: ['Oracle Certified Professional', 'Kubernetes Administrator'],
    portfolio: 'https://amitkumar.dev',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/amitkumar',
      github: 'https://github.com/amitkumar'
    },
    applicationNotes: 'Excellent leadership skills, strong technical background',
    interviewScheduled: '2024-01-22',
    interviewNotes: 'Technical round completed, scheduled for leadership round',
    feedback: 'Outstanding technical knowledge and leadership potential',
    lastContacted: '2024-01-19',
    tags: ['Senior', 'Tech Lead', 'Leadership', 'High Potential']
  },
  {
    id: '4',
    name: 'Neha Singh',
    email: 'neha.singh@email.com',
    phone: '+91 65432 10987',
    location: 'Pune, Maharashtra',
    age: 24,
    appliedFor: jobTitle,
    applicationDate: '2024-01-12',
    status: 'rejected',
    trustScore: 65,
    matchScore: 72,
    experience: '2 years',
    skills: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    resume: 'https://example.com/resume4.pdf',
    coverLetter: 'Frontend developer with passion for creating beautiful user interfaces...',
    expectedSalary: '₹4,00,000 - ₹6,00,000',
    noticePeriod: '30 days',
    currentCompany: 'WebDesign Studio',
    currentRole: 'Frontend Developer',
    education: 'B.Sc Computer Science',
    languages: ['English', 'Hindi', 'Marathi'],
    certifications: [],
    portfolio: 'https://nehasingh.dev',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/nehasingh',
      portfolio: 'https://nehasingh.dev'
    },
    applicationNotes: 'Limited experience for senior role',
    interviewScheduled: '2024-01-17',
    interviewNotes: 'Technical skills not sufficient for position',
    feedback: 'Good potential but needs more experience',
    lastContacted: '2024-01-17',
    tags: ['Junior', 'Frontend', 'Creative']
  },
  {
    id: '5',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@email.com',
    phone: '+91 54321 09876',
    location: 'Hyderabad, Telangana',
    age: 29,
    appliedFor: jobTitle,
    applicationDate: '2024-01-11',
    status: 'hired',
    trustScore: 88,
    matchScore: 90,
    experience: '6 years',
    skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Docker'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    resume: 'https://example.com/resume5.pdf',
    coverLetter: 'Full stack developer with expertise in modern web technologies...',
    expectedSalary: '₹12,00,000 - ₹16,00,000',
    noticePeriod: '45 days',
    currentCompany: 'Digital Solutions Inc',
    currentRole: 'Senior Full Stack Developer',
    education: 'B.Tech Information Technology',
    languages: ['English', 'Hindi', 'Telugu'],
    certifications: ['Docker Certified Associate', 'PostgreSQL Certified'],
    portfolio: 'https://vikrammalhotra.dev',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/vikrammalhotra',
      github: 'https://github.com/vikrammalhotra'
    },
    applicationNotes: 'Perfect fit for the role',
    interviewScheduled: '2024-01-16',
    interviewNotes: 'Excellent performance in all rounds',
    feedback: 'Hired - starts on 2024-02-01',
    lastContacted: '2024-01-18',
    tags: ['Hired', 'Full Stack', 'Experienced', 'Team Player']
  }
];

export const Route = createFileRoute('/job-applicants/$jobId')({
  component: JobApplicantsPage,
});

function JobApplicantsPage() {
  const { jobId } = Route.useParams();
  const { t } = useTranslation('candidates');
  
  // In a real app, you would fetch the job details using the jobId
  // For now, we'll use a placeholder job title
  // TODO: Use jobId to fetch actual job details from API
  const jobTitle = `Job ${jobId}`; // This should come from API
  const [applicants] = useState<JobApplicant[]>(() => generateDummyApplicants(jobTitle));
  const [filteredApplicants, setFilteredApplicants] = useState<JobApplicant[]>(applicants);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<JobApplicant | null>(null);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  // Sorting state
  const [sortBy, setSortBy] = useState<'trustScore' | 'matchScore' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sorting handler
  const handleSort = (column: 'trustScore' | 'matchScore') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter and sort applicants
  React.useEffect(() => {
    let filtered = applicants;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(applicant =>
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(applicant => applicant.status === statusFilter);
    }

    // Sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        if (sortOrder === 'asc') return aVal - bVal;
        return bVal - aVal;
      });
    }

    setFilteredApplicants(filtered);
  }, [applicants, searchQuery, statusFilter, sortBy, sortOrder]);



  const handleViewCandidate = (candidate: JobApplicant) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  const handleCloseCandidateDetails = () => {
    setShowCandidateDetails(false);
    setSelectedCandidate(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        {/* Back Button and Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">My Job Postings</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Candidate List</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Candidate List
              </h1>
              <p className="text-muted-foreground mt-1">
             • {filteredApplicants.length} candidates found
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applicants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-left p-4 font-medium">Age</th>
                    <th className="text-left p-4 font-medium">What I Have</th>
                    <th className="text-left p-4 font-medium">What I Have</th>
                    <th className="text-left p-4 font-medium">What I Have</th>
                    <th className="text-left p-4 font-medium">What I Have</th>
                    <th className="text-left p-4 font-medium">
                      <div className="flex items-center gap-1">
                        Trust Score
                        <button
                          type="button"
                          className={sortBy === 'trustScore' ? 'text-blue-600' : 'text-gray-400'}
                          onClick={e => { e.stopPropagation(); handleSort('trustScore'); }}
                        >
                          {sortBy === 'trustScore' && sortOrder === 'desc' ? <ArrowDown className="inline h-4 w-4" /> : <ArrowUp className="inline h-4 w-4" />}
                        </button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium">
                      <div className="flex items-center gap-1">
                        Match Score
                        <button
                          type="button"
                          className={sortBy === 'matchScore' ? 'text-green-600' : 'text-gray-400'}
                          onClick={e => { e.stopPropagation(); handleSort('matchScore'); }}
                        >
                          {sortBy === 'matchScore' && sortOrder === 'desc' ? <ArrowDown className="inline h-4 w-4" /> : <ArrowUp className="inline h-4 w-4" />}
                        </button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.length > 0 ? (
                    filteredApplicants.map((applicant) => (
                      <tr 
                        key={applicant.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewCandidate(applicant)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={applicant.avatar} alt={applicant.name} />
                              <AvatarFallback>{getInitials(applicant.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{applicant.name}</p>
                              <p className="text-sm text-muted-foreground">{applicant.experience}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {applicant.location}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium">{applicant.age} years</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-blue-600" />
                            <span className="text-sm font-medium">{applicant.trustScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-medium">{applicant.matchScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center">
                        <h3 className="text-lg font-medium mb-2">{t('search.noResults')}</h3>
                        <p className="text-muted-foreground">
                          No applicants found matching your criteria.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Details Dialog */}
      {selectedCandidate && (
        <CandidateDetails
          isOpen={showCandidateDetails}
          onClose={handleCloseCandidateDetails}
          candidate={selectedCandidate}
          jobTitle={jobTitle}
        />
      )}
    </div>
  );
} 