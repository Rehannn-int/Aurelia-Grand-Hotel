import apiClient from './apiClient';

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const bookingService = {
  async getQuote(payload) {
    if (demoMode) {
      return {
        nights: payload.nights,
        pricing: { subtotal: payload.subtotal, total: payload.subtotal, discount: 0, tax: 0 },
        currency: 'INR',
        available: true,
      };
    }
    const response = await apiClient.post('/bookings/quote', {
      checkIn: payload.checkin,
      checkOut: payload.checkout,
      adults: Number(payload.adults),
      children: Number(payload.children || 0),
      roomCount: Number(payload.rooms),
      categorySlug: payload.categorySlug || 'signature-suite',
    });
    return response.data.data;
  },

  async getMyBookings() {
    if (demoMode) {
      return [];
    }
    const response = await apiClient.get('/bookings/my');
    return response.data.data;
  },

  async createBooking(payload, idempotencyKey) {
    if (demoMode) {
      return {
        success: true,
        demo: true,
        reference: `AG-${Math.floor(Math.random() * 9000 + 1000)}`,
        message: 'This is a demonstration booking flow. No real reservation is stored yet.',
      };
    }

    const response = await apiClient.post('/bookings', {
      checkIn: payload.checkin,
      checkOut: payload.checkout,
      adults: Number(payload.adults),
      children: Number(payload.children || 0),
      roomCount: Number(payload.rooms),
      categorySlug: payload.categorySlug || 'signature-suite',
      guestName: payload.guestName,
      email: payload.email,
      phone: payload.phone,
      specialRequests: payload.notes,
    }, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return {
      success: response.data.success,
      message: response.data.message,
      reference: response.data.data.reference,
      booking: response.data.data,
    };
  },
};
