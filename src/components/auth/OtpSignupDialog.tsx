import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

import { requestOtp, verifyOtp } from '@/lib/api-client';
import type { RequestOtpRequest, VerifyOtpRequest } from '@/lib/api-client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { openPolicyPopup } from '@/lib/popupWindow';

const OtpSignupSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .refine((val) => val.trim().length > 0, {
      message: 'First name cannot be empty or contain only spaces'
    })
    .refine((val) => /^[a-zA-Z\s]+$/.test(val.trim()), {
      message: 'First name can only contain letters and spaces'
    }),
  lastName: z.string()
    .min(1, 'Last name is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Last name cannot be empty or contain only spaces'
    })
    .refine((val) => /^[a-zA-Z\s]+$/.test(val.trim()), {
      message: 'Last name can only contain letters and spaces'
    }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Please accept the terms and conditions"
  }),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: "Please consent to the privacy policy"
  }),
});

const OtpSchema = z.object({
  otp: z.string()
    .min(6, "OTP must be at least 6 digits")
    .max(6, "OTP must be at most 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});

type OtpSignupInputs = z.infer<typeof OtpSignupSchema>;
type OtpInputs = z.infer<typeof OtpSchema>;

interface OtpSignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
}

type SignupStep = 'details' | 'otp';

const OtpSignupDialog: React.FC<OtpSignupDialogProps> = ({ isOpen, onClose, identifier }) => {

  const navigate = useNavigate();
  const { handleOtpVerification } = useAuth();
  const [currentStep, setCurrentStep] = useState<SignupStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [userDetails, setUserDetails] = useState<OtpSignupInputs | null>(null);
  
  const signupForm = useForm<OtpSignupInputs>({
    resolver: zodResolver(OtpSignupSchema),
    defaultValues: {
      termsAccepted: false,
      privacyAccepted: false
    }
  });

  const otpForm = useForm<OtpInputs>({
    resolver: zodResolver(OtpSchema)
  });

  const handleSignupSubmit = async (data: OtpSignupInputs) => {
    setIsLoading(true);
    setUserDetails(data);
    
    try {
      // Determine if it's email or phone
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      
      // Ensure phone numbers always have +91 prefix
      let processedIdentifier = identifier;
      if (!isEmail && !identifier.startsWith('+91')) {
        const cleanNumber = identifier.replace(/^\+?\d{1,4}\s?/, '');
        processedIdentifier = `+91${cleanNumber}`;
      }
      
      const request: RequestOtpRequest = isEmail 
        ? { email: processedIdentifier }
        : { phoneNumber: processedIdentifier };

      const response = await requestOtp(request);
      
      if (response.ok) {
        setCurrentStep('otp');
        toast.success('OTP sent successfully!');
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpInputs) => {
    setIsVerifyingOtp(true);
    
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      
      // Ensure phone numbers always have +91 prefix
      let processedIdentifier = identifier;
      if (!isEmail && !identifier.startsWith('+91')) {
        const cleanNumber = identifier.replace(/^\+?\d{1,4}\s?/, '');
        processedIdentifier = `+91${cleanNumber}`;
      }
      
      const verifyRequest: VerifyOtpRequest = {
        ...(isEmail ? { email: processedIdentifier } : { phoneNumber: processedIdentifier }),
        otp: data.otp
      };

      const response = await verifyOtp(verifyRequest);
      
      // Handle successful verification
      if (response.token && response.user) {
        // Handle OTP verification response
        await handleOtpVerification(response);
        
        toast.success('Account created successfully!');
        onClose();
        navigate({ to: '/dashboard', replace: true });
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
    setIsRequestingOtp(true);
    
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      
      // Ensure phone numbers always have +91 prefix
      let processedIdentifier = identifier;
      if (!isEmail && !identifier.startsWith('+91')) {
        const cleanNumber = identifier.replace(/^\+?\d{1,4}\s?/, '');
        processedIdentifier = `+91${cleanNumber}`;
      }
      
      const request: RequestOtpRequest = isEmail 
        ? { email: processedIdentifier }
        : { phoneNumber: processedIdentifier };

      const response = await requestOtp(request);
      
      if (response.ok) {
        toast.success('OTP resent successfully!');
      } else {
        toast.error('Failed to resend OTP. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleBackToDetails = () => {
    setCurrentStep('details');
    otpForm.reset();
  };

  const handleClose = () => {
    setCurrentStep('details');
    setUserDetails(null);
    signupForm.reset();
    otpForm.reset();
    onClose();
  };

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Creating account for:
        </p>
        <p className="font-medium">{identifier}</p>
      </div>

      <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="signup-first-name">First Name</Label>
            <Input
              id="signup-first-name"
              type="text"
              placeholder="Enter your first name"
              {...signupForm.register("firstName", {
                onChange: (e) => {
                  // Only allow letters and spaces
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  e.target.value = value;
                }
              })}
            />
            {signupForm.formState.errors.firstName && (
              <span className="text-sm text-destructive">
                {signupForm.formState.errors.firstName.message}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="signup-last-name">Last Name</Label>
            <Input
              id="signup-last-name"
              type="text"
              placeholder="Enter your last name"
              {...signupForm.register("lastName", {
                onChange: (e) => {
                  // Only allow letters and spaces
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  e.target.value = value;
                }
              })}
            />
            {signupForm.formState.errors.lastName && (
              <span className="text-sm text-destructive">
                {signupForm.formState.errors.lastName.message}
              </span>
            )}
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="[&>button]:!h-[14px] [&>button]:!w-[14px] [&>button]:!min-h-[14px] [&>button]:!min-w-[14px] [&>button_svg]:!h-[11px] [&>button_svg]:!w-[11px]">
              <Checkbox
                id="otp-signup-terms"
                checked={signupForm.watch('termsAccepted')}
                onCheckedChange={(checked) => signupForm.setValue('termsAccepted', checked === true)}
              />
            </div>
            <Label htmlFor="otp-signup-terms" className="text-sm cursor-pointer">
              I accept the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openPolicyPopup('https://onest.network/terms-of-use', 'Terms and Conditions');
                }}
                className="text-primary underline hover:text-primary/80 cursor-pointer font-normal"
              >
                Terms and Conditions
              </button>
            </Label>
          </div>
          {signupForm.formState.errors.termsAccepted && (
            <span className="text-sm text-destructive">
              {signupForm.formState.errors.termsAccepted.message}
            </span>
          )}
          
          <div className="flex items-center space-x-2">
            <div className="[&>button]:!h-[14px] [&>button]:!w-[14px] [&>button]:!min-h-[14px] [&>button]:!min-w-[14px] [&>button_svg]:!h-[11px] [&>button_svg]:!w-[11px]">
              <Checkbox
                id="otp-signup-privacy"
                checked={signupForm.watch('privacyAccepted')}
                onCheckedChange={(checked) => signupForm.setValue('privacyAccepted', checked === true)}
              />
            </div>
            <Label htmlFor="otp-signup-privacy" className="text-sm cursor-pointer">
              I consent to{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openPolicyPopup('https://onest.network/privacy-policy', 'Privacy Policy');
                }}
                className="text-primary underline hover:text-primary/80 cursor-pointer font-normal"
              >
                Data Privacy Policy
              </button>
            </Label>
          </div>
          {signupForm.formState.errors.privacyAccepted && (
            <span className="text-sm text-destructive">
              {signupForm.formState.errors.privacyAccepted.message}
            </span>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </div>
  );

  const renderOtpStep = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          We've sent a verification code to:
        </p>
        <p className="font-medium">{identifier}</p>
        {userDetails && (
          <p className="text-sm text-muted-foreground">
            Creating account for: {userDetails.firstName} {userDetails.lastName}
          </p>
        )}
      </div>

      <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="signup-otp">Enter verification code</Label>
          <Input
            id="signup-otp"
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
            'Verify & Create Account'
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
            onClick={handleBackToDetails}
            className="block mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </form>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'details':
        return 'Create your account';
      case 'otp':
        return 'Verify your account';
      default:
        return 'Create your account';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">{getStepTitle()}</DialogTitle>
          {currentStep === 'details' && (
            <p className="text-muted-foreground text-sm">
              Complete your account setup
            </p>
          )}
        </DialogHeader>

        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'otp' && renderOtpStep()}
      </DialogContent>
    </Dialog>
  );
};

export default OtpSignupDialog; 