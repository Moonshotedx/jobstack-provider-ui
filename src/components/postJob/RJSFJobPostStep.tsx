import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, X, ChevronDown } from 'lucide-react';
import { FileUploadField } from './FileUploadField';
import { RegistrationField } from './RegistrationField';
import { LocationField } from './LocationField';
import { toast } from 'sonner';
import type { RJSFSchema } from '@rjsf/utils';
import { 
  loadRoleSchema, 
  getRoleInitialData, 
  getRoleDisplayInfo,
  type JobRoleName,
  type JobRoleConfig
} from '@/lib/role-schema-loader';
import { validateRegistrationNumber } from '@/lib/registration-validator';

import type { JobPosting } from '@/lib/api-client';

interface RJSFJobPostStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: JobRoleName | null;
  onSubmit: (formData: any, status: 'open' | 'draft') => void;
  onBack: () => void;
  isSubmitting?: boolean;
  editJobData?: JobPosting | null;
}

const RJSFJobPostStep: React.FC<RJSFJobPostStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  onSubmit,
  onBack,
  isSubmitting = false,
  editJobData
}) => {
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleDisplayInfo, setRoleDisplayInfo] = useState<JobRoleConfig | null>(null);
  
  // Add search state at component level
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Reset form state when selectedJobRole changes to prevent caching issues
  useEffect(() => {
    if (selectedJobRole) {
      console.log('🔄 Resetting form state for new job role:', selectedJobRole);
      setSchema(null);
      setFormData({});
      setLoading(true);
      setError(null);
      setRoleDisplayInfo(null);
      setSearchQueries({}); // Reset search queries
    }
  }, [selectedJobRole]);

  // Cleanup form state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🧹 Cleaning up form state when dialog closes');
      setSchema(null);
      setFormData({});
      setLoading(true);
      setError(null);
      setRoleDisplayInfo(null);
      setSearchQueries({}); // Reset search queries
    }
  }, [isOpen]);

  // Load schema and display info when role changes
  useEffect(() => {
    const loadSchemaAndInfo = async () => {
      if (!selectedJobRole) {
        setError('No job role selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Load both schema and display info in parallel
        const [roleSchema, displayInfo] = await Promise.all([
          loadRoleSchema(selectedJobRole),
          getRoleDisplayInfo(selectedJobRole)
        ]);
        
        let initialData = getRoleInitialData(roleSchema, selectedJobRole);
        
        // If editing, merge with existing job data
        if (editJobData && editJobData.metadata) {
          initialData = {
            ...initialData,
            ...editJobData.metadata
          };
        }
        
        setSchema(roleSchema);
        setFormData(initialData);
        setRoleDisplayInfo(displayInfo);
      } catch (err) {
        console.error('Failed to load schema or display info:', err);
        setError(`Failed to load form for ${selectedJobRole}. Please try again.`);
        setRoleDisplayInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && selectedJobRole) {
      loadSchemaAndInfo();
    }
  }, [selectedJobRole, isOpen, editJobData]);

  // Enhanced validation function to handle both section-level and root-level requirements
  const validateFormData = (schema: RJSFSchema, formData: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check root-level required sections
    if (schema.required) {
      schema.required.forEach((requiredSection: string) => {
        if (!formData[requiredSection] || Object.keys(formData[requiredSection] || {}).length === 0) {
          const sectionSchema = schema.properties?.[requiredSection] as any;
          const sectionTitle = sectionSchema?.title || requiredSection;
          errors.push(`${sectionTitle} section is required`);
        }
      });
    }

    // Check section-level required fields and numeric constraints
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([sectionKey, property]) => {
        const sectionSchema = property as any;
        
        if (sectionSchema.type === 'object' && sectionSchema.properties) {
          // Only validate if the section exists in formData
          if (formData[sectionKey]) {
            // Check required fields
            if (sectionSchema.required) {
              sectionSchema.required.forEach((requiredField: string) => {
                const fieldValue = formData[sectionKey][requiredField];
                
                // Check if field is empty, null, undefined, whitespace-only, or empty array
                const isEmpty = fieldValue === null || 
                               fieldValue === undefined || 
                               fieldValue === '' || 
                               (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
                               (Array.isArray(fieldValue) && fieldValue.length === 0);
                
                if (isEmpty) {
                  const fieldSchema = sectionSchema.properties[requiredField];
                  const fieldTitle = fieldSchema?.title || requiredField;
                  const sectionTitle = sectionSchema.title || sectionKey;
                  errors.push(`${sectionTitle}: ${fieldTitle} is required`);
                } else {
                  // Custom validation for registration fields
                  if (requiredField.toLowerCase().includes('registration') || 
                      requiredField.toLowerCase() === 'gstNumber' ||
                      requiredField.toLowerCase() === 'jobProviderRegistration') {
                    const validation = validateRegistrationNumber(fieldValue);
                    if (!validation.isValid && fieldValue.trim() !== '') {
                      const fieldSchema = sectionSchema.properties[requiredField];
                      const fieldTitle = fieldSchema?.title || requiredField;
                      const sectionTitle = sectionSchema.title || sectionKey;
                      errors.push(`${sectionTitle}: ${fieldTitle} - ${validation.description}`);
                    }
                  }
                  
                  // Additional validation for job provider name, job title, and job provider location to prevent whitespace-only values
                  if (requiredField === 'jobProviderName' || requiredField === 'title' || requiredField === 'jobProviderLocation') {
                    if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
                      const fieldSchema = sectionSchema.properties[requiredField];
                      const fieldTitle = fieldSchema?.title || requiredField;
                      const sectionTitle = sectionSchema.title || sectionKey;
                      errors.push(`${sectionTitle}: ${fieldTitle} cannot be empty or contain only spaces`);
                    }
                  }
                }
              });
            }

            // Check numeric constraints for all fields (not just required ones)
            Object.entries(sectionSchema.properties).forEach(([fieldKey, fieldSchema]) => {
              const fieldValue = formData[sectionKey][fieldKey];
              const field = fieldSchema as any;
              
              // Only validate if field has a value and is a number type
              if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '' && 
                  (field.type === 'number' || field.type === 'integer')) {
                
                const numValue = Number(fieldValue);
                
                // Check minimum constraint
                if (field.minimum !== undefined && numValue < field.minimum) {
                  const fieldTitle = field.title || fieldKey;
                  const sectionTitle = sectionSchema.title || sectionKey;
                  errors.push(`${sectionTitle}: ${fieldTitle} must be at least ${field.minimum}`);
                }
                
                // Check maximum constraint
                if (field.maximum !== undefined && numValue > field.maximum) {
                  const fieldTitle = field.title || fieldKey;
                  const sectionTitle = sectionSchema.title || sectionKey;
                  errors.push(`${sectionTitle}: ${fieldTitle} must be no more than ${field.maximum.toLocaleString()}`);
                }
              }
            });
          }
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = () => {
    if (!schema || !formData) return;

    // Validate the form data with enhanced validation
    const validation = validateFormData(schema, formData);
    
    if (!validation.isValid) {
      // Show toast error with summary
      const errorCount = validation.errors.length;
      toast.error(`Please fix ${errorCount} required field${errorCount > 1 ? 's' : ''}`, {
        description: validation.errors.slice(0, 3).join(', ') + (errorCount > 3 ? `... and ${errorCount - 3} more` : ''),
        duration: 5000,
      });
      return;
    }

    onSubmit(formData, 'open');
  };

  const handleSaveDraft = () => {
    if (!schema || !formData) return;

    // Validate the form data with enhanced validation
    const validation = validateFormData(schema, formData);
    
    if (!validation.isValid) {
      // Show toast error with summary
      const errorCount = validation.errors.length;
      toast.error(`Please fix ${errorCount} required field${errorCount > 1 ? 's' : ''}`, {
        description: validation.errors.slice(0, 3).join(', ') + (errorCount > 3 ? `... and ${errorCount - 3} more` : ''),
        duration: 5000,
      });
      return;
    }

    onSubmit(formData, 'draft');
  };

  const updateFormData = (sectionKey: string, fieldKey: string, value: any) => {
    // Handle nested field paths (e.g., "subsection.field")
    const fieldPath = fieldKey.split('.');
    
    if (fieldPath.length === 1) {
      // Regular field
      setFormData((prev: any) => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          [fieldKey]: value
        }
      }));
    } else if (fieldPath.length === 2) {
      // Subsection field
      const [subsectionKey, actualFieldKey] = fieldPath;
      setFormData((prev: any) => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          [subsectionKey]: {
            ...prev[sectionKey]?.[subsectionKey],
            [actualFieldKey]: value
          }
        }
      }));
    }
  };

  const addArrayItem = (sectionKey: string, fieldKey: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: [...(prev[sectionKey]?.[fieldKey] || []), '']
      }
    }));
  };

  const removeArrayItem = (sectionKey: string, fieldKey: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: prev[sectionKey]?.[fieldKey]?.filter((_: any, i: number) => i !== index) || []
      }
    }));
  };

  const updateArrayItem = (sectionKey: string, fieldKey: string, index: number, value: any) => {
    setFormData((prev: any) => {
      const newArray = [...(prev[sectionKey]?.[fieldKey] || [])];
      newArray[index] = value;
      return {
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          [fieldKey]: newArray
        }
      };
    });
  };

  // Helper function to check if a field is required
  const isFieldRequired = (sectionKey: string, fieldKey: string): boolean => {
    if (!schema?.properties) return false;
    
    const sectionSchema = schema.properties[sectionKey] as any;
    return sectionSchema?.required?.includes(fieldKey) || false;
  };

  // Helper function to check if a field is a location field
  const isLocationField = (fieldKey: string, fieldSchema: any): boolean => {
    return (fieldKey.toLowerCase().includes('location') || 
            fieldKey.toLowerCase().includes('address') ||
            fieldKey.toLowerCase() === 'jobProviderLocation' ||
            (fieldSchema.description && 
             fieldSchema.description.toLowerCase().includes('location'))) &&
           fieldSchema.type !== 'array'; // Exclude arrays like jobLocationPhotos
  };

  const renderField = (sectionKey: string, fieldKey: string, fieldSchema: any, value: any) => {
    const fieldId = `${sectionKey}-${fieldKey}`;
    const isRequired = isFieldRequired(sectionKey, fieldKey);
    const fieldLabel = fieldSchema.title + (isRequired ? ' *' : '');
    
    // Handle file uploads with format: "data-url" FIRST (before location check)
    if (fieldSchema.format === 'data-url') {
      const fileType = fieldKey.toLowerCase().includes('video') ? 'video' : 
                      fieldKey.toLowerCase().includes('image') || fieldKey.toLowerCase().includes('photo') || 
                      fieldKey.toLowerCase().includes('media') || fieldKey.toLowerCase().includes('sample') ? 'image' : 
                      'document';
      
      const accept = fileType === 'video' ? 'video/*' : 
                     fileType === 'image' ? 'image/*' : 
                     '*/*';
      
      // Special handling for fields that should support multiple images
      const isMultipleImageField = fieldKey === 'sampleTaskImage';
      
      return (
        <FileUploadField
          key={fieldKey}
          label={fieldLabel}
          description={fieldSchema.description}
          accept={accept}
          fileType={fileType}
          multiple={isMultipleImageField}
          maxFiles={isMultipleImageField ? 5 : undefined}
          value={value}
          onChange={(file) => updateFormData(sectionKey, fieldKey, file)}
          usePresignedUrl={true}
          objectKeyPrefix="job"
          hideEmptyState={fieldKey.toLowerCase().includes('sample') || fieldKey.toLowerCase().includes('media')}
        />
      );
    }
    
    // Handle location fields with geolocation functionality and structured data
    if (isLocationField(fieldKey, fieldSchema)) {
      return (
        <LocationField
          key={fieldKey}
          label={fieldSchema.title} // Pass base title without asterisk
          value={value || ''}
          onChange={(val) => updateFormData(sectionKey, fieldKey, val)}
          placeholder={fieldSchema.description}
          required={isRequired}
          returnStructuredData={true} // Use structured data for job posting forms
        />
      );
    }
    
    // Handle registration number fields with custom validation
    if (fieldKey.toLowerCase().includes('registration') || 
        fieldKey.toLowerCase() === 'gstNumber' ||
        fieldKey.toLowerCase() === 'jobProviderRegistration' ||
        (fieldSchema.description && 
         fieldSchema.description.toLowerCase().includes('gst') && 
         fieldSchema.description.toLowerCase().includes('registration'))) {
      return (
        <RegistrationField
          key={fieldKey}
          label={fieldLabel}
          value={value || ''}
          onChange={(val) => updateFormData(sectionKey, fieldKey, val)}
          placeholder={fieldSchema.description}
          required={isRequired}
        />
      );
    }
    
    // Handle enum fields (dropdowns and radio buttons)
    if (fieldSchema.type === 'string' && fieldSchema.enum) {
      // Check if this field should be rendered as radio buttons
      if (fieldSchema['x-ui-widget'] === 'radio') {
        return (
          <div key={fieldKey} className="space-y-3">
            <Label>{fieldLabel}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
            )}
            <div className="flex flex-col space-y-2">
              {fieldSchema.enum.map((option: string, index: number) => (
                <div key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${fieldId}-${option}`}
                    name={fieldId}
                    value={option}
                    checked={value === option}
                    onChange={(e) => updateFormData(sectionKey, fieldKey, e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    aria-describedby={fieldSchema.description ? `${fieldId}-description` : undefined}
                    aria-label={`${fieldLabel}: ${fieldSchema.enumNames?.[index] || option}`}
                  />
                  <Label 
                    htmlFor={`${fieldId}-${option}`} 
                    className="font-normal cursor-pointer"
                  >
                    {fieldSchema.enumNames?.[index] || option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Default dropdown for other enum fields
      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldId}>{fieldLabel}</Label>
          <Select value={value || ''} onValueChange={(val) => updateFormData(sectionKey, fieldKey, val)}>
            <SelectTrigger id={fieldId} className={isRequired && !value ? 'border-red-300' : ''}>
              <SelectValue placeholder={fieldSchema.description || `Select ${fieldSchema.title.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldSchema.enum.map((option: string, index: number) => (
                <SelectItem key={option} value={option}>
                  {fieldSchema.enumNames?.[index] || option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    // Handle textarea fields (long text)
    if (fieldSchema.type === 'string' && (
      fieldKey.toLowerCase().includes('description') || 
      fieldKey.toLowerCase().includes('explanation') ||
      fieldKey.toLowerCase().includes('terms') ||
      fieldKey.toLowerCase().includes('proof')
    )) {
      const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        const inputValue = e.target.value;
        
        // Check for whitespace-only values for required fields
        if (isRequired && typeof inputValue === 'string' && inputValue.trim() === '') {
          toast.error(`${fieldSchema.title || fieldKey} cannot be empty or contain only spaces`);
          e.target.classList.add('border-red-300');
        } else {
          e.target.classList.remove('border-red-300');
        }
      };

      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldId}>{fieldLabel}</Label>
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => updateFormData(sectionKey, fieldKey, e.target.value)}
            onBlur={handleTextareaBlur}
            placeholder={fieldSchema.description}
            rows={4}
            className={`resize-none ${isRequired && (!value || (typeof value === 'string' && value.trim() === '')) ? 'border-red-300' : ''}`}
          />
        </div>
      );
    }

    // Handle array fields
    if (fieldSchema.type === 'array') {
      const items = value || [];
      
      // Special handling for array of file uploads - direct strings with data-url format
      if (fieldSchema.items?.type === 'string' && fieldSchema.items?.format === 'data-url') {
        // Determine file type based on field name and description
        const isVideoField = fieldKey.toLowerCase().includes('video') || 
                           (fieldSchema.description && fieldSchema.description.toLowerCase().includes('video'));
        const isImageField = fieldKey.toLowerCase().includes('image') || 
                           fieldKey.toLowerCase().includes('photo') ||
                           fieldKey.toLowerCase().includes('media') ||
                           fieldKey.toLowerCase().includes('sample') ||
                           (fieldSchema.description && fieldSchema.description.toLowerCase().includes('image'));
        
        const fileType = isVideoField ? 'video' : (isImageField ? 'image' : 'document');
        const accept = isVideoField ? 'video/*' : (isImageField ? 'image/*' : '*/*');
        
        // Get max files from schema if specified
        const maxFiles = fieldSchema.maxItems || 5;
        
        return (
          <div key={fieldKey} className="space-y-3">
            <FileUploadField
              label={fieldLabel}
              description={fieldSchema.description}
              fileType={fileType}
              accept={accept}
              multiple={true}
              maxFiles={maxFiles}
              value={items}
              onChange={(files) => {
                if (files === null) {
                  updateFormData(sectionKey, fieldKey, []);
                } else if (Array.isArray(files)) {
                  updateFormData(sectionKey, fieldKey, files);
                } else {
                  updateFormData(sectionKey, fieldKey, [files]);
                }
              }}
              usePresignedUrl={true}
              objectKeyPrefix="job"
              hideEmptyState={fieldKey.toLowerCase().includes('sample') || fieldKey.toLowerCase().includes('media')}
            />
          </div>
        );
      }
      
      // Special handling for array of file uploads (photos/videos with descriptions)
      if (fieldSchema.items?.type === 'object' && fieldSchema.items?.properties?.file?.format === 'data-url') {
        return (
          <div key={fieldKey} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>{fieldLabel}</Label>
                {fieldSchema.description && (
                  <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(sectionKey, fieldKey)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4 text-center border-2 border-dashed rounded-lg">
                No items added yet. Click "Add" to start.
              </p>
            )}
            <div className="space-y-4">
              {items.map((item: any, index: number) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <FileUploadField
                      label={`${fieldSchema.items.properties.file.title} ${index + 1}`}
                      fileType={fieldKey.toLowerCase().includes('video') ? 'video' : 'image'}
                      accept={fieldKey.toLowerCase().includes('video') ? 'video/*' : 'image/*'}
                      value={item.file}
                      onChange={(file) => {
                        const newItems = [...items];
                        newItems[index] = { ...newItems[index], file };
                        updateFormData(sectionKey, fieldKey, newItems);
                      }}
                      usePresignedUrl={true}
                      objectKeyPrefix="job"
                    />
                    <div>
                      <Label>{fieldSchema.items.properties.description.title}</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...newItems[index], description: e.target.value };
                          updateFormData(sectionKey, fieldKey, newItems);
                        }}
                        placeholder="Enter description"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem(sectionKey, fieldKey, index)}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      }
      
      // Special handling for multiselect dropdown arrays (proof types)
      if (fieldSchema.items?.type === 'string' && fieldSchema.items?.enum) {
        const selectedItems = items || [];
        const hasOther = selectedItems.includes('other');
        
        // Add search state for education fields
        const isEducationField = fieldKey === 'minEducationLevel' || fieldKey.endsWith('.minEducationLevel');
        const isItiSpecialtyField = fieldKey === 'itiSpecialtyPreference' || fieldKey.endsWith('.itiSpecialtyPreference');
        const needsSearch = isEducationField || isItiSpecialtyField;
        
        // Use the base field key for search queries (remove subsection prefix if present)
        const searchKey = fieldKey.includes('.') ? fieldKey.split('.').pop() || fieldKey : fieldKey;
        
        // Filter options based on search query for education fields
        const filteredOptions = needsSearch 
          ? fieldSchema.items.enum.filter((option: string, index: number) => {
              const optionName = fieldSchema.items.enumNames?.[index] || option;
              const searchQuery = searchQueries[searchKey] || '';
              return optionName.toLowerCase().includes(searchQuery.toLowerCase());
            })
          : fieldSchema.items.enum;
        
        const handleOptionToggle = (option: string) => {
          let newItems: string[];
          if (selectedItems.includes(option)) {
            newItems = selectedItems.filter((item: string) => item !== option);
            // If removing "other", also clear the "other" text field
            if (option === 'other') {
              const otherFieldKey = fieldKey.replace('Proofs', 'ProofOther');
              updateFormData(sectionKey, otherFieldKey, '');
            }
          } else {
            newItems = [...selectedItems, option];
          }
          updateFormData(sectionKey, fieldKey, newItems);
        };

        return (
          <div key={fieldKey} className="space-y-3">
            <Label>{fieldLabel}</Label>
            {fieldSchema.description && (
              <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedItems.length > 0
                      ? `${selectedItems.length} selected`
                      : `Select ${fieldSchema.title.toLowerCase()}`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>{fieldSchema.title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Search input for education fields */}
                {needsSearch && (
                  <>
                    <div className="px-2 py-1">
                      <Input
                        placeholder={`Search ${isEducationField ? 'education' : 'ITI specialty'} options...`}
                        value={searchQueries[searchKey] || ''}
                        onChange={(e) => setSearchQueries({ ...searchQueries, [searchKey]: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {filteredOptions.map((option: string, index: number) => (
                  <DropdownMenuCheckboxItem
                    key={option}
                    checked={selectedItems.includes(option)}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleOptionToggle(option);
                    }}
                  >
                    {fieldSchema.items.enumNames?.[index] || option}
                  </DropdownMenuCheckboxItem>
                ))}
                
                {/* Show message if no options match search */}
                {needsSearch && filteredOptions.length === 0 && searchQueries[searchKey] && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No options match your search.
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* "Other" text input field */}
            {hasOther && (
              <div className="mt-3">
                <Label htmlFor={`${fieldId}-other`} className="text-sm font-medium">
                  Specify other proof type:
                </Label>
                <Input
                  id={`${fieldId}-other`}
                  value={formData[sectionKey]?.[fieldKey.replace('Proofs', 'ProofOther')] || ''}
                  onChange={(e) => {
                    const otherFieldKey = fieldKey.replace('Proofs', 'ProofOther');
                    updateFormData(sectionKey, otherFieldKey, e.target.value);
                  }}
                  placeholder="Enter other proof type"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        );
      }
      
      // Regular array of strings (fallback)
      return (
        <div key={fieldKey} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>{fieldLabel}</Label>
              {fieldSchema.description && (
                <p className="text-sm text-muted-foreground mt-1">{fieldSchema.description}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(sectionKey, fieldKey)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-4 text-center border-2 border-dashed rounded-lg">
                No items added yet. Click "Add" to start.
              </p>
            )}
            {items.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem(sectionKey, fieldKey, index, e.target.value)}
                  placeholder={`Enter ${fieldSchema.title.toLowerCase().replace(/s$/, '')} ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem(sectionKey, fieldKey, index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Handle number fields
    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        
        // Allow empty values
        if (inputValue === '') {
          updateFormData(sectionKey, fieldKey, null);
          return;
        }
        
        // For integer fields (like age), be more lenient during typing
        const isIntegerField = fieldSchema.type === 'integer';
        
        // Allow partial input for integers (like typing "2" when going to "25")
        if (isIntegerField && /^\d*$/.test(inputValue)) {
          const numValue = parseInt(inputValue, 10);
          if (!isNaN(numValue)) {
            // Only validate constraints if we have a complete number that seems intentional
            // Don't validate single digits as they might be part of a larger number
            if (inputValue.length > 1 || numValue >= 10) {
              if (fieldSchema.minimum !== undefined && numValue < fieldSchema.minimum) {
                toast.error(`${fieldSchema.title || fieldKey} must be at least ${fieldSchema.minimum}`);
                return;
              }
              
              if (fieldSchema.maximum !== undefined && numValue > fieldSchema.maximum) {
                toast.error(`${fieldSchema.title || fieldKey} must be no more than ${fieldSchema.maximum}`);
                return;
              }
            }
            
            updateFormData(sectionKey, fieldKey, numValue);
            return;
          }
        }
        
        // For number fields (not integers), parse as float
        const numValue = Number(inputValue);
        
        // Check if it's a valid number
        if (isNaN(numValue)) {
          toast.error(`${fieldSchema.title || fieldKey} must be a valid number`);
          return; // Don't update the form data with invalid number
        }
        
        // Check constraints while typing for non-integer fields
        if (fieldSchema.minimum !== undefined && numValue < fieldSchema.minimum) {
          toast.error(`${fieldSchema.title || fieldKey} must be at least ${fieldSchema.minimum}`);
          return; // Don't update the form data with value below minimum
        }
        
        if (fieldSchema.maximum !== undefined && numValue > fieldSchema.maximum) {
          toast.error(`${fieldSchema.title || fieldKey} must be no more than ${fieldSchema.maximum.toLocaleString()}`);
          return; // Don't update the form data with value above maximum
        }
        
        // Update the form data only if validation passes
        updateFormData(sectionKey, fieldKey, numValue);
      };

      const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // More thorough validation when user leaves the field
        const inputValue = e.target.value;
        
        if (inputValue === '') {
          return;
        }
        
        const isIntegerField = fieldSchema.type === 'integer';
        const numValue = isIntegerField ? parseInt(inputValue, 10) : Number(inputValue);
        
        // If invalid number, clear the field
        if (isNaN(numValue)) {
          toast.error(`${fieldSchema.title || fieldKey} must be a valid ${isIntegerField ? 'whole number' : 'number'}`);
          e.target.value = '';
          updateFormData(sectionKey, fieldKey, null);
          return;
        }
        
        // Validate constraints on blur (when user is done typing)
        if (fieldSchema.minimum !== undefined && numValue < fieldSchema.minimum) {
          toast.error(`${fieldSchema.title || fieldKey} must be at least ${fieldSchema.minimum}`);
          e.target.value = fieldSchema.minimum.toString();
          updateFormData(sectionKey, fieldKey, fieldSchema.minimum);
          return;
        }
        
        if (fieldSchema.maximum !== undefined && numValue > fieldSchema.maximum) {
          toast.error(`${fieldSchema.title || fieldKey} must be no more than ${fieldSchema.maximum}`);
          e.target.value = fieldSchema.maximum.toString();
          updateFormData(sectionKey, fieldKey, fieldSchema.maximum);
          return;
        }
        
        // Ensure the input shows the correct value from form data
        const currentFormValue = formData[sectionKey]?.[fieldKey];
        if (currentFormValue !== null && currentFormValue !== undefined) {
          e.target.value = currentFormValue.toString();
        }
      };

      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldId}>
            {fieldLabel}
          </Label>
          <Input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={handleNumberChange}
            onBlur={handleNumberBlur}
            placeholder={fieldSchema.description}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isRequired && !value ? 'border-red-300' : ''}`}
          />
          {/* {fieldSchema.description && (
            <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
          )} */}
        </div>
      );
    }

    // Handle date fields
    if (fieldSchema.format === 'date') {
      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldId}>{fieldLabel}</Label>
          <Input
            id={fieldId}
            type="date"
            value={value || ''}
            onChange={(e) => updateFormData(sectionKey, fieldKey, e.target.value)}
            className={`block ${isRequired && !value ? 'border-red-300' : ''}`}
          />
          {fieldSchema.description && (
            <p className="text-sm text-muted-foreground">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    // Handle boolean fields
    if (fieldSchema.type === 'boolean') {
      return (
        <div key={fieldKey} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={fieldId}
            checked={value || false}
            onChange={(e) => updateFormData(sectionKey, fieldKey, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            aria-describedby={fieldSchema.description ? `${fieldId}-description` : undefined}
            aria-label={fieldLabel}
          />
          <Label htmlFor={fieldId} className="font-normal cursor-pointer">
            {fieldLabel}
            {fieldSchema.description && (
              <span className="text-sm text-muted-foreground ml-1">({fieldSchema.description})</span>
            )}
          </Label>
        </div>
      );
    }

    // Default string input
    const handleStringBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Check for whitespace-only values for required fields
      if (isRequired && typeof inputValue === 'string' && inputValue.trim() === '') {
        toast.error(`${fieldSchema.title || fieldKey} cannot be empty or contain only spaces`);
        e.target.classList.add('border-red-300');
      } else {
        e.target.classList.remove('border-red-300');
      }
    };

    return (
      <div key={fieldKey} className="space-y-2">
        <Label htmlFor={fieldId}>{fieldLabel}</Label>
        <Input
          id={fieldId}
          value={value || ''}
          onChange={(e) => updateFormData(sectionKey, fieldKey, e.target.value)}
          onBlur={handleStringBlur}
          placeholder={fieldSchema.description}
          className={isRequired && (!value || (typeof value === 'string' && value.trim() === '')) ? 'border-red-300' : ''}
        />
      </div>
    );
  };

  const renderSubsection = (sectionKey: string, subsectionKey: string, subsectionSchema: any, subsectionData: any) => {
    const subsectionTitle = subsectionSchema.title;
    const hasBorder = subsectionSchema['x-ui-subsection'] === 'border';
    
    // Preserve the exact order from the JSON schema
    const fields = Object.entries(subsectionSchema.properties || {});
    
    const subsectionContent = (
      <div className="space-y-6">
        {/* Render fields in the exact order they appear in the JSON schema */}
        {fields.map(([fieldKey, fieldSchema]: [string, any]) => {
          const fieldValue = subsectionData[fieldKey];
          
          // Handle "Other" fields that are conditionally shown within multiselect fields
          if (fieldKey.toLowerCase().includes('other') && fieldKey.toLowerCase().includes('proof')) {
            return null; // Skip these as they're handled conditionally
          }
          
          // Determine if this field should take full width
          const isFullWidth = fieldSchema.type === 'array' || 
            fieldSchema.format === 'data-url' || 
            (fieldSchema.type === 'string' && (
              fieldKey.toLowerCase().includes('description') || 
              fieldKey.toLowerCase().includes('explanation') ||
              fieldKey.toLowerCase().includes('terms') ||
              fieldKey.toLowerCase().includes('proof')
            ));
          
          return (
            <div key={fieldKey} className={isFullWidth ? 'w-full' : 'md:col-span-1'}>
              {renderField(sectionKey, `${subsectionKey}.${fieldKey}`, fieldSchema, fieldValue)}
            </div>
          );
        })}
      </div>
    );

    if (hasBorder) {
      return (
        <div key={subsectionKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50/30">
          <h4 className="text-md font-semibold mb-4 text-gray-800">{subsectionTitle}</h4>
          {subsectionContent}
        </div>
      );
    }

    return (
      <div key={subsectionKey} className="space-y-4">
        <h4 className="text-md font-semibold text-gray-800">{subsectionTitle}</h4>
        {subsectionContent}
      </div>
    );
  };

  const renderSection = (sectionKey: string, sectionSchema: any) => {
    const sectionData = formData[sectionKey] || {};
    
    // Check if this section is required
    const isSectionRequired = schema?.required?.includes(sectionKey);
    const sectionTitle = sectionSchema.title + (isSectionRequired ? ' *' : '');
    
    // Preserve the exact order from the JSON schema
    const fields = Object.entries(sectionSchema.properties || {});
    
    // Separate subsections from regular fields while maintaining order
    const orderedFields: Array<{ key: string; schema: any; isSubsection: boolean }> = [];
    
    fields.forEach(([fieldKey, fieldSchema]: [string, any]) => {
      const isSubsection = fieldSchema.type === 'object' && fieldSchema['x-subsection'];
      orderedFields.push({
        key: fieldKey,
        schema: fieldSchema,
        isSubsection
      });
    });
    
    return (
      <Card key={sectionKey} className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/40 border-b">
          <CardTitle className="text-lg font-semibold">{sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Render fields in the exact order they appear in the JSON schema */}
          <div className="space-y-6">
            {orderedFields.map(({ key: fieldKey, schema: fieldSchema, isSubsection }) => {
              if (isSubsection) {
                // Render subsection
                return renderSubsection(sectionKey, fieldKey, fieldSchema, sectionData[fieldKey] || {});
              } else {
                // Render regular field
                const fieldValue = sectionData[fieldKey];
                
                // Determine if this field should take full width
                const isFullWidth = fieldSchema.type === 'array' || 
                  fieldSchema.format === 'data-url' || 
                  (fieldSchema.type === 'string' && (
                    fieldKey.toLowerCase().includes('description') || 
                    fieldKey.toLowerCase().includes('explanation') ||
                    fieldKey.toLowerCase().includes('terms') ||
                    fieldKey.toLowerCase().includes('proof')
                  ));
                
                return (
                  <div key={fieldKey} className={isFullWidth ? 'w-full' : 'md:col-span-1'}>
                    {renderField(sectionKey, fieldKey, fieldSchema, fieldValue)}
                  </div>
                );
              }
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!selectedJobRole) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editJobData ? 'Update Job' : 'Post a New Job'}</DialogTitle>
          {selectedJobRole && roleDisplayInfo && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{roleDisplayInfo.industry}</Badge>
              <span className="text-sm text-muted-foreground">→</span>
              <Badge>{selectedJobRole}</Badge>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading form for {selectedJobRole}...</span>
            </div>
          )}

          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <p className="text-destructive font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && schema && (
            <div className="space-y-6">
              {Object.entries(schema.properties || {}).map(([sectionKey, sectionSchema]: [string, any]) => (
                renderSection(sectionKey, sectionSchema)
              ))}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              className="flex-1" 
              disabled={loading || isSubmitting || !schema}
            >
              {isSubmitting ? (editJobData ? 'Updating Job...' : 'Posting Job...') : (editJobData ? 'Update Job' : 'Post Job')}
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
              Save Draft
            </Button>
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              {editJobData ? 'Cancel' : 'Back to Role Selection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RJSFJobPostStep; 