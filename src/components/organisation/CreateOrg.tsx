import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createOrganisation } from "@/lib/auth-client"
import { Input } from '@/components/ui/input'
import { toast } from "sonner"
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Building, Loader2, X } from 'lucide-react';
import { useUserStore } from '@/stores/authStore';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { getPresignedUrl, uploadFileToPresignedUrl, checkOrganizationSlugAvailability } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAssociations, useGetOrgDetailsBySlug } from '@/hooks/useJobsApi';
import { Building2 as BuildingIcon } from 'lucide-react';

const FormSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Organization name cannot be empty or contain only spaces'
    }),
  logo: z.string().url().optional().or(z.literal('')),
  address: z.string()
    .min(1, 'Address is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Address cannot be empty or contain only spaces'
    }),
  contactPersonName: z.string()
    .min(1, 'Contact person name is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Contact person name cannot be empty or contain only spaces'
    })
    .refine((val) => /^[a-zA-Z\s]+$/.test(val.trim()), {
      message: 'Contact person name can only contain letters and spaces'
    }),
  contactEmail: z.string()
    .trim()
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Valid email is required'
    }),
  contactPhone: z.string()
    .min(1, 'Contact phone is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Contact phone cannot be empty or contain only spaces'
    })
    .refine((val) => /^[\d\s+\-()]+$/.test(val), {
      message: 'Phone number can only contain digits, spaces, +, -, and parentheses'
    }),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  associationslug: z.string().optional()
})

type FormData = z.infer<typeof FormSchema>;

interface CreateOrgProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  /** When provided, the MSME association is pre-filled from the URL join flow and locked. */
  lockedAssociationSlug?: string;
}

