/**
 * MetaSOP Configuration
 * Centralized configuration for the MetaSOP system
 */

export interface AgentConfig {
  stepId: string;
  timeout: number; // Timeout in ms
  retries: number; // Number of retries
  temperature: number; // LLM temperature (0.0-1.0)
  model?: string; // Optional per-agent model override
  retryPolicy?: {
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
  };
}

export interface MetaSOPConfig {
  // Agent settings
  agents: {
    enabled: string[]; // List of enabled agents
    defaultTimeout: number; // Default timeout in ms
    defaultRetries: number; // Default number of retries
    agentConfigs: Record<string, AgentConfig>; // Per-agent configuration
  };

  // LLM settings (single provider for now)
  llm: {
    provider?: "gemini" | "mock";
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  // Performance settings
  performance: {
    cacheEnabled: boolean; // Enable caching of agent responses
    maxRefinementDepth: number; // Maximum depth for recursive refinements
    maxCascadeRipples: number; // Maximum number of agents a cascade can affect
  };

  // Logging
  logging: {
    level: "debug" | "info" | "warn" | "error";
    enabled: boolean;
  };
}

export const defaultConfig: MetaSOPConfig = {
  agents: {
    enabled: ["pm_spec", "arch_design", "devops_infrastructure", "security_architecture", "engineer_impl", "ui_design", "qa_verification"],
    defaultTimeout: 180000, // 180 seconds (3 minutes)
    defaultRetries: 0, // No retries - fail fast
    agentConfigs: {
      // Per-agent configuration: timeout, retries, temperature
      // Temperature guide: 0.2 = precise/technical, 0.3-0.4 = balanced/creative
      pm_spec: {
        stepId: "pm_spec",
        timeout: 180000,
        retries: 0,
        temperature: 0.4, // Slightly higher for creative opportunity identification
      },
      arch_design: {
        stepId: "arch_design",
        timeout: 180000,
        retries: 0,
        temperature: 0.2, // Lower for technical precision
      },
      devops_infrastructure: {
        stepId: "devops_infrastructure",
        timeout: 600000, // 600 seconds (10 minutes) - longer timeout for complex infrastructure setup
        retries: 0,
        temperature: 0.3, // Balanced
      },
      security_architecture: {
        stepId: "security_architecture",
        timeout: 180000,
        retries: 0,
        temperature: 0.2, // Lower for high-precision security analysis
      },
      engineer_impl: {
        stepId: "engineer_impl",
        timeout: 180000,
        retries: 0,
        temperature: 0.3, // Balanced to avoid deterministic loops
      },
      ui_design: {
        stepId: "ui_design",
        timeout: 180000, // 180 seconds (3 minutes) - same as other agents
        retries: 0,
        temperature: 0.4, // Slightly higher for creative design decisions
      },
      qa_verification: {
        stepId: "qa_verification",
        timeout: 180000, // 180 seconds (3 minutes) - same as other agents
        retries: 0,
        temperature: 0.2, // Lower for precise test specifications
      },
    },
  },
  llm: {
    provider: process.env.NODE_ENV === "test" ? "mock" : "gemini",
    model: "gemini-3-flash-preview", // Use Gemini 3 Flash Preview for fast, high-quality orchestration
    temperature: 0.2,
    maxTokens: 64000,
  },
  performance: {
    cacheEnabled: true,
    maxRefinementDepth: 3, // Prevent infinite refinement loops
    maxCascadeRipples: 10, // Limit cascade updates
  },
  logging: {
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    enabled: true,
  },
};

/**
 * Get temperature for a specific agent step
 * Single source of truth for all agent temperatures
 */
export function getAgentTemperature(stepId: string): number {
  const config = getConfig();
  const agentConfig = config.agents.agentConfigs[stepId];
  return agentConfig?.temperature ?? config.llm.temperature ?? 0.2;
}

/**
 * Get configuration from environment variables
 */
export function getConfig(): MetaSOPConfig {
  const config = { ...defaultConfig };

  // Override with environment variables if present
  if (process.env.METASOP_LLM_PROVIDER) {
    const provider = process.env.METASOP_LLM_PROVIDER;
    if (provider === "gemini" || provider === "mock") {
      config.llm.provider = provider;
    }
  }

  if (process.env.METASOP_LLM_MODEL) {
    config.llm.model = process.env.METASOP_LLM_MODEL;
  }

  if (process.env.METASOP_AGENT_TIMEOUT) {
    config.agents.defaultTimeout = parseInt(process.env.METASOP_AGENT_TIMEOUT, 10);
  }

  if (process.env.METASOP_AGENT_RETRIES) {
    config.agents.defaultRetries = parseInt(process.env.METASOP_AGENT_RETRIES, 10);
  }

  // Support for provider-specific keys
  if (process.env.METASOP_LLM_API_KEY) {
    config.llm.apiKey = process.env.METASOP_LLM_API_KEY;
  } else if (config.llm.provider === "gemini" && (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY)) {
    config.llm.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  }

  return config;
}
