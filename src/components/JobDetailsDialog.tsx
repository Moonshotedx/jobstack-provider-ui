import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  FileText,
  Target,
  Award,
  Phone,
  Mail,
  Globe,
  Video,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import type { JobPosting } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';

interface JobDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting | null;
  onEdit?: () => void;
}

const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({ 
  isOpen, 
  onClose, 
  job, 
  onEdit 
}) => {
  const { t } = useTranslation('jobs');

  if (!job) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | string) => {
    if (typeof amount === 'number') {
      return `₹${amount.toLocaleString()}`;
    }
    return amount;
  };

  const renderField = (label: string, value: any, icon?: React.ReactNode) => {
    if (value === null || value === undefined || value === '') return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm">{String(value)}</p>
        </div>
      </div>
    );
  };

  const renderArrayField = (label: string, values: string[], icon?: React.ReactNode) => {
    if (!values || values.length === 0) return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {values.map((value, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {value}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderObjectField = (label: string, obj: any, icon?: React.ReactNode) => {
    if (!obj || typeof obj !== 'object') return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-1 space-y-1">
            {Object.entries(obj).map(([key, value]) => {
              if (value === null || value === undefined || value === '') return null;
              return (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {String(value)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMediaField = (label: string, mediaUrl: string, type: 'video' | 'image', icon?: React.ReactNode) => {
    if (!mediaUrl) return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-2">
            {type === 'video' ? (
              <video 
                controls 
                className="w-full max-w-md rounded-lg border"
                src={mediaUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img 
                src={mediaUrl} 
                alt={label}
                className="w-full max-w-md rounded-lg border"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMediaArray = (label: string, mediaUrls: string[], type: 'video' | 'image', icon?: React.ReactNode) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mediaUrls.map((url, index) => (
              <div key={index}>
                {type === 'video' ? (
                  <video 
                    controls 
                    className="w-full rounded-lg border"
                    src={url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img 
                    src={url} 
                    alt={`${label} ${index + 1}`}
                    className="w-full rounded-lg border"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {job.title} - Job Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{job.title}</h2>
                  <p className="text-muted-foreground">{job.metadata?.role || 'Job Role'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {job.metadata?.status || 'Active'}
                  </Badge>
                  {onEdit && (
                    <Button onClick={onEdit} size="sm">
                      Edit Job
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location?.city}, {job.location?.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Posted: {formatDate(job.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{job.metadata?.applicationsCount || 0} applications</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Job Details</TabsTrigger>
              <TabsTrigger value="needs">Job Needs</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('Job Provider Name', job.metadata?.basicInfo?.jobProviderName, <Building2 className="h-4 w-4" />)}
                  {renderField('Registration Number', job.metadata?.basicInfo?.jobProviderRegistration, <FileText className="h-4 w-4" />)}
                  {renderField('Location', job.metadata?.basicInfo?.jobProviderLocation.city + ', ' + job.metadata?.basicInfo?.jobProviderLocation.state, <MapPin className="h-4 w-4" />)}
                  {renderField('Contact Person', job.metadata?.basicInfo?.contactPersonName, <Users className="h-4 w-4" />)}
                  {renderField('Contact Email', job.metadata?.basicInfo?.contactEmail, <Mail className="h-4 w-4" />)}
                  {renderField('Contact Phone', job.metadata?.basicInfo?.contactPhone, <Phone className="h-4 w-4" />)}
                  {renderMediaField('Company Logo', job.metadata?.basicInfo?.jobProviderLogo, 'image', <ImageIcon className="h-4 w-4" />)}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Job Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('Job Title', job.metadata?.jobDetails?.title, <FileText className="h-4 w-4" />)}
                  {renderField('Number of Positions', job.metadata?.jobDetails?.positions, <Users className="h-4 w-4" />)}
                  {renderField('Working Hours Per Day', job.metadata?.jobDetails?.workingHoursPerDay, <Clock className="h-4 w-4" />)}
                  {renderField('Salary CTC', formatCurrency(job.metadata?.jobDetails?.salaryCTC), <DollarSign className="h-4 w-4" />)}
                  {renderField('Monthly In-hand Salary', formatCurrency(job.metadata?.jobDetails?.monthlyInHand), <DollarSign className="h-4 w-4" />)}
                  {renderField('Monthly PF & ESIC Benefits', formatCurrency(job.metadata?.jobDetails?.monthlyPfEsicBenefits), <DollarSign className="h-4 w-4" />)}
                  {renderField('PF & ESIC Explanation', job.metadata?.jobDetails?.monthlyPfEsicExplanation, <FileText className="h-4 w-4" />)}
                  {renderField('Monthly Average OT', job.metadata?.jobDetails?.monthlyAverageOT, <Clock className="h-4 w-4" />)}
                  {renderField('Stay Provided', job.metadata?.jobDetails?.stayProvided, <Building2 className="h-4 w-4" />)}
                  {renderField('Cost Per Sharing Bed', job.metadata?.jobDetails?.costPerSharingBed, <DollarSign className="h-4 w-4" />)}
                  
                  {/* Media files */}
                  {renderMediaField('Job Details Video', job.metadata?.jobDetails?.jobDetailsVideo, 'video', <Video className="h-4 w-4" />)}
                  {renderMediaArray('Job Location Photos', job.metadata?.jobDetails?.jobLocationPhotos, 'image', <ImageIcon className="h-4 w-4" />)}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Job Needs Tab */}
            <TabsContent value="needs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Job Needs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderField('Age Lower Limit', job.metadata?.jobNeeds?.ageAllowedLowerLimit, <Users className="h-4 w-4" />)}
                  {renderField('Age Upper Limit', job.metadata?.jobNeeds?.ageAllowedUpperLimit, <Users className="h-4 w-4" />)}
                  {renderField('Proofs for Intent to Join', job.metadata?.jobNeeds?.proofsAcceptableForIntentToJoin, <FileText className="h-4 w-4" />)}
                  
                  {/* Media files */}
                  {renderMediaField('Sample Task Video', job.metadata?.jobNeeds?.sampleTaskVideo, 'video', <Video className="h-4 w-4" />)}
                  {renderMediaField('Sample Task Image', job.metadata?.jobNeeds?.sampleTaskImage, 'image', <ImageIcon className="h-4 w-4" />)}
                  
                  {/* Juki Speed Subsection (for Industrial Tailor) */}
                  {job.metadata?.jobNeeds?.jukiSpeedSubsection && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Juki Machine Speed Requirements</h4>
                      <div className="space-y-2">
                        {renderField('Min Acceptable Speed', job.metadata.jobNeeds.jukiSpeedSubsection.minAcceptableSpeed, <Target className="h-4 w-4" />)}
                        {renderArrayField('Acceptable Proofs', job.metadata.jobNeeds.jukiSpeedSubsection.acceptableSpeedProofs, <Award className="h-4 w-4" />)}
                        {renderField('Other Proof Type', job.metadata.jobNeeds.jukiSpeedSubsection.speedProofOther, <FileText className="h-4 w-4" />)}
                        {renderMediaArray('Speed Proof Documents', job.metadata.jobNeeds.jukiSpeedSubsection.uploadSpeedProof, 'image', <FileText className="h-4 w-4" />)}
                        {renderMediaArray('Speed Sample Media', job.metadata.jobNeeds.jukiSpeedSubsection.uploadSpeedSampleMedia, 'image', <Video className="h-4 w-4" />)}
                      </div>
                    </div>
                  )}
                  
                  {/* Juki Error Subsection (for Industrial Tailor) */}
                  {job.metadata?.jobNeeds?.jukiErrorSubsection && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Juki Machine Error Rate Requirements</h4>
                      <div className="space-y-2">
                        {renderField('Max Acceptable Error', job.metadata.jobNeeds.jukiErrorSubsection.maxAcceptableError, <Target className="h-4 w-4" />)}
                        {renderArrayField('Acceptable Proofs', job.metadata.jobNeeds.jukiErrorSubsection.acceptableErrorProofs, <Award className="h-4 w-4" />)}
                        {renderField('Other Proof Type', job.metadata.jobNeeds.jukiErrorSubsection.errorProofOther, <FileText className="h-4 w-4" />)}
                        {renderMediaArray('Error Proof Documents', job.metadata.jobNeeds.jukiErrorSubsection.uploadErrorProof, 'image', <FileText className="h-4 w-4" />)}
                        {renderMediaArray('Error Sample Media', job.metadata.jobNeeds.jukiErrorSubsection.uploadErrorSampleMedia, 'image', <Video className="h-4 w-4" />)}
                      </div>
                    </div>
                  )}
                  
                  {/* Relocation Proofs Subsection (for Industrial Tailor) */}
                  {job.metadata?.jobNeeds?.relocationProofsSubsection && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Relocation Requirements</h4>
                      <div className="space-y-2">
                        {renderArrayField('Acceptable Relocation Proofs', job.metadata.jobNeeds.relocationProofsSubsection.acceptableRelocationProofs, <Award className="h-4 w-4" />)}
                        {renderField('Other Proof Type', job.metadata.jobNeeds.relocationProofsSubsection.relocationProofOther, <FileText className="h-4 w-4" />)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsDialog; 