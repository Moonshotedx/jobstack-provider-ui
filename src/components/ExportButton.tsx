import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  exportCandidates, 
  getExportFilename, 
  validateExportData, 
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

  const handleExport = async (format: ExportFormat) => {
    if (!validateExportData(data)) {
      toast.error(t('export.noDataToExport'), {
        description: t('export.noDataDescription'),
      });
      return;
    }

    setIsExporting(true);

    try {
      const filename = getExportFilename(jobTitle, format);
      
      await exportCandidates(data, {
        format,
        filename
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
            onClick={() => handleExport(format)}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {getFormatIcon(format)}
            <span>{t('export.exportAs', { format: getFormatLabel(format) })}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton; 