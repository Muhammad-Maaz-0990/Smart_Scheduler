// Theme utility to get logo based on theme color
export const getThemeLogo = () => {
  const themeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color')
    .trim()
    .toLowerCase();
  
  // Map theme colors to logo files
  // Purple: #7c3aed, #9333ea, #a855f7, etc.
  // Green: #22c55e, #16a34a, #10b981, etc.
  // Blue: #3b82f6, #2563eb, #0ea5e9, etc.
  
  if (themeColor.includes('#7c3aed') || 
      themeColor.includes('#9333ea') || 
      themeColor.includes('#a855f7') ||
      themeColor.includes('rgb(124, 58, 237)') ||
      themeColor.includes('rgb(147, 51, 234)') ||
      themeColor.includes('purple')) {
    return '/assets/purple.png';
  } else if (themeColor.includes('#22c55e') || 
             themeColor.includes('#16a34a') || 
             themeColor.includes('#10b981') ||
             themeColor.includes('rgb(34, 197, 94)') ||
             themeColor.includes('rgb(22, 163, 74)') ||
             themeColor.includes('green')) {
    return '/assets/green.png';
  } else if (themeColor.includes('#3b82f6') || 
             themeColor.includes('#2563eb') || 
             themeColor.includes('#0ea5e9') ||
             themeColor.includes('rgb(59, 130, 246)') ||
             themeColor.includes('rgb(37, 99, 235)') ||
             themeColor.includes('blue')) {
    return '/assets/blue.png';
  }
  
  // Default to purple if no match
  return '/assets/purple.png';
};

// Get theme name for logging
export const getThemeName = () => {
  const logo = getThemeLogo();
  if (logo.includes('green')) return 'green';
  if (logo.includes('blue')) return 'blue';
  return 'purple';
};

// Update favicon dynamically
export const updateFavicon = () => {
  const logo = getThemeLogo();
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = logo;
  document.getElementsByTagName('head')[0].appendChild(link);
};

// Initialize theme on app load
export const initializeTheme = () => {
  updateFavicon();
  console.log(`Theme initialized: ${getThemeName()}`);
};
