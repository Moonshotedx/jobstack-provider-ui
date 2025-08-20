/**
 * Dynamic Export System for Candidate Data
 * 
 * This system automatically discovers all fields from the candidate data structure
 * and creates comprehensive exports without hardcoding field names.
 * 
 * Key Features:
 * - Automatically discovers all nested fields from candidate data
 * - Handles arrays, objects, and primitive values
 * - Creates human-readable CSV headers
 * - Supports JSON, CSV, and XLSX formats
 * - No hardcoded field names - completely dynamic
 */

import type { JobApplicant } from '@/types/jobPost';

// Export formats
export type ExportFormat = 'json' | 'csv' | 'xlsx';

// Interface for export options
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
}

/**
 * Recursively extracts all field paths from an object
 * 
 * Examples:
 * - Simple field: "name" -> "Name"
 * - Nested field: "whatIHave.age" -> "What I Have - Age"
 * - Array field: "skills[0].name" -> "Skills - Name"
 * 
 * @param obj - The object to extract fields from
 * @param prefix - Current field path prefix
 * @returns Array of field paths
 */
const extractAllFields = (obj: any, prefix = ''): string[] => {
  const fields: string[] = [];
  
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    Object.entries(obj).forEach(([key, value]) => {
      // Skip certain fields that might cause issues
      if (key === '__proto__' || key === 'constructor') return;
      
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively extract nested fields
        fields.push(...extractAllFields(value, fieldPath));
      } else if (Array.isArray(value) && value.length > 0) {
        // Handle array fields - extract the structure of first array item
        if (typeof value[0] === 'object' && value[0] !== null) {
          fields.push(...extractAllFields(value[0], `${fieldPath}[0]`));
        } else {
          fields.push(fieldPath);
        }
      } else {
        // Simple field
        fields.push(fieldPath);
      }
    });
  }
  
  return fields;
};

/**
 * Gets a nested value from an object using dot notation
 * 
 * Examples:
 * - "name" -> obj.name
 * - "whatIHave.age" -> obj.whatIHave.age
 * - "skills[0].name" -> obj.skills[0].name
 * 
 * @param obj - The object to extract from
 * @param path - The dot notation path
 * @returns The value at the path
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    if (key.includes('[')) {
      // Handle array access like 'skills[0]'
      const [arrayKey, indexStr] = key.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
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
 * Converts candidate data to CSV format with dynamic headers
 * 
 * This function:
 * 1. Discovers all unique fields across all candidates
 * 2. Creates human-readable headers from field paths
 * 3. Maps each candidate's data to the discovered fields
 * 4. Returns properly formatted CSV content
 * 
 * @param data - Array of candidate data
 * @returns CSV string with dynamic headers and data
 */
const convertToDynamicCSV = (data: JobApplicant[]): string => {
  if (data.length === 0) return '';

  // Collect all unique fields from all candidates
  const allFieldsSet = new Set<string>();
  
  data.forEach(applicant => {
    // Extract fields from the main applicant object
    const applicantFields = extractAllFields(applicant);
    applicantFields.forEach(field => allFieldsSet.add(field));
  });

  // Convert to array and sort for consistent ordering
  const allFields = Array.from(allFieldsSet).sort();

  // Log discovered fields for debugging
  console.log('🔍 Export - Discovered fields:', allFields);
  console.log('📊 Export - Total fields:', allFields.length);

  // Create CSV header
  const header = allFields.map(field => {
    // Convert field paths to readable headers
    return field
      .replace(/\./g, ' - ') // Replace dots with dashes
      .replace(/\[0\]/g, '') // Remove array notation
      .split(' - ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // Capitalize first letter
      .join(' - ');
  }).join(',');

  // Log the final header for debugging
  console.log('📋 Export - CSV Header:', header);

  // Create CSV rows
  const rows = data.map(applicant => {
    const rowData = allFields.map(field => {
      const value = getNestedValue(applicant, field);
      return `"${formatFieldValue(value)}"`;
    });
    
    return rowData.join(',');
  });

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

/**
 * Main export function for candidate data
 * 
 * Supports multiple formats:
 * - JSON: Raw data structure
 * - CSV: Dynamic headers with all discovered fields
 * - XLSX: Currently creates CSV that Excel can open
 * 
 * @param data - Array of candidate data to export
 * @param options - Export configuration options
 */
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
        const csvContent = convertToDynamicCSV(data);
        downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv');
        break;

      case 'xlsx':
        // For XLSX, we'll need to use a library like xlsx
        // For now, we'll create a simple CSV that Excel can open
        const xlsxContent = convertToDynamicCSV(data);
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
 * @returns Array of field paths that will be exported
 */
export const previewExportFields = (data: JobApplicant[]): string[] => {
  if (data.length === 0) return [];
  
  const allFieldsSet = new Set<string>();
  
  data.forEach(applicant => {
    const applicantFields = extractAllFields(applicant);
    applicantFields.forEach(field => allFieldsSet.add(field));
  });
  
  return Array.from(allFieldsSet).sort();
};

/**
 * Gets sample data structure for debugging
 * 
 * Returns the first applicant's structure and discovered fields
 * 
 * @param data - Array of candidate data
 * @returns Object containing sample data and field information
 */
export const getSampleDataStructure = (data: JobApplicant[]): any => {
  if (data.length === 0) return null;
  
  // Return the first applicant's structure as a sample
  const sample = data[0];
  const fields = extractAllFields(sample);
  
  return {
    sampleApplicant: sample,
    discoveredFields: fields,
    fieldCount: fields.length,
    sampleValues: fields.reduce((acc, field) => {
      acc[field] = getNestedValue(sample, field);
      return acc;
    }, {} as Record<string, any>)
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