export function CreateOrg({ isOpen = true, onClose, onSuccess, lockedAssociationSlug }: CreateOrgProps) {
  const { t } = useTranslation(['organizations', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const { updateProfile } = useUserStore();
  const contactEmailLabel = t('create.contactEmail').replace(/\s*\*$/, '');
  // Only fetch associations from dropdown when there's no locked slug from the join flow
  const { data: associations, isLoading: isLoadingAssociations } = useGetAssociations(isOpen !== false && !lockedAssociationSlug);
  // Fetch display name for the locked association (join flow)
  const { data: lockedOrgDetails } = useGetOrgDetailsBySlug(lockedAssociationSlug);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      logo: '',
      address: '',
      contactPersonName: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      description: '',
      associationslug: lockedAssociationSlug || ''
    }
  });

  // Keep the locked slug in sync with the form (in case the prop arrives after mount)
  useEffect(() => {
    if (lockedAssociationSlug) {
      form.setValue('associationslug', lockedAssociationSlug);
    }
  }, [lockedAssociationSlug, form]);

  const generateSlug = (): string => {
    // Generate crypto-based unique ID
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const slug = generateSlug();

      // Check if the slug is available
      console.log('🔍 Checking slug availability for:', slug);
      const isSlugAvailable = await checkOrganizationSlugAvailability(slug);
      
      if (!isSlugAvailable) {
        toast.error(t('errors.slugTakenUserFriendly'), {
          description: t('errors.slugTakenDescription')
        });
        return;
      }
      console.log('✅ Slug is available:', slug);

      // Prepare metadata with extended fields - trim whitespace from string fields
      // Add +91 country code if not present
      let processedPhone = data.contactPhone.trim();
      if (processedPhone && !processedPhone.startsWith('+')) {
        processedPhone = '+91' + processedPhone;
      }
      
      const metadata = {
        address: data.address.trim(),
        contactPersonName: data.contactPersonName.trim(),
        contactEmail: data.contactEmail?.trim() ?? '',
        contactPhone: processedPhone,
        website: data.website?.trim() || '',
        description: data.description?.trim() || ''
      };

      // Set organization type based on association selection
      const orgType = data.associationslug 
        ? `associationslug:${data.associationslug}` 
        : 'employer';

      const orgData = {
        name: data.name.trim(),
        slug: slug,
        logo: data.logo || undefined,
        metadata: metadata, // Pass metadata to better-auth
        type: orgType
      };

      const organization = await createOrganisation(orgData);
      
      if (organization) {
        // Set the newly created organization as active
        try {
          const { default: apiClient } = await import('@/lib/api-client');
          const setActiveResponse = await apiClient.post('/auth/organization/set-active', { 
            organizationId: organization.id 
          });
          
          if (setActiveResponse.status !== 200) {
            console.error('Failed to set organization as active:', setActiveResponse.status);
            throw new Error('Failed to set organization as active');
          }
        } catch (error) {
          console.error('Error setting organization as active:', error);
          throw error;
        }

        // Update user profile with organization data
        const organizationProfile = {
          name: data.name.trim(),
          address: data.address.trim(),
          gstNumber: '', // Empty since removed from UI
          logo: data.logo || '',
          contactPersonName: data.contactPersonName.trim(),
          contactEmail: data.contactEmail?.trim() ?? '',
          contactPhone: processedPhone,
          website: data.website?.trim() || '',
          description: data.description?.trim() || ''
        };

        updateProfile(organizationProfile);
        
        toast.success(t('create.createSuccess'), {
          description: t('create.createSuccessDesc', { name: data.name })
        });

        form.reset();
        onSuccess?.();
        onClose?.();
      }
    } catch (error: any) {
      console.error('Organization creation failed:', error);
      
      // Check for the specific error code "SLUG_IS_TAKEN"
      if (error.code === 'SLUG_IS_TAKEN' || error.message === 'Organization Identifier Already Exists') {
        toast.error(t('errors.slugTakenUserFriendly'), {
          description: t('errors.slugTakenDescription')
        });
      } else {
        toast.error(t('errors.createFailed'), {
          description: error.message || t('errors.tryAgainLater')
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        form.setValue('logo', presignedUrlResponse.accessUrl);
        
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
    form.setValue('logo', '');
    toast.info('Logo removed', {
      description: 'Organization logo has been removed.'
    });
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('create.organizationDetails')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('create.organizationName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('create.organizationNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('create.address')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('create.addressPlaceholder')} 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <div>
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('create.website')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('create.websitePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="associationslug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('create.association')}</FormLabel>
                    {lockedAssociationSlug ? (
                      // Join-flow: show the MSME org as a locked read-only badge
                      <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
                        <BuildingIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {lockedOrgDetails?.name ?? lockedAssociationSlug}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">Pre-selected via invite link</span>
                        {/* Keep hidden input so form value is submitted */}
                        <input type="hidden" {...field} value={lockedAssociationSlug} />
                      </div>
                    ) : (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(value) => field.onChange(value || undefined)}
                        disabled={isLoadingAssociations}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('create.associationPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {associations?.map((association) => (
                            <SelectItem key={association.slug} value={association.slug}>
                              {association.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <Label>{t('create.logo')}</Label>
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                {form.watch('logo') ? (
                  <div className="space-y-2">
                    <img src={form.watch('logo')} alt="Logo" className="h-16 w-16 mx-auto rounded" />
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

          <div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('create.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('create.descriptionPlaceholder')} 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('create.contactPersonDetails')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                                <FormField
                    control={form.control}
                    name="contactPersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('create.contactPersonName')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('create.contactPersonPlaceholder')} 
                            {...field}
                            onChange={(e) => {
                              // Only allow letters and spaces
                              const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </div>

            <div>
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <span>{contactEmailLabel}</span>
                      <span className="text-xs text-muted-foreground">{t('common:labels.optional')}</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder={t('create.contactEmailPlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('create.contactPhone')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder={t('create.contactPhonePlaceholder')}
                        {...field}
                        onChange={(e) => {
                          // Only allow digits, spaces, +, -, and parentheses
                          const value = e.target.value.replace(/[^\d\s+\-()]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t('create.agreementText')}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('create.creating')}
              </>
            ) : (
              t('create.createButton')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('create.title')}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}
