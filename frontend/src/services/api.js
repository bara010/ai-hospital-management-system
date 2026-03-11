import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hospito_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const multipartApi = axios.create({
  baseURL: BASE_URL,
});

multipartApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('hospito_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
