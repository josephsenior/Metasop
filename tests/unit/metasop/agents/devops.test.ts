import { describe, it, expect, vi } from "vitest";
import type { AgentContext } from "@/lib/metasop/types";
import type { DevOpsBackendArtifact } from "@/lib/metasop/artifacts/devops/types";

const llmHelperMock = vi.hoisted(() => {
  return {
    generateStreamingStructuredWithLLM: vi.fn(),
  };
});

vi.mock("@/lib/metasop/utils/llm-helper", () => llmHelperMock);

describe("DevOpsAgent", () => {
  it("returns a DevOps artifact with expected shape", async () => {
    const fixture: DevOpsBackendArtifact = {
      summary: "DevOps strategy summary.",
      description: "DevOps strategy description.",
      infrastructure: {
        cloud_provider: "AWS",
        services: [{ name: "prod-db", type: "database", configuration: { engine: "postgres" } }],
        regions: ["us-east-1"],
      },
      cicd: {
        pipeline_stages: [{ name: "Build", steps: ["pnpm install", "pnpm type-check"] }],
        tools: ["GitHub Actions"],
        triggers: [{ type: "push", branch: "main" }],
      },
      deployment: {
        strategy: "blue-green",
        environments: [{ name: "production", configuration: { NODE_ENV: "production" } }],
        rollback_strategy: "Revert to previous stable artifact.",
      },
      containerization: {
        dockerfile: "Dockerfile",
      },
      monitoring: {
        metrics: ["latency"],
        logging: ["structured logs"],
        tracing: ["opentelemetry"],
        alerting: ["pager"],
      } as any,
      scaling: {
        strategy: "HPA",
        auto_scaling: true,
        database_scaling: "read replicas",
      } as any,
      disaster_recovery: {
        rto: "4h",
        rpo: "15m",
        backups: "daily",
      } as any,
    };

    llmHelperMock.generateStreamingStructuredWithLLM.mockImplementation(async (_prompt, _schema, onProgress) => {
      onProgress({ type: "agent_progress", message: "partial" });
      return fixture;
    });

    const { devopsAgent } = await import("@/lib/metasop/agents/devops");

    const context: AgentContext = {
      user_request: "Build a SaaS app",
      previous_artifacts: {},
      options: { model: "gemini-3-flash-preview" },
    };

    const progressEvents: any[] = [];
    const result = await devopsAgent(context, (evt) => progressEvents.push(evt));

    expect(result.step_id).toBe("devops_infrastructure");
    expect(result.role).toBe("DevOps");
    expect(typeof result.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);

    const content = result.content as DevOpsBackendArtifact;
    expect(content.summary).toBe(fixture.summary);
    expect(content.infrastructure.cloud_provider).toBe("AWS");
    expect(content.cicd.tools).toContain("GitHub Actions");

    expect(progressEvents.length).toBeGreaterThan(0);
  });

  it("throws when LLM returns null", async () => {
    llmHelperMock.generateStreamingStructuredWithLLM.mockResolvedValueOnce(null as any);

    const { devopsAgent } = await import("@/lib/metasop/agents/devops");

    const context: AgentContext = {
      user_request: "Build a SaaS app",
      previous_artifacts: {},
    };

    await expect(devopsAgent(context)).rejects.toThrow(/No structured data received/i);
  });
});
