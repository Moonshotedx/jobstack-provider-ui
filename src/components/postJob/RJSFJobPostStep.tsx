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
import { LocationField, type LocationData } from './LocationField';
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

interface RJSFJobPostStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: JobRoleName | null;
  onSubmit: (formData: any) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

const RJSFJobPostStep: React.FC<RJSFJobPostStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  onSubmit,
  onBack,
  isSubmitting = false
}) => {
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleDisplayInfo, setRoleDisplayInfo] = useState<JobRoleConfig | null>(null);

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
        
        const initialData = getRoleInitialData(roleSchema, selectedJobRole);
        
        // Debug logging
        console.log('📋 Loading schema for:', selectedJobRole);
        console.log('📊 Schema loaded:', roleSchema);
        console.log('📝 Schema sections:', Object.keys(roleSchema.properties || {}));
        console.log('🎯 Initial data:', initialData);
        console.log('🎨 Display info:', displayInfo);
        
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
  }, [selectedJobRole, isOpen]);

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

    // Check section-level required fields
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([sectionKey, property]) => {
        const sectionSchema = property as any;
        
        if (sectionSchema.type === 'object' && sectionSchema.required && sectionSchema.properties) {
          // Only validate if the section exists in formData
          if (formData[sectionKey]) {
            sectionSchema.required.forEach((requiredField: string) => {
              const fieldValue = formData[sectionKey][requiredField];
              
              // Check if field is empty, null, undefined, or empty array
              const isEmpty = fieldValue === null || 
                             fieldValue === undefined || 
                             fieldValue === '' || 
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

    onSubmit(formData);
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
                      fieldKey.toLowerCase().includes('image') || fieldKey.toLowerCase().includes('photo') ? 'image' : 
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
    
    // Handle enum fields (dropdowns)
    if (fieldSchema.type === 'string' && fieldSchema.enum) {
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
      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldId}>{fieldLabel}</Label>
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => updateFormData(sectionKey, fieldKey, e.target.value)}
            placeholder={fieldSchema.description}
            rows={4}
            className={`resize-none ${isRequired && !value ? 'border-red-300' : ''}`}
          />
        </div>
      );
    }

    // Handle array fields
    if (fieldSchema.type === 'array') {
      const items = value || [];
      
      // Special handling for array of file uploads - direct strings with data-url format
      if (fieldSchema.items?.type === 'string' && fieldSchema.items?.format === 'data-url') {
        return (
          <div key={fieldKey} className="space-y-3">
            <FileUploadField
              label={fieldLabel}
              description={fieldSchema.description}
              fileType="image"
              accept="image/*"
              multiple={true}
              maxFiles={5}
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
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>{fieldSchema.title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {fieldSchema.items.enum.map((option: string, index: number) => (
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
      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldId}>
            {fieldLabel}
            {fieldSchema.minimum !== undefined && fieldSchema.maximum !== undefined && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({fieldSchema.minimum} - {fieldSchema.maximum})
              </span>
            )}
          </Label>
          <Input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={(e) => updateFormData(sectionKey, fieldKey, Number(e.target.value))}
            placeholder={fieldSchema.description}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isRequired && !value ? 'border-red-300' : ''}`}
          />
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
    return (
      <div key={fieldKey} className="space-y-2">
        <Label htmlFor={fieldId}>{fieldLabel}</Label>
        <Input
          id={fieldId}
          value={value || ''}
          onChange={(e) => updateFormData(sectionKey, fieldKey, e.target.value)}
          placeholder={fieldSchema.description}
          className={isRequired && !value ? 'border-red-300' : ''}
        />
      </div>
    );
  };

  const renderSubsection = (sectionKey: string, subsectionKey: string, subsectionSchema: any, subsectionData: any) => {
    const subsectionTitle = subsectionSchema.title;
    const hasBorder = subsectionSchema['x-ui-subsection'] === 'border';
    
    // Group fields by type for better layout
    const fields = Object.entries(subsectionSchema.properties || {});
    const fileFields = fields.filter(([_, schema]: [string, any]) => schema.format === 'data-url' || (schema.type === 'array' && schema.items?.properties?.file));
    const textareaFields = fields.filter(([key, schema]: [string, any]) => 
      schema.type === 'string' && (
        key.toLowerCase().includes('description') || 
        key.toLowerCase().includes('explanation') ||
        key.toLowerCase().includes('terms') ||
        key.toLowerCase().includes('proof')
      )
    );
    
    // Filter out "Other" fields as they will be handled conditionally within the multiselect fields
    const otherFields = fields.filter(([key, _]: [string, any]) => 
      key.toLowerCase().includes('other') && key.toLowerCase().includes('proof')
    );
    
    const regularFields = fields.filter(([key, _]: [string, any]) => 
      !fileFields.some(([fk]) => fk === key) && 
      !textareaFields.some(([tk]) => tk === key) &&
      !otherFields.some(([ok]) => ok === key)
    );

    const subsectionContent = (
      <div className="space-y-6">
        {/* Regular fields in grid */}
        {regularFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {regularFields.map(([fieldKey, fieldSchema]: [string, any]) => (
              <div key={fieldKey} className={
                fieldSchema.type === 'array' ? 'md:col-span-2' : ''
              }>
                {renderField(sectionKey, `${subsectionKey}.${fieldKey}`, fieldSchema, subsectionData[fieldKey])}
              </div>
            ))}
          </div>
        )}
        
        {/* Textarea fields full width */}
        {textareaFields.length > 0 && (
          <div className="space-y-6 mb-6">
            {textareaFields.map(([fieldKey, fieldSchema]: [string, any]) => (
              renderField(sectionKey, `${subsectionKey}.${fieldKey}`, fieldSchema, subsectionData[fieldKey])
            ))}
          </div>
        )}
        
        {/* File upload fields full width */}
        {fileFields.length > 0 && (
          <div className="space-y-6">
            {fileFields.map(([fieldKey, fieldSchema]: [string, any]) => (
              renderField(sectionKey, `${subsectionKey}.${fieldKey}`, fieldSchema, subsectionData[fieldKey])
            ))}
          </div>
        )}
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
    
    // Separate regular fields from subsections
    const fields = Object.entries(sectionSchema.properties || {});
    const subsections = fields.filter(([_, schema]: [string, any]) => schema.type === 'object' && schema['x-subsection']);
    const regularFields = fields.filter(([key, schema]: [string, any]) => 
      schema.type !== 'object' || !schema['x-subsection']
    );
    
    // Group regular fields by type for better layout
    const fileFields = regularFields.filter(([_, schema]: [string, any]) => schema.format === 'data-url' || (schema.type === 'array' && schema.items?.properties?.file));
    const textareaFields = regularFields.filter(([key, schema]: [string, any]) => 
      schema.type === 'string' && (
        key.toLowerCase().includes('description') || 
        key.toLowerCase().includes('explanation') ||
        key.toLowerCase().includes('terms') ||
        key.toLowerCase().includes('proof')
      )
    );
    const otherRegularFields = regularFields.filter(([key, _]: [string, any]) => 
      !fileFields.some(([fk]) => fk === key) && 
      !textareaFields.some(([tk]) => tk === key)
    );
    
    return (
      <Card key={sectionKey} className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/40 border-b">
          <CardTitle className="text-lg font-semibold">{sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Regular fields in grid */}
          {otherRegularFields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {otherRegularFields.map(([fieldKey, fieldSchema]: [string, any]) => (
                <div key={fieldKey} className={
                  fieldSchema.type === 'array' ? 'md:col-span-2' : ''
                }>
                  {renderField(sectionKey, fieldKey, fieldSchema, sectionData[fieldKey])}
                </div>
              ))}
            </div>
          )}
          
          {/* Textarea fields full width */}
          {textareaFields.length > 0 && (
            <div className="space-y-6 mb-6">
              {textareaFields.map(([fieldKey, fieldSchema]: [string, any]) => (
                renderField(sectionKey, fieldKey, fieldSchema, sectionData[fieldKey])
              ))}
            </div>
          )}
          
          {/* File upload fields full width */}
          {fileFields.length > 0 && (
            <div className="space-y-6 mb-6">
              {fileFields.map(([fieldKey, fieldSchema]: [string, any]) => (
                renderField(sectionKey, fieldKey, fieldSchema, sectionData[fieldKey])
              ))}
            </div>
          )}

          {/* Subsections */}
          {subsections.length > 0 && (
            <div className="space-y-6 mt-6">
              {subsections.map(([subsectionKey, subsectionSchema]: [string, any]) => (
                renderSubsection(sectionKey, subsectionKey, subsectionSchema, sectionData[subsectionKey] || {})
              ))}
            </div>
          )}
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
          <DialogTitle>Post a New Job</DialogTitle>
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
              {isSubmitting ? 'Posting Job...' : 'Post Job'}
            </Button>
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              Back to Role Selection
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Save Draft
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RJSFJobPostStep; 