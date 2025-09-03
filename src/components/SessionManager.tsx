import { useEffect } from 'react';
import { useUserStore } from '@/stores/authStore';
import { sessionManager } from '@/lib/session-manager';
import { useQueryClient } from '@tanstack/react-query';

/**
 * SessionManager component handles global session state management
 * This component should be mounted at the root of the app to ensure
 * proper session handling across the entire application
 */
// Helper function to load organization profile - now uses React Query cache first
const loadOrganizationProfileFromCache = async (queryClient: any, fallbackToAPI = true) => {
  try {
    // First, try to get organizations from React Query cache
    const cachedOrganizations = queryClient.getQueryData(['organizations']);
    
    let organizations = cachedOrganizations;
    
    // If not in cache and fallback is allowed, fetch from API
    if (!organizations && fallbackToAPI) {
      console.log('🔄 SessionManager: No cached organizations, fetching from API');
      const { getOrganizationList } = await import('@/lib/api-client');
      organizations = await getOrganizationList();
      
      // Cache the result in React Query
      queryClient.setQueryData(['organizations'], organizations);
    }
    
    // If still no organizations, return undefined
    if (!organizations || organizations.length === 0) {
      return undefined;
    }

    // For now, use the first organization as active
    const activeOrg = organizations[0];
    
    if (!activeOrg) {
      return undefined;
    }

    // Parse the metadata JSON string
    let metadata: {
      address?: string;
      gstNumber?: string;
      contactPersonName?: string;
      contactEmail?: string;
      contactPhone?: string;
      website?: string;
      description?: string;
    } = {};
    
    try {
      metadata = JSON.parse(activeOrg.metadata || '{}');
    } catch (error) {
      console.error('Failed to parse organization metadata:', error);
      metadata = {};
    }

    const profile = {
      id: activeOrg.id,
      name: activeOrg.name,
      slug: activeOrg.slug,
      logo: activeOrg.logo || undefined,
      address: metadata.address || '',
      gstNumber: metadata.gstNumber || '',
      contactPersonName: metadata.contactPersonName || '',
      contactEmail: metadata.contactEmail || '',
      contactPhone: metadata.contactPhone || '',
      website: metadata.website || '',
      description: metadata.description || '',
      createdAt: activeOrg.createdAt,
      isActive: true,
      isDefault: true
    };

    return profile;
  } catch (error) {
    console.error('Failed to load organization profile:', error);
    return undefined;
  }
};

export const SessionManager = ({ children }: { children: React.ReactNode }) => {
  const { setUser, clearUser, setLoading } = useUserStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🎬 SessionManager: useEffect started');
    let isUnmounted = false;

    const initializeSession = async () => {
      try {
        console.log('🏁 SessionManager: Starting initialization');
        
        // Set loading state while initializing
        setLoading(true);
        
        // Use the centralized initialization method
        const sessionUser = await sessionManager.initializeSession();
        console.log('🔍 SessionManager: initializeSession returned:', sessionUser);
        
        if (sessionUser && !isUnmounted) {
          console.log('✅ SessionManager: Session data found, loading organization profile');
          
          // Check if user is already in the store - if so, we might not need to reload profile
          const currentUser = useUserStore.getState().user;
          if (currentUser && currentUser.id === sessionUser.id) {
            console.log('✅ SessionManager: User already in store, skipping profile load');
          } else {
            try {
              console.log('🔄 SessionManager: About to call loadOrganizationProfileFromCache');
              // Load organization profile - first try from cache, then API if needed
              const profile = await loadOrganizationProfileFromCache(queryClient);
              console.log('🏢 SessionManager: Organization profile loaded:', profile);
              
              // We have valid session data, update the user store with profile
              const mappedUser = {
                id: sessionUser.id,
                email: sessionUser.email,
                role: 'organization' as const,
                isVerified: sessionUser.emailVerified || sessionUser.phoneNumberVerified || false,
                profile: profile,
              };
              
              console.log('💾 SessionManager: Setting user in store:', mappedUser);
              setUser(mappedUser);
              console.log('✅ SessionManager: User and profile loaded successfully');
            } catch (profileError) {
              console.warn('⚠️ SessionManager: Failed to load organization profile, setting user without profile:', profileError);
              
              // Even if profile loading fails, still set the user
              const mappedUser = {
                id: sessionUser.id,
                email: sessionUser.email,
                role: 'organization' as const,
                isVerified: sessionUser.emailVerified || sessionUser.phoneNumberVerified || false,
                profile: undefined,
              };
              
              console.log('💾 SessionManager: Setting user in store (without profile):', mappedUser);
              setUser(mappedUser);
              console.log('✅ SessionManager: User loaded successfully (without profile)');
            }
          }
        } else if (!sessionUser) {
          console.log('🚫 SessionManager: No session data, clearing user state');
          clearUser();
        }
      } catch (error) {
        console.error('❌ SessionManager: Session initialization failed:', error);
        if (!isUnmounted) {
          clearUser();
          sessionManager.clearSession();
        }
      } finally {
        // Clear loading state once initialization is complete
        if (!isUnmounted) {
          console.log('🏁 SessionManager: Clearing loading state');
          setLoading(false);
        }
      }
    };

    // Initialize session on mount
    initializeSession();

    // Set up periodic session validation (every 5 minutes)
    const sessionValidationInterval = setInterval(async () => {
      if (isUnmounted) return;

      try {
        const currentUser = useUserStore.getState().user;
        if (!currentUser) return;

        // Check if session is still valid
        const isAuthenticated = sessionManager.isAuthenticated();
        if (!isAuthenticated) {
          console.log('Session expired, clearing user state');
          clearUser();
          sessionManager.clearSession();
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        clearUser();
        sessionManager.clearSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Handle visibility change to refresh session when user returns to the app
    const handleVisibilityChange = async () => {
      if (isUnmounted) return;
      
      if (document.visibilityState === 'visible') {
        const currentUser = useUserStore.getState().user;
        if (currentUser) {
          // User returned to the app, check if session is still valid
          try {
            const sessionUser = await sessionManager.getSession();
            if (!sessionUser) {
              console.log('Session invalid after visibility change, clearing user');
              clearUser();
            }
          } catch (error) {
            console.error('Session check after visibility change failed:', error);
            clearUser();
            sessionManager.clearSession();
          }
        }
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle storage changes (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (isUnmounted) return;

      if (e.key === 'auth-token' && !e.newValue) {
        // Auth token was removed in another tab
        console.log('Auth token removed in another tab, clearing session');
        clearUser();
        sessionManager.clearSession();
      } else if (e.key === 'user-storage' && !e.newValue) {
        // User storage was cleared in another tab
        console.log('User storage cleared in another tab, clearing session');
        clearUser();
        sessionManager.clearSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      isUnmounted = true;
      clearInterval(sessionValidationInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setUser, clearUser, setLoading]);

  // Handle beforeunload to clear session if needed
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear session on page refresh/navigation
      // Only clear if user explicitly logged out (handled in logout function)
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
};

export default SessionManager;
