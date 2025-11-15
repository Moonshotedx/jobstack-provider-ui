import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileDown, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  exportCandidates, 
  getExportFilename, 
  validateExportData, 
  previewExportFields,
  getSampleDataStructure,
  type ExportFormat 
} from '@/lib/export-utils';
import type { JobApplicant } from '@/types/jobPost';

interface ExportButtonProps {
  data: JobApplicant[];
  jobTitle?: string;
  disabled?: boolean;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  jobTitle = 'candidates',
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation('candidates');
  const [isExporting, setIsExporting] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const handleFormatClick = (format: ExportFormat) => {
    setSelectedFormat(format);
    setConsentChecked(false);
    setShowConsentDialog(true);
  };

  const handleConsentConfirm = async () => {
    if (!consentChecked || !selectedFormat) {
      return;
    }
    
    setShowConsentDialog(false);
    await performExport(selectedFormat);
    setSelectedFormat(null);
    setConsentChecked(false);
  };

  const performExport = async (format: ExportFormat) => {
    if (!validateExportData(data)) {
      toast.error(t('export.noDataToExport'), {
        description: t('export.noDataDescription'),
      });
      return;
    }

    // Extract jobDetails from the first applicant (they all have the same job)
    const jobDetails = data.length > 0 && data[0].jobDetails ? {
      role: data[0].jobDetails.role,
      status: data[0].jobDetails.status
    } : undefined;

    // Debug: Show what fields will be exported
    const fields = previewExportFields(data, jobDetails);
    const sampleStructure = getSampleDataStructure(data, jobDetails);
    
    console.log('🔍 Export Debug Info:', {
      totalCandidates: data.length,
      discoveredFields: fields,
      fieldCount: fields.length,
      sampleStructure,
      jobDetails
    });

    setIsExporting(true);

    try {
      const filename = getExportFilename(jobTitle, format);
      
      await exportCandidates(data, {
        format,
        filename,
        jobDetails
      });

      toast.success(t('export.exportSuccess'), {
        description: `${format.toUpperCase()} file has been downloaded.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('export.exportFailed'), {
        description: error instanceof Error ? error.message : 'Failed to export data. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'json':
        return <FileJson className="h-4 w-4" />;
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case 'json':
        return t('export.formats.json');
      case 'csv':
        return t('export.formats.csv');
      case 'xlsx':
        return t('export.formats.xlsx');
      default:
        return 'Unknown';
    }
  };

  const formats: ExportFormat[] = ['csv', 'xlsx', 'json'];

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || isExporting}
          className={className}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('export.exporting')}
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 mr-2" />
              {t('export.title')}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleFormatClick(format)}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {getFormatIcon(format)}
            <span>{t('export.exportAs', { format: getFormatLabel(format) })}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog 
      open={showConsentDialog} 
      onOpenChange={(open) => {
        setShowConsentDialog(open);
        if (!open) {
          setConsentChecked(false);
          setSelectedFormat(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Consent</DialogTitle>
          <DialogDescription>
            Please confirm your agreement before downloading candidate data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start space-x-3 py-4">
          <Checkbox
            id="consent-checkbox"
            checked={consentChecked}
            onCheckedChange={(checked) => setConsentChecked(checked === true)}
            className="mt-1"
          />
          <Label
            htmlFor="consent-checkbox"
            className="text-sm font-normal leading-relaxed cursor-pointer"
          >
            I agree to use and store downloaded user information securely and only for hiring, as per the Terms of Use and Privacy Policy.
          </Label>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowConsentDialog(false);
              setConsentChecked(false);
              setSelectedFormat(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConsentConfirm}
            disabled={!consentChecked || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
};

export default ExportButton; 