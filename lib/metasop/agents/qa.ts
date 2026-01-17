import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { QABackendArtifact } from "../artifacts/qa/types";
import type { ArchitectBackendArtifact } from "../artifacts/architect/types";
import { qaSchema } from "../artifacts/qa/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";

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
    let content: QABackendArtifact;

    if (shouldUseRefinement(context)) {
      logger.info("QA agent in ATOMIC REFINEMENT mode");
      content = await refineWithAtomicActions<QABackendArtifact>(
        context,
        "QA",
        qaSchema,
        { 
          cacheId: context.cacheId,
          temperature: 0.2 
        }
      );
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as ArchitectBackendArtifact | undefined;
      const projectTitle = pmArtifact?.title || "Project";
      const techStackString = archArtifact?.technology_stack ? Object.values(archArtifact.technology_stack).flat().slice(0, 5).join(", ") : "Modern Stack";

      const qaPrompt = `As a Lead Quality Assurance Engineer, design a verification strategy for '${projectTitle}'.

ADAPTIVE DEPTH GUIDELINE:
- For **simple web apps/utilities**: Prioritize essential test cases, basic security checks, and straightforward manual verification. Focus on core functional stability.
- For **complex/enterprise systems**: Provide exhaustive BDD scenario mapping, deep risk analysis, and production-ready verification rigor.

${pmSpec?.content ? `Project Goals: ${(pmSpec.content as any).summary}` : `User Request: ${user_request}`}
${archDesign?.content ? `Tech Stack: ${techStackString}` : ""}
${engineerImpl?.content ? `Implementation Patterns: ${(engineerImpl.content as any).technical_patterns?.join(", ")}` : ""}

MISSION OBJECTIVES:
1. **Verification Strategy**: Define a test strategy covering Unit, Integration, and E2E layers proportional to the project's scale.
2. **BDD Scenario Mapping**: Map a comprehensive set of test scenarios DIRECTLY to user stories. The volume of scenarios should be proportional to the project's complexity. For each test case, include a **Gherkin (Given/When/Then)** specification.
3. **Quality Gates & Coverage**: Define code coverage thresholds (Line, Branch, Function) suitable for the project's requirements.
4. **Risk Analysis**: Conduct a simple but concise risk analysis of the architecture, identifying key risks proportional to the system's complexity. **For each risk, you MUST provide a specific mitigation strategy.** Keep descriptions to a maximum of 2 sentences.
5. **Benchmarking**: Specify target performance metrics (latency, throughput) as needed.
6. **Security & Manual Audits**: Define an authentication verification plan and manual UAT steps.
7. **Accessibility**: Design a verification plan for accessibility compliance (WCAG).

Focus on technical rigor and actionable verification value. Match the complexity of your verification strategy to the inherent needs of the project. Respond with ONLY the JSON object.`;

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
            temperature: 0.2, 
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

      content = {
        ok: llmQA.ok ?? true,
        test_strategy: llmQA.test_strategy,
        test_cases: llmQA.test_cases,
        security_plan: llmQA.security_plan,
        manual_verification_steps: llmQA.manual_verification_steps,
        risk_analysis: llmQA.risk_analysis,
        summary: llmQA.summary,
        description: llmQA.description,
        coverage: llmQA.coverage,
        performance_metrics: llmQA.performance_metrics,
        accessibility_plan: llmQA.accessibility_plan || (llmQA as any).accessibility,
        manual_uat_plan: llmQA.manual_uat_plan
      };
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
