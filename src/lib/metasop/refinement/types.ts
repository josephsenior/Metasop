/**
 * Refinement Orchestrator Types
 * 
 * 2-Layer Architecture:
 * - Layer 1 (Intent Analyzer): Produces EditPlan with field-level changes
 * - Layer 2 (Batch Updater): Applies changes atomically with schema enforcement
 */

// ─────────────────────────────────────────────────────────────────────────────
// Edit Plan (Layer 1 Output)
// ─────────────────────────────────────────────────────────────────────────────

export interface CascadingEffect {
    artifact: string;
    field_path: string;
    action: "update" | "validate";
    reason: string;
}

export interface Edit {
    artifact: string;
    field_path: string;
    action: "add" | "update" | "remove";
    new_value?: any;
    cascading_effects: CascadingEffect[];
}

export interface EditPlan {
    reasoning: string;
    edits: Edit[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming Events
// ─────────────────────────────────────────────────────────────────────────────

export type RefinementEventType =
    | "analyzing"
    | "plan_ready"
    | "applying"
    | "artifact_updated"
    | "complete"
    | "error";

export interface RefinementEvent {
    type: RefinementEventType;
    payload: any;
    timestamp: number;
}

export interface AnalyzingPayload {
    message: string;
}

export interface PlanReadyPayload {
    edits_count: number;
    artifacts_affected: string[];
    reasoning: string;
    edit_plan: EditPlan;
}

export interface ApplyingPayload {
    current_artifact: string;
    progress: string;
}

export interface ArtifactUpdatedPayload {
    artifact: string;
    fields_changed: number;
}

export interface CompletePayload {
    changelog: ChangelogEntry[];
    updated_artifacts: Record<string, any>;
}

export interface ErrorPayload {
    message: string;
    phase: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Refinement Output (Layer 2 Output)
// ─────────────────────────────────────────────────────────────────────────────

export interface ChangelogEntry {
    artifact: string;
    field: string;
    change: string;
}

export interface ArtifactPatch {
    path: string;
    value: any;
    op: "set" | "add" | "remove";
}

export interface RefinementOutput {
    updated_artifacts: Record<string, any>; // Still supported for full replacement if needed
    patches?: Record<string, ArtifactPatch[]>; // Delta updates
    changelog: ChangelogEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Request/Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RefinementRequest {
    intent: string;
    previousArtifacts: Record<string, any>;
    chatHistory?: string;
    activeTab?: string;
}

export interface RefinementContext {
    intent: string;
    artifacts: Record<string, any>;
    chatHistory?: string;
    activeTab?: string;
}
