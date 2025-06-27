import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MapPin, Bell, User, Briefcase, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from '@tanstack/react-router';
import { useUserStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import PostJobDialog from './PostJobDialog';
import LanguageSwitcher from './ui/language-switcher';
import { toast } from 'sonner';


const Header = () => {
  const [showPostJob, setShowPostJob] = useState(false);
  const { t } = useTranslation('navigation');
  
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { logout } = useAuth();

  const handleFindJobs = () => {
    navigate({ to: '/' });
  };

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: '/' }); // Navigate to home page after logout
    } catch (error) {
      // Handle logout error silently or show user-friendly message
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">{t('header.appName')}</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-foreground hover:text-primary" onClick={handleFindJobs}>
              {t('header.findJobs')}
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary"
              onClick={handlePostJobs}
            >
              {t('header.postJobs')}
            </Button>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSwitcher variant="ghost" size="sm" />

            {/* Location */}
            <Button variant="ghost" size="sm" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Mumbai</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" aria-label={t('header.notifications')}>
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            {user ? (
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
                    <DropdownMenuItem onClick={() => setShowPostJob(true)}>
                      Complete Profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => {}}>
                    {t('header.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('header.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2" 
                onClick={() => navigate({ to: "/auth/$action", params: { action: "login" } })}
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('header.login')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PostJobDialog 
        isOpen={showPostJob}
        onClose={() => setShowPostJob(false)}
        skipAuthSteps={true}
      />
      

    </header>
  );
};

export default Header;
