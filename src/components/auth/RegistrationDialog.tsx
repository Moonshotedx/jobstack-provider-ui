import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const SignUpSchema = z.object({
  firstName: z.string().nonempty().describe('Enter First Name'),
  surname: z.string().nonempty().describe('Enter Surname'),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
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
  
  const signUpForm = useForm<SignUpInputs>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      termsAccepted: false,
      privacyAccepted: false
    }
  });

  const watchedTerms = signUpForm.watch('termsAccepted');
  const watchedPrivacy = signUpForm.watch('privacyAccepted');

  const onSignUpSubmit = async (data: SignUpInputs) => {
    const name = data.firstName.trim() + " " + data.surname.trim()
    
    const signUpRequest = await authClient.signUp.email({ 
      name, 
      email: data.email,
      password: data.password 
    })
    
    if (signUpRequest.data) {
      onClose();
      navigate({ to: '/' })
      toast.success("Account created successfully!");
    } else if (signUpRequest.error) {
      toast.error(signUpRequest.error.message)
    }
  };

  const handleClose = () => {
    signUpForm.reset();
    onClose();
  };

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