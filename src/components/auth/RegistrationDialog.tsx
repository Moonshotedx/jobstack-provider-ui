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
import { useAuthStore } from "@/stores/authStore";
import { CheckCircle, Mail, RefreshCw } from 'lucide-react';

const SignUpSchema = z.object({
  firstName: z.string().nonempty().describe('Enter First Name'),
  surname: z.string().nonempty().describe('Enter Surname'),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(['individual', 'organization']),
  termsAccepted: z.boolean().refine(val => val, "Please accept the terms and conditions"),
  privacyAccepted: z.boolean().refine(val => val, "Please consent to the privacy policy")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpInputs = z.infer<typeof SignUpSchema>;

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

const RegistrationDialog: React.FC<RegistrationDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToLogin 
}) => {
  const navigate = useNavigate();
  const { register, resendVerificationEmail, pendingVerificationEmail } = useAuthStore();
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const signUpForm = useForm<SignUpInputs>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      role: 'organization',
      termsAccepted: false,
      privacyAccepted: false
    }
  });

  const watchedTerms = signUpForm.watch('termsAccepted');
  const watchedPrivacy = signUpForm.watch('privacyAccepted');
  const watchedRole = signUpForm.watch('role');

  const onSignUpSubmit = async (data: SignUpInputs) => {
    try {
      const result = await register({ 
        email: data.email,
        password: data.password,
        role: data.role,
        firstName: data.firstName,
        lastName: data.surname
      });
      
      if (result.needsVerification) {
        setShowVerificationPending(true);
        toast.success("Account created! Please check your email to verify your account.");
      } else {
        // If somehow already verified, go to dashboard
        onClose();
        navigate({ to: '/dashboard' });
        toast.success("Account created and verified!");
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      toast.success('Verification email resent successfully!');
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    signUpForm.reset();
    setShowVerificationPending(false);
    onClose();
  };

  // Verification Pending Screen
  if (showVerificationPending) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">Check Your Email</DialogTitle>
            <p className="text-muted-foreground text-sm">
              We've sent a verification link to {pendingVerificationEmail}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Account Created Successfully</p>
                  <p className="text-xs text-muted-foreground">
                    Click the verification link in your email to activate your account and access the dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification}
                disabled={isResending}
                variant="outline" 
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  Already verified?
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 ml-1"
                  onClick={() => {
                    handleClose();
                    onSwitchToLogin?.();
                  }}
                >
                  Sign In
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Can't find the email?</strong> Check your spam folder or try resending the verification email.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">Create Account</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Join our platform to discover opportunities
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
            {/* Email field */}
            <div>
              <Label htmlFor="reg-email">Email Address</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="your@email.com"
                {...signUpForm.register("email")}
              />
              {signUpForm.formState.errors.email && (
                <span className="text-sm text-destructive">
                  {signUpForm.formState.errors.email.message}
                </span>
              )}
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reg-first-name">First Name</Label>
                <Input
                  id="reg-first-name"
                  type="text"
                  placeholder="First Name"
                  {...signUpForm.register("firstName")}
                />
                {signUpForm.formState.errors.firstName && (
                  <span className="text-sm text-destructive">
                    {signUpForm.formState.errors.firstName.message}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="reg-surname">Last Name</Label>
                <Input
                  id="reg-surname"
                  type="text"
                  placeholder="Last Name"
                  {...signUpForm.register("surname")}
                />
                {signUpForm.formState.errors.surname && (
                  <span className="text-sm text-destructive">
                    {signUpForm.formState.errors.surname.message}
                  </span>
                )}
              </div>
            </div>

            {/* Password fields */}
            <div>
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Enter your password"
                {...signUpForm.register("password")}
              />
              {signUpForm.formState.errors.password && (
                <span className="text-sm text-destructive">
                  {signUpForm.formState.errors.password.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="reg-confirm-password">Confirm Password</Label>
              <Input
                id="reg-confirm-password"
                type="password"
                placeholder="Confirm your password"
                {...signUpForm.register("confirmPassword")}
              />
              {signUpForm.formState.errors.confirmPassword && (
                <span className="text-sm text-destructive">
                  {signUpForm.formState.errors.confirmPassword.message}
                </span>
              )}
            </div>

            {/* Account Type */}
            <div className="space-y-4">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={watchedRole === 'individual' ? 'default' : 'outline'}
                  disabled={true}
                  className="h-20 flex flex-col opacity-50 cursor-not-allowed"
                >
                  <span className="font-medium">Individual</span>
                  <span className="text-xs text-muted-foreground">Job seeker</span>
                </Button>
                <Button
                  type="button"
                  variant={watchedRole === 'organization' ? 'default' : 'outline'}
                  onClick={() => signUpForm.setValue('role', 'organization')}
                  className="h-20 flex flex-col"
                >
                  <span className="font-medium">Organization</span>
                  <span className="text-xs text-muted-foreground">Job posting</span>
                </Button>
              </div>
              {signUpForm.formState.errors.role && (
                <span className="text-sm text-destructive">
                  {signUpForm.formState.errors.role.message}
                </span>
              )}
            </div>

            {/* Terms and Privacy */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reg-terms"
                  checked={watchedTerms}
                  onCheckedChange={(checked) => signUpForm.setValue('termsAccepted', checked === true)}
                />
                <Label htmlFor="reg-terms" className="text-sm">
                  I accept the <span className="text-primary cursor-pointer">Terms and Conditions</span>
                </Label>
              </div>
              {signUpForm.formState.errors.termsAccepted && (
                <span className="text-sm text-destructive">
                  {signUpForm.formState.errors.termsAccepted.message}
                </span>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reg-privacy"
                  checked={watchedPrivacy}
                  onCheckedChange={(checked) => signUpForm.setValue('privacyAccepted', checked === true)}
                />
                <Label htmlFor="reg-privacy" className="text-sm">
                  I consent to <span className="text-primary cursor-pointer">Data Privacy Policy</span>
                </Label>
              </div>
              {signUpForm.formState.errors.privacyAccepted && (
                <span className="text-sm text-destructive">
                  {signUpForm.formState.errors.privacyAccepted.message}
                </span>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={signUpForm.formState.isSubmitting}
            >
              {signUpForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            {onSwitchToLogin && (
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  Already have an account?
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 ml-1"
                  onClick={() => {
                    handleClose();
                    onSwitchToLogin();
                  }}
                >
                  Sign In
                </Button>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationDialog; 