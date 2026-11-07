import { api } from './api';

export const flightService = {
  search: (params, signal) => api.get(`/flights?${new URLSearchParams(params)}`, { signal }),
};
