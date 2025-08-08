import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

import { requestOtp, verifyOtp } from '@/lib/api-client';
import type { RequestOtpRequest, VerifyOtpRequest } from '@/lib/api-client';
import { ArrowLeft, Loader2 } from 'lucide-react';

const UnifiedAuthSchema = z.object({
  identifier: z.string()
    .min(1, "Please enter your email or phone number")
    .refine((val) => {
      // Check if it's a valid email or phone number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      return emailRegex.test(val) || phoneRegex.test(val);
    }, "Please enter a valid email or phone number"),
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

  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const identifierForm = useForm<UnifiedAuthInputs>({
    resolver: zodResolver(UnifiedAuthSchema)
  });

  const otpForm = useForm<OtpInputs>({
    resolver: zodResolver(OtpSchema)
  });

  const handleIdentifierSubmit = async (data: UnifiedAuthInputs) => {
    setIsRequestingOtp(true);
    setIdentifier(data.identifier);
    
    try {
      // Determine if it's email or phone
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.identifier);
      
      const request: RequestOtpRequest = isEmail 
        ? { email: data.identifier }
        : { phoneNumber: data.identifier };

      const response = await requestOtp(request);
      
      if (response.ok) {
        if (response.user) {
          // User exists, proceed to OTP verification for login
          setCurrentStep('otp');
          toast.success('OTP sent successfully!');
        } else {
          // User doesn't exist, proceed to signup
          setCurrentStep('signup');
        }
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
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      
      const verifyRequest: VerifyOtpRequest = {
        ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
        otp: data.otp
      };

      const response = await verifyOtp(verifyRequest);
      
      // Handle successful verification
      if (response.token && response.user) {
        // Handle OTP verification response
        await handleOtpVerification(response);
        
        toast.success('Login successful!');
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
      const request: RequestOtpRequest = isEmail 
        ? { email: identifier }
        : { phoneNumber: identifier };

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

  const handleBackToIdentifier = () => {
    setCurrentStep('identifier');
    otpForm.reset();
  };

  const handleClose = () => {
    setCurrentStep('identifier');
    setIdentifier('');

    identifierForm.reset();
    otpForm.reset();
    onClose();
  };

  const renderIdentifierStep = () => (
    <div className="space-y-4">
      <form onSubmit={identifierForm.handleSubmit(handleIdentifierSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="identifier">Enter mobile number or email</Label>
          <Input
            id="identifier"
            type="text"
            placeholder="Enter your email or phone number"
            {...identifierForm.register("identifier")}
          />
          {identifierForm.formState.errors.identifier && (
            <span className="text-sm text-destructive">
              {identifierForm.formState.errors.identifier.message}
            </span>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isRequestingOtp}
        >
          {isRequestingOtp ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending OTP...
            </>
          ) : (
            'Continue'
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
      <DialogContent className="sm:max-w-md">
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