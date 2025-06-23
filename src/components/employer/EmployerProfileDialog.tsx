import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, type EmployerProfile } from '@/stores/authStore';

interface EmployerProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employer?: EmployerProfile;
}

const EmployerProfileDialog: React.FC<EmployerProfileDialogProps> = ({ 
  isOpen, 
  onClose, 
  employer 
}) => {
  const { addEmployer, updateEmployer } = useAuthStore();
  const [formData, setFormData] = useState({
    name: employer?.name || '',
    address: employer?.address || '',
    gstNumber: employer?.gstNumber || '',
    contactPersonName: employer?.contactPersonName || '',
    contactEmail: employer?.contactEmail || '',
    contactPhone: employer?.contactPhone || '',
    website: employer?.website || '',
    description: employer?.description || ''
  });

  const handleSubmit = () => {
    if (employer) {
      updateEmployer(employer.id, formData);
    } else {
      addEmployer({ ...formData, isActive: true });
    }
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employer ? 'Edit Employer Profile' : 'Add New Employer Profile'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empName">Company Name *</Label>
                  <Input
                    id="empName"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder="Enter GST number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPersonName}
                    onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <Label htmlFor="empEmail">Email *</Label>
                  <Input
                    id="empEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="company@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empPhone">Phone Number *</Label>
                  <Input
                    id="empPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="empDescription">Company Description</Label>
                <Textarea
                  id="empDescription"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the company"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              {employer ? 'Update Employer' : 'Add Employer'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployerProfileDialog; 