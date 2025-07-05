import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { validateRegistrationNumber, type RegistrationValidation } from '@/lib/registration-validator';

interface RegistrationFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const RegistrationField: React.FC<RegistrationFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className = ''
}) => {
  const [validation, setValidation] = useState<RegistrationValidation>();
  const [focused, setFocused] = useState(false);

  // Validate on value change
  useEffect(() => {
    const result = validateRegistrationNumber(value);
    setValidation(result);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase(); // Auto-convert to uppercase
    onChange(newValue);
  };

  const getValidationIcon = () => {
    if (!validation || !value) return <Info className="h-4 w-4 text-muted-foreground" />;
    
    if (validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (validation.type === 'unknown' && value.length > 0) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    
    return <Info className="h-4 w-4 text-muted-foreground" />;
  };

  const getInputBorderClass = () => {
    if (!validation || !value) return '';
    
    if (validation.isValid) {
      return 'border-green-300 focus:border-green-500';
    } else if (validation.type === 'unknown' && value.length > 0) {
      return 'border-orange-300 focus:border-orange-500';
    }
    
    return '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="registration-field">
        {label}{required && ' *'}
      </Label>
      
      <div className="relative">
        <Input
          id="registration-field"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "Enter GST, CIN, TAN, PAN or other registration number"}
          className={`pr-10 ${getInputBorderClass()}`}
          style={{ textTransform: 'uppercase' }}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>

      {/* Dynamic validation feedback - prominently display when valid */}
      <div className="space-y-2">
        {validation && value && (
          <div className="flex items-center gap-2">
            <Badge 
              variant={validation.isValid ? 'default' : 'secondary'}
              className={
                validation.isValid ? 'bg-green-100 text-green-800 border-green-200 font-medium' :
                validation.type === 'unknown' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                'bg-gray-100 text-gray-600 border-gray-200'
              }
            >
              {validation.description}
            </Badge>
          </div>
        )}

        {/* Show example only when there's an invalid input and user needs guidance */}
        {validation && !validation.isValid && value.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <strong>Example:</strong> {validation.example}
          </p>
        )}

        {/* Simple help text when focused and no value - don't show all formats */}
        {focused && !value && (
          <p className="text-xs text-muted-foreground">
            Enter your GST, PAN, CIN, TAN or other registration number
          </p>
        )}
      </div>
    </div>
  );
}; 