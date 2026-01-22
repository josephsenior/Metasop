import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/metasop/utils/logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => { });
    vi.spyOn(console, "info").mockImplementation(() => { });
    vi.spyOn(console, "warn").mockImplementation(() => { });
    vi.spyOn(console, "error").mockImplementation(() => { });
  });

  afterEach(() => {
    // NODE_ENV is read-only in TypeScript, but we can still test the logger behavior
    vi.restoreAllMocks();
  });

  describe("debug", () => {
    it("should log debug messages in development", () => {
      // Force logger to re-check NODE_ENV
      (logger as any).isDevelopment = true;
      logger.debug("Debug message", { key: "value" });

      expect(console.debug).toHaveBeenCalled();

      (logger as any).isDevelopment = false;
    });

    it("should not log debug messages in production", () => {
      (logger as any).isDevelopment = false;
      logger.debug("Debug message");

      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe("info", () => {
    it("should log info messages", () => {
      logger.info("Info message", { key: "value" });

      expect(console.info).toHaveBeenCalled();
      const call = vi.mocked(console.info).mock.calls[0];
      expect(call[0]).toContain("[MetaSOP:INFO]");
      expect(call[1]).toBe("Info message");
      // Args are spread, so check if any arg contains the object
      const hasValueArg = call.some((arg) => typeof arg === "object" && arg !== null && "key" in arg && arg.key === "value");
      expect(hasValueArg).toBe(true);
    });
  });

  describe("warn", () => {
    it("should log warning messages", () => {
      logger.warn("Warning message", { key: "value" });

      expect(console.warn).toHaveBeenCalled();
      const call = vi.mocked(console.warn).mock.calls[0];
      expect(call[0]).toContain("[MetaSOP:WARN]");
    });
  });

  describe("error", () => {
    it("should log error messages", () => {
      logger.error("Error message", { key: "value" });

      expect(console.error).toHaveBeenCalled();
      const call = vi.mocked(console.error).mock.calls[0];
      expect(call[0]).toContain("[MetaSOP:ERROR]");
    });
  });

  describe("timestamp", () => {
    it("should include timestamp in log messages", () => {
      logger.info("Test message");

      const call = vi.mocked(console.info).mock.calls[0];
      expect(call[0]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

