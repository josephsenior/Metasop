import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
// Note: NODE_ENV is read-only in TypeScript, but vitest sets it automatically
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-key-for-testing-only";
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = "7d";
}
if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
}

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js headers
vi.mock("next/headers", () => ({
  headers: () => ({
    get: vi.fn(),
  }),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

