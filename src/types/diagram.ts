/**
 * Diagram types: artifact-centric model.
 *
 * Diagram (for the user) = metadata + artifacts. The DB does not store
 * any graph structure; the canonical view is artifacts only.
 */

import type { MetaSOPReport, MetaSOPResult, MetaSOPStep } from "@/lib/metasop/types";
import type { SerializedChatMessage } from "@/types/chat";

export interface DiagramMetadata {
  prompt?: string;
  /** ISO timestamp when generation completed. */
  generated_at?: string;
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
    model?: string;
    reasoning?: boolean;
  };
  metasop_artifacts?: MetaSOPResult["artifacts"];
  metasop_report?: MetaSOPReport;
  metasop_steps?: MetaSOPStep[];
  is_guest?: boolean;
  update_error?: string;
  chat_history?: SerializedChatMessage[];
}

export interface Diagram {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "processing" | "completed" | "failed" | "pending";
  createdAt: string;
  updatedAt: string;
  metadata?: DiagramMetadata;
}

export interface UploadedDocument {
  name: string;
  type: string;
  content: string;
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
  documents?: UploadedDocument[];
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
  metadata?: DiagramMetadata;
}

export interface DiagramListResponse {
  diagrams: Diagram[];
  total: number;
  page?: number;
  limit?: number;
}
