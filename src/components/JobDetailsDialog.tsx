import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Phone,
  Mail,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import type { JobPosting } from '@/lib/api-client';

interface JobDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting | null;
}

const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({ 
  isOpen, 
  onClose, 
  job
}) => {
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

  const limitText = (text = '', max = 25) =>
  text.length > max ? text.slice(0, max) + '…' : text;

  // Helper function to format paragraph text with bullet points and line breaks
  const formatParagraphText = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if line is a bullet point (starts with -, *, or number followed by .)
      const isBulletPoint = /^[-*•]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine);
      
      if (isBulletPoint) {
        // Add to current list
        currentList.push(trimmedLine.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, ''));
      } else {
        // If we have accumulated list items, render them
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-2 ml-4">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-sm break-words">{item}</li>
              ))}
            </ul>
          );
          currentList = [];
        }
        // Add regular paragraph line
        if (trimmedLine) {
          elements.push(
            <p key={`para-${index}`} className="text-sm break-words mb-2 whitespace-pre-wrap">
              {trimmedLine}
            </p>
          );
        }
      }
    });
    
    // Render any remaining list items
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-final`} className="list-disc list-inside space-y-1 mb-2 ml-4">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-sm break-words">{item}</li>
          ))}
        </ul>
      );
    }
    
    return elements.length > 0 ? <div className="space-y-2">{elements}</div> : null;
  };

  const renderField = (label: string, value: any, icon?: React.ReactNode, isParagraph: boolean = false) => {
    if (value === null || value === undefined || value === '') return null;
    
    // Special handling for paragraph fields
    if (isParagraph || label.toLowerCase().includes('paragraph')) {
      const formattedContent = formatParagraphText(String(value));
      if (!formattedContent) return null;
      
      return (
        <div className="flex items-start gap-3 py-2">
          {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
            <div className="text-sm break-words whitespace-pre-wrap">
              {formattedContent}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm break-words">{String(value)}</p>
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

  // Dynamic rendering function for job needs
  const renderJobNeeds = (jobNeeds: any) => {
    if (!jobNeeds || typeof jobNeeds !== 'object') return null;

    const details: React.ReactElement[] = [];

    const processObject = (obj: any, prefix = '', isSubsection = false): React.ReactElement[] => {
      const subsectionDetails: React.ReactElement[] = [];
      
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Check if this is a subsection (contains multiple fields)
            const hasMultipleFields = Object.keys(value).length > 1;
            
            if (hasMultipleFields && !isSubsection) {
              // Render as subsection
              const subsectionElements = processObject(value, fullKey, true);
              details.push(
                <div key={fullKey} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h4>
                  <div className="space-y-2">
                    {subsectionElements}
                  </div>
                </div>
              );
            } else {
              // Recursively process nested objects
              const nestedElements = processObject(value, fullKey, isSubsection);
              if (isSubsection) {
                subsectionDetails.push(...nestedElements);
              } else {
                details.push(...nestedElements);
              }
            }
          } else if (Array.isArray(value)) {
            // Handle arrays
            const displayValue = value.length > 0 ? value.join(', ') : 'None';
            const element = (
              <div key={fullKey} className="text-sm text-muted-foreground">
                <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</span> {displayValue}
              </div>
            );
            if (isSubsection) {
              subsectionDetails.push(element);
            } else {
              details.push(element);
            }
          } else {
            // Handle primitive values
            let displayValue = String(value);
            
            // Format specific fields
            if (typeof value === 'number' && (key.includes('speed') || key.includes('error') || key.includes('limit'))) {
              displayValue = `${value}`;
            } else if (key.includes('date') || key.includes('Date')) {
              try {
                displayValue = new Date(String(value)).toLocaleDateString();
              } catch {
                // Keep original value if date parsing fails
              }
            }
            
            const element = (
              <div key={fullKey} className="text-sm text-muted-foreground">
                <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</span> {displayValue}
              </div>
            );
            if (isSubsection) {
              subsectionDetails.push(element);
            } else {
              details.push(element);
            }
          }
        }
      });
      
      return isSubsection ? subsectionDetails : details;
    };

    processObject(jobNeeds);
    return details;
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
                  <Badge 
                    variant="outline"
                    className={(() => {
                      const raw = job.status || job.metadata?.status;
                      const status = (raw || '').toLowerCase();
                      if (status === 'open' || status === 'active') return 'border-green-300 text-green-800';
                      if (status === 'archive' || status === 'archived') return 'border-orange-300 text-orange-800';
                      if (status === 'closed') return 'border-red-300 text-red-800';
                      if (status === 'draft') return 'border-gray-300 text-gray-800';
                      return 'border-gray-300 text-gray-800';
                    })()}
                  >
                    {(() => {
                      const raw = job.status || job.metadata?.status;
                      const status = (raw || '').toLowerCase();
                      if (status === 'open' || status === 'active') return 'Active';
                      if (status === 'archive' || status === 'archived') return 'Archived';
                      return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active';
                    })()}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location?.city || 'Unknown City'}, {job.location?.state || 'Unknown State'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Posted: {formatDate(job.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{job.applicationsCount ? parseInt(job.applicationsCount) : (job.metadata?.applicationsCount || 0)} applications</span>
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
                  {renderField('Job Provider Name', limitText(job.metadata?.basicInfo?.jobProviderName, 25), <Building2 className="h-4 w-4" />)}
                  {renderField('Registration Number', job.metadata?.basicInfo?.jobProviderRegistration, <FileText className="h-4 w-4" />)}
                  {renderField('Location', job.metadata?.basicInfo?.jobProviderLocation ? (job.metadata.basicInfo.jobProviderLocation.city || 'Unknown City') + ', ' + (job.metadata.basicInfo.jobProviderLocation.state || 'Unknown State') : 'Location not available', <MapPin className="h-4 w-4" />)}
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
                  {renderField('Job Details Paragraph', job.metadata?.jobDetails?.jobDetailsParagraph, <FileText className="h-4 w-4" />, true)}
                  {renderField('Working Hours Per Day', job.metadata?.jobDetails?.workingHoursPerDay, <Clock className="h-4 w-4" />)}
                  {renderField('Salary CTC', formatCurrency(job.metadata?.jobDetails?.salaryCTC), <DollarSign className="h-4 w-4" />)}
                  {renderField('Monthly In-hand Salary', formatCurrency(job.metadata?.jobDetails?.monthlyInHand), <DollarSign className="h-4 w-4" />)}
                  {renderField('Min Monthly In-Hand', formatCurrency(job.metadata?.jobDetails?.minMonthlyInHand), <DollarSign className="h-4 w-4" />)}
                  {renderField('Max Monthly In-Hand', formatCurrency(job.metadata?.jobDetails?.maxMonthlyInHand), <DollarSign className="h-4 w-4" />)}
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
                  {renderJobNeeds(job.metadata?.jobNeeds)}
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