import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { checkGuestDiagramLimit, recordGuestDiagramCreation } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import { runMetaSOPOrchestration } from "@/lib/metasop/orchestrator";
import type { CreateDiagramRequest, DiagramNode, DiagramEdge } from "@/types/diagram";
import type { ArchitectBackendArtifact } from "@/lib/metasop/types";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";
import { ensureUniqueNodeIds, ensureEdgeIds, validateEdgeReferences } from "@/lib/diagrams/validation";

/**
 * POST /api/diagrams/generate - Generate diagram using MetaSOP multi-agent system
 * 
 * This endpoint uses the integrated MetaSOP orchestrator to generate architecture diagrams
 * using the multi-agent orchestration system.
 * 
 * Supports both authenticated users and guest users (with limits).
 * 
 * Timeout: 10 minutes (600 seconds) to accommodate agent execution times:
 * - PM Spec: 120s (2 min)
 * - Architect: 300s (5 min)
 * - Engineer: 60s (1 min)
 * - UI Designer: 60s (1 min)
 * - Total: ~540s + buffer = 600s
 */
export const maxDuration = 600; // 10 minutes (Next.js App Router timeout)

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Set model override if provided in options
    // This allows the orchestrator to pick up the model from config
    // Note: Request body validation happens next, but we check rawBody safely here
    if (rawBody?.options?.model) {
      console.log(`[API Route] Overriding LLM model to: ${rawBody.options.model}`);
      process.env.METASOP_LLM_MODEL = rawBody.options.model;
    } else {
      // Clear any previous override to respect defaults
      delete process.env.METASOP_LLM_MODEL;
    }

    // Validate request using schema
    let body: CreateDiagramRequest;
    try {
      body = validateCreateDiagramRequest(rawBody);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
          400
        );
      }
      return createErrorResponse("Invalid request format", 400);
    }

    // Check authentication - support both authenticated and guest users
    // In dev mode, always treat as authenticated user
    let userId: string;
    let isGuest = false;
    let guestSessionId: string | undefined;

    if (process.env.DEV_MODE === "true") {
      // Dev mode: always authenticated
      const user = getAuthenticatedUser(request);
      userId = user.userId;
      isGuest = false;
    } else {
      try {
        const user = getAuthenticatedUser(request);
        userId = user.userId;
      } catch {
        // User is not authenticated, check guest limits
        const guestCheck = await checkGuestDiagramLimit(request);
        if (!guestCheck.allowed) {
          return createErrorResponse(
            guestCheck.reason || "Please sign up to create more diagrams",
            403
          );
        }
        isGuest = true;
        guestSessionId = guestCheck.sessionId;
        // Use a temporary guest user ID (won't be saved to DB)
        userId = `guest_${guestSessionId}`;
      }
    }

    // Check for streaming flag in request or query params
    // We'll support both for flexibility
    const useStreaming = request.nextUrl.searchParams.get("stream") === "true" || (body as any).stream === true;

    if (useStreaming) {
      const encoder = new TextEncoder();
      let isStreamClosed = false;
      let heartbeatInterval: NodeJS.Timeout | undefined;

      const customReadable = new ReadableStream({
        async start(controller) {
          const safeClose = () => {
            if (!isStreamClosed) {
              isStreamClosed = true;
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              try {
                controller.close();
              } catch (e: any) {
                // Suppress "already closed" errors as they are common in async cleanup
                const isAlreadyClosed = e instanceof TypeError && e.message.includes("already closed");
                if (!isAlreadyClosed) {
                  console.error("[Backend] Error closing controller:", e);
                }
              }
            }
          };

          const safeEnqueue = (payload: any) => {
            if (isStreamClosed) return false;
            try {
              controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
              return true;
            } catch (e: any) {
              isStreamClosed = true;
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              // Suppress "already closed" errors
              const isAlreadyClosed = e instanceof TypeError && e.message.includes("already closed");
              if (!isAlreadyClosed) {
                console.warn("[Backend] Failed to enqueue, stream might be closed:", e.message);
              }
              return false;
            }
          };

          safeEnqueue({ type: "stream_open", timestamp: new Date().toISOString() });

          // Set up a heartbeat to keep the connection alive
          heartbeatInterval = setInterval(() => {
            const ok = safeEnqueue({ type: "heartbeat", timestamp: new Date().toISOString() });
            if (!ok) {
              if (heartbeatInterval) clearInterval(heartbeatInterval);
            }
          }, 15000); // 15 seconds heartbeat

          try {
            const metasopResult = await runMetaSOPOrchestration(
              body.prompt,
              body.options,
              (event) => {
                // Stream event to client
                console.log("[Backend] Streaming event:", event.type, event.step_id || event.role || "");
                const ok = safeEnqueue(event);
                
                // If the stream is closed, we throw a special error to stop the orchestrator
                if (!ok && isStreamClosed) {
                  throw new Error("STREAM_CLOSED");
                }
              }
            );

            // Clear heartbeat once orchestration is done
            clearInterval(heartbeatInterval);

            console.log("[Backend] Orchestration completed, artifacts:", Object.keys(metasopResult.artifacts || {}))
            // Success: Transform and Save
            try {
              // Transform MetaSOP artifacts to our diagram format
              const transformedDiagram = transformMetaSOPToDiagram(metasopResult);

              // Validate and normalize transformed diagram data for consistency
              transformedDiagram.nodes = ensureUniqueNodeIds(transformedDiagram.nodes);
              transformedDiagram.edges = ensureEdgeIds(transformedDiagram.edges);

              if (transformedDiagram.nodes.length === 0) {
                console.error("[Backend] ERROR: No nodes after transformation! Artifacts:", Object.keys(metasopResult.artifacts || {}));
              }

              // Validate edge references
              const refValidation = validateEdgeReferences(transformedDiagram.nodes, transformedDiagram.edges);
              if (!refValidation.valid) {
                const nodeIds = new Set(transformedDiagram.nodes.map((n) => n.id));
                transformedDiagram.edges = transformedDiagram.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
              }

              // For guest users, return in-memory diagram
              if (isGuest && guestSessionId) {
                recordGuestDiagramCreation(guestSessionId);
                const guestDiagram = {
                  id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  user_id: userId,
                  title: body.prompt.substring(0, 50) + (body.prompt.length > 50 ? "..." : ""),
                  description: body.prompt,
                  nodes: transformedDiagram.nodes,
                  edges: transformedDiagram.edges,
                  status: "completed" as const,
                  metadata: {
                    prompt: body.prompt,
                    options: body.options,
                    metasop_artifacts: metasopResult.artifacts,
                    metasop_report: metasopResult.report,
                    metasop_steps: metasopResult.steps,
                    is_guest: true,
                  },
                };

                safeEnqueue({
                  type: "orchestration_complete",
                  diagram: guestDiagram,
                  success: true,
                  timestamp: new Date().toISOString()
                });
              } else {
                // Authenticated user - save to database
                let diagram = await diagramDb.create(userId, body);
                let diagramWithMetadata = diagram;
                try {
                  diagramWithMetadata = await diagramDb.update(diagram.id, userId, {
                    nodes: transformedDiagram.nodes,
                    edges: transformedDiagram.edges,
                    metadata: {
                      prompt: body.prompt,
                      options: body.options,
                      metasop_artifacts: metasopResult.artifacts,
                      metasop_report: metasopResult.report,
                      metasop_steps: metasopResult.steps,
                    },
                  });
                } catch (updateError: any) {
                  console.error("Failed to update diagram:", updateError);
                  diagramWithMetadata = {
                    ...diagram,
                    nodes: transformedDiagram.nodes,
                    edges: transformedDiagram.edges,
                    status: "completed" as const
                  };
                }

                safeEnqueue({
                  type: "orchestration_complete",
                  diagram: diagramWithMetadata,
                  success: true,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (transformError: any) {
              console.error("[Backend] Transformation error:", transformError);
              safeEnqueue({
                type: "orchestration_failed",
                error: transformError.message || "Failed to process results",
                timestamp: new Date().toISOString()
              });
            } finally {
              safeClose();
            }
          } catch (error: any) {
            // Clear heartbeat on error
            clearInterval(heartbeatInterval);

            // Handle intentional stream closure stop
            if (error.message === "STREAM_CLOSED") {
              console.log("[Backend] Orchestration stopped because client disconnected.");
              safeClose();
              return;
            }

            console.error("[Backend] Streaming error:", error);
            try {
              safeEnqueue({
                type: "orchestration_failed",
                error: error.message || "Orchestration failed",
                timestamp: new Date().toISOString()
              });
            } catch (enqueueError) {
              console.error("[Backend] Error enqueuing failure event:", enqueueError);
            } finally {
              safeClose();
            }
          }
        },
        cancel() {
          console.log("[Backend] Stream cancelled by client.");
          isStreamClosed = true;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      });

      return new NextResponse(customReadable, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Run MetaSOP orchestration (LEGACY NON-STREAMING MODE)
    let metasopResult;
    try {
      metasopResult = await runMetaSOPOrchestration(body.prompt, body.options);
    } catch (error: any) {
      console.error("[API Route] MetaSOP orchestration error:", error);
      console.error("[API Route] Error message:", error.message);
      console.error("[API Route] Error stack:", error.stack);
      // Continue with partial results if available
      // The orchestrator might have partial artifacts even if it failed
      throw error; // Re-throw for now to see the full error
    }

    // Debug: Log MetaSOP result
    const isDevMode = process.env.DEV_MODE === "true" || process.env.NEXT_PUBLIC_DEV_MODE === "true";
    if (isDevMode) {
      console.log("\n[API Route] MetaSOP orchestration completed");
      console.log("[API Route] Success:", metasopResult.success);
      console.log("[API Route] Artifacts keys:", Object.keys(metasopResult.artifacts || {}));
      if (metasopResult.artifacts?.arch_design) {
        const archContent = (metasopResult.artifacts.arch_design.content || {}) as ArchitectBackendArtifact;
        console.log("[API Route] Architecture has apis:", !!archContent.apis, "Count:", Array.isArray(archContent.apis) ? archContent.apis.length : 0);
        console.log("[API Route] Architecture has database_schema:", !!archContent.database_schema);
        console.log("[API Route] Architecture has technology_stack:", !!archContent.technology_stack);
      }
    }

    // Transform MetaSOP artifacts to our diagram format
    const transformedDiagram = transformMetaSOPToDiagram(metasopResult);

    // Validate and normalize transformed diagram data for consistency
    transformedDiagram.nodes = ensureUniqueNodeIds(transformedDiagram.nodes);
    transformedDiagram.edges = ensureEdgeIds(transformedDiagram.edges);

    // Validate edge references
    const refValidation = validateEdgeReferences(transformedDiagram.nodes, transformedDiagram.edges);
    if (!refValidation.valid) {
      console.warn("[API Route] Edge reference validation warnings:", refValidation.errors);
      // Filter out invalid edges to ensure data consistency
      const nodeIds = new Set(transformedDiagram.nodes.map((n) => n.id));
      transformedDiagram.edges = transformedDiagram.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
    }

    // Debug: Log transformation result
    if (isDevMode) {
      console.log("\n[API Route] Diagram transformation completed");
      console.log("[API Route] Nodes created:", transformedDiagram.nodes.length);
      console.log("[API Route] Edges created:", transformedDiagram.edges.length);
      if (transformedDiagram.nodes.length > 0) {
        console.log("[API Route] Node types:", transformedDiagram.nodes.map(n => n.type));
        console.log("[API Route] Node labels:", transformedDiagram.nodes.map(n => n.label));
        console.log("[API Route] Node IDs:", transformedDiagram.nodes.map(n => n.id));
      } else {
        console.warn("[API Route] WARNING: No nodes were created in the diagram!");
        console.log("[API Route] MetaSOP artifacts keys:", Object.keys(metasopResult.artifacts || {}));
      }
    }

    // For guest users, don't save to database, return in-memory diagram
    if (isGuest && guestSessionId) {
      // Record diagram creation for guest
      recordGuestDiagramCreation(guestSessionId);

      // Create in-memory diagram object (not saved to DB)
      const guestDiagram = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        title: body.prompt.substring(0, 50) + (body.prompt.length > 50 ? "..." : ""),
        description: body.prompt,
        nodes: transformedDiagram.nodes,
        edges: transformedDiagram.edges,
        status: "completed" as const,
        metadata: {
          prompt: body.prompt,
          options: body.options,
          metasop_artifacts: metasopResult.artifacts,
          metasop_report: metasopResult.report,
          metasop_steps: metasopResult.steps,
          is_guest: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Format orchestration data for response
      const orchestrationData = {
        status: metasopResult.success ? "success" : "failed",
        artifacts: metasopResult.artifacts,
        report: metasopResult.report,
        steps: metasopResult.steps,
      };

      return NextResponse.json({
        status: "success",
        data: {
          diagram: guestDiagram,
          orchestration: orchestrationData,
          guest: {
            sessionId: guestSessionId,
            message: "This diagram is not saved. Sign up to save your diagrams!",
          },
        },
        message: "Diagram generated successfully (guest mode - not saved)",
      });
    }

    // Authenticated user - save to database
    // Create diagram with MetaSOP data
    let diagram = await diagramDb.create(userId, body);

    // Update with MetaSOP transformed data and metadata
    // Use try-catch to ensure we always return a diagram even if update fails
    let diagramWithMetadata = diagram;
    try {
      diagramWithMetadata = await diagramDb.update(diagram.id, userId, {
        nodes: transformedDiagram.nodes,
        edges: transformedDiagram.edges,
        metadata: {
          prompt: body.prompt,
          options: body.options,
          metasop_artifacts: metasopResult.artifacts,
          metasop_report: metasopResult.report,
          metasop_steps: metasopResult.steps,
        },
      });
    } catch (updateError: any) {
      console.error("[API Route] Failed to update diagram with MetaSOP data:", updateError);
      // Diagram is already created, so we'll return it with basic data
      // The user can update it later if needed
      diagramWithMetadata = {
        ...diagram,
        nodes: transformedDiagram.nodes,
        edges: transformedDiagram.edges,
        status: "completed" as const,
        metadata: {
          prompt: body.prompt,
          options: body.options,
          metasop_artifacts: metasopResult.artifacts,
          metasop_report: metasopResult.report,
          metasop_steps: metasopResult.steps,
          update_error: "Failed to update diagram metadata, but diagram was created successfully",
        },
      };
    }

    // Format orchestration data for response
    const orchestrationData = {
      status: metasopResult.success ? "success" : "failed",
      artifacts: metasopResult.artifacts,
      report: metasopResult.report,
      steps: metasopResult.steps,
    };

    return createSuccessResponse(
      { diagram: diagramWithMetadata, orchestration: orchestrationData },
      "Diagram generated and saved successfully using MetaSOP multi-agent system"
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    console.error("MetaSOP orchestration error:", error);
    return createErrorResponse(error.message || "Failed to generate diagram", 500);
  }
}

/**
 * Transform MetaSOP orchestration artifacts to our diagram format
 * Creates 5 distinct cards, one for each agent, with all their data
 */
/**
 * Transform MetaSOP orchestration artifacts to our diagram format
 * Creates a holistic graph linking Agents, Artifacts, and Technical Components
 */
function transformMetaSOPToDiagram(
  metasopResult: any
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const artifacts = metasopResult.artifacts || {};
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  // 1. Create Agent Nodes (The "Who")
  // -------------------------------------------------------------
  const agentNodes = [
    { id: "agent-pm", label: "Product Manager", type: "agent", role: "pm", pos: { x: 0, y: 0 } },
    { id: "agent-arch", label: "Architect", type: "agent", role: "arch", pos: { x: 250, y: 0 } },
    { id: "agent-devops", label: "DevOps", type: "agent", role: "devops", pos: { x: 500, y: 0 } },
    { id: "agent-security", label: "Security", type: "agent", role: "security", pos: { x: 750, y: 0 } },
    { id: "agent-eng", label: "Engineer", type: "agent", role: "engineer", pos: { x: 1000, y: 0 } },
    { id: "agent-ui", label: "UI Designer", type: "agent", role: "ui", pos: { x: 1250, y: 0 } },
    { id: "agent-qa", label: "QA Engineer", type: "agent", role: "qa", pos: { x: 1500, y: 0 } },
  ];

  agentNodes.forEach(agent => {
    nodes.push({
      id: agent.id,
      label: agent.label,
      type: "agent", // Uses the standard agent visual
      position: { x: agent.pos.x, y: agent.pos.y },
      data: { agentRole: agent.role, label: agent.label }
    });
  });

  // -------------------------------------------------------------
  // 2. Create Artifact Nodes (The "What")
  // -------------------------------------------------------------

  // PM Artifacts: User Stories (Grouped into one Rich Node)
  const pmSpec = artifacts.pm_spec?.content || {};
  if (pmSpec.user_stories && Array.isArray(pmSpec.user_stories)) {
    const storyId = "artifact-user-stories";
    nodes.push({
      id: storyId,
      type: "user_story",
      position: { x: 0, y: 250 },
      label: "User Stories",
      data: {
        label: "User Stories",
        artifactType: "user_stories",
        items: pmSpec.user_stories.map((s: any) => ({
          title: s.title,
          description: s.description || s.story || (typeof s === 'string' ? s : undefined),
          priority: s.priority
        }))
      }
    });
    edges.push({
      id: `pm-stories`,
      from: "agent-pm",
      to: storyId,
      label: "defines",
      animated: true
    });
  }

  // Engineer Artifacts: Files (Grouped into one Rich Node)
  const engineerArtifact = artifacts.engineer_impl?.content || {};
  if (engineerArtifact.file_structure) {
    const fileId = "artifact-files";
    const flattenedFiles = flattenFiles(engineerArtifact.file_structure).slice(0, 10);

    nodes.push({
      id: fileId,
      type: "file",
      position: { x: 600, y: 250 },
      label: "Source Files",
      data: {
        label: "File Structure",
        artifactType: "file_structure",
        items: flattenedFiles.map(f => f.name)
      }
    });
    edges.push({
      id: `eng-files`,
      from: "agent-eng",
      to: fileId,
      label: "scaffolds",
      animated: true
    });
  }

  // Architect Artifacts: Database Schema (Grouped into one Rich Node)
  const archContent = (metasopResult.artifacts?.arch_design?.content || {}) as ArchitectBackendArtifact;
  if (archContent.database_schema?.tables && Array.isArray(archContent.database_schema.tables)) {
    const schemaId = "artifact-schema";
    nodes.push({
      id: schemaId,
      type: "database_schema",
      position: { x: 300, y: 250 },
      label: "Database Schema",
      data: {
        label: "Data Schema",
        artifactType: "database_schema",
        items: archContent.database_schema.tables
      }
    });
    edges.push({
      id: `arch-schema`,
      from: "agent-arch",
      to: schemaId,
      label: "specifies",
      animated: true
    });
  }

  // Architect Artifacts: APIs (Grouped into one Rich Node)
  if (archContent.apis && Array.isArray(archContent.apis)) {
    const apisId = "artifact-apis";
    nodes.push({
      id: apisId,
      type: "apis",
      position: { x: 450, y: 250 },
      label: "API Definitions",
      data: {
        label: "API Endpoints",
        artifactType: "apis",
        items: archContent.apis
      }
    });
    edges.push({
      id: `arch-apis`,
      from: "agent-arch",
      to: apisId,
      label: "defines",
      animated: true
    });
  }

  // 3. Create Technical Nodes (The "System") - Architect Output
  // -------------------------------------------------------------
  const technicalNodes: any[] = [];
  const technicalEdges: any[] = [];

  // archContent already defined above

  // Extract nodes from Technology Stack
  if (archContent.technology_stack) {
    const stack = archContent.technology_stack;
    const categories: Array<keyof typeof stack> = ['frontend', 'backend', 'database', 'authentication', 'hosting'];

    categories.forEach(category => {
      const items = stack[category];
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          technicalNodes.push({
            id: `tech-${category}-${idx}`,
            label: item,
            type: category as string,
            metadata: { category }
          });
        });
      }
    });
  }

  // Extract nodes from Database Schema
  if (archContent.database_schema?.tables) {
    archContent.database_schema.tables.forEach((table) => {
      technicalNodes.push({
        id: `db-table-${table.name}`,
        label: `Table: ${table.name}`,
        type: 'database',
        metadata: {
          columns: table.columns.length,
          description: table.description
        }
      });
    });
  }

  // No fallback here - if no technical nodes were generated by agents, don't inject default ones

  // Process technical nodes
  const techStartY = 600; // Place system below artifacts
  const techStartX = 100;

  // Auto-layout helpers (simple Grid/Layering)
  const layerMap: Record<string, number> = {
    'frontend': 0, 'mobile': 0, 'browser': 0,
    'gateway': 1, 'load-balancer': 1, 'external': 1,
    'service': 2, 'backend': 2, 'worker': 2,
    'database': 3, 'storage': 3, 'queue': 3, 'cache': 3
  };

  const nodesPerLayer: Record<number, number> = {};

  technicalNodes.forEach((node: any) => {
    // Schema-level validation should prevent illogical nodes, but keep minimal safety check
    // The schema now has pattern constraints preventing 'nodes', 'edges', 'a2ui', 'manifest' in ids/labels
    // This is just a final safety net in case LLM doesn't strictly follow schema
    const labelLower = (node.label || node.id || '').toLowerCase();
    const typeLower = (node.type || '').toLowerCase();
    const dataLabel = (node.data?.label || '').toLowerCase();

    // Skip only the most obvious illogical nodes (schema should prevent these)
    if (labelLower === 'nodes' || labelLower === 'edges' || dataLabel === 'nodes' || dataLabel === 'edges') {
      return;
    }

    // Determine specialized type
    let nodeType = "service"; // Default

    if (typeLower.includes('db') || typeLower.includes('database') || typeLower.includes('store') || labelLower.includes('database')) nodeType = "database";
    else if (typeLower.includes('front') || typeLower.includes('ui') || typeLower.includes('web')) nodeType = "frontend";
    else if (typeLower.includes('gateway') || typeLower.includes('balancer')) nodeType = "gateway";

    // Calculate Position
    const layer = layerMap[nodeType] ?? 2;
    const countInLayer = nodesPerLayer[layer] || 0;
    nodesPerLayer[layer] = countInLayer + 1;

    // Cast nodeType to specific union type to satisfy TS
    const typedNodeType = nodeType as "component" | "service" | "database" | "api" | "storage" | "other" | "agent" | "user_story" | "file" | "gateway" | "frontend";

    nodes.push({
      id: node.id,
      type: typedNodeType,
      position: {
        x: techStartX + (countInLayer * 250),
        y: techStartY + (layer * 180)
      },
      label: node.label || node.id,
      data: {
        ...node.data,
        label: node.label || node.id,
        description: node.description || node.data?.description,
        technologies: node.technologies || node.data?.technologies
      }
    });

    // Edge: Architect -> System Component (Design link)
    // Only connect to "entry point" nodes (frontend, gateway) to keep hierarchy clean
    const isEntryPoint = nodeType === "frontend" || nodeType === "gateway";
    if (isEntryPoint) {
      edges.push({
        id: `arch-${node.id}`,
        from: "agent-arch",
        to: node.id,
        label: "designs",
        animated: false,
        style: { strokeDasharray: '5,5', opacity: 0.5, stroke: '#10b981' } // Greenish design link
      });
    } else {
      // For other nodes, we can add a subtle edge if it has no incoming edges from technical nodes
      // This ensures everything is reachable from an agent root
      const hasIncomingTechnical = technicalEdges.some(te => te.target === node.id);
      if (!hasIncomingTechnical) {
        edges.push({
          id: `arch-ref-${node.id}`,
          from: "agent-arch",
          to: node.id,
          label: "",
          animated: false,
          style: { strokeDasharray: '2,2', opacity: 0.2 }
        });
      }
    }
  });

  // Process technical edges
  technicalEdges.forEach((edge: any) => {
    edges.push({
      id: edge.id || `edge-${edge.source}-${edge.target}`,
      from: edge.source,
      to: edge.target,
      label: edge.label || edge.protocol,
      animated: true,
      data: { protocol: edge.protocol }
    });
  });

  return { nodes, edges };
}

// Helper to flatten directory structure for visualization
function flattenFiles(structure: any): any[] {
  const files: any[] = [];
  if (!structure) return files;

  function traverse(item: any) {
    if (item.type === 'file') {
      files.push(item);
    } else if (item.children) {
      item.children.forEach(traverse);
    }
  }

  if (Array.isArray(structure)) structure.forEach(traverse);
  else traverse(structure);

  return files;
}
