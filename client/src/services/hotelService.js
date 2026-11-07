import { api } from './api';

const dropEmpty = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export const hotelService = {
  list: (params, signal) => api.get(`/hotels?${new URLSearchParams(dropEmpty(params))}`, { signal }),
  get: (id, signal) => api.get(`/hotels/${id}`, { signal }),
};
