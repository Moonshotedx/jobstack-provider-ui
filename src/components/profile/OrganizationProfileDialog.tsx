import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Building } from 'lucide-react';
import { useAuthStore, type OrganizationProfile } from '@/stores/authStore';
import { toast } from 'sonner';

interface OrganizationProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrganizationProfileDialog: React.FC<OrganizationProfileDialogProps> = ({ isOpen, onClose }) => {
  const { updateProfile } = useAuthStore();
  
  const [profile, setProfile] = useState<OrganizationProfile>({
    name: '',
    address: '',
    gstNumber: '',
    logo: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: ''
  });

  const handleSave = () => {
    if (!profile.name || !profile.address || !profile.contactPersonName || !profile.contactEmail || !profile.contactPhone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    updateProfile(profile);
    onClose();
    toast.success("Organization Profile Created", {
      description: "Your organization profile has been successfully created."
    });
  };

  const handleLogoUpload = () => {
    // Mock file upload
    setProfile({ ...profile, logo: 'https://via.placeholder.com/100x100' });
    toast.info("Logo Uploaded", {
      description: "Your organization logo has been uploaded."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Organization Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Organization Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={profile.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter organization name"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Enter complete address"
                />
              </div>

              <div>
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={profile.gstNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, gstNumber: e.target.value })}
                  placeholder="Enter GST number"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>

            <div>
              <Label>Organization Logo</Label>
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  {profile.logo ? (
                    <div className="space-y-2">
                      <img src={profile.logo} alt="Logo" className="h-16 w-16 mx-auto rounded" />
                      <Button variant="outline" onClick={handleLogoUpload}>
                        Change Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Building className="h-12 w-12 mx-auto text-muted-foreground" />
                      <Button onClick={handleLogoUpload}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={profile.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Describe your organization"
                rows={3}
              />
            </div>
          </div>

          {/* Contact Person Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Person Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="contactName">Contact Person Name *</Label>
                <Input
                  id="contactName"
                  value={profile.contactPersonName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, contactPersonName: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, contactEmail: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={profile.contactPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, contactPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                By creating an organization profile, you agree to the additional terms and conditions 
                applicable to organizations for posting jobs and issuing certificates.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Create Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationProfileDialog; 