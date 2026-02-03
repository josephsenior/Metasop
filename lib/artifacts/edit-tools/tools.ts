/**
 * Predefined tools for editing artifact JSON (document-style refinement).
 * Prevents direct manipulation; all changes go through validated operations.
 */

import { setAtPath, deleteAtPath, addArrayItem, removeArrayItem } from "./path";
import { logger } from "@/lib/metasop/utils/logger";

export const ARTIFACT_IDS = [
  "pm_spec",
  "arch_design",
  "security_architecture",
  "devops_infrastructure",
  "ui_design",
  "engineer_impl",
  "qa_verification",
] as const;

export type ArtifactId = (typeof ARTIFACT_IDS)[number];

export type EditToolName =
  | "set_at_path"
  | "delete_at_path"
  | "add_array_item"
  | "remove_array_item";

export interface EditOpBase {
  tool: EditToolName;
  artifactId: ArtifactId;
  path: string;
}

export interface SetAtPathOp extends EditOpBase {
  tool: "set_at_path";
  value: unknown;
}

export interface DeleteAtPathOp extends EditOpBase {
  tool: "delete_at_path";
}

export interface AddArrayItemOp extends EditOpBase {
  tool: "add_array_item";
  value: unknown;
}

export interface RemoveArrayItemOp extends EditOpBase {
  tool: "remove_array_item";
  index?: number;
}

export type EditOp = SetAtPathOp | DeleteAtPathOp | AddArrayItemOp | RemoveArrayItemOp;

export interface ArtifactRecord {
  content: Record<string, unknown>;
  step_id?: string;
  role?: string;
  timestamp?: string;
}

export interface EditToolsResult {
  success: boolean;
  artifacts: Record<string, ArtifactRecord>;
  applied: number;
  errors: Array<{ op: EditOp; error: string }>;
}

/**
 * Validate artifactId and that artifact exists.
 */
function getArtifactContent(
  artifacts: Record<string, ArtifactRecord>,
  artifactId: string
): Record<string, unknown> | null {
  if (!ARTIFACT_IDS.includes(artifactId as ArtifactId)) {
    return null;
  }
  const art = artifacts[artifactId];
  if (!art?.content || typeof art.content !== "object") {
    return null;
  }
  return art.content as Record<string, unknown>;
}

/**
 * Execute a single edit op on artifacts. Mutates artifacts in place.
 * Returns error message or null on success.
 */
export function executeEditOp(
  artifacts: Record<string, ArtifactRecord>,
  op: EditOp
): string | null {
  const content = getArtifactContent(artifacts, op.artifactId);
  if (!content) {
    return `Artifact not found or invalid: ${op.artifactId}`;
  }
  if (!op.path || typeof op.path !== "string") {
    return "Path is required and must be a string";
  }

  switch (op.tool) {
    case "set_at_path": {
      const ok = setAtPath(content, op.path, (op as SetAtPathOp).value);
      if (!ok) return `set_at_path failed at ${op.artifactId}.${op.path}`;
      logger.debug("Edit tool set_at_path", { artifactId: op.artifactId, path: op.path });
      return null;
    }
    case "delete_at_path": {
      const ok = deleteAtPath(content, op.path);
      if (!ok) return `delete_at_path failed (path missing or invalid): ${op.artifactId}.${op.path}`;
      logger.debug("Edit tool delete_at_path", { artifactId: op.artifactId, path: op.path });
      return null;
    }
    case "add_array_item": {
      const addOp = op as AddArrayItemOp;
      const ok = addArrayItem(content, op.path, addOp.value);
      if (!ok) return `add_array_item failed (path must be an array): ${op.artifactId}.${op.path}`;
      logger.debug("Edit tool add_array_item", { artifactId: op.artifactId, path: op.path });
      return null;
    }
    case "remove_array_item": {
      const remOp = op as RemoveArrayItemOp;
      const ok = removeArrayItem(content, op.path, remOp.index);
      if (!ok) return `remove_array_item failed: ${op.artifactId}.${op.path}`;
      logger.debug("Edit tool remove_array_item", { artifactId: op.artifactId, path: op.path });
      return null;
    }
    default:
      return `Unknown tool: ${(op as EditOp).tool}`;
  }
}

/**
 * Apply a list of edit ops to a copy of artifacts. Does not mutate the input.
 * Returns updated artifacts and list of errors for failed ops.
 */
export function applyEditOps(
  artifacts: Record<string, ArtifactRecord>,
  ops: EditOp[]
): EditToolsResult {
  const copy: Record<string, ArtifactRecord> = {};
  for (const [id, art] of Object.entries(artifacts)) {
    copy[id] = {
      ...art,
      content: art.content && typeof art.content === "object" ? JSON.parse(JSON.stringify(art.content)) : {},
    };
  }
  const errors: Array<{ op: EditOp; error: string }> = [];
  let applied = 0;
  for (const op of ops) {
    const err = executeEditOp(copy, op);
    if (err) {
      errors.push({ op, error: err });
    } else {
      applied++;
    }
  }
  return {
    success: errors.length === 0,
    artifacts: copy,
    applied,
    errors,
  };
}
