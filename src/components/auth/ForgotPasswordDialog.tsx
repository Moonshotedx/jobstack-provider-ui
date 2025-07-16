import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { forgetPassword } from "@/lib/auth-client";
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordInputs = z.infer<typeof ForgotPasswordSchema>;

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ 
  isOpen, 
  onClose, 
  onBackToLogin 
}) => {
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  
  const form = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(ForgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordInputs) => {
    setIsLoading(true);
    try {
      const result = await forgetPassword(data.email);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setSentToEmail(data.email);
      setEmailSent(true);
      toast.success(t('forgotPassword.resetEmailSent'));
    } catch (error: any) {
      toast.error(error.message || t('errors.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setEmailSent(false);
    setSentToEmail('');
    onClose();
  };

  const handleBackToLogin = () => {
    // Clear all state before closing
    form.reset();
    setEmailSent(false);
    setSentToEmail('');
    onClose();
    // Call the callback to switch to login
    onBackToLogin();
  };

  if (emailSent) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">{t('forgotPassword.resetEmailSent')}</DialogTitle>
            <p className="text-muted-foreground text-sm">
              {t('forgotPassword.checkEmail')}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email sent to {sentToEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Click the link in your email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleBackToLogin} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Can't find the email?</strong> Check your spam folder or contact support if you continue to have issues.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">{t('forgotPassword.title')}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t('forgotPassword.subtitle')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">{t('forgotPassword.emailLabel')}</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder={t('forgotPassword.emailPlaceholder')}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <span className="text-sm text-destructive">
                  {t('errors.invalidEmail')}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog; 