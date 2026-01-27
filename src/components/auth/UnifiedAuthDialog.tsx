import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

import { checkUser, requestOtp, verifyOtp } from '@/lib/api-client';
import type { CheckUserRequest, VerifyOtpRequest } from '@/lib/api-client';
import { ArrowLeft, Loader2 } from 'lucide-react';

const UnifiedAuthSchema = z.object({
  identifier: z.string()
    .min(1, "Please enter your email or phone number")
    .refine((val) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(val)) return true;
      
      // Phone Validation: 
      // 1. Strip the +91 prefix if it exists
      const phoneWithoutPrefix = val.startsWith('+91') 
        ? val.replace('+91', '') 
        : val;
      
      // 2. Remove any other non-digit formatting (spaces, dashes)
      const digitsOnly = phoneWithoutPrefix.replace(/\D/g, "");
      
      // 3. Check if the remaining subscriber number is exactly 10 digits
      return digitsOnly.length === 10;
    }, "Please enter exactly 10 digits for your phone number"),
});

const OtpSchema = z.object({
  otp: z.string()
    .min(6, "OTP must be at least 6 digits")
    .max(6, "OTP must be at most 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});

type UnifiedAuthInputs = z.infer<typeof UnifiedAuthSchema>;
type OtpInputs = z.infer<typeof OtpSchema>;

interface UnifiedAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'identifier' | 'otp' | 'signup';

const UnifiedAuthDialog: React.FC<UnifiedAuthDialogProps> = ({ isOpen, onClose }) => {

  const navigate = useNavigate();
  const { handleOtpVerification } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [previousIdentifierType, setPreviousIdentifierType] = useState<'email' | 'phone'>('email');
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const identifierForm = useForm<UnifiedAuthInputs>({
    resolver: zodResolver(UnifiedAuthSchema)
  });

  const otpForm = useForm<OtpInputs>({
    resolver: zodResolver(OtpSchema)
  });

  // Refs for input fields
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Effect to restore cursor position when input type changes
  useEffect(() => {
    if (identifierType !== previousIdentifierType) {
      setPreviousIdentifierType(identifierType);
      
      // Small delay to ensure the new input is rendered
      setTimeout(() => {
        if (identifierType === 'phone') {
          // For phone input, focus will be handled by the PhoneInput component
          // We just need to ensure the form value is properly set
        } else if (identifierType === 'email' && emailInputRef.current) {
          emailInputRef.current.focus();
          // For email input, restore the exact cursor position
          // Use a small delay to ensure the input is fully rendered
          setTimeout(() => {
            if (emailInputRef.current) {
              emailInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
            }
          }, 5);
        }
      }, 10);
    }
  }, [identifierType, previousIdentifierType, cursorPosition]);

  const handleIdentifierSubmit = async (data: UnifiedAuthInputs) => {
    setIsCheckingUser(true);
    setIdentifier(data.identifier);
    
    try {
      // Determine if it's email or phone
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier);
      const isPhone = /^\+?[\d\s\-\(\)]{10,}$/.test(data.identifier) || data.identifier.startsWith('+') || /^\d/.test(data.identifier);
      
      // Use the detected type for consistency
      const detectedType = isEmail ? 'email' : (isPhone ? 'phone' : identifierType);
      setIdentifierType(detectedType);
      
      // Ensure phone numbers always have +91 prefix
      let processedIdentifier = data.identifier;
      if (detectedType === 'phone' && !data.identifier.startsWith('+91')) {
        // Remove any existing country code and add +91
        const cleanNumber = data.identifier.replace(/^\+?\d{1,4}\s?/, '');
        processedIdentifier = `+91${cleanNumber}`;
        setIdentifier(processedIdentifier);
      }
      
      const checkUserRequest: CheckUserRequest = detectedType === 'email' 
        ? { email: processedIdentifier }
        : { phoneNumber: processedIdentifier };

      const response = await checkUser(checkUserRequest);
              
      if (response.userExists) {
        // User exists, request OTP for login
        await handleRequestOtp(checkUserRequest);
      } else {
        // User doesn't exist, proceed to signup
        setCurrentStep('signup');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check user. Please try again.');
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleRequestOtp = async (request: CheckUserRequest) => {
    setIsRequestingOtp(true);
    
    try {
      // Ensure phone numbers always have +91 prefix
      let processedRequest = { ...request };
      if (request.phoneNumber && !request.phoneNumber.startsWith('+91')) {
        const cleanNumber = request.phoneNumber.replace(/^\+?\d{1,4}\s?/, '');
        processedRequest.phoneNumber = `+91${cleanNumber}`;
      }
      
      const response = await requestOtp(processedRequest);
      
      if (response.ok) {
        setCurrentStep('otp');
        toast.success('OTP sent successfully!');
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleOtpSubmit = async (data: OtpInputs) => {
    setIsVerifyingOtp(true);
    
    try {
      // Determine the type based on the identifier value
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhone = /^\+?[\d\s\-\(\)]{10,}$/.test(identifier) || identifier.startsWith('+') || /^\d/.test(identifier);
      const detectedType = isEmail ? 'email' : (isPhone ? 'phone' : identifierType);
      
      // Ensure phone numbers always have +91 prefix
      let processedIdentifier = identifier;
      if (detectedType === 'phone' && !identifier.startsWith('+91')) {
        const cleanNumber = identifier.replace(/^\+?\d{1,4}\s?/, '');
        processedIdentifier = `+91${cleanNumber}`;
      }
      
      const verifyRequest: VerifyOtpRequest = {
        ...(detectedType === 'email' ? { email: processedIdentifier } : { phoneNumber: processedIdentifier }),
        otp: data.otp
      };

      const response = await verifyOtp(verifyRequest);
      
      // Handle successful verification
      if (response.token && response.user) {
        // Handle OTP verification response
        const result = await handleOtpVerification(response);
        
        if (result.needsOrgSelection) {
          // Show organization selection - we'll handle this in a separate state
          // For now, redirect to dashboard and let the dashboard handle org selection
          toast.success('Login successful!');
          onClose();
          navigate({ to: '/dashboard', replace: true });
        } else {
          toast.success('Login successful!');
          onClose();
          navigate({ to: result.redirectPath || '/dashboard', replace: true });
        }
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    // Determine the type based on the identifier value
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+?[\d\s\-\(\)]{10,}$/.test(identifier) || identifier.startsWith('+') || /^\d/.test(identifier);
    const detectedType = isEmail ? 'email' : (isPhone ? 'phone' : identifierType);
    
    // Ensure phone numbers always have +91 prefix
    let processedIdentifier = identifier;
    if (detectedType === 'phone' && !identifier.startsWith('+91')) {
      const cleanNumber = identifier.replace(/^\+?\d{1,4}\s?/, '');
      processedIdentifier = `+91${cleanNumber}`;
    }
    
    const request: CheckUserRequest = detectedType === 'email'
      ? { email: processedIdentifier }
      : { phoneNumber: processedIdentifier };
    
    await handleRequestOtp(request);
  };

  const handleBackToIdentifier = () => {
    setCurrentStep('identifier');
    otpForm.reset();
  };

  const handleClose = () => {
    setCurrentStep('identifier');
    setIdentifier('');
    setIdentifierType('email');

    identifierForm.reset();
    otpForm.reset();
    onClose();
  };

  const handleIdentifierChange = (value: string) => {
    // Store cursor position for email input
    if (emailInputRef.current) {
      setCursorPosition(emailInputRef.current.selectionStart || 0);
    }
    
    // Update the form value
    identifierForm.setValue('identifier', value);
    
    // Dynamically determine if it's email or phone based on input
    if (value) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^\+?[\d\s\-\(\)]{10,}$/.test(value) || value.startsWith('+') || /^\d/.test(value);
      
      // Only update identifierType if it's clearly one or the other
      if (isEmail && identifierType !== 'email') {
        setIdentifierType('email');
      } else if (isPhone && identifierType !== 'phone') {
        setIdentifierType('phone');
      }
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store cursor position before calling handleIdentifierChange
    setCursorPosition(e.target.selectionStart || 0);
    handleIdentifierChange(e.target.value);
  };

  const handleEmailInputFocus = () => {
    // Store cursor position when input gains focus
    if (emailInputRef.current) {
      setCursorPosition(emailInputRef.current.selectionStart || 0);
    }
  };

  const handleEmailInputBlur = () => {
    // Store cursor position when input loses focus
    if (emailInputRef.current) {
      setCursorPosition(emailInputRef.current.selectionStart || 0);
    }
  };

  const handleIdentifierTypeToggle = () => {
    const newType = identifierType === 'email' ? 'phone' : 'email';
    setIdentifierType(newType);
    identifierForm.setValue('identifier', '');
    
    // Reset the form to prevent validation errors
    identifierForm.clearErrors('identifier');
    
    // Reset cursor position
    setCursorPosition(0);
  };

  const renderIdentifierStep = () => {
    // Determine the current input type based on what user is typing
    const currentValue = identifierForm.watch('identifier') || '';
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue);
    const isPhone = /^\+?[\d\s\-\(\)]{2,}$/.test(currentValue) || currentValue.startsWith('+') || /^\d/.test(currentValue);
    const phoneValueWithoutPrefix = currentValue.startsWith('+91') 
      ? currentValue.replace('+91', '') 
      : currentValue;
    const isPhoneValid = phoneValueWithoutPrefix.length === 10 && /^\d+$/.test(phoneValueWithoutPrefix);
    const isTooLong = phoneValueWithoutPrefix.length > 10 && !isEmail;
    
    // Use the detected type, fallback to the selected type, or default to email
    const effectiveType = isEmail ? 'email' : (isPhone ? 'phone' : identifierType);

    const isContinueDisabled = 
      isCheckingUser || 
      currentValue.trim() === '' || 
      (effectiveType === 'phone' && !isPhoneValid);
    
    // Dynamic label and placeholder
    const getLabel = () => {
      if (effectiveType === 'phone') return 'Enter your phone number';
      if (effectiveType === 'email') return 'Enter your email address';
      return 'Enter mobile number or email';
    };
    
    const getPlaceholder = () => {
      if (effectiveType === 'phone') return 'Enter your phone number';
      if (effectiveType === 'email') return 'Enter your email address';
      return 'Enter mobile number or email';
    };

    return (
      <div className="space-y-4">
        <form onSubmit={identifierForm.handleSubmit(handleIdentifierSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="identifier">{getLabel()}</Label>
            <div className="space-y-2">
              {effectiveType === 'phone' ? (
                <PhoneInput
                  value={identifierForm.watch('identifier') || ''}
                  onChange={handleIdentifierChange}
                  placeholder={getPlaceholder()}
                  error={identifierForm.formState.errors.identifier?.message}
                />
              ) : (
                <Input
                  ref={(el) => {
                    emailInputRef.current = el;
                  }}
                  id="identifier-email"
                  type="email"
                  placeholder={getPlaceholder()}
                  onChange={handleEmailInputChange}
                  onFocus={handleEmailInputFocus}
                  onBlur={handleEmailInputBlur}
                  value={identifierForm.watch('identifier') || ''}
                />
              )}
              
              {/* Toggle Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleIdentifierTypeToggle}
                >
                  {effectiveType === 'email' ? 'Use phone number instead' : 'Use email instead'}
                </Button>
              </div>
            </div>
            <div className="min-h-[20px] mt-1">
              {identifierForm.formState.errors.identifier ? (
                <span className="text-sm text-destructive">
                  {identifierForm.formState.errors.identifier.message}
                </span>
              ) : isTooLong ? (
                <span className="text-sm text-destructive">
                  Phone number should be 10 digits only
                </span>
              ) : null}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isCheckingUser || isContinueDisabled}
          >
            {isCheckingUser ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </div>
    );
  };

  const renderOtpStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          We've sent a verification code to:
        </p>
        <p className="font-medium">{identifier}</p>
      </div>

      <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="otp">Enter verification code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit code"
            maxLength={6}
            {...otpForm.register("otp")}
          />
          {otpForm.formState.errors.otp && (
            <span className="text-sm text-destructive">
              {otpForm.formState.errors.otp.message}
            </span>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isVerifyingOtp}
        >
          {isVerifyingOtp ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>

        <div className="text-center space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendOtp}
            disabled={isRequestingOtp}
          >
            {isRequestingOtp ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend code'
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBackToIdentifier}
            className="block mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </form>
    </div>
  );

  const renderSignupStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          No account found for:
        </p>
        <p className="font-medium">{identifier}</p>
        <p className="text-sm text-muted-foreground">
          Would you like to create a new account?
        </p>
      </div>

      <div className="space-y-3">
        <Button 
          className="w-full"
          onClick={() => {
            // Navigate to signup with the identifier pre-filled
            onClose();
            navigate({ 
              to: '/auth/$action', 
              params: { action: 'signup' },
              search: { identifier }
            });
          }}
        >
          Create new account
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          onClick={handleBackToIdentifier}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'identifier':
        return 'Sign in or create account';
      case 'otp':
        return 'Enter verification code';
      case 'signup':
        return 'Create new account';
      default:
        return 'Sign in or create account';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">{getStepTitle()}</DialogTitle>
          {currentStep === 'identifier' && (
            <p className="text-muted-foreground text-sm">
              Enter your email or phone number to continue
            </p>
          )}
        </DialogHeader>

        {currentStep === 'identifier' && renderIdentifierStep()}
        {currentStep === 'otp' && renderOtpStep()}
        {currentStep === 'signup' && renderSignupStep()}
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedAuthDialog; 