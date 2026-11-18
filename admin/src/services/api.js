import axios from 'axios';

const TOKEN_STORAGE_KEY = 'aurelia-grand-admin-token';

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

let accessToken = readStoredToken();
let onUnauthorized = () => {};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
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

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && accessToken) onUnauthorized();
    error.message = error.response?.data?.message || 'The request could not be completed.';
    return Promise.reject(error);
  },
);

const query = (params) => ({ params });

export const adminApi = {
  async health() {
    return (await api.get('/health')).data;
  },
  async login(credentials) {
    return (await api.post('/auth/admin-login', credentials)).data;
  },
  async me() {
    return (await api.get('/auth/me')).data;
  },
  async logout() {
    return (await api.post('/auth/logout')).data;
  },
  async updateProfile(payload) {
    return (await api.patch('/auth/profile', payload)).data;
  },
  async dashboard() {
    return (await api.get('/admin/dashboard')).data;
  },
  async bookings(params) {
    return (await api.get('/admin/bookings', query(params))).data;
  },
  async updateBookingStatus(id, status) {
    return (await api.patch(`/admin/bookings/${encodeURIComponent(id)}/status`, { status })).data;
  },
  async rooms(params) {
    return (await api.get('/admin/rooms', query(params))).data;
  },
  async saveRoom(payload, id) {
    const path = id ? `/admin/rooms/${encodeURIComponent(id)}` : '/admin/rooms';
    return (await (id ? api.patch(path, payload) : api.post(path, payload))).data;
  },
  async deactivateRoom(id) {
    return (await api.delete(`/admin/rooms/${encodeURIComponent(id)}`)).data;
  },
  async categories() {
    return (await api.get('/admin/room-categories')).data;
  },
  async saveCategory(payload, id) {
    const path = id ? `/admin/room-categories/${encodeURIComponent(id)}` : '/admin/room-categories';
    return (await (id ? api.patch(path, payload) : api.post(path, payload))).data;
  },
  async guests(params) {
    return (await api.get('/admin/guests', query(params))).data;
  },
  async staff(params) {
    return (await api.get('/admin/staff', query(params))).data;
  },
  async createStaff(payload) {
    return (await api.post('/admin/staff', payload)).data;
  },
  async updateStaff(id, payload) {
    return (await api.patch(`/admin/staff/${encodeURIComponent(id)}`, payload)).data;
  },
  async services() {
    return (await api.get('/admin/services')).data;
  },
  async saveService(payload, id) {
    const path = id ? `/admin/services/${encodeURIComponent(id)}` : '/admin/services';
    return (await (id ? api.patch(path, payload) : api.post(path, payload))).data;
  },
  async deactivateService(id) {
    return (await api.delete(`/admin/services/${encodeURIComponent(id)}`)).data;
  },
  async payments(params) {
    return (await api.get('/admin/payments', query(params))).data;
  },
  async refund(id, amount) {
    return (await api.post(`/admin/payments/${encodeURIComponent(id)}/refund`, amount === undefined ? {} : { amount })).data;
  },
  async reservationReport(params) {
    return (await api.get('/admin/reports/reservations', query(params))).data;
  },
  async revenueReport(params) {
    return (await api.get('/admin/reports/revenue', query(params))).data;
  },
  async hotelSettings() {
    return (await api.get('/admin/settings')).data;
  },
  async saveHotelSettings(payload) {
    return (await api.put('/admin/settings', payload)).data;
  },
};
