import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { User, LogOut, AlertCircle, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';
import { useUserStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import PostJobDialog from './PostJobDialog';
import { CreateOrg } from './organisation/CreateOrg';
import LanguageSwitcher from './ui/language-switcher';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';


import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import UnifiedAuthDialog from './auth/UnifiedAuthDialog';

const Header = () => {
  const [showPostJob, setShowPostJob] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { t } = useTranslation('navigation');
  

  const user = useUserStore((state) => state.user);
  const { checkSession, logout } = useAuth();
  const queryClient = useQueryClient();

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
    try {
      // Clear queries first to prevent race conditions
      queryClient.clear();
      
      // Use the useAuth hook's logout function
      await logout();
      
      // Clear user state from store
      const clearUser = useUserStore.getState().clearUser;
      clearUser();
      
      // Clear all storage
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('user-storage');
        localStorage.removeItem('auth-token');
      }
      
      // Force a page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error in header:', error);
      // Even if logout fails, clear state and redirect
      const clearUser = useUserStore.getState().clearUser;
      clearUser();
      
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('user-storage');
        localStorage.removeItem('auth-token');
      }
      
      window.location.href = '/';
    }
  };

  // Explicitly check if user exists and has valid data
  const isUserLoggedIn = user && (user.email || user.phone || user.id);

  // Mobile Navigation Menu
  const MobileNavMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="right" className="w-[280px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isUserLoggedIn ? 'Account Menu' : 'Navigation'}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {isUserLoggedIn ? (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">
                      {user.profile?.name || user.email || user.phone}
                    </p>
                    {user.profile && 'contactEmail' in user.profile && (
                      <p className="text-xs text-muted-foreground">{(user.profile as any).contactEmail}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
                <div className="space-y-2">
                  {!user.profile && (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        handleCompleteProfile();
                        setMobileMenuOpen(false);
                      }}
                    >
                      {!user.isVerified && <AlertCircle className="h-4 w-4 mr-3 text-yellow-500" />}
                      Complete Profile
                    </Button>
                  )}
                  {/* <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      handlePostJobs();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Post Jobs
                  </Button> */}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {t('header.logout')}
                  </Button>
                </div>
              </div>
              
              {/* User Email Display */}
              <div className="pt-2 border-t">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">
                    {user.email || user.phone}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowAuthDialog(true);
                  setMobileMenuOpen(false);
                }}
              >
                {t('header.login')}
              </Button>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <LanguageSwitcher variant="ghost" size="sm" className="w-full justify-start" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <img
                  src="/Onest_logo_mobile.png"
                  alt="ONEST Logo"
                  className="h-8 w-auto object-contain max-w-[120px]"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            {/* <nav className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={handlePostJobs}
                className="text-sm font-medium"
              >
                {t('header.postJobs')}
              </Button>
            </nav> */}

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Language Selector - Hidden on mobile */}
              <div className="hidden sm:block">
                <LanguageSwitcher variant="ghost" size="sm" />
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Desktop User Menu */}
              {isUserLoggedIn ? (
                <div className="hidden md:block">
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
                      {/* User Email Display */}
                      <div className="px-3 py-2 bg-muted/30">
                        <p className="text-sm font-medium text-muted-foreground">
                          {user.email || user.phone}
                        </p>
                      </div>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('header.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAuthDialog(true)}
                  >
                    {t('header.login')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <MobileNavMenu />

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

      {/* Unified Auth Dialog */}
      <UnifiedAuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />
    </>
  );
};

export default Header;
