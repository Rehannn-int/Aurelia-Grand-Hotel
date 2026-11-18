import apiClient, { setAccessToken } from './apiClient';

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const authService = {
  async getCurrentUser() {
    if (demoMode) {
      return { user: null };
    }

    const response = await apiClient.get('/auth/me');
    return { user: response.data.data.user };
  },

  async login(payload) {
    if (demoMode) {
      return {
        success: true,
        demo: true,
        message: 'Demo mode is active. Authentication is not connected to a backend yet.',
        user: {
          email: payload.email,
          name: 'Guest Demo User',
        },
      };
    }

    const response = await apiClient.post('/auth/login', payload);
    const result = response.data.data;
    setAccessToken(result.token);
    return { ...result, message: response.data.message };
  },

  async register(payload) {
    if (demoMode) {
      return {
        success: true,
        demo: true,
        message: 'This is a frontend-only demonstration. No real account is created in demo mode.',
      };
    }

    const response = await apiClient.post('/auth/register', payload);
    return { ...response.data.data, message: response.data.message };
  },

  async requestPasswordReset(payload) {
    if (demoMode) {
      return {
        success: true,
        demo: true,
        message: 'Demo mode only. No reset email is sent without the backend.',
      };
    }

    const response = await apiClient.post('/auth/forgot-password', payload);
    return { ...response.data.data, message: response.data.message };
  },

  async resetPassword(payload) {
    const response = await apiClient.post('/auth/reset-password', payload);
    return { ...response.data.data, message: response.data.message };
  },

  async logout() {
    if (!demoMode) await apiClient.post('/auth/logout');
    setAccessToken(null);
  },
};

export default authService;
