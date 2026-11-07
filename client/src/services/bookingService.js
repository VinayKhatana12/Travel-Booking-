import { api } from './api';

export const bookingService = {
  list: (signal) => api.get('/bookings', { signal }),
  create: (payload) => api.post('/bookings', payload),
  cancel: (ref) => api.patch(`/bookings/${ref}/cancel`, {}),
};
