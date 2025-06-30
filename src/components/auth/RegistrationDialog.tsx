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
import { CheckCircle, Mail, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SignUpSchema = z.object({
  firstName: z.string().nonempty().describe('Enter First Name'),
  surname: z.string().nonempty().describe('Enter Surname'),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 8 characters"),
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
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { register, resendVerificationEmail, isLoading, pendingVerificationEmail } = useAuth();
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
        toast.success(t('register.accountCreated'));
      } else {
        // If somehow already verified, go to dashboard
        onClose();
        navigate({ to: '/dashboard' });
        toast.success("Account created and verified!");
      }
    } catch (error: any) {
      toast.error(error.message || t('errors.registrationFailed'));
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      toast.success(t('verification.resendSuccess'));
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
            <DialogTitle className="text-2xl font-bold">{t('verification.title')}</DialogTitle>
            <p className="text-muted-foreground text-sm">
              {t('verification.subtitle', { email: pendingVerificationEmail })}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('verification.accountCreatedTitle')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('verification.accountCreatedDesc')}
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
                    {t('verification.resending')}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('verification.resendButton')}
                  </>
                )}
              </Button>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  {t('verification.alreadyVerified')}
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
                  {t('verification.signInLink')}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>{t('verification.cantFindEmail')}</strong> {t('verification.checkSpamFolder')}
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
          <DialogTitle className="text-2xl font-bold">{t('register.title')}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t('register.subtitle')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
            {/* Email field */}
            <div>
              <Label htmlFor="reg-email">{t('register.emailLabel')}</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder={t('register.emailPlaceholder')}
                {...signUpForm.register("email")}
              />
              {signUpForm.formState.errors.email && (
                <span className="text-sm text-destructive">
                  {t('errors.invalidEmail')}
                </span>
              )}
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reg-first-name">{t('register.firstNameLabel')}</Label>
                <Input
                  id="reg-first-name"
                  type="text"
                  placeholder={t('register.firstNamePlaceholder')}
                  {...signUpForm.register("firstName")}
                />
                {signUpForm.formState.errors.firstName && (
                  <span className="text-sm text-destructive">
                    {t('validation.nameRequired')}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="reg-surname">{t('register.lastNameLabel')}</Label>
                <Input
                  id="reg-surname"
                  type="text"
                  placeholder={t('register.lastNamePlaceholder')}
                  {...signUpForm.register("surname")}
                />
                {signUpForm.formState.errors.surname && (
                  <span className="text-sm text-destructive">
                    {t('validation.lastNameRequired')}
                  </span>
                )}
              </div>
            </div>

            {/* Password fields */}
            <div>
              <Label htmlFor="reg-password">{t('register.passwordLabel')}</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('register.passwordPlaceholder')}
                  {...signUpForm.register("password")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {signUpForm.formState.errors.password && (
                <span className="text-sm text-destructive">
                  {t('errors.passwordTooShort')}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="reg-confirm-password">{t('register.confirmPasswordLabel')}</Label>
              <div className="relative">
                <Input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  {...signUpForm.register("confirmPassword")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {signUpForm.formState.errors.confirmPassword && (
                <span className="text-sm text-destructive">
                  {t('errors.passwordMismatch')}
                </span>
              )}
            </div>

            {/* Account Type */}
            <div className="space-y-4">
              <Label>{t('register.accountTypeLabel')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={watchedRole === 'individual' ? 'default' : 'outline'}
                  disabled={true}
                  className="h-20 flex flex-col opacity-50 cursor-not-allowed"
                >
                  <span className="font-medium">{t('register.individualAccount')}</span>
                  <span className="text-xs text-muted-foreground">{t('register.individualAccountDesc')}</span>
                </Button>
                <Button
                  type="button"
                  variant={watchedRole === 'organization' ? 'default' : 'outline'}
                  onClick={() => signUpForm.setValue('role', 'organization')}
                  className="h-20 flex flex-col"
                >
                  <span className="font-medium">{t('register.organizationAccount')}</span>
                  <span className="text-xs text-muted-foreground">{t('register.organizationAccountDesc')}</span>
                </Button>
              </div>
              {signUpForm.formState.errors.role && (
                <span className="text-sm text-destructive">
                  {t('validation.accountTypeRequired')}
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
                  {t('register.termsAccept', { termsLink: t('register.termsAndConditions') })}
                </Label>
              </div>
              {signUpForm.formState.errors.termsAccepted && (
                <span className="text-sm text-destructive">
                  {t('errors.termsRequired')}
                </span>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reg-privacy"
                  checked={watchedPrivacy}
                  onCheckedChange={(checked) => signUpForm.setValue('privacyAccepted', checked === true)}
                />
                <Label htmlFor="reg-privacy" className="text-sm">
                  {t('register.privacyConsent', { privacyLink: t('register.dataPrivacyPolicy') })}
                </Label>
              </div>
              {signUpForm.formState.errors.privacyAccepted && (
                <span className="text-sm text-destructive">
                  {t('errors.privacyRequired')}
                </span>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? t('register.creatingAccount') : t('register.createAccountButton')}
            </Button>

            {onSwitchToLogin && (
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  {t('register.hasAccount')}
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
                  {t('register.signIn')}
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