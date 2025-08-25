// Mobile-specific utilities for location functionality

/**
 * Check if the current device is mobile based on user agent and screen size
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for mobile user agents
  const mobileUserAgents = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUserAgent = mobileUserAgents.test(navigator.userAgent);
  
  // Check for small screen size
  const isSmallScreen = window.innerWidth < 768;
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUserAgent || (isSmallScreen && isTouchDevice);
};

/**
 * Enhanced geolocation options optimized for mobile devices
 */
export const getMobileGeolocationOptions = (): PositionOptions => {
  const isMobile = isMobileDevice();
  
  return {
    enableHighAccuracy: true,
    timeout: isMobile ? 20000 : 15000, // Longer timeout on mobile
    maximumAge: isMobile ? 600000 : 300000 // 10 minutes on mobile, 5 minutes on desktop
  };
};

/**
 * Check if geolocation permissions are available and granted
 */
export const checkGeolocationPermissions = async (): Promise<'granted' | 'denied' | 'prompt' | 'unavailable'> => {
  if (!navigator.geolocation) {
    return 'unavailable';
  }

  // Check permissions API if available
  if ('permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.warn('Permissions API not available:', error);
    }
  }

  // Fallback: try to get position with minimal accuracy to check permission
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            resolve('denied');
            break;
          case error.POSITION_UNAVAILABLE:
          case error.TIMEOUT:
            resolve('prompt'); // Permission might be granted but location unavailable
            break;
          default:
            resolve('prompt');
        }
      },
      { enableHighAccuracy: false, timeout: 1000, maximumAge: Infinity }
    );
  });
};

/**
 * Get user-friendly error messages for geolocation errors on mobile
 */
export const getMobileGeolocationErrorMessage = (error: GeolocationPositionError): string => {
  const isMobile = isMobileDevice();
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return isMobile 
        ? 'Location access denied. Please enable location access in your device settings and refresh the page.'
        : 'Location access denied. Please enable location access and try again.';
    
    case error.POSITION_UNAVAILABLE:
      return isMobile
        ? 'Location unavailable. Please check if location services are enabled on your device and you have a good signal.'
        : 'Location unavailable. Please check your connection and try again.';
    
    case error.TIMEOUT:
      return isMobile
        ? 'Location request timed out. Please try again or check your GPS signal.'
        : 'Location request timed out. Please try again.';
    
    default:
      return isMobile
        ? 'Unable to get your location. Please try again or enter your location manually.'
        : 'Failed to get current location. Please try again.';
  }
};

/**
 * Optimize touch interactions for mobile devices
 */
export const getTouchOptimizedClasses = () => {
  const isMobile = isMobileDevice();
  
  return {
    // Input field classes
    input: isMobile 
      ? 'h-12 text-base pr-12 touch-manipulation' 
      : 'h-10 text-sm pr-10',
    
    // Button classes
    button: isMobile
      ? 'min-h-[44px] min-w-[44px] p-3 touch-manipulation'
      : 'min-h-[32px] min-w-[32px] p-2',
    
    // Dropdown item classes
    dropdownItem: isMobile
      ? 'py-3 px-4 text-base min-h-[44px] touch-manipulation'
      : 'py-2 px-4 text-sm',
    
    // Icon classes
    icon: isMobile ? 'h-5 w-5' : 'h-4 w-4',
    
    // Dropdown container classes
    dropdown: isMobile
      ? 'max-h-[40vh] text-base'
      : 'max-h-60 text-sm'
  };
};

/**
 * Detect if the device supports vibration (for haptic feedback)
 */
export const supportsVibration = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Provide haptic feedback on mobile devices
 */
export const provideHapticFeedback = (pattern: number | number[] = 50): void => {
  if (supportsVibration() && isMobileDevice()) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration not supported:', error);
    }
  }
};

/**
 * Check if the device is in landscape mode
 */
export const isLandscapeMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

/**
 * Get viewport-aware dropdown positioning
 */
export const getDropdownPositioning = (inputElement: HTMLElement) => {
  if (typeof window === 'undefined') return {};
  
  const rect = inputElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  
  // If not enough space below but enough above, show dropdown above
  if (spaceBelow < 200 && spaceAbove > 200) {
    return {
      position: 'above',
      maxHeight: Math.min(spaceAbove - 20, 300)
    };
  }
  
  return {
    position: 'below',
    maxHeight: Math.min(spaceBelow - 20, isMobileDevice() ? 200 : 300)
  };
};

/**
 * Debounce function optimized for mobile typing patterns
 */
export const createMobileOptimizedDebounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): ((...args: Parameters<T>) => void) => {
  const isMobile = isMobileDevice();
  const optimizedWait = isMobile ? wait + 100 : wait; // Slightly longer debounce on mobile
  
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), optimizedWait);
  };
};
