/**
 * Central API Configuration for ChateChat Dashboard
 * Supports local dev (http://localhost:4000) and production deployment (Render / Cloud)
 */

export const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    let url = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url;
  }
  if (typeof window !== 'undefined') {
    // Detect Capacitor Android / iOS Native WebView
    const isCapacitor = !!(window as any).Capacitor || !!(window as any).isNative;
    if (isCapacitor) {
      return 'https://chatechat.onrender.com';
    }

    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  // Default to live production server if running on mobile device or cloud
  return 'https://chatechat.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();
