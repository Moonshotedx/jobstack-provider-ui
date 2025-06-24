import React from 'react';
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

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInInputs = z.infer<typeof SignInSchema>;

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const signInForm = useForm<SignInInputs>({
    resolver: zodResolver(SignInSchema)
  });

  const onSignInSubmit = async (data: SignInInputs) => {
    try {
      await login(data);
      onClose();
      navigate({ to: '/dashboard' });
      toast.success("Welcome back! You have successfully logged in.");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    }
  };

  const handleClose = () => {
    signInForm.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">Sign In</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Welcome back! Please sign in to your account
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4">
            {/* Email field */}
            <div>
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                {...signInForm.register("email")}
              />
              {signInForm.formState.errors.email && (
                <span className="text-sm text-destructive">
                  {signInForm.formState.errors.email.message}
                </span>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Button variant="ghost" className="text-sm text-primary p-0 h-auto">
                  Forgot Password?
                </Button>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                {...signInForm.register("password")}
              />
              {signInForm.formState.errors.password && (
                <span className="text-sm text-destructive">
                  {signInForm.formState.errors.password.message}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?
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
                Create Account
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog; 