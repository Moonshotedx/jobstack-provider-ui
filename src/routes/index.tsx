import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/authStore';
import { logout } from '@/lib/utils';
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

  // Automatically clear user session when visiting root page
  useEffect(() => {
    const clearSession = async () => {
      try {
        // Clear the user from the store first
        clearUser();
        
        // Clear any persisted data from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage');
          sessionStorage.clear();
        }
        
        // Only attempt logout if we have a session to clear
        // This prevents unnecessary API calls when user is already logged out
        try {
          const session = await authClient.getSession(undefined, { credentials: 'include' });
          if (session.data?.user) {
            // User has an active session, so we should logout
            await logout();
          } else {
            // No active session, just clear local state
            console.log('No active session found, skipping logout call');
          }
        } catch (sessionError) {
          // Session check failed, which means no valid session anyway
          console.log('Session check failed, skipping logout call:', sessionError);
        }
        
        // Force a re-render by updating the store
        // This ensures any cached data is cleared
        setTimeout(() => {
          clearUser(); // Call again to ensure it's cleared
        }, 100);
      } catch (error) {
        // Silently handle any errors during logout
        console.log('Session cleared (with potential errors):', error);
        // Ensure user is still cleared even if logout fails
        clearUser();
      }
    };

    clearSession();
  }, [clearUser]);

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
