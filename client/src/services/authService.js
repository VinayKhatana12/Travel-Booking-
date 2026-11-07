import { api } from './api';

export const authService = {
  me: () => api.get('/auth/me'),
  signup: (payload) => api.post('/auth/signup', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout', {}),
};
