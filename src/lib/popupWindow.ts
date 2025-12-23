/**
 * Opens a responsive popup window for displaying policy documents (Terms, Privacy Policy, etc.)
 * @param url - The URL to open in the popup window
 * @param title - Optional title for the popup window
 * @returns The window reference or null if popup was blocked
 */
export const openPolicyPopup = (url: string, title?: string): Window | null => {
  const isMobile = window.innerWidth < 768;
  
  // Calculate dimensions based on screen size
  const width = isMobile ? Math.floor(window.innerWidth * 0.95) : 800;
  const height = isMobile ? Math.floor(window.innerHeight * 0.9) : 700;
  
  // Center the popup on the screen
  const left = Math.floor((window.innerWidth - width) / 2) + window.screenX;
  const top = Math.floor((window.innerHeight - height) / 2) + window.screenY;
  
  // Window features string
  const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no`;
  
  // Open the popup window
  const popup = window.open(url, title || 'Policy', features);
  
  // Handle popup blocker
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    // Popup was blocked, fallback to new tab
    console.warn('Popup blocked. Opening in new tab instead.');
    window.open(url, '_blank');
    return null;
  }
  
  // Focus the popup window
  popup.focus();
  
  return popup;
};

