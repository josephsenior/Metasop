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
   * Refine a specific artifact
   */
  async refineArtifact(data: {
    diagramId: string;
    stepId: string;
    instruction: string;
    previousArtifacts: Record<string, any>;
  }): Promise<any> {
    const response = await apiClient.post<{
      status: string;
      data: any;
      message: string;
    }>("/diagrams/refine", data);
    return response.data.data;
  },
};

