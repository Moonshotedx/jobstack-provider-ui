import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PostJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    salary: '',
    description: ''
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.location) {
      toast.error("Please fill in required fields.");
      return;
    }

    // Simulate job posting
    toast.success("Job posted successfully!");
    onClose();
    setFormData({ title: '', location: '', salary: '', description: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post New Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="job-title">Job Title *</Label>
            <Input
              id="job-title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter job title"
            />
          </div>

          <div>
            <Label htmlFor="job-location">Location *</Label>
            <Input
              id="job-location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter job location"
            />
          </div>

          <div>
            <Label htmlFor="job-salary">Salary</Label>
            <Input
              id="job-salary"
              value={formData.salary}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              placeholder="Enter salary range"
            />
          </div>

          <div>
            <Label htmlFor="job-description">Description</Label>
            <Input
              id="job-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter job description"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Post Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostJobDialog; 