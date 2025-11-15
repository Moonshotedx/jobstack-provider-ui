/**
 * Selective Export System for Candidate Data
 * 
 * This system exports only the specified fields from the candidate data structure.
 * 
 * Exported Fields:
 * - Application Status
 * - Who I Am: age, name, phone, gender, location
 * - What I Have: all fields (experience, skills, etc.)
 * - What I Want: all fields (preferences, expectations, etc.)
 * - Job Details: role, status from tags
 */

import type { JobApplicant } from '@/types/jobPost';

// Export formats
export type ExportFormat = 'json' | 'csv' | 'xlsx';

// Interface for export options
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  jobDetails?: {
    role?: string;
    status?: string;
  };
}

/**
 * Extracts only the specific fields we want to export from an application
 * 
 * @param app - The job application object
 * @param jobDetails - Job details including role and status
 * @returns Flattened object with only the fields we want
 */
const extractExportFields = (app: JobApplicant, jobDetails?: { role?: string; status?: string }): Record<string, any> => {
  const exported: Record<string, any> = {};
  
  // Application Status
  exported['status'] = app.status || 'N/A';
  
  // Who I Am fields
  const whoIAm = (app as any).whoIAm;
  if (whoIAm) {
    exported['age'] = whoIAm.age || 'N/A';
    exported['name'] = whoIAm.name || app.name || 'N/A';
    exported['phone'] = whoIAm.phone || app.phone || 'N/A';
    exported['gender'] = whoIAm.gender || 'N/A';
    exported['location'] = whoIAm.location || app.location || 'N/A';
  } else {
    // Fallback to top-level fields if whoIAm doesn't exist
    exported['age'] = app.age || 'N/A';
    exported['name'] = app.name || 'N/A';
    exported['phone'] = app.phone || 'N/A';
    exported['gender'] = (app as any).gender || 'N/A';
    exported['location'] = app.location || 'N/A';
  }
  
  // What I Have fields - all fields dynamically (use original key names)
  const whatIHave = app.whatIHave;
  if (whatIHave && typeof whatIHave === 'object') {
    Object.entries(whatIHave).forEach(([key, value]) => {
      exported[key] = formatFieldValue(value);
    });
  }
  
  // What I Want fields - all fields dynamically (use original key names)
  const whatIWant = app.whatIWant;
  if (whatIWant && typeof whatIWant === 'object') {
    Object.entries(whatIWant).forEach(([key, value]) => {
      exported[key] = formatFieldValue(value);
    });
  }
  
  // Job Details
  if (jobDetails) {
    exported['role'] = jobDetails.role || 'N/A';
    exported['jobStatus'] = jobDetails.status || 'N/A';
  }
  
  return exported;
};


