import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const TOKEN_KEY = "aa_session_token";

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

export const getStoredToken = () =>
  isBrowser ? localStorage.getItem(TOKEN_KEY) || null : null;
export const storeToken = (token: string | null) => {
  if (!isBrowser) return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Simple hook for expired token handling; extend as needed
    if (error.response?.status === 401) {
      storeToken(null);
    }
    return Promise.reject(error);
  },
);
