import axios from 'axios';

// Axios instance pointing at your Express backend
const API =  axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}`   // production: full URL
    : '/api',                              // dev: use Vite proxy
});

// Attach JWT token to every request automatically
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default API;

// ─── Shared helpers (used across all pages) ───────────────────────────────────

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getCategoryIcon = (cat) =>
  ({ image: '🖼️', document: '📄', audio: '🎵', video: '🎬', other: '📦' }[cat] || '📦');

export const getStatusClass = (status) =>
  ({ active: 'badge-active', archived: 'badge-archived', pending: 'badge-pending', released: 'badge-released' }[status] || 'badge-archived');

export const fmt = (dateStr, mode = 'date') => {
  const d = new Date(dateStr);
  if (mode === 'date') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (mode === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};
