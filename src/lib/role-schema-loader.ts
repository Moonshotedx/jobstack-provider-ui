import type { RJSFSchema, UiSchema } from '@rjsf/utils';

// Job role configuration interface
export interface JobRoleConfig {
  schemaFile: string;
  industry: string;
  icon: string;
  description: string;
}

export interface JobRolesConfiguration {
  jobRoles: Record<string, JobRoleConfig>;
}

// Cache for configurations and schemas
let jobRolesConfig: JobRolesConfiguration | null = null;
const schemaCache = new Map<string, RJSFSchema>();

/**
 * Load job roles configuration from JSON
 */
export const loadJobRolesConfig = async (): Promise<JobRolesConfiguration> => {
  if (jobRolesConfig) {
    return jobRolesConfig;
  }

  try {
    const response = await fetch('/schemas/job-roles-config.json');
    if (!response.ok) {
      throw new Error(`Failed to load job roles configuration: ${response.statusText}`);
    }
    
    jobRolesConfig = await response.json();
    console.log('📋 Job roles configuration loaded:', Object.keys(jobRolesConfig!.jobRoles));
    return jobRolesConfig!;
  } catch (error) {
    console.error('❌ Error loading job roles configuration:', error);
    throw error;
  }
};

/**
 * Get all available job roles
 */
export const getAvailableRoles = async (): Promise<string[]> => {
  const config = await loadJobRolesConfig();
  return Object.keys(config.jobRoles);
};

// Type for job role names (will be dynamically determined)
export type JobRoleName = string;

/**
 * Load a specific job role schema from its JSON file
 */
export const loadRoleSchema = async (roleName: JobRoleName): Promise<RJSFSchema> => {
  const config = await loadJobRolesConfig();
  const roleConfig = config.jobRoles[roleName];
  
  if (!roleConfig) {
    throw new Error(`Job role "${roleName}" not found in configuration`);
  }

  const fileName = roleConfig.schemaFile;
  
  console.log('🔧 loadRoleSchema called for:', roleName);
  console.log('📁 Mapped to file:', fileName);
  console.log('🌐 Fetching from URL:', `/schemas/${fileName}`);
  
  // Check cache first
  if (schemaCache.has(fileName)) {
    console.log('💾 Found in cache:', fileName);
    return schemaCache.get(fileName)!;
  }

  try {
    const response = await fetch(`/schemas/${fileName}`);
    console.log('📡 Fetch response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to load schema for ${roleName}: ${response.statusText}`);
    }
    
    const schema: RJSFSchema = await response.json();
    console.log('✅ Schema loaded successfully for:', roleName);
    console.log('📋 Schema title:', schema.title);
    console.log('📊 Number of properties:', Object.keys(schema.properties || {}).length);
    console.log('🏷️ Properties:', Object.keys(schema.properties || {}));
    
    // Cache the schema
    schemaCache.set(fileName, schema);
    
    return schema;
  } catch (error) {
    console.error(`❌ Error loading schema for ${roleName}:`, error);
    throw error;
  }
};

/**
 * Get role display information (now from config)
 */
export const getRoleDisplayInfo = async (roleName: JobRoleName): Promise<JobRoleConfig> => {
  const config = await loadJobRolesConfig();
  const roleConfig = config.jobRoles[roleName];
  
  if (!roleConfig) {
    throw new Error(`Job role "${roleName}" not found in configuration`);
  }
  
  return roleConfig;
};

/**
 * Get UI schema for better form organization
 */
export const getRoleUISchema = (schema: RJSFSchema): UiSchema => {
  const uiSchema: UiSchema = {};
  
  // Define UI schema based on schema properties
  if (schema.properties) {
    Object.keys(schema.properties).forEach((key) => {
      const property = schema.properties![key] as any;
      
      // Make sections collapsible
      if (property.type === 'object' && property.title) {
        uiSchema[key] = {
          'ui:title': property.title,
          'ui:classNames': 'section-group'
        };
      }
      
      // Handle array fields
      if (property.type === 'array') {
        uiSchema[key] = {
          'ui:options': {
            addable: true,
            removable: true,
            orderable: false
          }
        };
      }
      
      // Handle text areas for descriptions
      if (key === 'description' || key.includes('description')) {
        uiSchema[key] = {
          'ui:widget': 'textarea',
          'ui:options': {
            rows: 4
          }
        };
      }
    });
  }
  
  return uiSchema;
};

/**
 * Get initial form data with default values
 */
export const getRoleInitialData = (schema: RJSFSchema, roleName?: JobRoleName): Record<string, any> => {
  const initialData: Record<string, any> = {};
  
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, property]) => {
      const prop = property as any;
      
      if (prop.type === 'object' && prop.properties) {
        initialData[key] = {};
        
        // Set defaults for nested properties
        Object.entries(prop.properties).forEach(([nestedKey, nestedProp]) => {
          const nested = nestedProp as any;
          
          // Special handling for job title - pre-fill with selected role name
          if (nestedKey === 'title' && roleName) {
            initialData[key][nestedKey] = roleName;
          } else if (nested.default !== undefined) {
            initialData[key][nestedKey] = nested.default;
          } else if (nested.type === 'array' && nested.default) {
            initialData[key][nestedKey] = nested.default;
          }
        });
      } else if (prop.default !== undefined) {
        initialData[key] = prop.default;
      } else if (prop.type === 'array') {
        initialData[key] = prop.default || [];
      }
    });
  }
  
  return initialData;
};

/**
 * Validate form data against schema
 */
export const validateRoleData = (schema: RJSFSchema, formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Basic validation - check required fields
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, property]) => {
      const prop = property as any;
      
      if (prop.type === 'object' && prop.required && prop.properties) {
        prop.required.forEach((requiredField: string) => {
          if (!formData[key] || !formData[key][requiredField]) {
            errors.push(`${prop.title || key}: ${requiredField} is required`);
          }
        });
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 