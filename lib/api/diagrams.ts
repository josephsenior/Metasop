import type {
  Diagram,
  CreateDiagramRequest,
  UpdateDiagramRequest,
  DiagramListResponse,
  CreateDiagramResponse,
} from "@/types/diagram";
import { apiClient } from "./client";

export const diagramsApi = {
  /**
   * Get all diagrams for the current user
   */
  async getAll(options?: {
    limit?: number;
    offset?: number;
    status?: "processing" | "completed" | "failed" | "pending";
  }): Promise<DiagramListResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());
    if (options?.status) params.append("status", options.status);

    const response = await apiClient.get<{
      status: string;
      data: DiagramListResponse;
    }>(`/diagrams?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get a specific diagram by ID
   */
  async getById(id: string): Promise<Diagram> {
    const response = await apiClient.get<{
      status: string;
      data: { diagram: Diagram };
    }>(`/diagrams/${id}?t=${Date.now()}`);
    return response.data.data.diagram;
  },

  /**
   * Create a new diagram
   */
  async create(data: CreateDiagramRequest): Promise<Diagram> {
    const response = await apiClient.post<{
      status: string;
      data: CreateDiagramResponse;
      message: string;
    }>("/diagrams", data);
    return response.data.data.diagram;
  },

  /**
   * Update a diagram
   */
  async update(id: string, data: UpdateDiagramRequest): Promise<Diagram> {
    const response = await apiClient.patch<{
      status: string;
      data: { diagram: Diagram };
      message: string;
    }>(`/diagrams/${id}`, data);
    return response.data.data.diagram;
  },

  /**
   * Delete a diagram
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/diagrams/${id}`);
  },

  /**
   * Duplicate a diagram
   */
  async duplicate(id: string): Promise<Diagram> {
    const response = await apiClient.post<{
      status: string;
      data: { diagram: Diagram };
      message: string;
    }>(`/diagrams/${id}/duplicate`);
    return response.data.data.diagram;
  },
};

// Re-export metasopApi for convenience
export { metasopApi } from "./metasop";

