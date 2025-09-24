import { useEffect } from 'react';

/**
 * Hook to fix iOS Safari dropdown interaction issues
 * 
 * This hook implements several fixes for iOS Safari:
 * 1. Forces Safari to initialize touch handling early
 * 2. Adds touchstart event listeners to dropdown triggers
 * 3. Ensures dropdowns work on first tap
 */
export function useIOSSafariFix() {
  useEffect(() => {
    // Check if we're on iOS Safari
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isIOSSafari) {
      return; // Only apply fixes on iOS Safari
    }

    // Force Safari to initialize touch handling
    const initializeTouchHandler = () => {};
    document.body.addEventListener('touchstart', initializeTouchHandler, { passive: true });

    // Add touchstart handlers to all dropdown triggers
    const addTouchHandlers = () => {
      const dropdownTriggers = document.querySelectorAll('[data-slot="dropdown-menu-trigger"]');
      
      dropdownTriggers.forEach((trigger) => {
        const button = trigger as HTMLElement;
        
        // Ensure the element is recognized as clickable
        if (!button.style.cursor) {
          button.style.cursor = 'pointer';
        }
        
        // Add touch-action for better iOS handling
        button.style.touchAction = 'manipulation';
        
        // Add touchstart handler to ensure immediate response
        const handleTouchStart = (e: TouchEvent) => {
          e.stopPropagation();
          // Force the element to be "active" for iOS
          button.classList.add('active');
          
          // Remove the active class after a short delay
          setTimeout(() => {
            button.classList.remove('active');
          }, 150);
        };

        // Add the event listener if it doesn't already exist
        if (!(button as any)._touchStartAdded) {
          button.addEventListener('touchstart', handleTouchStart, { passive: false });
          (button as any)._touchStartAdded = true;
        }
      });
    };

    // Initial setup
    addTouchHandlers();

    // Re-run when DOM changes (for dynamically added dropdowns)
    const observer = new MutationObserver(() => {
      // Debounce the handler addition
      setTimeout(addTouchHandlers, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      document.body.removeEventListener('touchstart', initializeTouchHandler);
      observer.disconnect();
      
      // Remove all added touch handlers
      const dropdownTriggers = document.querySelectorAll('[data-slot="dropdown-menu-trigger"]');
      dropdownTriggers.forEach((trigger) => {
        const button = trigger as any;
        if (button._touchStartAdded) {
          button.removeEventListener('touchstart', button._touchStartHandler);
          delete button._touchStartAdded;
        }
      });
    };
  }, []);
}

/**
 * Enhanced hook that also fixes specific dropdown components
 * Use this in components that have dropdown menus
 */
export function useDropdownIOSFix() {
  useIOSSafariFix();
  
  useEffect(() => {
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (!isIOSSafari) {
      return;
    }

    // Additional specific fixes for dropdown menus
    const enhanceDropdownTriggers = () => {
      const triggers = document.querySelectorAll('[data-slot="dropdown-menu-trigger"]');
      
      triggers.forEach((trigger) => {
        const element = trigger as HTMLElement;
        
        // Ensure proper CSS properties
        (element.style as any).webkitTapHighlightColor = 'transparent';
        element.style.touchAction = 'manipulation';
        
        // Add a click handler that ensures the dropdown opens immediately
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Trigger the actual click event after a minimal delay
          setTimeout(() => {
            element.click();
          }, 0);
        };

        // Override the default click behavior for iOS
        if (!(element as any)._iosClickFixed) {
          element.addEventListener('touchend', handleClick, { passive: false });
          (element as any)._iosClickFixed = true;
        }
      });
    };

    // Apply enhancements
    enhanceDropdownTriggers();

    // Watch for new dropdown triggers
    const observer = new MutationObserver(() => {
      setTimeout(enhanceDropdownTriggers, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-slot']
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
