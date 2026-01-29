const { defineConfig } = require("vitest/config");
const path = require("path");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    pool: "threads",
    maxWorkers: 1,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "scripts/**",
      "tests/integration/**",
      "tests/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "app/api/**/*.{ts,tsx}"],
      exclude: [
        "**/*.d.ts",
        "**/*.config.{ts,tsx}",
        "**/node_modules/**",
        "**/coverage/**",
        "**/dist/**",
        "**/.next/**",
        "**/types/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
      reportOnFailure: true,
      skipFull: false,
    },
  },
});
