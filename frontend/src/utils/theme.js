// Theme utility to get logo with transparent background
export const getThemeLogo = () => {
  // Always return the transparent logo - theme color will be applied as background
  return '/assets/logo.png';
};

// Get theme name for logging
export const getThemeName = () => {
  const themeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color')
    .trim()
    .toLowerCase();
  
  if (themeColor.includes('#22c55e') || 
      themeColor.includes('#16a34a') || 
      themeColor.includes('#10b981') ||
      themeColor.includes('rgb(34, 197, 94)') ||
      themeColor.includes('rgb(22, 163, 74)') ||
      themeColor.includes('green')) {
    return 'green';
  }
  if (themeColor.includes('#3b82f6') || 
      themeColor.includes('#2563eb') || 
      themeColor.includes('#0ea5e9') ||
      themeColor.includes('rgb(59, 130, 246)') ||
      themeColor.includes('rgb(37, 99, 235)') ||
      themeColor.includes('blue')) {
    return 'blue';
  }
  return 'purple';
};

// Get theme color
export const getThemeColor = () => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color')
    .trim();
};

// Update favicon dynamically with colored background
export const updateFavicon = () => {
  const logo = getThemeLogo();
  const themeColor = getThemeColor();
  
  // Create a canvas to draw the logo with background
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // Draw rounded square background
  ctx.fillStyle = themeColor;
  const radius = 12;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(64 - radius, 0);
  ctx.quadraticCurveTo(64, 0, 64, radius);
  ctx.lineTo(64, 64 - radius);
  ctx.quadraticCurveTo(64, 64, 64 - radius, 64);
  ctx.lineTo(radius, 64);
  ctx.quadraticCurveTo(0, 64, 0, 64 - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Load and draw the logo image
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 64, 64);
    
    // Set the favicon
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = canvas.toDataURL('image/png');
    document.getElementsByTagName('head')[0].appendChild(link);
  };
  img.src = logo;
};

// Initialize theme on app load
export const initializeTheme = () => {
  updateFavicon();
  console.log(`Theme initialized: ${getThemeName()}`);
};
