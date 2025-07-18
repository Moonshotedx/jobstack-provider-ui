import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/authStore';

import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/')({
  component: RouteComponent,
  beforeLoad: () => {
    // Clear any potential URL params that might interfere with modals
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('token') || url.searchParams.has('reset')) {
        url.searchParams.delete('token');
        url.searchParams.delete('reset');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }
});

function RouteComponent() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const user = useUserStore((state) => state.user);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [user, navigate]);

  // Only clear session if user is not authenticated
  useEffect(() => {
    const checkAndClearSession = async () => {
      try {
        // Check if user is already authenticated in the store
        if (user) {
          // User is authenticated, don't clear session
          return;
        }

        // Check server session to see if user is actually logged in
        const session = await authClient.getSession(undefined, { credentials: 'include' });
        
        if (session.data?.user) {
          // User has an active session but not in store, this might be a race condition
          // Don't clear the session, let the SessionInitializer handle it
          return;
        } else {
          // No active session, safe to clear local state
          clearUser();
          
          // Clear any persisted data from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user-storage');
            sessionStorage.clear();
          }
        }
      } catch (sessionError) {
        // Session check failed, which means no valid session anyway
        clearUser();
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage');
          sessionStorage.clear();
        }
      }
    };

    checkAndClearSession();
  }, [clearUser, user]);

  // Show loading state while checking authentication
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">{t('landing.welcome')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('landing.subtitle')}
            </p>
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t('landing.getStarted')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate({ to: "/auth/$action", params: { action: "login" } })}
                >
                  {t('landing.loginButton')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate({ to: "/auth/$action", params: { action: "signup" } })}
                >
                  {t('landing.createAccountButton')}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('landing.newUserMessage')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
