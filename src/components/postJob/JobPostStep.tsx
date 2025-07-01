import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Mic, Play, Upload, FileImage, CheckCircle, XCircle } from 'lucide-react';
import type { JobData } from '@/types/jobPost';

interface JobPostStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  jobData: JobData;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const JobPostStep: React.FC<JobPostStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  jobData,
  setJobData,
  onSubmit,
  onBack,
  isSubmitting = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [registrationValidation, setRegistrationValidation] = useState<{
    isValid: boolean;
    type: string;
    message: string;
  }>({ isValid: false, type: '', message: '' });

  // Validation function for registration details
  const validateRegistration = (value: string) => {
    if (!value) {
      setRegistrationValidation({ isValid: false, type: '', message: '' });
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (gstRegex.test(value)) {
      setRegistrationValidation({
        isValid: true,
        type: 'GST',
        message: '✓ Valid GST Number Format'
      });
    } else if (cinRegex.test(value)) {
      setRegistrationValidation({
        isValid: true,
        type: 'CIN',
        message: '✓ Valid CIN Number Format'
      });
    } else if (tanRegex.test(value)) {
      setRegistrationValidation({
        isValid: true,
        type: 'TAN',
        message: '✓ Valid TAN Number Format'
      });
    } else if (panRegex.test(value)) {
      setRegistrationValidation({
        isValid: true,
        type: 'PAN',
        message: '✓ Valid PAN Number Format'
      });
    } else {
      // Check for partial matches to provide helpful hints
      if (value.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(value)) {
        setRegistrationValidation({
          isValid: false,
          type: 'GST',
          message: '⚠ Invalid GST format. Expected format: 22AAAAA0000A1Z5'
        });
      } else if (value.length === 21 && /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/i.test(value)) {
        setRegistrationValidation({
          isValid: false,
          type: 'CIN',
          message: '⚠ Invalid CIN format. Expected format: L12345AB2000ABC123456'
        });
      } else if (value.length === 10 && /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/i.test(value)) {
        setRegistrationValidation({
          isValid: false,
          type: 'TAN',
          message: '⚠ Invalid TAN format. Expected format: ABCD12345E'
        });
      } else if (value.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(value)) {
        setRegistrationValidation({
          isValid: false,
          type: 'PAN',
          message: '⚠ Invalid PAN format. Expected format: ABCDE1234F'
        });
      } else {
        setRegistrationValidation({
          isValid: false,
          type: 'UNKNOWN',
          message: '⚠ Enter GST (15 chars), CIN (21 chars), TAN/PAN (10 chars), or other valid registration number'
        });
      }
    }
  };

  const handleRegistrationChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setJobData(prev => ({ ...prev, jobProviderRegistration: upperValue }));
    validateRegistration(upperValue);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setJobData(prev => ({ ...prev, jobProviderLogo: file }));
    }
  };

  const handleVoiceInput = (field: string) => {
    if (isRecording) {
      setIsRecording(false);
      const mockVoiceText = "We are looking for a skilled professional to join our growing team. This is an excellent opportunity for career growth.";
      if (field === 'description') {
        setJobData(prev => ({ ...prev, description: mockVoiceText }));
      }
    } else {
      setIsRecording(true);
    }
  };

  const addField = (field: 'requirements' | 'benefits' | 'questions') => {
    setJobData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeField = (field: 'requirements' | 'benefits' | 'questions', index: number) => {
    setJobData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateField = (field: 'requirements' | 'benefits' | 'questions', index: number, value: string) => {
    setJobData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Job</DialogTitle>
          {selectedJobRole && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{selectedIndustry}</Badge>
              <span className="text-sm text-muted-foreground">→</span>
              <Badge>{selectedJobRole}</Badge>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Provider Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border">
                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold text-blue-900">Job Provider Information</Label>
                </div>
                
                <div>
                  <Label htmlFor="jobProviderName">Job Provider Name *</Label>
                  <Input
                    id="jobProviderName"
                    value={jobData.jobProviderName}
                    onChange={(e) => setJobData(prev => ({ ...prev, jobProviderName: e.target.value }))}
                    placeholder="Enter job provider/company name"
                  />
                </div>

                <div>
                  <Label htmlFor="jobProviderRegistration">Job Provider Registration Details *</Label>
                  <Input
                    id="jobProviderRegistration"
                    value={jobData.jobProviderRegistration}
                    onChange={(e) => handleRegistrationChange(e.target.value)}
                    placeholder="GST, CIN, TAN, PAN or other registration number"
                    className={registrationValidation.message ? 
                      (registrationValidation.isValid ? 'border-green-500' : 'border-orange-500') : ''
                    }
                  />
                  {registrationValidation.message && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${
                      registrationValidation.isValid ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {registrationValidation.isValid ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {registrationValidation.message}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="jobProviderLogo">Job Provider Logo</Label>
                  <div className="mt-2">
                    <input
                      id="jobProviderLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('jobProviderLogo')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </Button>
                      {jobData.jobProviderLogo && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FileImage className="h-4 w-4" />
                          {jobData.jobProviderLogo.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJobData(prev => ({ ...prev, jobProviderLogo: null }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload company logo (PNG, JPG, max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hide job title for Industrial Tailor as it will be in Job Details section */}
                {!(selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor') && (
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={jobData.title}
                      onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Electrician, Welder, Security Guard"
                    />
                  </div>
                )}
                <div className={!(selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor') ? '' : 'md:col-span-2'}>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={jobData.location}
                    onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Mumbai, Maharashtra or Sector 18, Gurgaon, Haryana"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Provide the specific location where candidates will work
                  </p>
                </div>
              </div>

              {/* Job Type, Salary Range, and Pay Frequency - hidden for Industrial Tailor */}
              {!(selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="jobType">Job Type *</Label>
                    <Select value={jobData.jobType} onValueChange={(value) => setJobData(prev => ({ ...prev, jobType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="trainee">Trainee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salary">Salary Range *</Label>
                    <Input
                      id="salary"
                      value={jobData.salary}
                      onChange={(e) => setJobData(prev => ({ ...prev, salary: e.target.value }))}
                      placeholder="₹15,000 - ₹25,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payFrequency">Pay Frequency *</Label>
                    <Select value={jobData.payFrequency} onValueChange={(value) => setJobData(prev => ({ ...prev, payFrequency: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Hide experience and positions for Industrial Tailor as they will be in Job Details section */}
              {!(selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="experience">Experience Required</Label>
                    <Input
                      id="experience"
                      value={jobData.experience}
                      onChange={(e) => setJobData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g., 2-5 years"
                    />
                  </div>
                  <div>
                    <Label htmlFor="positions">Number of Positions</Label>
                    <Input
                      id="positions"
                      type="number"
                      value={jobData.positions}
                      onChange={(e) => setJobData(prev => ({ ...prev, positions: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastDate">Last Date to Apply</Label>
                    <Input
                      id="lastDate"
                      type="date"
                      value={jobData.lastDate}
                      onChange={(e) => setJobData(prev => ({ ...prev, lastDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Overtime fields for Textile -> Tailor role */}
              {selectedIndustry === 'Textile' && selectedJobRole === 'Tailor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overtime">Overtime</Label>
                    <Select 
                      value={jobData.overtime || ''} 
                      onValueChange={(value) => setJobData(prev => ({ 
                        ...prev, 
                        overtime: value,
                        overtimePay: value === 'no' ? '' : prev.overtimePay
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select overtime option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {jobData.overtime === 'yes' && (
                    <div>
                      <Label htmlFor="overtimePay">Overtime Pay</Label>
                      <Select 
                        value={jobData.overtimePay || ''} 
                        onValueChange={(value) => setJobData(prev => ({ ...prev, overtimePay: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select overtime pay rate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1X">1X</SelectItem>
                          <SelectItem value="2X">2X</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Education field for Textile -> Tailor role */}
              {selectedIndustry === 'Textile' && selectedJobRole === 'Tailor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Select 
                      value={jobData.education || ''} 
                      onValueChange={(value) => setJobData(prev => ({ ...prev, education: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8th">8th</SelectItem>
                        <SelectItem value="10th">10th</SelectItem>
                        <SelectItem value="12th">12th</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Hiring Manager Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="managerName">Provider Contact Name *</Label>
                  <Input
                    id="managerName"
                    value={jobData.hiringManager.managerName}
                    onChange={(e) => setJobData(prev => ({ 
                      ...prev, 
                      hiringManager: { 
                        ...prev.hiringManager, 
                        managerName: e.target.value 
                      } 
                    }))}
                    placeholder="Enter manager name"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNo">Provider Contact Phone No *</Label>
                  <Input
                    id="phoneNo"
                    type="tel"
                    value={jobData.hiringManager.phoneNo}
                    onChange={(e) => setJobData(prev => ({ 
                      ...prev, 
                      hiringManager: { 
                        ...prev.hiringManager, 
                        phoneNo: e.target.value 
                      } 
                    }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label htmlFor="emailId">Provider Contact Email ID *</Label>
                  <Input
                    id="emailId"
                    type="email"
                    value={jobData.hiringManager.emailId}
                    onChange={(e) => setJobData(prev => ({ 
                      ...prev, 
                      hiringManager: { 
                        ...prev.hiringManager, 
                        emailId: e.target.value 
                      } 
                    }))}
                    placeholder="manager@company.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Details section for Industrial Tailor */}
          {selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Title and Number of Openings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={jobData.title}
                      onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Industrial Tailor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="positions">Number of Openings *</Label>
                    <Input
                      id="positions"
                      type="number"
                      value={jobData.positions}
                      onChange={(e) => setJobData(prev => ({ ...prev, positions: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                </div>

                {/* Job Details Video Upload */}
                <div>
                  <Label htmlFor="jobDetailsVideo">Job Details Video</Label>
                  <div className="mt-2">
                    <input
                      id="jobDetailsVideo"
                      type="file"
                      accept="video/mov,video/avi,video/mp4,video/mkv,video/wmv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setJobData(prev => ({
                            ...prev,
                            industrialTailorDetails: {
                              ...prev.industrialTailorDetails,
                              jobDetailsVideo: file
                            }
                          }));
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('jobDetailsVideo')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Video
                      </Button>
                      {jobData.industrialTailorDetails?.jobDetailsVideo && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FileImage className="h-4 w-4" />
                          {jobData.industrialTailorDetails.jobDetailsVideo.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJobData(prev => ({
                              ...prev,
                              industrialTailorDetails: {
                                ...prev.industrialTailorDetails,
                                jobDetailsVideo: undefined
                              }
                            }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload job details video (MOV, AVI, MP4, MKV, WMV, max 50MB)
                    </p>
                  </div>
                </div>

                {/* Job Location Photos Upload */}
                <div>
                  <Label htmlFor="jobLocationPhotos">Job Location Photos</Label>
                  <div className="mt-2">
                    <input
                      id="jobLocationPhotos"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setJobData(prev => ({
                            ...prev,
                            industrialTailorDetails: {
                              ...prev.industrialTailorDetails,
                              jobLocationPhotos: files
                            }
                          }));
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('jobLocationPhotos')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Photos
                      </Button>
                      {jobData.industrialTailorDetails?.jobLocationPhotos && jobData.industrialTailorDetails.jobLocationPhotos.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FileImage className="h-4 w-4" />
                          {jobData.industrialTailorDetails.jobLocationPhotos.length} photo(s) selected
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJobData(prev => ({
                              ...prev,
                              industrialTailorDetails: {
                                ...prev.industrialTailorDetails,
                                jobLocationPhotos: []
                              }
                            }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload job location photos (PNG, JPEG, JPG, max 5MB each)
                    </p>
                  </div>
                </div>

                {/* Working Hours and Salary Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workingHoursPerDay">Working Hours/Day</Label>
                    <Input
                      id="workingHoursPerDay"
                      type="number"
                      value={jobData.industrialTailorDetails?.workingHoursPerDay || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          workingHoursPerDay: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      placeholder="Enter working hours per day"
                      min="1"
                      max="24"
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyInHand">Monthly In-hand (INR)</Label>
                    <Input
                      id="monthlyInHand"
                      type="number"
                      value={jobData.industrialTailorDetails?.monthlyInHand || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          monthlyInHand: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      placeholder="Enter monthly in-hand amount"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyPfEsic">Monthly PF & ESIC (INR)</Label>
                    <Input
                      id="monthlyPfEsic"
                      type="number"
                      value={jobData.industrialTailorDetails?.monthlyPfEsicBenefits || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          monthlyPfEsicBenefits: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      placeholder="Enter monthly PF & ESIC amount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyAverageOT">Monthly Average OT (Overtime) (INR)</Label>
                    <Input
                      id="monthlyAverageOT"
                      value={jobData.industrialTailorDetails?.monthlyAverageOT || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          monthlyAverageOT: e.target.value 
                        } 
                      }))}
                      placeholder="Enter monthly average overtime amount"
                    />
                  </div>
                </div>

                {/* Stay Provided and Cost */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stayProvided">Stay Provided</Label>
                    <Select 
                      value={jobData.industrialTailorDetails?.stayProvided || ''} 
                      onValueChange={(value) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          stayProvided: value,
                          costPerSharingBed: value === 'no' ? '' : prev.industrialTailorDetails?.costPerSharingBed || ''
                        } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stay option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes-free">Yes - Free</SelectItem>
                        <SelectItem value="yes-paid">Yes - Paid</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {jobData.industrialTailorDetails?.stayProvided === 'yes-paid' && (
                    <div>
                      <Label htmlFor="costPerSharingBed">Cost per Sharing Bed</Label>
                      <Input
                        id="costPerSharingBed"
                        value={jobData.industrialTailorDetails?.costPerSharingBed || ''}
                        onChange={(e) => setJobData(prev => ({ 
                          ...prev, 
                          industrialTailorDetails: { 
                            ...prev.industrialTailorDetails, 
                            costPerSharingBed: e.target.value 
                          } 
                        }))}
                        placeholder="Enter cost per sharing bed"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Needs section for Industrial Tailor */}
          {selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Needs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Age Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ageAllowedLowerLimit">Age Allowed - Lower Limit</Label>
                    <Input
                      id="ageAllowedLowerLimit"
                      type="number"
                      value={jobData.industrialTailorDetails?.ageAllowedLowerLimit || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          ageAllowedLowerLimit: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      placeholder="Enter minimum age"
                      min="18"
                      max="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ageAllowedUpperLimit">Age Allowed - Upper Limit</Label>
                    <Input
                      id="ageAllowedUpperLimit"
                      type="number"
                      value={jobData.industrialTailorDetails?.ageAllowedUpperLimit || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          ageAllowedUpperLimit: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      placeholder="Enter maximum age"
                      min="18"
                      max="100"
                    />
                  </div>
                </div>

                {/* Sample Task Video */}
                <div>
                  <Label htmlFor="sampleTaskVideo">Sample Task Video</Label>
                  <div className="mt-2">
                    <input
                      id="sampleTaskVideo"
                      type="file"
                      accept="video/mov,video/avi,video/mp4,video/mkv,video/wmv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setJobData(prev => ({
                            ...prev,
                            industrialTailorDetails: {
                              ...prev.industrialTailorDetails,
                              sampleTaskVideo: file
                            }
                          }));
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('sampleTaskVideo')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Sample Task Video
                      </Button>
                      {jobData.industrialTailorDetails?.sampleTaskVideo && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FileImage className="h-4 w-4" />
                          {jobData.industrialTailorDetails.sampleTaskVideo.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJobData(prev => ({
                              ...prev,
                              industrialTailorDetails: {
                                ...prev.industrialTailorDetails,
                                sampleTaskVideo: undefined
                              }
                            }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload video showing sample task (MOV, AVI, MP4, MKV, WMV, max 50MB)
                    </p>
                  </div>
                </div>

                {/* Sample Task Image */}
                <div>
                  <Label htmlFor="sampleTaskImage">Sample Task Image</Label>
                  <div className="mt-2">
                    <input
                      id="sampleTaskImage"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setJobData(prev => ({
                            ...prev,
                            industrialTailorDetails: {
                              ...prev.industrialTailorDetails,
                              sampleTaskImage: file
                            }
                          }));
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('sampleTaskImage')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Sample Task Image
                      </Button>
                      {jobData.industrialTailorDetails?.sampleTaskImage && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FileImage className="h-4 w-4" />
                          {jobData.industrialTailorDetails.sampleTaskImage.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJobData(prev => ({
                              ...prev,
                              industrialTailorDetails: {
                                ...prev.industrialTailorDetails,
                                sampleTaskImage: undefined
                              }
                            }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload image showing sample task (PNG, JPEG, JPG, max 5MB)
                    </p>
                  </div>
                </div>

                {/* Speed Benchmark and Proofs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="speedBenchmarkMins">Speed Benchmark (mins taken for sample task)</Label>
                    <Input
                      id="speedBenchmarkMins"
                      type="number"
                      value={jobData.industrialTailorDetails?.speedBenchmarkMins || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          speedBenchmarkMins: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      placeholder="Enter time in minutes"
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="proofsAcceptableForIntentToJoin">Proofs Acceptable for Intent to Join</Label>
                    <Input
                      id="proofsAcceptableForIntentToJoin"
                      value={jobData.industrialTailorDetails?.proofsAcceptableForIntentToJoin || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          proofsAcceptableForIntentToJoin: e.target.value 
                        } 
                      }))}
                      placeholder="Enter acceptable proofs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">
                  {selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor' 
                    ? 'Job Requirement/Responsibilities *' 
                    : 'Job Description *'}
                </Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      id="description"
                      value={jobData.description}
                      onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the job role, responsibilities, and what you're looking for..."
                      rows={4}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVoiceInput('description')}
                      className={isRecording ? 'bg-red-100 text-red-600' : ''}
                    >
                      {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                  {isRecording && (
                    <div className="text-sm text-red-600 flex items-center gap-2">
                      <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                      Recording job description... Click stop when done
                    </div>
                  )}
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
              </div>

              {/* Work Timings and Work Days - Work Days hidden for Industrial Tailor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workTimings">Work Timings</Label>
                  <Input
                    id="workTimings"
                    value={jobData.workTimings}
                    onChange={(e) => setJobData(prev => ({ ...prev, workTimings: e.target.value }))}
                    placeholder="e.g., 9 AM - 6 PM"
                  />
                </div>
                {!(selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor') && (
                  <div>
                    <Label htmlFor="workDays">Work Days</Label>
                    <Input
                      id="workDays"
                      value={jobData.workDays}
                      onChange={(e) => setJobData(prev => ({ ...prev, workDays: e.target.value }))}
                      placeholder="e.g., Monday to Friday"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workplace & Media section for Industrial Tailor */}
          {selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workplace Details & Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Office Photos Upload */}
                <div>
                  <Label>Office Photos with Description</Label>
                  <div className="space-y-2">
                    {(jobData.industrialTailorDetails?.officePhotos || []).map((photo, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setJobData(prev => ({
                                  ...prev,
                                  industrialTailorDetails: {
                                    ...prev.industrialTailorDetails,
                                    officePhotos: (prev.industrialTailorDetails?.officePhotos || []).map((p, i) => 
                                      i === index ? { ...p, file } : p
                                    )
                                  }
                                }));
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Photo description"
                            value={photo.description}
                            onChange={(e) => {
                              setJobData(prev => ({
                                ...prev,
                                industrialTailorDetails: {
                                  ...prev.industrialTailorDetails,
                                  officePhotos: (prev.industrialTailorDetails?.officePhotos || []).map((p, i) => 
                                    i === index ? { ...p, description: e.target.value } : p
                                  )
                                }
                              }));
                            }}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setJobData(prev => ({
                              ...prev,
                              industrialTailorDetails: {
                                ...prev.industrialTailorDetails,
                                officePhotos: (prev.industrialTailorDetails?.officePhotos || []).filter((_, i) => i !== index)
                              }
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setJobData(prev => ({
                          ...prev,
                          industrialTailorDetails: {
                            ...prev.industrialTailorDetails,
                            officePhotos: [...(prev.industrialTailorDetails?.officePhotos || []), { file: new File([], ''), description: '' }]
                          }
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Office Photo
                    </Button>
                  </div>
                </div>

                {/* Testimonial Videos Upload */}
                <div>
                  <Label>Testimonial Videos with Description</Label>
                  <div className="space-y-2">
                    {(jobData.industrialTailorDetails?.testimonialVideos || []).map((video, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="video/mov,video/avi,video/mp4,video/mkv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setJobData(prev => ({
                                  ...prev,
                                  industrialTailorDetails: {
                                    ...prev.industrialTailorDetails,
                                    testimonialVideos: (prev.industrialTailorDetails?.testimonialVideos || []).map((v, i) => 
                                      i === index ? { ...v, file } : v
                                    )
                                  }
                                }));
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Video description"
                            value={video.description}
                            onChange={(e) => {
                              setJobData(prev => ({
                                ...prev,
                                industrialTailorDetails: {
                                  ...prev.industrialTailorDetails,
                                  testimonialVideos: (prev.industrialTailorDetails?.testimonialVideos || []).map((v, i) => 
                                    i === index ? { ...v, description: e.target.value } : v
                                  )
                                }
                              }));
                            }}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setJobData(prev => ({
                              ...prev,
                              industrialTailorDetails: {
                                ...prev.industrialTailorDetails,
                                testimonialVideos: (prev.industrialTailorDetails?.testimonialVideos || []).filter((_, i) => i !== index)
                              }
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setJobData(prev => ({
                          ...prev,
                          industrialTailorDetails: {
                            ...prev.industrialTailorDetails,
                            testimonialVideos: [...(prev.industrialTailorDetails?.testimonialVideos || []), { file: new File([], ''), description: '' }]
                          }
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Testimonial Video
                    </Button>
                  </div>
                </div>

                {/* Work Schedule and Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weeklyHolidays">Weekly Holidays</Label>
                    <Select 
                      value={jobData.industrialTailorDetails?.weeklyHolidays || ''} 
                      onValueChange={(value) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          weeklyHolidays: value,
                          weeklyHolidaysOther: value !== 'other' ? '' : prev.industrialTailorDetails?.weeklyHolidaysOther
                        } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select weekly holidays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekends-off">Weekends off</SelectItem>
                        <SelectItem value="sunday-only">Only Sunday off</SelectItem>
                        <SelectItem value="rotational-weekday">Rotational 1 weekday off</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="workingMode">Working Mode</Label>
                    <Select 
                      value={jobData.industrialTailorDetails?.workingMode || ''} 
                      onValueChange={(value) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          workingMode: value 
                        } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select working mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-site">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="travelling">Travelling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Other Holiday Specification */}
                {jobData.industrialTailorDetails?.weeklyHolidays === 'other' && (
                  <div>
                    <Label htmlFor="weeklyHolidaysOther">Specify Other Holiday Schedule</Label>
                    <Input
                      id="weeklyHolidaysOther"
                      value={jobData.industrialTailorDetails?.weeklyHolidaysOther || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          weeklyHolidaysOther: e.target.value 
                        } 
                      }))}
                      placeholder="Specify the holiday schedule"
                    />
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="regionalScope">Regional Scope</Label>
                    <Input
                      id="regionalScope"
                      value={jobData.industrialTailorDetails?.regionalScope || ''}
                      onChange={(e) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          regionalScope: e.target.value 
                        } 
                      }))}
                      placeholder="Enter regional scope"
                    />
                  </div>

                  <div>
                    <Label htmlFor="genderSpecific">Gender Specific</Label>
                    <Select 
                      value={jobData.industrialTailorDetails?.genderSpecific || ''} 
                      onValueChange={(value) => setJobData(prev => ({ 
                        ...prev, 
                        industrialTailorDetails: { 
                          ...prev.industrialTailorDetails, 
                          genderSpecific: value 
                        } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="no-preference">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ageRangeAllowed">Age Range Allowed</Label>
                  <Input
                    id="ageRangeAllowed"
                    value={jobData.industrialTailorDetails?.ageRangeAllowed || ''}
                    onChange={(e) => setJobData(prev => ({ 
                      ...prev, 
                      industrialTailorDetails: { 
                        ...prev.industrialTailorDetails, 
                        ageRangeAllowed: e.target.value 
                      } 
                    }))}
                    placeholder="e.g., 18-35 years"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills section for Textile -> Tailor role */}
          {selectedIndustry === 'Textile' && selectedJobRole === 'Tailor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills Required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="electricSewingMachine"
                      checked={jobData.tailorSkills?.electricSewingMachine || false}
                      onCheckedChange={(checked) => 
                        setJobData(prev => ({
                          ...prev,
                          tailorSkills: {
                            ...prev.tailorSkills,
                            electricSewingMachine: checked === true,
                            machineControl: prev.tailorSkills?.machineControl || false,
                            stitchFastStraightLine: prev.tailorSkills?.stitchFastStraightLine || false
                          }
                        }))
                      }
                    />
                    <Label htmlFor="electricSewingMachine">Ability to Handle an electric sewing machine</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="machineControl"
                      checked={jobData.tailorSkills?.machineControl || false}
                      onCheckedChange={(checked) => 
                        setJobData(prev => ({
                          ...prev,
                          tailorSkills: {
                            ...prev.tailorSkills,
                            electricSewingMachine: prev.tailorSkills?.electricSewingMachine || false,
                            machineControl: checked === true,
                            stitchFastStraightLine: prev.tailorSkills?.stitchFastStraightLine || false
                          }
                        }))
                      }
                    />
                    <Label htmlFor="machineControl">Machine control</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stitchFastStraightLine"
                      checked={jobData.tailorSkills?.stitchFastStraightLine || false}
                      onCheckedChange={(checked) => 
                        setJobData(prev => ({
                          ...prev,
                          tailorSkills: {
                            ...prev.tailorSkills,
                            electricSewingMachine: prev.tailorSkills?.electricSewingMachine || false,
                            machineControl: prev.tailorSkills?.machineControl || false,
                            stitchFastStraightLine: checked === true
                          }
                        }))
                      }
                    />
                    <Label htmlFor="stitchFastStraightLine">Stitch Fast in a straight line</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Factory Environment section for Textile -> Tailor role */}
          {selectedIndustry === 'Textile' && selectedJobRole === 'Tailor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Factory Environment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="computedTrustScore"
                      checked={jobData.factoryEnvironment?.computedTrustScore || false}
                      onCheckedChange={(checked) => 
                        setJobData(prev => ({
                          ...prev,
                          factoryEnvironment: {
                            ...prev.factoryEnvironment,
                            computedTrustScore: checked === true,
                            videoWalkthrough: prev.factoryEnvironment?.videoWalkthrough || false,
                            videoTestimonial: prev.factoryEnvironment?.videoTestimonial || false,
                            videoWalkthroughFile: prev.factoryEnvironment?.videoWalkthroughFile || null,
                            videoTestimonialFile: prev.factoryEnvironment?.videoTestimonialFile || null
                          }
                        }))
                      }
                    />
                    <Label htmlFor="computedTrustScore">Computed Trust Score</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="videoWalkthrough"
                        checked={jobData.factoryEnvironment?.videoWalkthrough || false}
                        onCheckedChange={(checked) => 
                          setJobData(prev => ({
                            ...prev,
                            factoryEnvironment: {
                              ...prev.factoryEnvironment,
                              computedTrustScore: prev.factoryEnvironment?.computedTrustScore || false,
                              videoWalkthrough: checked === true,
                              videoTestimonial: prev.factoryEnvironment?.videoTestimonial || false,
                              videoWalkthroughFile: checked === true ? prev.factoryEnvironment?.videoWalkthroughFile : null,
                              videoTestimonialFile: prev.factoryEnvironment?.videoTestimonialFile || null
                            }
                          }))
                        }
                      />
                      <Label htmlFor="videoWalkthrough">Video walkthrough</Label>
                    </div>
                    {jobData.factoryEnvironment?.videoWalkthrough && (
                      <div className="ml-6">
                        <Label htmlFor="videoWalkthroughFile">Upload Video Walkthrough</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="videoWalkthroughFile"
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setJobData(prev => ({
                                ...prev,
                                factoryEnvironment: {
                                  ...prev.factoryEnvironment,
                                  computedTrustScore: prev.factoryEnvironment?.computedTrustScore || false,
                                  videoWalkthrough: prev.factoryEnvironment?.videoWalkthrough || false,
                                  videoTestimonial: prev.factoryEnvironment?.videoTestimonial || false,
                                  videoWalkthroughFile: file,
                                  videoTestimonialFile: prev.factoryEnvironment?.videoTestimonialFile || null
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Browse
                          </Button>
                        </div>
                        {jobData.factoryEnvironment?.videoWalkthroughFile && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Selected: {jobData.factoryEnvironment.videoWalkthroughFile.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="videoTestimonial"
                        checked={jobData.factoryEnvironment?.videoTestimonial || false}
                        onCheckedChange={(checked) => 
                          setJobData(prev => ({
                            ...prev,
                            factoryEnvironment: {
                              ...prev.factoryEnvironment,
                              computedTrustScore: prev.factoryEnvironment?.computedTrustScore || false,
                              videoWalkthrough: prev.factoryEnvironment?.videoWalkthrough || false,
                              videoTestimonial: checked === true,
                              videoWalkthroughFile: prev.factoryEnvironment?.videoWalkthroughFile || null,
                              videoTestimonialFile: checked === true ? prev.factoryEnvironment?.videoTestimonialFile : null
                            }
                          }))
                        }
                      />
                      <Label htmlFor="videoTestimonial">Video testimonial of existing worker</Label>
                    </div>
                    {jobData.factoryEnvironment?.videoTestimonial && (
                      <div className="ml-6">
                        <Label htmlFor="videoTestimonialFile">Upload Video Testimonial</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="videoTestimonialFile"
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setJobData(prev => ({
                                ...prev,
                                factoryEnvironment: {
                                  ...prev.factoryEnvironment,
                                  computedTrustScore: prev.factoryEnvironment?.computedTrustScore || false,
                                  videoWalkthrough: prev.factoryEnvironment?.videoWalkthrough || false,
                                  videoTestimonial: prev.factoryEnvironment?.videoTestimonial || false,
                                  videoWalkthroughFile: prev.factoryEnvironment?.videoWalkthroughFile || null,
                                  videoTestimonialFile: file
                                }
                              }));
                            }}
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Browse
                          </Button>
                        </div>
                        {jobData.factoryEnvironment?.videoTestimonialFile && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Selected: {jobData.factoryEnvironment.videoTestimonialFile.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements and Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requirements & Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Job Requirements</Label>
                {jobData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={req}
                      onChange={(e) => updateField('requirements', index, e.target.value)}
                      placeholder="Enter requirement"
                    />
                    {jobData.requirements.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField('requirements', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('requirements')}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>

              <div>
                <Label>Benefits & Perks</Label>
                {jobData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateField('benefits', index, e.target.value)}
                      placeholder="Enter benefit"
                    />
                    {jobData.benefits.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField('benefits', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('benefits')}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Benefit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Custom Questions for Applicants</Label>
                {jobData.questions.map((question, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={question}
                      onChange={(e) => updateField('questions', index, e.target.value)}
                      placeholder="Enter question for applicants"
                    />
                    {jobData.questions.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField('questions', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addField('questions')}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button 
              onClick={onSubmit} 
              className="flex-1" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting Job...' : 'Post Job'}
            </Button>
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              Back to Role Selection
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Save Draft
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobPostStep; 