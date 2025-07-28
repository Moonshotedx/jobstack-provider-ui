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
  Building2,
  Clock,
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
  Zap,
  Image,
  FileVideo,
  AlertCircle,
  Play,
  Maximize2,
  Eye,
  Award,
  GraduationCap,
  Globe,
  MapPinIcon
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

  // Helper function to check if URL is a media file
  const isMediaUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'];
    const hasExtension = mediaExtensions.some(ext => url.toLowerCase().includes(ext));
    const isGCS = url.includes('storage.googleapis.com');
    const isMediaPattern = url.includes('/video/') || url.includes('/image/') || url.includes('/media/') || 
                          url.includes('/uploads/') || url.includes('/assets/');
    const isDataUrl = url.startsWith('data:image/') || url.startsWith('data:video/');
    
    return hasExtension || isGCS || isMediaPattern || isDataUrl;
  };

  // Helper function to determine media type
  const getMediaType = (url: string): 'image' | 'video' | 'unknown' => {
    if (!url) return 'unknown';
    
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    const lowerUrl = url.toLowerCase();
    
    if (url.startsWith('data:')) {
      if (url.startsWith('data:video/')) return 'video';
      if (url.startsWith('data:image/')) return 'image';
    }
    
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) return 'video';
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) return 'image';
    
    if (lowerUrl.includes('storage.googleapis.com')) {
      if (lowerUrl.includes('video') || lowerUrl.includes('task') || lowerUrl.includes('mp4')) return 'video';
      if (lowerUrl.includes('image') || lowerUrl.includes('photo') || lowerUrl.includes('jpg') || lowerUrl.includes('png')) return 'image';
      return 'image';
    }
    
    if (lowerUrl.includes('/video/') || lowerUrl.includes('video')) return 'video';
    if (lowerUrl.includes('/image/') || lowerUrl.includes('image') || lowerUrl.includes('photo')) return 'image';
    
    return 'unknown';
  };

  // Enhanced media content renderer
  const renderMediaContent = (url: string, title: string, className: string = '', fieldName?: string) => {
    if (!isMediaUrl(url)) return null;

    let mediaType = getMediaType(url);
    if (mediaType === 'unknown' && fieldName) {
      if (fieldName.toLowerCase().includes('video')) {
        mediaType = 'video';
      } else if (fieldName.toLowerCase().includes('image') || fieldName.toLowerCase().includes('photo')) {
        mediaType = 'image';
      }
    }
    
    return (
      <div className={`${className} space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mediaType === 'video' ? (
              <FileVideo className="h-5 w-5 text-blue-600" />
            ) : (
              <Image className="h-5 w-5 text-green-600" />
            )}
            <span className="font-semibold text-lg">{title}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            className="flex items-center gap-1"
          >
            <Maximize2 className="h-4 w-4" />
            Open in new tab
          </Button>
        </div>
        
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-sm">
          {mediaType === 'video' ? (
            <div className="relative">
              <video 
                controls 
                className="w-full max-h-80 object-contain bg-black"
                preload="metadata"
                onError={(e) => {
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none';
                  const errorDiv = target.parentElement?.querySelector('.media-error');
                  if (errorDiv) errorDiv.classList.remove('hidden');
                }}
              >
                <source src={url} type="video/mp4" />
                <source src={url} type="video/webm" />
                <source src={url} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                <Play className="h-3 w-3 inline mr-1" />
                Video
              </div>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={url} 
                alt={title}
                className="w-full max-h-80 object-contain"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const errorDiv = target.parentElement?.querySelector('.media-error');
                  if (errorDiv) errorDiv.classList.remove('hidden');
                }}
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                <Image className="h-3 w-3 inline mr-1" />
                Image
              </div>
            </div>
          )}
          
          <div className="media-error hidden absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Failed to load media</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.open(url, '_blank')}
                className="mt-2"
              >
                Open in new tab
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Extract all media URLs from the candidate data
  const extractMediaUrls = () => {
    const mediaUrls: Array<{ url: string; title: string; section: string; fieldName: string }> = [];
    
    if (!candidate.metadata?.metadata) return mediaUrls;

    const { whoIAm, whatIHave, whatIWant } = candidate.metadata.metadata;

    // Helper function to extract media from an object
    const extractFromObject = (obj: any, section: string) => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string' && isMediaUrl(value)) {
          mediaUrls.push({
            url: value,
            title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            section,
            fieldName: key
          });
        }
      });
    };

    extractFromObject(whoIAm, 'whoIAm');
    extractFromObject(whatIHave, 'whatIHave');
    extractFromObject(whatIWant, 'whatIWant');

    return mediaUrls;
  };

  // Helper functions for data extraction
  const getCandidateName = () => {
    return candidate.metadata?.metadata?.whoIAm?.name || 
           candidate.metadata?.name || 
           candidate.userName || 
           'Unknown Candidate';
  };

  const getCandidatePhone = () => {
    return candidate.contact?.phone || 
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
           candidate.metadata?.metadata?.whoIAm?.currentLocation || 
           'Location not specified';
  };

  const getCandidateAge = () => {
    return candidate.metadata?.age || 
           candidate.metadata?.metadata?.whoIAm?.age || 
           candidate.metadata?.metadata?.whatIHave?.age || 
           '';
  };

  const getCandidateSkills = () => {
    const skills = candidate.metadata?.skills || [];
    return skills.map(skill => {
      if (typeof skill === 'string') return skill;
      if (skill && typeof skill === 'object' && 'name' in skill) {
        return (skill as any).name;
      }
      return String(skill);
    });
  };

  const getCandidateLanguages = () => {
    return candidate.metadata?.languages?.map(lang => lang.name) || [];
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

  const handleContactCandidate = () => {
    const email = getCandidateEmail();
    if (email) {
      window.open(`mailto:${email}?subject=Regarding your application for ${jobTitle}`, '_blank');
    }
  };

  // Helper function to format field names
  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  };

  // Helper function to get appropriate icon for a field
  const getFieldIcon = (fieldName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      name: <User className="h-4 w-4 text-muted-foreground" />,
      age: <Calendar className="h-4 w-4 text-muted-foreground" />,
      phone: <Phone className="h-4 w-4 text-muted-foreground" />,
      email: <Mail className="h-4 w-4 text-muted-foreground" />,
      location: <MapPin className="h-4 w-4 text-muted-foreground" />,
      currentLocation: <MapPinIcon className="h-4 w-4 text-muted-foreground" />,
      desiredLocation: <Globe className="h-4 w-4 text-muted-foreground" />,
      qualityScore: <Star className="h-4 w-4 text-muted-foreground" />,
      stitchingSpeed: <Zap className="h-4 w-4 text-muted-foreground" />,
      jukiMachineExperience: <Target className="h-4 w-4 text-muted-foreground" />,
      monthlyPFESIC: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      readyToMigrate: <Car className="h-4 w-4 text-muted-foreground" />,
      stayPreferences: <Home className="h-4 w-4 text-muted-foreground" />,
      workHoursPerDay: <Clock className="h-4 w-4 text-muted-foreground" />,
      maxCostPerSharingBed: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      monthlyOTExpectation: <Clock className="h-4 w-4 text-muted-foreground" />,
      monthlyInHandPreferred: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      machinesOperated: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      qualityScoreExplanation: <Info className="h-4 w-4 text-muted-foreground" />,
      taskVideo: <FileVideo className="h-4 w-4 text-muted-foreground" />,
      interestedRole: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      interestedIndustry: <Building2 className="h-4 w-4 text-muted-foreground" />,
      skills: <Award className="h-4 w-4 text-muted-foreground" />,
      languages: <Globe className="h-4 w-4 text-muted-foreground" />,
      education: <GraduationCap className="h-4 w-4 text-muted-foreground" />,
      experience: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      certificates: <Award className="h-4 w-4 text-muted-foreground" />
    };
    
    return iconMap[fieldName] || <Info className="h-4 w-4 text-muted-foreground" />;
  };

  // Helper function to format field values
  const formatFieldValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return Object.values(value).join(', ');
    }
    
    if (typeof value === 'string') {
      // Add currency symbol for money fields
      if (fieldName.toLowerCase().includes('cost') || fieldName.toLowerCase().includes('salary') || 
          fieldName.toLowerCase().includes('preferred') || fieldName.toLowerCase().includes('pfesic')) {
        return `₹${value}`;
      }
      
      // Add units for specific fields
      if (fieldName.toLowerCase().includes('hours')) {
        return `${value} hours`;
      }
      
      if (fieldName.toLowerCase().includes('age')) {
        return `${value} years`;
      }
      
      if (fieldName.toLowerCase().includes('score')) {
        return `${value}/10`;
      }
      
      if (fieldName.toLowerCase().includes('speed')) {
        return `${value} units`;
      }
    }
    
    return String(value);
  };

  // Render a section with dynamic fields
  const renderSection = (title: string, data: any, icon: React.ReactNode) => {
    if (!data || typeof data !== 'object') return null;

    const fields = Object.entries(data).filter(([key, value]) => {
      // Skip media URLs (handled separately)
      if (typeof value === 'string' && isMediaUrl(value)) return false;
      // Skip null/undefined values
      if (value === null || value === undefined) return false;
      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });

    if (fields.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {getFieldIcon(key)}
                <span className="font-medium">{formatFieldName(key)}:</span>
                <span>{formatFieldValue(value, key)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render skills, languages, and other array fields
  const renderArraySection = (title: string, data: any[], icon: React.ReactNode) => {
    if (!data || data.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.map((item, index) => (
              <Badge key={index} variant="secondary">
                {typeof item === 'string' ? item : item.name || item.value || String(item)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render verification status
  const renderVerificationStatus = () => {
    const whoIAm = candidate.metadata?.metadata?.whoIAm;
    if (!whoIAm) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {whoIAm.isNameVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Name Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {whoIAm.isAgeVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Age Verified</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
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

          {/* Media Section */}
          {(() => {
            const mediaUrls = extractMediaUrls();
            if (mediaUrls.length > 0) {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileVideo className="h-5 w-5" />
                      Media Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {mediaUrls.map((media, index) => (
                      <div key={`media-${index}`} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        {renderMediaContent(media.url, media.title, '', media.fieldName)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Verification Status */}
          {renderVerificationStatus()}

          {/* Who I Am Section */}
          {candidate.metadata?.metadata?.whoIAm && 
           renderSection('Who I Am', candidate.metadata.metadata.whoIAm, <User className="h-5 w-5" />)}

          {/* What I Have Section */}
          {candidate.metadata?.metadata?.whatIHave && 
           renderSection('What I Have', candidate.metadata.metadata.whatIHave, <Briefcase className="h-5 w-5" />)}

          {/* What I Want Section */}
          {candidate.metadata?.metadata?.whatIWant && 
           renderSection('What I Want', candidate.metadata.metadata.whatIWant, <Heart className="h-5 w-5" />)}

          {/* Skills Section */}
          {getCandidateSkills().length > 0 && 
           renderArraySection('Skills', getCandidateSkills(), <Award className="h-5 w-5" />)}

          {/* Languages Section */}
          {getCandidateLanguages().length > 0 && 
           renderArraySection('Languages', getCandidateLanguages(), <Globe className="h-5 w-5" />)}

          {/* Tags Section */}
          {candidate.metadata?.tags && candidate.metadata.tags.length > 0 && 
           renderArraySection('Tags', candidate.metadata.tags.map(tag => tag.descriptor?.name || tag.list?.[0]?.value || 'Tag'), <Info className="h-5 w-5" />)}

          {/* Additional Information for candidates without detailed metadata */}
          {!candidate.metadata?.metadata?.whoIAm && candidate.metadata?.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(candidate.metadata.metadata).map(([key, value]) => {
                    if (value === null || value === undefined || typeof value === 'object') return null;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {getFieldIcon(key)}
                        <span className="font-medium">{formatFieldName(key)}:</span>
                        <span>{formatFieldValue(value, key)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetails; 