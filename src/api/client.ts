import axios from 'axios';

import { getStoredToken } from './session';
import { API_BASE_URL } from '../config/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Render free tier can cold-start; retry once on network/5xx gateway errors.
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err?.config;
    if (!cfg || cfg.__cxcixRetried) throw err;
    const status = err?.response?.status;
    const isGatewayish = status === 502 || status === 503 || status === 504;
    const msg = String(err?.message || '').toLowerCase();
    const isNetwork = msg.includes('network') || msg.includes('timeout');
    if (!isGatewayish && !isNetwork) throw err;
    cfg.__cxcixRetried = true;
    await sleep(2500);
    return apiClient.request(cfg);
  },
);
