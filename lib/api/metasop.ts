import { apiClient } from "./client";
import type { Diagram } from "@/types/diagram";

export interface MetaSOPOrchestrationStep {
  step_id: string;
  role: string;
  status: "pending" | "running" | "success" | "failed";
  artifact?: any;
  artifact_hash?: string;
  error?: string;
  timestamp?: string;
}

export interface MetaSOPOrchestrationData {
  status: "success" | "failed" | "processing";
  summary?: string;
  artifacts?: {
    pm_spec?: any;
    arch_design?: any;
    devops_infrastructure?: any;
    security_architecture?: any;
    engineer_impl?: any;
    ui_design?: any;
    qa_verification?: any;
  };
  diagram?: string; // Mermaid diagram
  report?: {
    events?: Array<{
      step_id: string;
      role: string;
      status: string;
      retries?: number;
    }>;
  };
  steps?: MetaSOPOrchestrationStep[];
  /** A2A Protocol state for inter-agent communication tracking */
  a2a?: {
    tasks: any[];
    messages: any[];
  };
}

export const metasopApi = {
  /**
   * Generate diagram using MetaSOP multi-agent system
   */
  async generateDiagram(data: {
    prompt: string;
    options?: {
      includeStateManagement?: boolean;
      includeAPIs?: boolean;
      includeDatabase?: boolean;
    };
  }): Promise<{ diagram: Diagram; orchestration: MetaSOPOrchestrationData | null }> {
    const response = await apiClient.post<{
      status: string;
      data: {
        diagram: Diagram;
        orchestration: MetaSOPOrchestrationData | null;
      };
      message: string;
    }>("/diagrams/generate", data);
    return response.data.data;
  },

  /**
   * Get orchestration status for a diagram
   */
  async getOrchestrationStatus(diagramId: string): Promise<MetaSOPOrchestrationData> {
    const response = await apiClient.get<{
      status: string;
      data: MetaSOPOrchestrationData;
    }>(`/diagrams/${diagramId}/orchestration`);
    return response.data.data;
  },

  /**
   * Poll for orchestration updates (for real-time updates)
   */
  async pollOrchestration(
    diagramId: string,
    lastStepId?: string
  ): Promise<MetaSOPOrchestrationData> {
    const params = lastStepId ? `?last_step_id=${lastStepId}` : "";
    const response = await apiClient.get<{
      status: string;
      data: MetaSOPOrchestrationData;
    }>(`/diagrams/${diagramId}/orchestration/poll${params}`);
    return response.data.data;
  },

  /**
   * Edit artifacts via predefined tools (set_at_path, delete_at_path, add_array_item, remove_array_item).
   * Tool-based refinement; no agent re-runs.
   */
  async editArtifacts(data: {
    diagramId?: string;
    previousArtifacts: Record<string, any>;
    edits: Array<
      | { tool: "set_at_path"; artifactId: string; path: string; value: any }
      | { tool: "delete_at_path"; artifactId: string; path: string }
      | { tool: "add_array_item"; artifactId: string; path: string; value: any }
      | { tool: "remove_array_item"; artifactId: string; path: string; index?: number }
    >;
  }): Promise<{ success: boolean; artifacts: Record<string, any>; applied: number; errors?: Array<{ op: any; error: string }> }> {
    const response = await apiClient.post<{
      status: string;
      data: { success: boolean; artifacts: Record<string, any>; applied: number; errors?: Array<{ op: any; error: string }> };
      message: string;
    }>("/diagrams/artifacts/edit", data);
    return response.data.data;
  },

  /**
   * Ask a question about the project artifacts (RAG)
   */
  async askQuestion(data: {
    diagramId: string;
    question: string;
    contextMarkdown: string;
    activeTab?: string;
    cacheId?: string;
  }): Promise<{ answer: string; cacheId?: string }> {
    const response = await apiClient.post<{
      status: string;
      data: { answer: string; cacheId?: string };
      message: string;
    }>("/diagrams/ask", data);
    return response.data.data;
  },
};

