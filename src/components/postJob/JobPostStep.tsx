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
import { Plus, X, Mic, Play, Upload } from 'lucide-react';
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
}

const JobPostStep: React.FC<JobPostStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  selectedIndustry,
  jobData,
  setJobData,
  onSubmit,
  onBack
}) => {
  const [isRecording, setIsRecording] = useState(false);

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={jobData.title}
                    onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Electrician, Welder, Security Guard"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={jobData.location}
                    onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State"
                  />
                </div>
              </div>

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
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Job Description *</Label>
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
                <div>
                  <Label htmlFor="workDays">Work Days</Label>
                  <Input
                    id="workDays"
                    value={jobData.workDays}
                    onChange={(e) => setJobData(prev => ({ ...prev, workDays: e.target.value }))}
                    placeholder="e.g., Monday to Friday"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Hiring Manager Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hiring Manager Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="managerName">Manager Name *</Label>
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
                  <Label htmlFor="phoneNo">Phone No *</Label>
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
                  <Label htmlFor="emailId">Email ID *</Label>
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

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button onClick={onSubmit} className="flex-1">
              Post Job
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to Role Selection
            </Button>
            <Button variant="outline" onClick={onClose}>
              Save Draft
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobPostStep; 