import axios from 'axios';

const TOKEN_STORAGE_KEY = 'aurelia-grand-token';

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

let accessToken = readStoredToken();

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setAccessToken(token) {
  accessToken = token || null;
  try {
    if (accessToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable; continue without persisting the token.
  }
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong.';
    error.message = message;
    return Promise.reject(error);
  },
);

export default apiClient;
