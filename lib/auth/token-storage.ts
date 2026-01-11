const TOKEN_KEY = "architectai_auth_token";
const USER_KEY = "architectai_auth_user";

export const tokenStorage = {
  /**
   * Store authentication token
   */
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  /**
   * Get authentication token
   */
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  /**
   * Remove authentication token
   */
  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Store user data
   */
  setUser(user: Record<string, unknown>): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * Get user data
   */
  getUser(): Record<string, unknown> | null {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Clear all auth data
   */
  clear(): void {
    this.removeToken();
  },
};

