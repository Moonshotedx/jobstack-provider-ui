import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

const INDIA_COUNTRY_CODE: CountryCode = {
  code: 'IN',
  dialCode: '+91',
  name: 'India',
  flag: '🇮🇳'
};

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter phone number',
  label,
  required = false,
  className = '',
  disabled = false,
  error
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize phone number from value prop
  useEffect(() => {
    if (!isInitialized && value) {
      // Check if value already has the +91 country code
      if (value.startsWith(INDIA_COUNTRY_CODE.dialCode)) {
        setPhoneNumber(value.replace(INDIA_COUNTRY_CODE.dialCode, '').trim());
      } else {
        // Assume it's a local number, keep current country
        setPhoneNumber(value);
      }
      setIsInitialized(true);
    } else if (!value) {
      setPhoneNumber('');
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // Auto-focus when component is rendered
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
      // Set cursor at the end of the input
      const value = inputRef.current.value;
      if (value) {
        inputRef.current.setSelectionRange(value.length, value.length);
      }
    }
  }, [disabled]);

  // Update parent when phone number changes - use useCallback to prevent unnecessary re-renders
  const updateParent = useCallback((newPhoneNumber: string) => {
    const fullNumber = newPhoneNumber ? `${INDIA_COUNTRY_CODE.dialCode}${newPhoneNumber}` : '';
    onChange(fullNumber);
  }, [onChange]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits, spaces, and hyphens
    const cleaned = input.replace(/[^\d\s\-]/g, '');
    setPhoneNumber(cleaned);
    updateParent(cleaned);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, tab, escape, enter, and navigation keys
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
      return;
    }
    
    // Allow digits, spaces, and hyphens
    if (!/[\d\s\-]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="phone-input">
          {label}{required && ' *'}
        </Label>
      )}
      
      <div className="flex">
        {/* Country Code Display (Fixed to India) */}
        <div className="flex items-center px-3 py-2 bg-muted border border-r-0 rounded-l-md text-sm font-medium">
          <span className="text-lg mr-2">{INDIA_COUNTRY_CODE.flag}</span>
          <span>{INDIA_COUNTRY_CODE.dialCode}</span>
        </div>

        {/* Phone Number Input */}
        <Input
          id="phone-input"
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rounded-l-none flex-1"
          disabled={disabled}
          autoComplete="tel"
          ref={inputRef}
        />
      </div>

      {error && (
        <span className="text-sm text-destructive">
          {error}
        </span>
      )}
    </div>
  );
};
