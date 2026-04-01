import axios from 'axios';

/**
 * Shared HTTP client — set EXPO_PUBLIC_API_URL in app config / env when backend is ready.
 */
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.cxcix.app';

export const apiClient = axios.create({
  baseURL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});
