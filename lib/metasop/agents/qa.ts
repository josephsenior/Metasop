import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { QABackendArtifact } from "../artifacts/qa/types";
import type { ArchitectBackendArtifact } from "../artifacts/architect/types";
import { qaSchema } from "../artifacts/qa/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

/**
 * QA Agent
 * Generates test plans and verification criteria
 */
export async function qaAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const pmSpec = previous_artifacts.pm_spec;
  const archDesign = previous_artifacts.arch_design;
  const engineerImpl = previous_artifacts.engineer_impl;

  logger.info("QA agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let qaPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("QA agent in REFINEMENT mode");
      const previousQAContent = context.previous_artifacts?.qa_verification?.content as QABackendArtifact | undefined;
      const guidelines = `
1. **Test Strategy**: Update testing approach based on new implementation details
2. **Test Cases**: Add test cases for newly added features or edge cases
3. **Coverage Metrics**: Refine coverage targets (${previousQAContent?.coverage?.threshold || '80'}%) and thresholds
4. **Performance Testing**: Update benchmark scenarios based on the scalability approach`;
      qaPrompt = buildRefinementPrompt(context, "QA", guidelines);
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as ArchitectBackendArtifact | undefined;
      const projectTitle = pmArtifact?.title || "Project";
      const techStackString = archArtifact?.technology_stack ? Object.values(archArtifact.technology_stack).flat().slice(0, 5).join(", ") : "Modern Stack";

      qaPrompt = `As a Lead Quality Assurance Engineer, design a concise but comprehensive verification STRATEGY for '${projectTitle}'.

${pmSpec?.content ? `Project Goals: ${(pmSpec.content as any).summary}` : `User Request: ${user_request}`}
${archDesign?.content ? `Tech Stack: ${techStackString}` : ""}
${engineerImpl?.content ? `Implementation Patterns: ${(engineerImpl.content as any).technical_patterns?.join(", ")}` : ""}

MISSION OBJECTIVES:
1. **High-Fidelity Strategy**: Define a robust test strategy covering Unit, Integration, and E2E layers.
2. **BDD Scenario Mapping**: Map 4-6 critical-path test scenarios DIRECTLY to user stories. For each test case, include a **Gherkin (Given/When/Then)** specification and precise **Expected Results**.
3. **Quality Gates & Coverage**: Define mandatory code coverage thresholds. Target at least 80% coverage for core business logic.
4. **Resilience & Risk Analysis**: Conduct a risk analysis of the architecture (3-5 key risks). Identify potential failure modes and define technical mitigations.
5. **Full-Spectrum Benchmarking**: Specify target performance metrics (P95 latency, load times).
6. **Security & Manual Audits**: Define an authentication verification plan and 3-5 manual UAT steps.
7. **Executive Summary**: Provide a high-level summary and description.

Focus on creating a professional, battle-hardened verification strategy. Be technical and precise, but avoid excessive verbosity. Respond with ONLY the JSON object. Keep the total response size manageable.`;
    }

    let llmQA: QABackendArtifact | null = null;

    try {
      llmQA = await generateStreamingStructuredWithLLM<QABackendArtifact>(
        qaPrompt,
        qaSchema,
        (partialEvent) => {
          if (onProgress) {
            onProgress(partialEvent);
          }
        },
        {
          reasoning: context.options?.reasoning ?? false,
          temperature: 0.3,
          cacheId: context.cacheId,
          role: "QA"
        }
      );
    } catch (error: any) {
      logger.error("QA agent LLM call failed", { error: error.message });
      throw error;
    }

    if (!llmQA) {
      throw new Error("QA agent failed: No structured data received from LLM");
    }

    const content: QABackendArtifact = {
      ok: llmQA.ok,
      test_strategy: llmQA.test_strategy,
      test_cases: llmQA.test_cases,
      security_plan: llmQA.security_plan,
      manual_verification_steps: llmQA.manual_verification_steps,
      risk_analysis: llmQA.risk_analysis,
      summary: llmQA.summary,
      coverage: llmQA.coverage,
      performance_metrics: llmQA.performance_metrics,
    };


    // Validation check
    if (!content.test_strategy || !content.test_cases) {
      throw new Error("QA agent failed: Test strategy or test cases are missing");
    }

    logger.info("QA agent completed");

    return {
      step_id: "qa_verification",
      role: "QA",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("QA agent failed", { error: error.message });
    throw error;
  }
}
