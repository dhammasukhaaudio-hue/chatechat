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
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      // Auto-detect Render naming convention (chatechat-dashboard -> chatechat-api)
      if (host.includes('-dashboard')) {
        return `${window.location.protocol}//${host.replace('-dashboard', '-api')}`;
      }
    }
  }
  return 'http://localhost:4000';
};

export const API_BASE_URL = getApiBaseUrl();
