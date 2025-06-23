import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Mic, Play } from 'lucide-react';
import { toast } from 'sonner';

interface PostJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  skipAuthSteps?: boolean; // New prop to skip login and org profile steps
}

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, skipAuthSteps = false }) => {
  // Start directly at job posting if user is authenticated
  const [step, setStep] = useState<'login' | 'orgProfile' | 'jobPost'>(
    skipAuthSteps ? 'jobPost' : 'login'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [jobData, setJobData] = useState({
    title: '',
    location: '',
    jobType: '',
    salary: '',
    payFrequency: '',
    workTimings: '',
    experience: '',
    description: '',
    requirements: [''],
    benefits: [''],
    documentsRequired: [],
    questions: [''],
    positions: 1,
    lastDate: '',
    workDays: '',
    machineType: ''
  });

  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    gst: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    description: ''
  });

  const handleLogin = () => {
    // Simulate login check - if organization profile exists, go to job post
    // Otherwise, go to organization profile creation
    setStep('orgProfile');
  };

  const handleOrgProfileSubmit = () => {
    setStep('jobPost');
  };

  const handleJobSubmit = () => {
    console.log('Submitting job:', jobData);
    toast.success("Job posted successfully!");
    onClose();
    // Reset form
    setJobData({
      title: '',
      location: '',
      jobType: '',
      salary: '',
      payFrequency: '',
      workTimings: '',
      experience: '',
      description: '',
      requirements: [''],
      benefits: [''],
      documentsRequired: [],
      questions: [''],
      positions: 1,
      lastDate: '',
      workDays: '',
      machineType: ''
    });
  };

  const handleVoiceInput = (field: string) => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice input completion
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

  if (step === 'login') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post a Job</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Please login or sign up to post a job
              </p>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={handleLogin}>
                Login with Email
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLogin}>
                Login with Phone
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLogin}>
                Create New Account
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              By proceeding, you agree to our Terms & Conditions
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'orgProfile') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Organization Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      value={orgData.name}
                      onChange={(e) => setOrgData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                      id="gst"
                      value={orgData.gst}
                      onChange={(e) => setOrgData(prev => ({ ...prev, gst: e.target.value }))}
                      placeholder="Enter GST number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={orgData.address}
                    onChange={(e) => setOrgData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter complete address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={orgData.contactPerson}
                      onChange={(e) => setOrgData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgEmail">Email *</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => setOrgData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="organization@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orgPhone">Phone Number *</Label>
                    <Input
                      id="orgPhone"
                      value={orgData.phone}
                      onChange={(e) => setOrgData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={orgData.website}
                      onChange={(e) => setOrgData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="orgDescription">Organization Description</Label>
                  <Textarea
                    id="orgDescription"
                    value={orgData.description}
                    onChange={(e) => setOrgData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your organization"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleOrgProfileSubmit} className="flex-1">
                Save & Continue to Job Posting
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a New Job</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Select value={jobData.title} onValueChange={(value) => setJobData(prev => ({ ...prev, title: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tailor">Tailor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="machineType">Required Machine Type</Label>
                  <Select value={jobData.machineType} onValueChange={(value) => setJobData(prev => ({ ...prev, machineType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-needle">Single needle</SelectItem>
                      <SelectItem value="double-needle">Double needle</SelectItem>
                      <SelectItem value="flat-lock">Flat lock</SelectItem>
                      <SelectItem value="over-lock">Over lock</SelectItem>
                    </SelectContent>
                  </Select>
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
            <Button onClick={handleJobSubmit} className="flex-1">
              Post Job
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

export default PostJobDialog; 