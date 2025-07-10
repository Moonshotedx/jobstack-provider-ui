import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Star,
  TrendingUp,
  Building2,
  GraduationCap,
  Globe,
  FileText,
  MessageSquare,
  ExternalLink,
  Download,
  Clock,
  Award,
  Languages,
  Link,
  Tag,
  User,
  Target,
  MessageCircle,
  CheckCircle,
  XCircle,
  Info,
  Briefcase,
  Heart,
  DollarSign,
  Home,
  Car,
  Zap
} from 'lucide-react';
import type { JobApplication } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';

interface CandidateDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: JobApplication;
  jobTitle: string;
}

const CandidateDetails: React.FC<CandidateDetailsProps> = ({ 
  isOpen, 
  onClose, 
  candidate, 
  jobTitle 
}) => {
  const { t } = useTranslation('candidates');

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return '📝';
      case 'reviewed': return '👀';
      case 'shortlisted': return '⭐';
      case 'interview': return '🤝';
      case 'hired': return '✅';
      case 'rejected': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleContactCandidate = () => {
    const email = candidate.contact?.email || candidate.metadata?.metadata?.phone || '';
    if (email) {
      window.open(`mailto:${email}?subject=Regarding your application for ${jobTitle}`, '_blank');
    }
  };

  // Extract candidate information from API response
  const getCandidateName = () => {
    return candidate.metadata?.metadata?.name || 
           candidate.metadata?.name || 
           candidate.userName || 
           'Unknown Candidate';
  };

  const getCandidatePhone = () => {
    return candidate.contact?.phone || 
           candidate.metadata?.metadata?.phone || 
           candidate.metadata?.metadata?.whoIAm?.phone || 
           '';
  };

  const getCandidateEmail = () => {
    return candidate.contact?.email || '';
  };

  const getCandidateLocation = () => {
    if (candidate.location) {
      const { city, state, address } = candidate.location;
      const parts = [];
      if (address) parts.push(address);
      if (city?.name) parts.push(city.name);
      if (state?.name) parts.push(state.name);
      return parts.join(', ');
    }
    return candidate.metadata?.metadata?.whoIAm?.location || 
           candidate.metadata?.metadata?.currentLocation || 
           'Location not specified';
  };

  const getCandidateAge = () => {
    return candidate.metadata?.age || 
           candidate.metadata?.metadata?.whoIAm?.age || 
           candidate.metadata?.metadata?.whatIHave?.age || 
           '';
  };

  const getCandidateSkills = () => {
    return candidate.metadata?.skills || 
           candidate.metadata?.metadata?.skills || 
           [];
  };

  const getCandidateLanguages = () => {
    return candidate.metadata?.languages?.map(lang => lang.name) || [];
  };

  // Check if candidate has detailed metadata
  const hasDetailedMetadata = () => {
    return candidate.metadata?.metadata?.whoIAm && 
           candidate.metadata?.metadata?.whatIHave && 
           candidate.metadata?.metadata?.whatIWant;
  };

  const renderBasicInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Name:</span>
            <span>{getCandidateName()}</span>
          </div>
          {getCandidateAge() && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Age:</span>
              <span>{getCandidateAge()} years</span>
            </div>
          )}
          {getCandidatePhone() && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Phone:</span>
              <span>{getCandidatePhone()}</span>
            </div>
          )}
          {getCandidateEmail() && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span>{getCandidateEmail()}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Location:</span>
            <span>{getCandidateLocation()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Applied:</span>
            <span>{formatDate(candidate.appliedAt)}</span>
          </div>
        </div>

        {/* Verification Status */}
        {candidate.metadata?.metadata?.whoIAm && (
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              {candidate.metadata.metadata.whoIAm.isNameVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Name Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {candidate.metadata.metadata.whoIAm.isAgeVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Age Verified</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDetailedMetadata = () => {
    if (!hasDetailedMetadata()) return null;

    const metadata = candidate.metadata?.metadata;
    if (!metadata) return null;

    const { whoIAm, whatIHave, whatIWant } = metadata;

    return (
      <>
        {/* Who I Am Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Who I Am
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{whoIAm.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Age:</span>
                <span>{whoIAm.age} years</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span>{whoIAm.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{whoIAm.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Current Location:</span>
                <span>{whoIAm.currentLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Desired Location:</span>
                <span>{whoIAm.desiredLocation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What I Have Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              What I Have
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Age:</span>
                <span>{whatIHave.age} years</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Quality Score:</span>
                <span>{whatIHave.qualityScore}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Stitching Speed:</span>
                <span>{whatIHave.stitchingSpeed} units</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Juki Experience:</span>
                <span>{whatIHave.jukiMachineExperience}</span>
              </div>
            </div>
            
                         {whatIHave.machinesOperated && whatIHave.machinesOperated.length > 0 && (
               <div>
                 <span className="font-medium">Machines Operated:</span>
                 <div className="flex flex-wrap gap-2 mt-2">
                   {whatIHave.machinesOperated.map((machine: string, index: number) => (
                     <Badge key={index} variant="secondary">
                       {machine}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}

            {whatIHave.qualityScoreExplanation && (
              <div>
                <span className="font-medium">Quality Score Explanation:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {whatIHave.qualityScoreExplanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What I Want Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5" />
              What I Want
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Monthly PF/ESIC:</span>
                <span>{whatIWant.monthlyPFESIC}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ready to Migrate:</span>
                <span>{whatIWant.readyToMigrate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Stay Preferences:</span>
                <span>{whatIWant.stayPreferences}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Work Hours/Day:</span>
                <span>{whatIWant.workHoursPerDay} hours</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Max Cost/Sharing Bed:</span>
                <span>₹{whatIWant.maxCostPerSharingBed}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Monthly OT Expectation:</span>
                <span>{whatIWant.monthlyOTExpectation} hours</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Monthly In-Hand Preferred:</span>
                <span>₹{whatIWant.monthlyInHandPreferred}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderBasicMetadata = () => {
    if (hasDetailedMetadata()) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidate.metadata?.metadata?.interestedRole && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Interested Role:</span>
                <span>{candidate.metadata.metadata.interestedRole}</span>
              </div>
            )}
            {candidate.metadata?.metadata?.interestedIndustry && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Interested Industry:</span>
                <span>{candidate.metadata.metadata.interestedIndustry}</span>
              </div>
            )}
            {candidate.metadata?.metadata?.currentLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Current Location:</span>
                <span>{candidate.metadata.metadata.currentLocation}</span>
              </div>
            )}
            {candidate.metadata?.metadata?.desiredLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Desired Location:</span>
                <span>{candidate.metadata.metadata.desiredLocation}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {getCandidateSkills().length > 0 && (
            <div>
              <span className="font-medium">Skills:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {getCandidateSkills().map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {getCandidateLanguages().length > 0 && (
            <div>
              <span className="font-medium">Languages:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {getCandidateLanguages().map((language, index) => (
                  <Badge key={index} variant="outline">
                    {language}
                  </Badge>
                ))}
              </div>
            </div>
          )}

                     {/* Tags */}
           {candidate.metadata?.tags && candidate.metadata.tags.length > 0 && (
             <div>
               <span className="font-medium">Tags:</span>
               <div className="flex flex-wrap gap-2 mt-2">
                 {candidate.metadata.tags.map((tag, index) => (
                   <Badge key={index} variant="outline">
                     {tag.descriptor?.name || tag.list?.[0]?.value || 'Tag'}
                   </Badge>
                 ))}
               </div>
             </div>
           )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {getCandidateName()} - {jobTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={getCandidateName()} />
                  <AvatarFallback className="text-lg">{getInitials(getCandidateName())}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{getCandidateName()}</h2>
                    <Badge className={getStatusColor(candidate.status)}>
                      {getStatusIcon(candidate.status)} {t(`status.${candidate.status}`)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                    {getCandidateEmail() && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {getCandidateEmail()}
                      </div>
                    )}
                    {getCandidatePhone() && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {getCandidatePhone()}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {getCandidateLocation()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Applied: {formatDate(candidate.appliedAt)}
                    </div>
                  </div>

                  {getCandidateAge() && (
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{getCandidateAge()} years old</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={handleContactCandidate} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          {renderBasicInfo()}

          {/* Detailed Metadata (Who I Am, What I Have, What I Want) */}
          {renderDetailedMetadata()}

          {/* Basic Metadata (for candidates without detailed metadata) */}
          {renderBasicMetadata()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetails; 