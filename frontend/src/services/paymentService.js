import apiClient from './apiClient';

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const paymentService = {
  async processPayment(bookingReference) {
    if (demoMode) {
      return { success: false, demo: true, message: 'Demo mode only. No real payment is processed.' };
    }
    const response = await apiClient.post('/payments/intents', { bookingReference }, {
      headers: { 'Idempotency-Key': `booking-${bookingReference}` },
    });
    return { ...response.data.data, message: response.data.message };
  },

};
