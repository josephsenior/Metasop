/**
 * Artifact edit tools: document-style refinement via predefined ops.
 * Use these instead of re-running agents to change artifact JSON.
 */

export { parsePath, getAtPath, setAtPath, deleteAtPath, addArrayItem, removeArrayItem } from "./path";
export type { PathSegment } from "./path";
export {
  ARTIFACT_IDS,
  executeEditOp,
  applyEditOps,
  type ArtifactId,
  type EditToolName,
  type EditOp,
  type SetAtPathOp,
  type DeleteAtPathOp,
  type AddArrayItemOp,
  type RemoveArrayItemOp,
  type ArtifactRecord,
  type EditToolsResult,
} from "./tools";