/**
 * Formats field values for CSV export
 * 
 * Handles:
 * - null/undefined -> empty string
 * - Arrays -> joined with semicolons
 * - Objects -> extracts meaningful string representation
 * - Primitives -> converted to string
 * 
 * @param value - The value to format
 * @returns Formatted string for CSV
 */
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    // Handle arrays - join with semicolon
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        // For objects in arrays, try to extract meaningful string representation
        if (item.name) return item.name;
        if (item.code) return item.code;
        if (item.value) return item.value;
        // Try to find any string property
        const stringProps = Object.values(item).filter(v => typeof v === 'string');
        if (stringProps.length > 0) return stringProps[0];
        return JSON.stringify(item);
      }
      return String(item);
    }).join('; ');
  }
  if (typeof value === 'object') {
    // For objects, try to extract meaningful string representation
    if (value.name) return value.name;
    if (value.code) return value.code;
    if (value.value) return value.value;
    // Try to find any string property
    const stringProps = Object.values(value).filter(v => typeof v === 'string');
    if (stringProps.length > 0) return stringProps[0];
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Converts candidate data to CSV format with only selected fields
 * 
 * @param data - Array of candidate data
 * @param jobDetails - Job details including role and status
 * @returns CSV string with selected fields
 */
const convertToSelectiveCSV = (data: JobApplicant[], jobDetails?: { role?: string; status?: string }): string => {
  if (data.length === 0) return '';

  // Extract fields from all candidates to get all unique column headers
  const allFieldsMap = new Map<string, boolean>();
  const extractedData = data.map(applicant => {
    const fields = extractExportFields(applicant, jobDetails);
    Object.keys(fields).forEach(key => allFieldsMap.set(key, true));
    return fields;
  });

  // Get all unique headers in a consistent order
  const headers = Array.from(allFieldsMap.keys());
  
  console.log('🔍 Export - Selected fields:', headers);
  console.log('📊 Export - Total fields:', headers.length);

  // Create CSV header
  const headerRow = headers.map(h => `"${h}"`).join(',');

  // Create CSV rows
  const rows = extractedData.map(record => {
    return headers.map(header => {
      const value = record[header] !== undefined ? record[header] : 'N/A';
      return `"${String(value).replace(/"/g, '""')}"`; // Escape quotes
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
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

/**
 * Main export function for candidate data
 * 
 * Supports multiple formats:
 * - JSON: Selected fields only
 * - CSV: Selected fields with human-readable headers
 * - XLSX: Currently creates CSV that Excel can open
 * 
 * @param data - Array of candidate data to export
 * @param options - Export configuration options
 */
export const exportCandidates = async (
  data: JobApplicant[],
  options: ExportOptions
): Promise<void> => {
  const { format, filename = 'candidates-export', jobDetails } = options;

  // Remove any existing file extension from filename to prevent duplication
  const baseFilename = filename.replace(/\.(json|csv|xlsx)$/i, '');

  try {
    switch (format) {
      case 'json':
        // Export selected fields as JSON
        const selectedData = data.map(app => extractExportFields(app, jobDetails));
        const jsonContent = JSON.stringify(selectedData, null, 2);
        downloadFile(jsonContent, `${baseFilename}.json`, 'application/json');
        break;

      case 'csv':
        const csvContent = convertToSelectiveCSV(data, jobDetails);
        downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv');
        break;

      case 'xlsx':
        // For XLSX, we'll need to use a library like xlsx
        // For now, we'll create a simple CSV that Excel can open
        const xlsxContent = convertToSelectiveCSV(data, jobDetails);
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

/**
 * Generates export filename with timestamp
 * 
 * @param baseName - Base filename without extension
 * @param format - Export format
 * @returns Filename with timestamp and extension
 */
export const getExportFilename = (baseName: string, format: ExportFormat): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `${baseName}-${timestamp}.${format}`;
};

/**
 * Previews all fields that will be exported
 * 
 * Useful for debugging and understanding the export structure
 * 
 * @param data - Array of candidate data
 * @param jobDetails - Job details including role and status
 * @returns Array of field names that will be exported
 */
export const previewExportFields = (data: JobApplicant[], jobDetails?: { role?: string; status?: string }): string[] => {
  if (data.length === 0) return [];
  
  const allFieldsSet = new Set<string>();
  
  data.forEach(applicant => {
    const fields = extractExportFields(applicant, jobDetails);
    Object.keys(fields).forEach(field => allFieldsSet.add(field));
  });
  
  return Array.from(allFieldsSet).sort();
};

/**
 * Gets sample data structure for debugging
 * 
 * Returns the first applicant's exported structure
 * 
 * @param data - Array of candidate data
 * @param jobDetails - Job details including role and status
 * @returns Object containing sample data and field information
 */
export const getSampleDataStructure = (data: JobApplicant[], jobDetails?: { role?: string; status?: string }): any => {
  if (data.length === 0) return null;
  
  // Return the first applicant's exported structure as a sample
  const sample = data[0];
  const exportedFields = extractExportFields(sample, jobDetails);
  
  return {
    sampleApplicant: sample,
    exportedFields: Object.keys(exportedFields),
    fieldCount: Object.keys(exportedFields).length,
    sampleValues: exportedFields
  };
};

/**
 * Validates that export data is valid
 * 
 * @param data - Array of candidate data
 * @returns True if data is valid for export
 */
export const validateExportData = (data: JobApplicant[]): boolean => {
  return Array.isArray(data) && data.length > 0;
}; 