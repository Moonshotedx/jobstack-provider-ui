import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { User, Briefcase, LogOut, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from '@tanstack/react-router';
import { useUserStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import PostJobDialog from './PostJobDialog';
import { CreateOrg } from './organisation/CreateOrg';
import LanguageSwitcher from './ui/language-switcher';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { logoutAndRedirect } from '@/lib/utils';

const Header = () => {
  const [showPostJob, setShowPostJob] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { t } = useTranslation('navigation');
  
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const { checkSession } = useAuth();
  const queryClient = useQueryClient();

  const handlePostJobs = () => {
    // If user is logged in with profile, redirect to dashboard
    if (user && user.profile) {
      navigate({ to: '/dashboard' });
    } else if (user && !user.profile) {
      // User is logged in but needs to complete profile
      setShowPostJob(true);
    } else {
      // User is not logged in, redirect to auth
      navigate({ to: "/auth/$action", params: { action: "login" } });
    }
  };

  const handleCompleteProfile = () => {
    if (!user) return;
    
    // Check if email is verified first
    if (!user.isVerified) {
      toast.error('Email Verification Required', {
        description: 'Please verify your email address before completing your profile.',
      });
      return;
    }
    
    // If email is verified, show organization creation modal
    setShowCreateOrg(true);
  };

  const handleLogout = async () => {
    await logoutAndRedirect();
  };

  // Explicitly check if user exists and has valid data
  const isUserLoggedIn = user && (user.email || user.phone || user.id);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={handlePostJobs}
                className="text-sm font-medium"
              >
                {t('header.postJobs')}
              </Button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <LanguageSwitcher variant="ghost" size="sm" />

             

            
              {/* User Menu */}
              {isUserLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {user.profile?.name || user.email || user.phone}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!user.profile && (
                      <DropdownMenuItem onClick={handleCompleteProfile}>
                        {!user.isVerified && <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />}
                        Complete Profile
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('header.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: "/auth/$action", params: { action: "login" } })}
                  >
                    {t('header.login')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Post Job Dialog */}
      <PostJobDialog 
        isOpen={showPostJob}
        onClose={() => setShowPostJob(false)}
        skipAuthSteps={true}
      />

      {/* Create Organization Dialog */}
      <CreateOrg
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onSuccess={async () => {
          setShowCreateOrg(false);
          // Force session reload and invalidate all caches
          await checkSession();
          // Invalidate all queries to ensure fresh data
          queryClient.invalidateQueries();
          toast.success('Organization created successfully!');
        }}
      />
    </>
  );
};

export default Header;
