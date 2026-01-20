import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenStorage } from "../auth/token-storage";
import { getGuestSessionId } from "./guest-session";

// Create axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers) {
      // Add guest session ID if no token is present
      const guestId = getGuestSessionId();
      if (guestId) {
        config.headers["x-guest-session-id"] = guestId;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.warn("API: No response from backend", error.message);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      const isAuthPage = typeof window !== "undefined" && 
        (window.location.pathname.startsWith("/login") || 
         window.location.pathname.startsWith("/register"));
      
      if (!isAuthPage) {
        tokenStorage.clear();
        // Only redirect if not already on login page
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    // Continue with the error for other error handlers
    return Promise.reject(error);
  },
);

