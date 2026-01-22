import { describe, it, expect } from "vitest";
import { parsePrompt } from "@/lib/metasop/utils/prompt-parser";

describe("PromptParser", () => {
  describe("parsePrompt", () => {
    it("should detect authentication requirements", () => {
      const parsed = parsePrompt("Create a user authentication system with login");

      expect(parsed.hasAuth).toBe(true);
      expect(parsed.keywords.length).toBeGreaterThan(0);
      expect(Array.isArray(parsed.keywords)).toBe(true);
    });

    it("should detect database requirements", () => {
      const parsed = parsePrompt("Store user data in a database");

      expect(parsed.hasDatabase).toBe(true);
    });

    it("should detect API requirements", () => {
      const parsed = parsePrompt("Create REST API endpoints for user management");

      expect(parsed.hasAPI).toBe(true);
    });

    it("should detect payment requirements", () => {
      const parsed = parsePrompt("Integrate Stripe payment processing");

      expect(parsed.hasPayment).toBe(true);
    });

    it("should detect email requirements", () => {
      const parsed = parsePrompt("Send email notifications to users");

      expect(parsed.hasEmail).toBe(true);
    });

    it("should detect storage requirements", () => {
      const parsed = parsePrompt("Upload files to S3 storage");

      expect(parsed.hasStorage).toBe(true);
    });

    it("should detect state management requirements", () => {
      const parsed = parsePrompt("Use Redux for state management");

      expect(parsed.hasStateManagement).toBe(true);
    });

    it("should extract components", () => {
      const parsed = parsePrompt("Create a dashboard with forms and charts");

      expect(parsed.components).toContain("Dashboard");
      expect(parsed.components).toContain("Form");
      expect(parsed.components).toContain("Chart");
    });

    it("should extract technologies", () => {
      const parsed = parsePrompt("Build with React and Next.js using PostgreSQL");

      expect(parsed.technologies).toContain("React");
      expect(parsed.technologies).toContain("Next.js");
      expect(parsed.technologies).toContain("PostgreSQL");
    });

    it("should extract keywords", () => {
      const parsed = parsePrompt("Create a user management system with authentication");

      expect(parsed.keywords.length).toBeGreaterThan(0);
      expect(parsed.keywords.some((k) => k.includes("user"))).toBe(true);
    });

    it("should handle empty prompt", () => {
      const parsed = parsePrompt("");

      expect(parsed.hasAuth).toBe(false);
      expect(parsed.keywords).toEqual([]);
    });

    it("should handle complex prompt with multiple features", () => {
      const parsed = parsePrompt(
        "Create a full-stack e-commerce app with user authentication, payment processing via Stripe, email notifications, and file uploads to S3. Use React, Next.js, and PostgreSQL database."
      );

      expect(parsed.hasAuth).toBe(true);
      expect(parsed.hasPayment).toBe(true);
      expect(parsed.hasEmail).toBe(true);
      expect(parsed.hasStorage).toBe(true);
      expect(parsed.hasDatabase).toBe(true);
      expect(parsed.technologies.length).toBeGreaterThan(0);
    });

    it("should extract all component types", () => {
      const parsed = parsePrompt("Create a dashboard with forms, lists, charts, modals, and search filters");
      
      expect(parsed.components).toContain("Dashboard");
      expect(parsed.components).toContain("Form");
      expect(parsed.components).toContain("List");
      expect(parsed.components).toContain("Chart");
      expect(parsed.components).toContain("Modal");
      expect(parsed.components).toContain("Search");
    });

    it("should extract all technology types", () => {
      const parsed = parsePrompt(
        "Build with React, Next.js, Vue, Angular, Node.js, Express, NestJS, Python, Django, Flask, PostgreSQL, MySQL, MongoDB, Redis, Docker, Kubernetes, AWS, Azure, GCP"
      );
      
      expect(parsed.technologies).toContain("React");
      expect(parsed.technologies).toContain("Next.js");
      expect(parsed.technologies).toContain("Vue");
      expect(parsed.technologies).toContain("Angular");
      expect(parsed.technologies).toContain("Node.js");
      expect(parsed.technologies).toContain("Express");
      expect(parsed.technologies).toContain("NestJS");
      expect(parsed.technologies).toContain("Python");
      expect(parsed.technologies).toContain("Django");
      expect(parsed.technologies).toContain("Flask");
      expect(parsed.technologies).toContain("PostgreSQL");
      expect(parsed.technologies).toContain("MySQL");
      expect(parsed.technologies).toContain("MongoDB");
      expect(parsed.technologies).toContain("Redis");
      expect(parsed.technologies).toContain("Docker");
      expect(parsed.technologies).toContain("Kubernetes");
      expect(parsed.technologies).toContain("AWS");
      expect(parsed.technologies).toContain("Azure");
      expect(parsed.technologies).toContain("GCP");
    });

    it("should not detect features when not present", () => {
      const parsed = parsePrompt("Create a simple application");
      
      expect(parsed.hasAuth).toBe(false);
      expect(parsed.hasPayment).toBe(false);
      expect(parsed.hasEmail).toBe(false);
      expect(parsed.hasStorage).toBe(false);
      expect(parsed.hasDatabase).toBe(false);
      expect(parsed.hasAPI).toBe(false);
      expect(parsed.hasStateManagement).toBe(false);
    });

    it("should handle prompt with only short words", () => {
      const parsed = parsePrompt("a b c d e f");
      
      expect(parsed.keywords.length).toBe(0);
    });

    it("should limit keywords to 20", () => {
      const longPrompt = Array(30).fill("word").join(" ");
      const parsed = parsePrompt(longPrompt);
      
      expect(parsed.keywords.length).toBeLessThanOrEqual(20);
    });
  });
});

