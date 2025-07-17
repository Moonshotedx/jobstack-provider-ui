import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Mail, RefreshCw, LogIn, UserX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/verify/email')({
  component: EmailVerificationComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: search.error as string | undefined,
    };
  },
});

function EmailVerificationComponent() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const search = useSearch({ from: '/verify/email' });
  const { checkEmailVerification, resendVerificationEmail } = useAuth();
  const user = useUserStore((state) => state.user);
  
  const [isChecking, setIsChecking] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get error from URL params
  const urlError = search.error;

  useEffect(() => {
    const handleVerification = async () => {
      setIsChecking(true);
      
      try {
        // If there's an error in URL, handle it first
        if (urlError) {
          setError(urlError);
          setIsChecking(false);
          return;
        }

        // Check if user is verified
        const verified = await checkEmailVerification();
        
        if (verified) {
          // User is verified, redirect to dashboard
          toast.success(t('verification.verificationSuccess'));
          navigate({ to: '/dashboard' });
        } else {
          // User is not verified, show error
          setError('verification_failed');
        }
      } catch (error) {
        console.error('Verification check failed:', error);
        setError('verification_failed');
      } finally {
        setIsChecking(false);
      }
    };

    handleVerification();

  }, [urlError, navigate, t]);


  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmail();
      toast.success(t('verification.resendSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('errors.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate({ to: '/auth/$action', params: { action: 'login' } });
  };

  const getErrorContent = (errorType: string) => {
    switch (errorType) {
      case 'token_expired':
      case 'invalid_token':
      case 'expired_token':
        return {
          icon: <AlertCircle className="h-12 w-12 text-yellow-500" />,
          title: t('verification.tokenExpiredTitle'),
          description: t('verification.tokenExpiredDesc'),
          action: (
            <Button onClick={handleResendVerification} disabled={isResending} className="w-full">
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
          )
        };
      
      case 'user_not_found':
        return {
          icon: <UserX className="h-12 w-12 text-red-500" />,
          title: t('verification.userNotFoundTitle'),
          description: t('verification.userNotFoundDesc'),
          action: (
            <Button onClick={handleGoToLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              {t('verification.goToLogin')}
            </Button>
          )
        };
      
      case 'already_verified':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: t('verification.alreadyVerifiedTitle'),
          description: t('verification.alreadyVerifiedDesc'),
          action: (
            <Button onClick={() => navigate({ to: '/dashboard' })} className="w-full">
              {t('verification.goToDashboard')}
            </Button>
          )
        };
      
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: t('verification.verificationFailedTitle'),
          description: t('verification.verificationFailedDesc'),
          action: (
            <Button onClick={handleResendVerification} disabled={isResending} className="w-full">
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
          )
        };
    }
  };

  if (isChecking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-muted-foreground">{t('verification.checkingStatus')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorContent = getErrorContent(error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-4">
            {errorContent.icon}
            <h1 className="text-2xl font-bold">{errorContent.title}</h1>
            <p className="text-muted-foreground">{errorContent.description}</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {errorContent.action}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // This should not be reached, but just in case
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">{t('verification.verificationSuccess')}</h1>
          <p className="text-muted-foreground">{t('verification.redirectingToDashboard')}</p>
        </div>
      </div>
    </div>
  );
} 