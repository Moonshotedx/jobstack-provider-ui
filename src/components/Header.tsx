import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Bell, User, Briefcase, LogOut, ChevronDown, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import PostJobDialog from './PostJobDialog';
import OrganizationProfileDialog from './profile/OrganizationProfileDialog';

const Header = () => {
  const [showPostJob, setShowPostJob] = useState(false);
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [selectedLocation, setSelectedLocation] = useState('Mumbai');
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const languages = [
    { code: 'EN', name: 'English (English)' },
    { code: 'HI', name: 'Hindi (हिंदी)' },
    { code: 'BN', name: 'Bengali (বাংলা)' },
    { code: 'TE', name: 'Telugu (తెలుগు)' },
    { code: 'MR', name: 'Marathi (मराठी)' },
    { code: 'TA', name: 'Tamil (தமிழ்)' },
    { code: 'GU', name: 'Gujarati (ગુજરાતી)' },
    { code: 'KN', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ML', name: 'Malayalam (മലയാളം)' },
    { code: 'PA', name: 'Punjabi (ਪੰਜਾਬੀ)' }
  ];

  const locations = [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Chennai',
    'Hyderabad',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Surat',
    'Jaipur'
  ];

  const handleFindJobs = () => {
    navigate({ to: '/' });
  };

  const handleProviderDashboard = () => {
    navigate({ to: '/dashboard' });
  };

  const handlePostJobs = () => {
    // Check if user is authenticated and has profile
    if (user && user.profile) {
      setShowPostJob(true);
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

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              JobBridge
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/10 font-medium transition-all"
              onClick={handleFindJobs}
            >
              Find Jobs
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/10 font-medium transition-all"
              onClick={handlePostJobs}
            >
              Post a Job
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/10 font-medium transition-all"
              onClick={handleProviderDashboard}
            >
              Provider Dashboard
            </Button>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted transition-colors">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">{selectedLanguage}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => setSelectedLanguage(language.code)}
                    className={selectedLanguage === language.code ? 'bg-accent font-medium' : ''}
                  >
                    {language.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Location Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted transition-colors">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">{selectedLocation}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {locations.map((location) => (
                  <DropdownMenuItem
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className={selectedLocation === location ? 'bg-accent font-medium' : ''}
                  >
                    {location}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted transition-colors">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="hidden md:inline text-sm font-medium max-w-24 truncate">
                      {user.profile?.name || user.email?.split('@')[0] || user.phone}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {!user.profile && (
                    <DropdownMenuItem onClick={handleProfileComplete} className="font-medium text-primary">
                      Complete Profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate({ to: '/dashboard' })}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 hover:bg-muted transition-colors" 
                  onClick={() => navigate({ to: "/auth/$action", params: { action: "login" } })}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  onClick={() => navigate({ to: "/auth/$action", params: { action: "signup" } })}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleFindJobs}>
                    Find Jobs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePostJobs}>
                    Post a Job
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleProviderDashboard}>
                    Provider Dashboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
