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
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ForgotPasswordDialog from './ForgotPasswordDialog';

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 8 characters"),
});

type SignInInputs = z.infer<typeof SignInSchema>;

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const signInForm = useForm<SignInInputs>({
    resolver: zodResolver(SignInSchema)
  });

  const onSignInSubmit = async (data: SignInInputs) => {
    try {
      await login(data);
      onClose();
      navigate({ to: '/dashboard' });
      toast.success(t('login.signInSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('errors.loginFailed'));
    }
  };

  const handleClose = () => {
    signInForm.reset();
    setShowForgotPassword(false);
    onClose();
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">{t('login.title')}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t('login.subtitle')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4">
            {/* Email field */}
            <div>
              <Label htmlFor="login-email">{t('login.emailLabel')}</Label>
              <Input
                id="login-email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                {...signInForm.register("email")}
              />
              {signInForm.formState.errors.email && (
                <span className="text-sm text-destructive">
                  {t('errors.invalidEmail')}
                </span>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">{t('login.passwordLabel')}</Label>
                <Button 
                  variant="ghost" 
                  className="text-sm text-primary p-0 h-auto"
                  onClick={handleForgotPassword}
                >
                  {t('login.forgotPassword')}
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('login.passwordPlaceholder')}
                  {...signInForm.register("password")}
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
              {signInForm.formState.errors.password && (
                <span className="text-sm text-destructive">
                  {t('errors.passwordTooShort')}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('login.signingIn') : t('login.signInButton')}
            </Button>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                {t('login.noAccount')}
              </span>
              <Button
                type="button"
                variant="link"
                className="p-0 ml-1"
                onClick={() => {
                  handleClose();
                  onSwitchToRegister();
                }}
              >
                {t('login.createAccount')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
      
      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={handleBackToLogin}
      />
    </Dialog>
  );
};

export default LoginDialog; 