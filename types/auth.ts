export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  image?: string;
  role: "admin" | "user";
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  subscriptionPlan?: "free" | "pro" | "teams" | "enterprise";
  hasPassword?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  name?: string;
  password: string;
  confirm_password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  reset_token: string;
  new_password: string;
  confirm_password: string;
}

export type UserRole = "admin" | "user";

