/**
 * Runtime config: single source for env + defaults + feature flags.
 * Used by API routes and lib/metasop so behavior is easy to reason about.
 * All defaults live here; env vars override; nothing is "forgotten."
 */

const env = typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);

/** Feature flags and misc runtime options */
export interface RuntimeFeatureFlags {
  enableMetrics: boolean;
  enableCache: boolean;
}

/** LLM slice for MetaSOP */
export interface RuntimeLLMConfig {
  provider: "gemini" | "mock";
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/** Agents slice for MetaSOP */
export interface RuntimeAgentsConfig {
  enabled: string[];
  defaultTimeout: number;
  defaultRetries: number;
}

/** Performance slice for MetaSOP */
export interface RuntimePerformanceConfig {
  cacheEnabled: boolean;
  maxRefinementDepth: number;
  maxCascadeRipples: number;
}

/** Logging slice */
export interface RuntimeLoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  enabled: boolean;
}

export interface RuntimeConfig {
  llm: RuntimeLLMConfig;
  agents: RuntimeAgentsConfig;
  performance: RuntimePerformanceConfig;
  logging: RuntimeLoggingConfig;
  featureFlags: RuntimeFeatureFlags;
}

const DEFAULT_LLM: RuntimeLLMConfig = {
  provider: env.NODE_ENV === "test" ? "mock" : "gemini",
  model: "gemini-3-flash-preview",
  temperature: 0.2,
  maxTokens: 64000,
};

const DEFAULT_AGENTS: RuntimeAgentsConfig = {
  enabled: [
    "pm_spec",
    "arch_design",
    "devops_infrastructure",
    "security_architecture",
    "engineer_impl",
    "ui_design",
    "qa_verification",
  ],
  defaultTimeout: 180000,
  defaultRetries: 0,
};

const DEFAULT_PERFORMANCE: RuntimePerformanceConfig = {
  cacheEnabled: true,
  maxRefinementDepth: 3,
  maxCascadeRipples: 10,
};

const DEFAULT_LOGGING: RuntimeLoggingConfig = {
  level: env.NODE_ENV === "development" ? "debug" : "info",
  enabled: true,
};

const DEFAULT_FEATURE_FLAGS: RuntimeFeatureFlags = {
  enableMetrics: env.ENABLE_METRICS !== "false",
  enableCache: true,
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

/**
 * Returns the current runtime config (env + defaults). Safe to call from API and lib/metasop.
 */
export function getRuntimeConfig(): RuntimeConfig {
  const llm: RuntimeLLMConfig = {
    ...DEFAULT_LLM,
    ...(env.METASOP_LLM_PROVIDER === "gemini" || env.METASOP_LLM_PROVIDER === "mock"
      ? { provider: env.METASOP_LLM_PROVIDER }
      : {}),
  };
  if (env.METASOP_LLM_MODEL) llm.model = env.METASOP_LLM_MODEL;
  if (env.METASOP_LLM_API_KEY) llm.apiKey = env.METASOP_LLM_API_KEY;
  else if (llm.provider === "gemini" && (env.GOOGLE_AI_API_KEY || env.GEMINI_API_KEY)) {
    llm.apiKey = env.GOOGLE_AI_API_KEY || env.GEMINI_API_KEY;
  }

  const agents: RuntimeAgentsConfig = {
    ...DEFAULT_AGENTS,
    ...(env.METASOP_AGENT_TIMEOUT !== undefined && {
      defaultTimeout: parseNumber(env.METASOP_AGENT_TIMEOUT, DEFAULT_AGENTS.defaultTimeout),
    }),
    ...(env.METASOP_AGENT_RETRIES !== undefined && {
      defaultRetries: parseNumber(env.METASOP_AGENT_RETRIES, DEFAULT_AGENTS.defaultRetries),
    }),
  };

  return {
    llm,
    agents,
    performance: { ...DEFAULT_PERFORMANCE },
    logging: { ...DEFAULT_LOGGING },
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
  };
}
