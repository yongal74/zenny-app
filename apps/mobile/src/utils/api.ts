import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + '/api';
  }

  return 'http://localhost:3000/api';
}

export const API_BASE = getApiBase();

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
