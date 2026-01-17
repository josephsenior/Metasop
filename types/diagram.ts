export interface DiagramNode {
  id: string;
  label: string;
  type: "component" | "service" | "database" | "api" | "storage" | "other" | "agent" | "user_story" | "file" | "gateway" | "frontend" | "database_schema" | "apis";
  position?: { x: number; y: number };
  data?: Record<string, any>;
}

export interface DiagramEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  type?: string;
  data?: Record<string, any>;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface Diagram {
  id: string;
  user_id: string;
  title: string;
  description: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  status: "processing" | "completed" | "failed" | "pending";
  created_at: string;
  updated_at: string;
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
  documents?: any[];
}

export interface CreateDiagramRequest {
  prompt: string;
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
  };
}

export interface CreateDiagramResponse {
  diagram: Diagram;
  message: string;
}

export interface UpdateDiagramRequest {
  title?: string;
  description?: string;
  nodes?: DiagramNode[];
  edges?: DiagramEdge[];
  metadata?: any;
}

export interface DiagramListResponse {
  diagrams: Diagram[];
  total: number;
  page?: number;
  limit?: number;
}

