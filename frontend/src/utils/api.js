// Centralized API base handling.
// Dev: keep REACT_APP_API_URL empty and rely on CRA `proxy`.
// Prod: set REACT_APP_API_URL to your backend origin (no trailing slash).

export const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

export function apiUrl(path = '') {
  if (!path) return API_BASE;
  // Absolute URLs are returned as-is.
  if (/^https?:\/\//i.test(path)) return path;

  // If API_BASE is empty, return relative path (works with CRA proxy).
  if (!API_BASE) return path.startsWith('/') ? path : `/${path}`;

  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}
