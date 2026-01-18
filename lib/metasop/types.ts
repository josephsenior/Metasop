
/**
 * MetaSOP Types - Simplified version for Next.js integration
 */

import type { ArchitectBackendArtifact } from "./artifacts/architect/types";
import type { ProductManagerBackendArtifact } from "./artifacts/product-manager/types";
import type { EngineerBackendArtifact } from "./artifacts/engineer/types";
import type { QABackendArtifact } from "./artifacts/qa/types";
import type { DevOpsBackendArtifact } from "./artifacts/devops/types";
import type { SecurityBackendArtifact } from "./artifacts/security/types";
import type { UIDesignerBackendArtifact } from "./artifacts/ui-designer/types";
import type { A2ATask, A2AMessage } from "./a2a-types";

// Re-export specific artifact types for consumers
export type {
  ArchitectBackendArtifact,
  ProductManagerBackendArtifact,
  EngineerBackendArtifact,
  QABackendArtifact,
  DevOpsBackendArtifact,
  SecurityBackendArtifact,
  UIDesignerBackendArtifact,
};

export type BackendArtifactData =
  | ArchitectBackendArtifact
  | ProductManagerBackendArtifact
  | EngineerBackendArtifact
  | QABackendArtifact
  | DevOpsBackendArtifact
  | SecurityBackendArtifact
  | UIDesignerBackendArtifact;

export interface MetaSOPArtifact {
  step_id: string;
  role: string;
  content: BackendArtifactData | Record<string, any>; // Use backend schema types when possible
  timestamp: string;
}

export interface MetaSOPStep {
  id: string;
  role: string;
  status: "pending" | "running" | "success" | "failed";
  artifact?: MetaSOPArtifact;
  error?: string;
  timestamp?: string;
}

export interface MetaSOPEvent {
  type: "step_start" | "step_thought" | "step_partial_artifact" | "step_complete" | "step_failed" | "orchestration_complete" | "orchestration_failed" | "agent_progress";
  step_id?: string;
  role?: string;
  artifact?: MetaSOPArtifact;
  thought?: string;
  partial_content?: any;
  error?: string;
  status?: string;
  message?: string;
  timestamp: string;
}

export interface MetaSOPReport {
  events: Array<{
    step_id: string;
    role: string;
    status: string;
    retries?: number;
    timestamp?: string;
  }>;
  summary?: string;
}

export interface MetaSOPResult {
  success: boolean;
  artifacts: {
    pm_spec?: MetaSOPArtifact;
    arch_design?: MetaSOPArtifact;
    devops_infrastructure?: MetaSOPArtifact;
    security_architecture?: MetaSOPArtifact;
    engineer_impl?: MetaSOPArtifact;
    ui_design?: MetaSOPArtifact;
    qa_verification?: MetaSOPArtifact;
  };
  report: MetaSOPReport;
  steps: MetaSOPStep[];
  graph?: KnowledgeGraph; // The dependency graph of all generated artifacts
  /** A2A Protocol state for inter-agent communication tracking */
  a2a?: {
    tasks: A2ATask[];
    messages: A2AMessage[];
  };
}

export interface AgentContext {
  user_request: string;
  previous_artifacts: Record<string, MetaSOPArtifact>;
  cacheId?: string; // Optional Gemini Context Cache ID
  documents?: any[]; // Additional context documents
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
    model?: string;
    reasoning?: boolean;
  };
  refinement?: {
    instruction: string;
    target_step_id: string;
    previous_artifact_content: any;
    isAtomicAction?: boolean;
  };
}

export interface ArtifactDependency {
  source_id: string;
  target_id: string;
  type: "data_flow" | "schema_sync" | "security_rule" | "api_contract";
  description?: string;
}

export interface KnowledgeGraph {
  nodes: MetaSOPArtifact[];
  edges: ArtifactDependency[];
}

export type AgentFunction = (
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
) => Promise<MetaSOPArtifact>;
