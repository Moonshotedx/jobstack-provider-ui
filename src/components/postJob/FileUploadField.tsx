import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, FileVideo, FileImage, File as FileIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPresignedUrl, uploadFileToPresignedUrl } from '@/lib/api-client';
import { toast } from 'sonner';

interface FileUploadFieldProps {
  label: string;
  description?: string;
  accept?: string;
  value?: string | File | File[] | string[];
  onChange: (file: File | File[] | string | string[] | null) => void;
  className?: string;
  fileType?: 'image' | 'video' | 'document';
  multiple?: boolean;
  maxFiles?: number;
  usePresignedUrl?: boolean; // New prop to enable presigned URL uploads
  objectKeyPrefix?: string; // Prefix for object key generation
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  description,
  accept,
  value,
  onChange,
  className,
  fileType = 'document',
  multiple = false,
  maxFiles = 5,
  usePresignedUrl = false,
  objectKeyPrefix = 'job'
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle current value
  const currentFiles = multiple && Array.isArray(value) ? value : (value ? [value] : []);
  
  useEffect(() => {
    if (currentFiles.length > 0) {
      const previewUrls: string[] = [];
      
      currentFiles.forEach((file) => {
        if (file instanceof File) {
          // Create preview for images
          if (fileType === 'image' && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
              previewUrls.push(reader.result as string);
              if (previewUrls.length === currentFiles.length) {
                setPreviews([...previewUrls]);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      });
      
      if (fileType !== 'image') {
        setPreviews([]);
      }
    } else {
      setPreviews([]);
    }
  }, [value, fileType]);

  const uploadFileWithPresignedUrl = async (file: File): Promise<string> => {
    // Generate unique object key
    const objectKey = `${objectKeyPrefix}/id${Date.now()}`;
    
    // Get presigned URL
    const presignedUrlResponse = await getPresignedUrl({
      bucketName: 'onest-job-storage',
      contentType: file.type,
      objectKey: objectKey
    });
    
    // Upload file to presigned URL
    await uploadFileToPresignedUrl(presignedUrlResponse.uploadUrl, file);
    
    // Return the access URL
    return presignedUrlResponse.accessUrl;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    if (usePresignedUrl) {
      // Handle presigned URL uploads
      setIsUploading(true);
      
      try {
        if (multiple) {
          const existingFiles = Array.isArray(value) ? [...value] : [];
          const totalFiles = existingFiles.length + files.length;
          
          if (totalFiles > maxFiles) {
            toast.error(`You can only upload up to ${maxFiles} files. Selected ${files.length} files, but you already have ${existingFiles.length}.`);
            return;
          }
          
          // Upload all files and get their access URLs
          const uploadPromises = files.map(file => uploadFileWithPresignedUrl(file));
          const accessUrls = await Promise.all(uploadPromises);
          
          const newFiles = [...existingFiles, ...accessUrls];
          onChange(newFiles as string[]);
          
          toast.success('Files uploaded successfully');
        } else {
          const file = files[0];
          const accessUrl = await uploadFileWithPresignedUrl(file);
          onChange(accessUrl);
          
          toast.success('File uploaded successfully');
        }
      } catch (error) {
        console.error('File upload failed:', error);
        toast.error('Upload failed', {
          description: 'Failed to upload file. Please try again.'
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      // Handle regular file uploads (existing behavior)
      if (multiple) {
        const existingFiles = Array.isArray(value) ? [...value] : [];
        const totalFiles = existingFiles.length + files.length;
        
        if (totalFiles > maxFiles) {
          alert(`You can only upload up to ${maxFiles} files. Selected ${files.length} files, but you already have ${existingFiles.length}.`);
          return;
        }
        
        const newFiles = [...existingFiles, ...files];
        onChange(newFiles as File[]);
      } else {
        const file = files[0];
        if (file) {
          onChange(file);
        }
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    if (multiple && Array.isArray(value)) {
      const newFiles = value.filter((_, i) => i !== index);
      if (usePresignedUrl) {
        onChange(newFiles.length > 0 ? newFiles as string[] : null);
      } else {
        onChange(newFiles.length > 0 ? newFiles as File[] : null);
      }
    } else {
      onChange(null);
    }
  };

  const getIcon = () => {
    switch (fileType) {
      case 'video':
        return <FileVideo className="h-8 w-8 text-muted-foreground" />;
      case 'image':
        return <FileImage className="h-8 w-8 text-muted-foreground" />;
      default:
        return <FileIcon className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const canAddMore = !multiple || (Array.isArray(value) ? value.length < maxFiles : (!value || currentFiles.length < maxFiles));

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label>{label}</Label>
        {multiple && (
          <p className="text-sm text-muted-foreground">
            {Array.isArray(value) ? value.length : (value ? 1 : 0)} / {maxFiles} files selected
          </p>
        )}
      </div>
      
      {/* File Upload Area */}
      {canAddMore && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            multiple={multiple}
            disabled={isUploading}
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 mb-3 animate-spin text-muted-foreground/60" />
                <p className="mb-1 text-sm text-muted-foreground">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 mb-3 text-muted-foreground/60" />
                <p className="mb-1 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                {multiple && (
                  <p className="text-xs text-muted-foreground/80">
                    Select multiple files (up to {maxFiles - (Array.isArray(value) ? value.length : (value ? 1 : 0))} more)
                  </p>
                )}
                {description && (
                  <p className="text-xs text-muted-foreground/80 text-center px-4 mt-1">{description}</p>
                )}
              </>
            )}
          </div>
        </label>
      )}
      
      {/* Selected Files Display */}
      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-3">
            {currentFiles.map((file, index) => {
              const fileName = file instanceof File ? file.name : `File ${index + 1}`;
              const hasPreview = fileType === 'image' && previews[index];
              const isUrl = typeof file === 'string' && file.startsWith('http');
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border-2 border-muted-foreground/25 rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {hasPreview ? (
                      <img 
                        src={previews[index]} 
                        alt={`Preview ${index + 1}`} 
                        className="h-10 w-10 object-cover rounded-md border flex-shrink-0" 
                      />
                    ) : isUrl ? (
                      <img 
                        src={file as string} 
                        alt={`Preview ${index + 1}`} 
                        className="h-10 w-10 object-cover rounded-md border flex-shrink-0" 
                      />
                    ) : (
                      <div className="flex-shrink-0">
                        {getIcon()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {isUrl ? `Uploaded File ${index + 1}` : fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {multiple ? `File ${index + 1} of ${currentFiles.length}` : 'Click remove to change file'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 flex-shrink-0"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Empty state for multiple files - only show for non-image fields */}
      {multiple && currentFiles.length === 0 && fileType !== 'image' && !isUploading && (
        <div className="text-center py-4 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">No files selected. Click above to add up to {maxFiles} files.</p>
        </div>
      )}
    </div>
  );
}; 