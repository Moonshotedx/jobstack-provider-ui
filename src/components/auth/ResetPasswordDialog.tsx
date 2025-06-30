import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth-client";
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';

const ResetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordInputs = z.infer<typeof ResetPasswordSchema>;

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({ 
  isOpen, 
  onClose,
  token
}) => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<ResetPasswordInputs>({
    resolver: zodResolver(ResetPasswordSchema)
  });

  // Validate token before rendering
  const isValidToken = token && 
                      token.trim() !== '' && 
                      token.length > 10 && 
                      !token.includes('undefined') && 
                      !token.includes('null');

  // Don't render if token is invalid
  if (!isValidToken) {
    return null;
  }

  const onSubmit = async (data: ResetPasswordInputs) => {
    setIsLoading(true);
    try {
      const result = await resetPassword(token, data.password);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setIsSuccess(true);
      toast.success(t('resetPassword.passwordResetSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('errors.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setIsSuccess(false);
    onClose();
  };

  const handleLoginRedirect = () => {
    handleClose();
    navigate({ to: "/auth/$action", params: { action: "login" } });
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">Password Reset Successful</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={handleLoginRedirect} className="w-full">
              Continue to Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">{t('resetPassword.title')}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t('resetPassword.subtitle')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="reset-password">{t('resetPassword.newPasswordLabel')}</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  {...form.register("password")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <span className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="reset-confirm-password">{t('resetPassword.confirmPasswordLabel')}</Label>
              <div className="relative">
                <Input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  {...form.register("confirmPassword")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <span className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('resetPassword.resetting') : t('resetPassword.resetPasswordButton')}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog; 