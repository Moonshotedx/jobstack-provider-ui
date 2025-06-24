import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Bell, User, Briefcase, LogOut, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from '@tanstack/react-router';
import { useUserStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import PostJobDialog from './PostJobDialog';
import OrganizationProfileDialog from './profile/OrganizationProfileDialog';

const Header = () => {
  const [showPostJob, setShowPostJob] = useState(false);
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { logout } = useAuth();

  const languages = [
    { code: 'EN', name: 'English (English)' },
    { code: 'HI', name: 'Hindi (हिंदी)' },
    { code: 'BN', name: 'Bengali (বাংলা)' },
    { code: 'TE', name: 'Telugu (తెలుగు)' },
    { code: 'MR', name: 'Marathi (मराठी)' },
    { code: 'TA', name: 'Tamil (তামিল)' },
    { code: 'GU', name: 'Gujarati (ગુજરાતી)' },
    { code: 'KN', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ML', name: 'Malayalam (മലയാളം)' },
    { code: 'PA', name: 'Punjabi (ਪੰਜਾਬੀ)' }
  ];

  const handleFindJobs = () => {
    navigate({ to: '/' });
  };

  const handleProviderDashboard = () => {
    // Check if user is logged in before allowing access to dashboard
    if (user) {
      navigate({ to: '/dashboard' });
    } else {
      // User is not logged in, redirect to auth
      navigate({ to: "/auth/$action", params: { action: "login" } });
    }
  };

  const handlePostJobs = () => {
    // If user is logged in with profile, redirect to dashboard
    if (user && user.profile) {
      navigate({ to: '/dashboard' });
    } else if (user && !user.profile) {
      // User is logged in but needs to complete profile
      setShowOrgProfile(true);
    } else {
      // User is not logged in, redirect to auth
      navigate({ to: "/auth/$action", params: { action: "login" } });
    }
  };

  const handleProfileComplete = () => {
    if (user?.role === 'organization') {
      setShowOrgProfile(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: '/' }); // Navigate to home page after logout
    } catch (error) {
      console.error('Logout failed:', error);
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
            <span className="text-xl font-bold text-primary">JobBridge</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-foreground hover:text-primary" onClick={handleFindJobs}>
              Find Jobs
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary"
              onClick={handlePostJobs}
            >
              Post Jobs
            </Button>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{selectedLanguage}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => setSelectedLanguage(language.code)}
                    className={selectedLanguage === language.code ? 'bg-accent' : ''}
                  >
                    {language.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Location */}
            <Button variant="ghost" size="sm" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Mumbai</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
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
                    <DropdownMenuItem onClick={handleProfileComplete}>
                      Complete Profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => {}}>
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
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
                <span className="hidden sm:inline">Login</span>
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
      
      <OrganizationProfileDialog
        isOpen={showOrgProfile}
        onClose={() => setShowOrgProfile(false)}
      />
    </header>
  );
};

export default Header;
