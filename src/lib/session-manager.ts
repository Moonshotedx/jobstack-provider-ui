import { getCustomSession, type CustomSessionResponse } from './api-client';

interface SessionData {
  user: CustomSessionResponse['user'] | null;
  isAuthenticated: boolean;
  authToken: string | null;
  isChecking: boolean;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionData: SessionData = {
    user: null,
    isAuthenticated: false,
    authToken: null,
    isChecking: false
  };
  private sessionPromise: Promise<CustomSessionResponse | null> | null = null;
  private lastTokenCheck = 0;
  private hasInitialized = false; // Track if we've already initialized session

  private constructor() {
    // Listen for storage changes to detect logout in other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Handle storage changes (logout from other tabs)
   */
  private handleStorageChange(e: StorageEvent) {
    if (e.key === 'auth-token' && !e.newValue) {
      // Auth token was removed in another tab
      console.log('Auth token removed in another tab, clearing session');
      this.clearSession();
    }
  }

  /**
   * Get current auth token from storage with minimal caching
   */
  private getAuthToken(): string | null {
    const now = Date.now();
    
    // Cache auth token checks for 1 second to avoid repeated localStorage access
    if (this.sessionData.authToken && (now - this.lastTokenCheck) < 1000) {
      return this.sessionData.authToken;
    }

    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
    this.sessionData.authToken = token;
    this.lastTokenCheck = now;
    return token;
  }

  /**
   * Check if we have valid session data cached
   */
  private hasValidCachedSession(): boolean {
    const currentToken = this.getAuthToken();
    
    return (
      this.sessionData.user !== null &&
      this.sessionData.isAuthenticated &&
      this.sessionData.authToken === currentToken &&
      !!currentToken
    );
  }

  /**
   * Get session data - returns cached data if available, otherwise fetches from server
   * This is the main optimization: once we have session data, we keep it until logout/token change
   */
  async getSession(forceRefresh = false): Promise<CustomSessionResponse['user'] | null> {
    // If we have valid cached data and not forcing refresh, return it immediately
    if (!forceRefresh && this.hasValidCachedSession()) {
      console.log('🚀 Returning cached session data');
      return this.sessionData.user;
    }

    // Check if token exists
    const authToken = this.getAuthToken();
    if (!authToken) {
      console.log('No auth token found, clearing session');
      this.clearSession();
      return null;
    }

    // If already checking, wait for the existing promise
    if (this.sessionPromise) {
      try {
        const result = await this.sessionPromise;
        return result?.user || null;
      } catch (error) {
        console.warn('Session check failed, returning cached data:', error);
        return this.sessionData.user;
      }
    }

    // Start new session check
    this.sessionData.isChecking = true;
    this.sessionPromise = this.performSessionCheck();

    try {
      const result = await this.sessionPromise;
      return result?.user || null;
    } catch (error) {
      console.error('Session check failed:', error);
      this.clearSession();
      return null;
    } finally {
      this.sessionData.isChecking = false;
      this.sessionPromise = null;
    }
  }

  /**
   * Perform the actual session check with server
   */
  private async performSessionCheck(): Promise<CustomSessionResponse | null> {
    try {
      console.log('📡 Fetching session data from server');
      const sessionData = await getCustomSession();
      
      if (sessionData?.user) {
        // Cache the session data until logout/token change
        this.sessionData = {
          user: sessionData.user,
          isAuthenticated: true,
          authToken: this.getAuthToken(),
          isChecking: false
        };
        console.log('✅ Session cached successfully');
        return sessionData;
      } else {
        console.log('❌ No user in session response, clearing session');
        this.clearSession();
        return null;
      }
    } catch (error: any) {
      console.error('❌ Session check failed:', error);
      
      // If it's a 401 or auth error, clear the session
      if (error.response?.status === 401 || error.message?.includes('auth')) {
        console.log('🔐 Authentication error, clearing session');
        this.clearSession();
      }
      
      throw error;
    }
  }

  /**
   * Check if user is authenticated (fast, uses cached data)
   */
  isAuthenticated(): boolean {
    const hasToken = !!this.getAuthToken();
    const hasCachedSession = this.hasValidCachedSession();
    
    return hasCachedSession || hasToken;
  }

  /**
   * Get cached user data without making a network request
   */
  getCachedUser(): CustomSessionResponse['user'] | null {
    return this.hasValidCachedSession() ? this.sessionData.user : null;
  }

  /**
   * Update session data (called after successful login/signup)
   */
  updateSession(user: CustomSessionResponse['user']): void {
    console.log('💾 Updating session cache with new user data');
    this.sessionData = {
      user,
      isAuthenticated: true,
      authToken: this.getAuthToken(),
      isChecking: false
    };
  }

  /**
   * Clear session data (called on logout or token expiry)
   */
  clearSession(): void {
    console.log('🗑️ Clearing session cache');
    this.sessionData = {
      user: null,
      isAuthenticated: false,
      authToken: null,
      isChecking: false
    };
    
    // Clear tokens from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      sessionStorage.removeItem('auth-token');
    }
  }

  /**
   * Invalidate session cache (forces next getSession to fetch from server)
   */
  invalidateSession(): void {
    console.log('♻️ Invalidating session cache');
    this.sessionData.user = null;
    this.sessionData.isAuthenticated = false;
    this.sessionData.authToken = null;
  }

  /**
   * Get session for API requests - prioritizes cached data for speed
   */
  async getSessionForRequest(): Promise<CustomSessionResponse['user'] | null> {
    // For API requests, prioritize speed - return cached data if available
    if (this.hasValidCachedSession()) {
      return this.sessionData.user;
    }

    // If no cached data, check server (this should be rare after initial login)
    return this.getSession();
  }

  /**
   * Force refresh session data from server
   */
  async refreshSession(): Promise<CustomSessionResponse['user'] | null> {
    console.log('🔄 Force refreshing session data');
    return this.getSession(true);
  }

  /**
   * Check if token has changed (useful for detecting login/logout in other tabs)
   */
  hasTokenChanged(): boolean {
    const currentToken = this.getAuthToken();
    return this.sessionData.authToken !== currentToken;
  }

  /**
   * Mark session as initialized to prevent multiple initialization calls
   */
  markAsInitialized(): void {
    this.hasInitialized = true;
  }

  /**
   * Check if session has been initialized
   */
  isInitialized(): boolean {
    return this.hasInitialized;
  }

  /**
   * Initialize session data (should only be called once by SessionManager component)
   */
  async initializeSession(): Promise<CustomSessionResponse['user'] | null> {
    if (this.hasInitialized) {
      console.log('🔄 Session already initialized, returning cached data');
      
      // If we're still checking session (race condition), wait for the existing promise
      if (this.sessionPromise) {
        console.log('⏳ Session initialization in progress, waiting...');
        try {
          const result = await this.sessionPromise;
          return result?.user || null;
        } catch (error) {
          console.warn('Session initialization failed, returning cached data:', error);
          return this.getCachedUser();
        }
      }
      
      return this.getCachedUser();
    }

    console.log('🎯 Initializing session for the first time');
    this.hasInitialized = true;
    
    // Check if we have a token and fetch session if needed
    const authToken = this.getAuthToken();
    if (!authToken) {
      console.log('No auth token found during initialization');
      return null;
    }

    // If we already have cached data that matches the current token, use it
    if (this.hasValidCachedSession()) {
      console.log('🚀 Using existing cached session data');
      return this.sessionData.user;
    }

    // Otherwise fetch fresh session data
    return this.getSession();
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
