import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from "@/types/auth";
import { apiClient } from "./client";

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<{
      status: string;
      data: LoginResponse;
      message: string;
    }>("/auth/register", data);
    return response.data.data;
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<{
      status: string;
      data: LoginResponse;
      message: string;
    }>("/auth/login", data);
    return response.data.data;
  },

  /**
   * Logout user (client-side token discard)
   */
  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ status: string; data: { user: User } }>(
      "/auth/me",
    );
    return response.data.data.user;
  },

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ token: string; expires_in: number }> {
    const response = await apiClient.post<{
      status: string;
      data: { token: string; expires_in: number };
    }>("/auth/refresh");
    return response.data.data;
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post("/auth/change-password", data);
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post("/auth/forgot-password", data);
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post("/auth/reset-password", data);
  },

  /**
   * Update user profile
   */
  async updateProfile(data: { name?: string; image?: string }): Promise<User> {
    const response = await apiClient.patch<{
      status: string;
      data: { user: User };
      message: string;
    }>("/auth/profile", data);
    return response.data.data.user;
  },

  /**
   * Get OAuth authorization URL
   */
  async getOAuthUrl(
    provider: "github" | "google",
    redirectUri?: string,
  ): Promise<string> {
    const params = redirectUri
      ? `?redirect_uri=${encodeURIComponent(redirectUri)}`
      : "";
    const response = await apiClient.get<{
      status: string;
      data: { auth_url: string; state: string };
    }>(`/auth/oauth/${provider}/authorize${params}`);
    return response.data.data.auth_url;
  },
};

