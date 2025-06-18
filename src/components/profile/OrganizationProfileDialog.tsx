import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrganizationProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrganizationProfileDialog: React.FC<OrganizationProfileDialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gstNumber: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: ''
  });
  
  const { updateProfile } = useAuth();

  const handleSave = () => {
    if (!formData.name || !formData.address || !formData.contactPersonName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    updateProfile(formData);
    onClose();
    toast.success("Organization profile created successfully!");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Organization Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="org-name">Organization Name *</Label>
            <Input
              id="org-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <Label htmlFor="org-address">Address *</Label>
            <Input
              id="org-address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter organization address"
            />
          </div>

          <div>
            <Label htmlFor="gst-number">GST Number</Label>
            <Input
              id="gst-number"
              value={formData.gstNumber}
              onChange={(e) => handleInputChange('gstNumber', e.target.value)}
              placeholder="Enter GST number"
            />
          </div>

          <div>
            <Label htmlFor="contact-person">Contact Person Name *</Label>
            <Input
              id="contact-person"
              value={formData.contactPersonName}
              onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
              placeholder="Enter contact person name"
            />
          </div>

          <div>
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="Enter contact email"
            />
          </div>

          <div>
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input
              id="contact-phone"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              placeholder="Enter contact phone"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="Enter website URL"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter organization description"
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationProfileDialog; 