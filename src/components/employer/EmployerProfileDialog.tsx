import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useUpdateOrganization } from '@/hooks/useJobsApi';
import { Loader2, Upload, Building, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPresignedUrl, uploadFileToPresignedUrl, checkOrganizationSlugAvailability } from '@/lib/api-client';
import { useUserStore } from '@/stores/authStore';

// TODO: Move this interface to a separate employer types file when implementing employer store
interface EmployerProfile {
  id: string;
  name: string;
  address: string;
  gstNumber: string;
  logo?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  isDefault?: boolean;
}

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
  const { t } = useTranslation('organizations');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gstNumber: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    logo: ''
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Update form data when employer changes
  useEffect(() => {
    if (employer) {
      setFormData({
        name: employer.name || '',
        address: employer.address || '',
        gstNumber: employer.gstNumber || '',
        contactPersonName: employer.contactPersonName || '',
        contactEmail: employer.contactEmail || '',
        contactPhone: employer.contactPhone || '',
        website: employer.website || '',
        description: employer.description || '',
        logo: employer.logo || ''
      });
    } else {
      // Reset form for new employer
      setFormData({
        name: '',
        address: '',
        gstNumber: '',
        contactPersonName: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        description: '',
        logo: ''
      });
    }
  }, [employer]);

  const updateOrganizationMutation = useUpdateOrganization();
  const updateProfile = useUserStore((state) => state.updateProfile);

  const handleLogoUpload = async () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg';
    input.style.display = 'none';
    
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please select a file smaller than 5MB.'
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', {
          description: 'Please select a valid image file (PNG, JPEG, JPG).'
        });
        return;
      }
      
      setIsUploadingLogo(true);
      
      try {
        // Generate unique object key for the logo
        const objectKey = `provider/id${Date.now()}`;
        
        // Get presigned URL
        const presignedUrlResponse = await getPresignedUrl({
          bucketName: 'onest-job-storage',
          contentType: file.type,
          objectKey: objectKey
        });
        
        // Upload file to presigned URL
        await uploadFileToPresignedUrl(presignedUrlResponse.uploadUrl, file);
        
        // Set the access URL in the form
        setFormData(prev => ({ ...prev, logo: presignedUrlResponse.accessUrl }));
        
        toast.success('Logo uploaded successfully', {
          description: 'Your organization logo has been uploaded.'
        });
        
      } catch (error: any) {
        console.error('Logo upload failed:', error);
        
        // If it's a CORS error, provide helpful message
        if (error.message.includes('CORS restrictions')) {
          toast.error('Upload failed', {
            description: 'CORS error: Please contact support to configure storage bucket permissions.'
          });
        } else {
          toast.error('Upload failed', {
            description: 'Failed to upload logo. Please try again.'
          });
        }
      } finally {
        setIsUploadingLogo(false);
      }
    };
    
    // Trigger file selection
    input.click();
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    toast.info('Logo removed', {
      description: 'Organization logo has been removed.'
    });
  };

  // Helper function to generate slug from GST number or create unique ID
  const generateSlug = (gstNumber?: string): string => {
    // If GST number/identifier is provided, clean and use it as slug
    if (gstNumber && gstNumber.trim().length > 0) {
      return gstNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    // If empty, generate crypto-based unique ID
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  };

  // Function to check if slug is available
  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    try {
      console.log('🔍 [EmployerProfileDialog] Checking slug availability for:', slug);
      const isAvailable = await checkOrganizationSlugAvailability(slug);
      console.log(`✅ [EmployerProfileDialog] Slug "${slug}" availability result:`, isAvailable);
      return isAvailable;
    } catch (error: any) {
      console.error('❌ [EmployerProfileDialog] Error checking slug availability:', error);
      return true; // Assume available on error to not block the user
    }
  };

  const handleSubmit = async () => {
    // Enhanced validation with whitespace checks and phone number validation
    const trimmedName = formData.name.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedContactPerson = formData.contactPersonName.trim();
    const trimmedEmail = formData.contactEmail.trim();
    const trimmedPhone = formData.contactPhone.trim();

    // Check for empty or whitespace-only fields
    if (!trimmedName) {
      toast.error("Organization name cannot be empty or contain only spaces.");
      return;
    }
    if (!trimmedAddress) {
      toast.error("Address cannot be empty or contain only spaces.");
      return;
    }
    if (!trimmedContactPerson) {
      toast.error("Contact person name cannot be empty or contain only spaces.");
      return;
    }
    if (!trimmedEmail) {
      toast.error("Contact email is required.");
      return;
    }
    if (!trimmedPhone) {
      toast.error("Contact phone cannot be empty or contain only spaces.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Validate contact person name (only letters and spaces)
    if (!/^[a-zA-Z\s]+$/.test(trimmedContactPerson)) {
      toast.error("Contact person name can only contain letters and spaces.");
      return;
    }


    // Validate phone number format (only allowed characters)
    if (!/^[\d\s+\-()]+$/.test(formData.contactPhone)) {
      toast.error("Phone number can only contain digits, spaces, +, -, and parentheses.");
      return;
    }

    if (employer) {
      // Update existing organization
      try {
        const currentGstNumber = formData.gstNumber?.trim() || '';
        const existingGstNumber = employer.gstNumber || '';
        
        // Generate new slug based on current GST number
        const newSlug = generateSlug(currentGstNumber);
        
        console.log('🔄 [EmployerProfileDialog] Organization update details:', {
          currentGstNumber,
          existingGstNumber,
          newSlug,
          employerId: employer.id
        });
        
        // Check if GST number (and therefore slug) has changed
        const gstNumberChanged = currentGstNumber !== existingGstNumber;
        
        console.log('📊 [EmployerProfileDialog] GST number change analysis:', {
          gstNumberChanged,
          willCheckSlug: gstNumberChanged && currentGstNumber
        });
        
        // If GST number changed, check slug availability
        if (gstNumberChanged && currentGstNumber) {
          console.log('🔍 [EmployerProfileDialog] GST number changed, checking slug availability...');
          const isSlugAvailable = await checkSlugAvailability(newSlug);
          if (!isSlugAvailable) {
            console.log('❌ [EmployerProfileDialog] Slug is not available:', newSlug);
            toast.error(t('errors.slugTakenUserFriendly'), {
              description: t('errors.slugTakenDescription')
            });
            return;
          }
          console.log('✅ [EmployerProfileDialog] Slug is available, proceeding with update');
        } else {
          console.log('ℹ️ [EmployerProfileDialog] No GST number change detected, skipping slug check');
        }

        // Add +91 country code if not present
        let processedPhone = trimmedPhone;
        if (processedPhone && !processedPhone.startsWith('+')) {
          processedPhone = '+91' + processedPhone;
        }
        
        const metadata = {
          address: trimmedAddress,
          gstNumber: currentGstNumber,
          contactPersonName: trimmedContactPerson,
          contactEmail: trimmedEmail,
          contactPhone: processedPhone,
          website: formData.website?.trim() || '',
          description: formData.description?.trim() || ''
        };

        await updateOrganizationMutation.mutateAsync({
          organizationId: employer.id,
          organizationData: {
            name: trimmedName,
            metadata: metadata, // Pass as object, not JSON string
            logo: formData.logo,
            slug: newSlug // Always use properly generated slug
          }
        });

        // Update the user profile in the store to reflect the changes immediately
        updateProfile({
          name: trimmedName,
          address: trimmedAddress,
          gstNumber: currentGstNumber,
          logo: formData.logo,
          contactPersonName: trimmedContactPerson,
          contactEmail: trimmedEmail,
          contactPhone: processedPhone,
          website: formData.website?.trim() || '',
          description: formData.description?.trim() || ''
        });

        toast.success("Organization updated successfully!");
        onClose();
      } catch (error: any) {
        console.error('Failed to update organization:', error);
        
        // Check for slug taken error during update
        if (error.code === 'SLUG_IS_TAKEN' || 
            error.message === 'Organization Identifier Already Exists' ||
            error.response?.data?.message?.includes('slug') ||
            error.response?.data?.message?.includes('already exists')) {
          toast.error(t('errors.slugTakenUserFriendly'), {
            description: t('errors.slugTakenDescription')
          });
        } else {
          toast.error("Failed to update organization. Please try again.");
        }
      }
    } else {
      // TODO: Implement create organization functionality
      toast.success("Employer profile added successfully!");
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isSubmitting = updateOrganizationMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employer ? 'Edit Organization Profile' : 'Add New Organization Profile'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empName">Organization Name *</Label>
                  <Input
                    id="empName"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter organization name"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder="Enter GST number"
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label>{t('create.logo')}</Label>
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    {formData.logo ? (
                      <div className="space-y-2">
                        <img src={formData.logo} alt="Logo" className="h-16 w-16 mx-auto rounded" />
                        <div className="flex gap-2 justify-center">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleLogoUpload}
                            disabled={isUploadingLogo}
                          >
                            {isUploadingLogo ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {t('create.changeLogo')}
                              </>
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleRemoveLogo}
                            disabled={isUploadingLogo}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Building className="h-12 w-12 mx-auto text-muted-foreground" />
                        <Button 
                          type="button" 
                          onClick={handleLogoUpload}
                          disabled={isUploadingLogo}
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {t('create.uploadLogo')}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPersonName}
                    onChange={(e) => {
                      // Only allow letters and spaces
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      handleInputChange('contactPersonName', value);
                    }}
                    placeholder="Contact person name"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empPhone">Phone Number *</Label>
                  <Input
                    id="empPhone"
                    value={formData.contactPhone}
                    onChange={(e) => {
                      // Only allow digits, spaces, +, -, and parentheses
                      const value = e.target.value.replace(/[^\d\s+\-()]/g, '');
                      handleInputChange('contactPhone', value);
                    }}
                    placeholder="Enter phone number"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://company.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="empDescription">Organization Description</Label>
                <Textarea
                  id="empDescription"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the organization"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {employer ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                employer ? 'Update Organization' : 'Add Organization'
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployerProfileDialog; 