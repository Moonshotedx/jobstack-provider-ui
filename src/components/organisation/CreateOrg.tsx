import { useState } from 'react';
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
import { createOrganisation, authClient } from "@/lib/auth-client"
import { Input } from '@/components/ui/input'
import { toast } from "sonner"
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Building, Loader2 } from 'lucide-react';
import { useUserStore } from '@/stores/authStore';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

const FormSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  logo: z.string().url().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  gstNumber: z.string().optional(),
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional()
})

type FormData = z.infer<typeof FormSchema>;

interface CreateOrgProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function CreateOrg({ isOpen = true, onClose, onSuccess }: CreateOrgProps) {
  const { t } = useTranslation('organizations');
  const [isLoading, setIsLoading] = useState(false);
  const { updateProfile } = useUserStore();

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      logo: '',
      address: '',
      gstNumber: '',
      contactPersonName: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      description: ''
    }
  });

  const generateSlug = (gstNumber?: string): string => {
    // If GST number/identifier is provided, clean and use it as slug
    if (gstNumber && gstNumber.trim().length > 0) {
      return gstNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    // If empty, generate crypto-based unique ID
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const slug = generateSlug(data.gstNumber);

      // Prepare metadata with extended fields
      const metadata = {
        address: data.address,
        gstNumber: data.gstNumber,
        contactPersonName: data.contactPersonName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        website: data.website,
        description: data.description
      };

      const orgData = {
        name: data.name,
        slug: slug,
        logo: data.logo || undefined,
        metadata: metadata // Pass metadata to better-auth
      };

      const organization = await createOrganisation(orgData);
      
      if (organization) {
        // Set the newly created organization as active
        try {
          const setActiveResult = await authClient.organization.setActive({ 
            organizationId: organization.id 
          });
          
          if (setActiveResult.error) {
            console.error('Failed to set organization as active:', setActiveResult.error);
            throw new Error(`Failed to set organization as active: ${setActiveResult.error.message}`);
          }
        } catch (error) {
          console.error('Error setting organization as active:', error);
          throw error;
        }

        // Update user profile with organization data
        const organizationProfile = {
          name: data.name,
          address: data.address,
          gstNumber: data.gstNumber || '',
          logo: data.logo || '',
          contactPersonName: data.contactPersonName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          website: data.website || '',
          description: data.description || ''
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
      
      if (error.message === 'Organization Identifier Already Exists') {
        toast.error(t('errors.slugExists'), {
          description: t('errors.tryAgainLater')
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

  const handleLogoUpload = () => {
    const mockLogoUrl = 'https://via.placeholder.com/100x100';
    form.setValue('logo', mockLogoUrl);
    toast.info("Logo Uploaded", {
      description: "Organization logo has been uploaded."
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

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('create.gstNumber')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('create.gstNumberPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      {t('create.gstNumberDesc')}
                    </p>
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
          </div>

          <div>
            <Label>{t('create.logo')}</Label>
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                {form.watch('logo') ? (
                  <div className="space-y-2">
                    <img src={form.watch('logo')} alt="Logo" className="h-16 w-16 mx-auto rounded" />
                    <Button type="button" variant="outline" onClick={handleLogoUpload}>
                      {t('create.changeLogo')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground" />
                    <Button type="button" onClick={handleLogoUpload}>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('create.uploadLogo')}
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
                      <Input placeholder={t('create.contactPersonPlaceholder')} {...field} />
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
                    <FormLabel>{t('create.contactEmail')}</FormLabel>
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
