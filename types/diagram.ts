/**
 * Diagram types: artifact-centric model.
 *
 * Diagram (for the user) = metadata + artifacts. The DB does not store
 * any graph structure; the canonical view is artifacts only.
 */

export interface Diagram {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "processing" | "completed" | "failed" | "pending";
  createdAt: string;
  updatedAt: string;
  metadata?: {
    prompt?: string;
    options?: {
      includeStateManagement?: boolean;
      includeAPIs?: boolean;
      includeDatabase?: boolean;
    };
    metasop_artifacts?: any;
    metasop_report?: any;
    metasop_steps?: any;
    is_guest?: boolean;
    update_error?: string;
  };
}

export interface CreateDiagramRequest {
  prompt: string;
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
    model?: string;
    reasoning?: boolean;
  };
  documents?: any[];
  /** Answers from guided clarification (question id -> selected option). */
  clarificationAnswers?: Record<string, string>;
}

export interface CreateDiagramResponse {
  diagram: Diagram;
  message: string;
}

export interface UpdateDiagramRequest {
  title?: string;
  description?: string;
  status?: "processing" | "completed" | "failed" | "pending";
  metadata?: any;
}

export interface DiagramListResponse {
  diagrams: Diagram[];
  total: number;
  page?: number;
  limit?: number;
}
