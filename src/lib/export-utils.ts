import type { JobApplicant } from '@/types/jobPost';

// Export formats
export type ExportFormat = 'json' | 'csv' | 'xlsx';

// Interface for export options
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
}

// Helper function to convert data to CSV format
const convertToCSV = (data: JobApplicant[]): string => {
  if (data.length === 0) return '';

  // Define the columns we want to export
  const columns = [
    'Name',
    'Email',
    'Phone',
    'Location',
    'Age',
    'Applied For',
    'Application Date',
    'Status',
    'Trust Score',
    'Match Score',
    'Experience',
    'Skills',
    'Expected Salary',
    'Languages',
    'Tags',
    'Quality Score',
    'Stitching Speed',
    'Juki Experience',
    'Monthly In-Hand Preferred',
    'Work Hours Per Day',
    'Ready to Migrate',
    'Stay Preferences'
  ];

  // Create CSV header
  const header = columns.join(',');

  // Create CSV rows
  const rows = data.map(applicant => [
    `"${applicant.name || ''}"`,
    `"${applicant.email || ''}"`,
    `"${applicant.phone || ''}"`,
    `"${applicant.location || ''}"`,
    applicant.age || '',
    `"${applicant.appliedFor || ''}"`,
    `"${applicant.applicationDate || ''}"`,
    `"${applicant.status || ''}"`,
    applicant.trustScore || '',
    applicant.matchScore || '',
    `"${applicant.experience || ''}"`,
    `"${(applicant.skills || []).join('; ')}"`,
    `"${applicant.expectedSalary || ''}"`,
    `"${(applicant.languages || []).join('; ')}"`,
    `"${(applicant.tags || []).join('; ')}"`,
    applicant.whatIHave?.qualityScore || '',
    applicant.whatIHave?.stitchingSpeed || '',
    `"${applicant.whatIHave?.jukiMachineExperience || ''}"`,
    applicant.whatIWant?.monthlyInHandPreferred || '',
    applicant.whatIWant?.workHoursPerDay || '',
    `"${applicant.whatIWant?.readyToMigrate || ''}"`,
    `"${applicant.whatIWant?.stayPreferences || ''}"`
  ].join(','));

  return [header, ...rows].join('\n');
};

// Helper function to download file
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Main export function
export const exportCandidates = async (
  data: JobApplicant[],
  options: ExportOptions
): Promise<void> => {
  const { format, filename = 'candidates-export' } = options;

  // Remove any existing file extension from filename to prevent duplication
  const baseFilename = filename.replace(/\.(json|csv|xlsx)$/i, '');

  try {
    switch (format) {
      case 'json':
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `${baseFilename}.json`, 'application/json');
        break;

      case 'csv':
        const csvContent = convertToCSV(data);
        downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv');
        break;

      case 'xlsx':
        // For XLSX, we'll need to use a library like xlsx
        // For now, we'll create a simple CSV that Excel can open
        const xlsxContent = convertToCSV(data);
        downloadFile(xlsxContent, `${baseFilename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get export filename with timestamp
export const getExportFilename = (baseName: string, format: ExportFormat): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `${baseName}-${timestamp}.${format}`;
};

// Helper function to validate export data
export const validateExportData = (data: JobApplicant[]): boolean => {
  return Array.isArray(data) && data.length > 0;
}; 