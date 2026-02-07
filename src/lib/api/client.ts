import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { getRequestHeaders } from "./request-headers";

// Create axios instance (guest session only; no auth)
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: single source of truth for guest session header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      const common = getRequestHeaders();
      Object.entries(common).forEach(([key, value]) => {
        config.headers!.set(key, value);
      });
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor: log network errors only; no auth redirect
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (!error.response) {
      console.warn("API: No response from backend", error.message);
    }
    return Promise.reject(error);
  },
);

