/**
 * A2A Agent Cards Registry
 * Defines the capabilities and contracts for each agent in the MetaSOP orchestration.
 */
import type { A2AAgentCard } from "./a2a-types";

// ============================================================================
// ORCHESTRATOR
// ============================================================================
export const orchestratorAgentCard: A2AAgentCard = {
    name: "Orchestrator",
    version: "1.0",
    description: "Coordinates the multi-agent workflow, managing task delegation and artifact flow between agents.",
    capabilities: ["task_delegation", "context_caching", "progress_tracking", "failure_handling"],
    inputArtifacts: ["user_request"],
    outputArtifacts: ["orchestration_result"],
};

// ============================================================================
// PRODUCT MANAGER
// ============================================================================
export const productManagerAgentCard: A2AAgentCard = {
    name: "ProductManager",
    version: "1.0",
    description: "Translates user requirements into a formal product specification with user stories and acceptance criteria.",
    capabilities: ["requirement_analysis", "user_story_generation", "scope_definition"],
    inputArtifacts: ["user_request"],
    outputArtifacts: ["pm_spec"],
};

// ============================================================================
// ARCHITECT
// ============================================================================
export const architectAgentCard: A2AAgentCard = {
    name: "Architect",
    version: "1.0",
    description: "Designs the technical architecture, including components, APIs, database schemas, and system interactions.",
    capabilities: ["system_design", "api_design", "database_modeling", "component_architecture"],
    inputArtifacts: ["user_request", "pm_spec"],
    outputArtifacts: ["arch_design"],
};

// ============================================================================
// DEVOPS
// ============================================================================
export const devopsAgentCard: A2AAgentCard = {
    name: "DevOps",
    version: "1.0",
    description: "Designs infrastructure, CI/CD pipelines, and deployment strategies.",
    capabilities: ["infrastructure_design", "ci_cd_pipelines", "container_orchestration", "monitoring_setup"],
    inputArtifacts: ["user_request", "pm_spec", "arch_design"],
    outputArtifacts: ["devops_infrastructure"],
};

// ============================================================================
// SECURITY
// ============================================================================
export const securityAgentCard: A2AAgentCard = {
    name: "Security",
    version: "1.0",
    description: "Performs threat modeling, defines security controls, and ensures compliance.",
    capabilities: ["threat_modeling", "security_controls", "compliance_analysis", "encryption_design"],
    inputArtifacts: ["user_request", "pm_spec", "arch_design", "devops_infrastructure"],
    outputArtifacts: ["security_architecture"],
};

// ============================================================================
// ENGINEER
// ============================================================================
export const engineerAgentCard: A2AAgentCard = {
    name: "Engineer",
    version: "1.0",
    description: "Defines the implementation plan, technology stack, and code structure.",
    capabilities: ["implementation_planning", "technology_selection", "code_structure_design"],
    inputArtifacts: ["user_request", "pm_spec", "arch_design", "devops_infrastructure", "security_architecture"],
    outputArtifacts: ["engineer_impl"],
};

// ============================================================================
// UI DESIGNER
// ============================================================================
export const uiDesignerAgentCard: A2AAgentCard = {
    name: "UIDesigner",
    version: "1.0",
    description: "Designs the user interface, component hierarchy, and design tokens.",
    capabilities: ["ui_design", "component_hierarchy", "design_tokens", "a2ui_manifest"],
    inputArtifacts: ["user_request", "pm_spec", "arch_design", "engineer_impl"],
    outputArtifacts: ["ui_design"],
};

// ============================================================================
// QA
// ============================================================================
export const qaAgentCard: A2AAgentCard = {
    name: "QA",
    version: "1.0",
    description: "Defines testing strategies, test cases, and quality verification.",
    capabilities: ["test_planning", "test_case_generation", "quality_metrics"],
    inputArtifacts: ["user_request", "pm_spec", "arch_design", "engineer_impl", "ui_design"],
    outputArtifacts: ["qa_verification"],
};

// ============================================================================
// REGISTRY
// ============================================================================
export const agentCardsRegistry: Record<string, A2AAgentCard> = {
    Orchestrator: orchestratorAgentCard,
    ProductManager: productManagerAgentCard,
    Architect: architectAgentCard,
    DevOps: devopsAgentCard,
    Security: securityAgentCard,
    Engineer: engineerAgentCard,
    UIDesigner: uiDesignerAgentCard,
    QA: qaAgentCard,
};

/**
 * Get an agent card by name
 */
export function getAgentCard(name: string): A2AAgentCard | undefined {
    return agentCardsRegistry[name];
}
