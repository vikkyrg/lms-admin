import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const isLocalPage = localHosts.has(window.location.hostname);
let configuredApiHost;
if (configuredApiUrl) {
  try {
    configuredApiHost = new URL(configuredApiUrl, window.location.origin).hostname;
  } catch {
    console.error('VITE_API_URL is invalid; using the same-origin /api/v1 fallback.');
  }
}
const configuredApiPointsToLocalhost = localHosts.has(configuredApiHost);
if (configuredApiUrl && configuredApiPointsToLocalhost && !isLocalPage) {
  console.error('VITE_API_URL points to localhost in a remote browser. Configure the production backend URL.');
}
const useConfiguredApiUrl = configuredApiUrl
  && configuredApiHost
  && (isLocalPage || !configuredApiPointsToLocalhost);
const apiBaseUrl = useConfiguredApiUrl
  ? configuredApiUrl
  : '/api/v1';

const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/+$/, ''),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (config.data instanceof FormData) {
      config.timeout = Math.max(config.timeout || 0, 10 * 60 * 1000);
      if (config.headers?.delete) {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
