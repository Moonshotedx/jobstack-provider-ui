import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Download,
  MapPin, 
  Calendar, 
  Star,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  appliedFor: string;
  applicationDate: string;
  status: 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  trustScore: number;
  matchScore: number;
  experience: string;
  skills: string[];
  avatar?: string;
}

const CandidateManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  
  const [candidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43210',
      location: 'Mumbai, Maharashtra',
      appliedFor: 'Senior React Developer',
      applicationDate: '2024-01-15',
      status: 'shortlisted',
      trustScore: 85,
      matchScore: 92,
      experience: '5 years',
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js']
    },
    {
      id: '2',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 87654 32109',
      location: 'Bangalore, Karnataka',
      appliedFor: 'UI/UX Designer',
      applicationDate: '2024-01-14',
      status: 'interview',
      trustScore: 78,
      matchScore: 88,
      experience: '3 years',
      skills: ['Figma', 'Adobe XD', 'Photoshop', 'User Research']
    },
    {
      id: '3',
      name: 'Anita Patel',
      email: 'anita.patel@email.com',
      phone: '+91 76543 21098',
      location: 'Ahmedabad, Gujarat',
      appliedFor: 'Product Manager',
      applicationDate: '2024-01-13',
      status: 'applied',
      trustScore: 92,
      matchScore: 85,
      experience: '7 years',
      skills: ['Product Strategy', 'Analytics', 'Agile', 'Leadership']
    },
    {
      id: '4',
      name: 'Vikram Singh',
      email: 'vikram.singh@email.com',
      phone: '+91 65432 10987',
      location: 'Delhi, Delhi',
      appliedFor: 'DevOps Engineer',
      applicationDate: '2024-01-12',
      status: 'reviewed',
      trustScore: 88,
      matchScore: 90,
      experience: '4 years',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins']
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'interview': return 'bg-orange-100 text-orange-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.appliedFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === 'all') return matchesSearch;
    return matchesSearch && candidate.status === selectedTab;
  });

  const statusCounts = {
    all: candidates.length,
    applied: candidates.filter(c => c.status === 'applied').length,
    reviewed: candidates.filter(c => c.status === 'reviewed').length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    interview: candidates.filter(c => c.status === 'interview').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidate Management</h2>
          <p className="text-muted-foreground">Review and manage job applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="applied">Applied ({statusCounts.applied})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({statusCounts.reviewed})</TabsTrigger>
            <TabsTrigger value="shortlisted">Shortlisted ({statusCounts.shortlisted})</TabsTrigger>
            <TabsTrigger value="interview">Interview ({statusCounts.interview})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Candidates List */}
      <div className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={candidate.avatar} />
                    <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{candidate.name}</h3>
                      <Badge className={getStatusColor(candidate.status)}>
                        {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                      <div>Applied for: <span className="font-medium text-foreground">{candidate.appliedFor}</span></div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {candidate.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(candidate.applicationDate)}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">Trust: {candidate.trustScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium">Match: {candidate.matchScore}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{candidate.experience}</span> experience
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Shortlist
                  </Button>
                  <Button variant="outline" size="sm">
                    <UserX className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No candidates found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No applications received yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateManagement; 