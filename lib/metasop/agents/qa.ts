import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { QABackendArtifact } from "../artifacts/qa/types";
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
  const { user_request } = context;

  logger.info("QA agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let qaPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("QA agent in REFINEMENT mode");
      const guidelines = `
1. **Test Strategy**: Update testing approach or add new test types
2. **Test Cases**: Add test cases for new features
3. **Coverage Metrics**: Update coverage targets or edge cases
4. **Performance Testing**: Enhance load testing or benchmark scenarios`;
      qaPrompt = buildRefinementPrompt(context, "QA", guidelines);
    } else {
      const hasCache = !!context.cacheId;

      qaPrompt = hasCache
        ? `As a Lead Quality Assurance Engineer, refine the verification STRATEGY based on the cached context.

CRITICAL GOALS:
1. **Strategic Approach**: Define the methodology, types of testing (Functional, Security, etc.), and tools (Jest, Playwright).
2. **Test Cases**: List critical **Gherkin-style** test cases (Given/When/Then) for the primary flows.
3. **Performance & Coverage**: Set specific performance targets (p95 response times) and code coverage goals.
4. **Security Plan**: Define specific verification steps for authentication and authorization.

Do NOT generate simulated test results. Focus purely on the PLAN.`
        : `As a Lead Quality Assurance Engineer, design a comprehensive QUALITY ASSURANCE PLAN.

User Request: ${user_request}

CRITICAL GOALS:
1. **Strategic Test Plan**: Define the methodology, test layers (Unit, Integration, E2E), and frameworks to be used.
2. **Critical Path Scenarios**: Translate primary user stories into **Gherkin** test cases.
3. **Performance & Coverage**: Explicitly define performance metrics (latency, load) and coverage targets (percentage).
4. **Risk Assessment**: Analyze technical risks and define mitigation strategies.

Focus on the *strategy* and *coverage plan*. Do NOT simulate execution results.

RESPOND WITH ONLY THE JSON OBJECT - NO PREAMBLE OR EXPLANATION.`;
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
          reasoning: true,
          temperature: 0.7,
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

    if (Array.isArray(content.test_cases) && content.test_cases.length > 0) {
      const hasGherkin = content.test_cases.some((t: any) => typeof t?.gherkin === "string" && t.gherkin.length > 0);
      if (!hasGherkin) {
        content.test_cases[0] = {
          ...content.test_cases[0],
          gherkin: "Given a user exists\nWhen they attempt to sign in\nThen they should be authenticated and see their dashboard",
        } as any;
      }
    }

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
