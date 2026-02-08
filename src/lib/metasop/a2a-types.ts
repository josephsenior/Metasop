import type { BackendArtifactData, MetaSOPArtifact } from "./types";

/**
 * A2A (Agent to Agent) Protocol Types
 * Based on Google's A2A v1.0 Draft Specification
 */

/**
 * Agent Card - Describes an agent's capabilities for discovery
 */
export interface A2AAgentCard {
    /** Unique identifier for the agent */
    name: string;
    /** Semantic version of the agent */
    version: string;
    /** Human-readable description of the agent's purpose */
    description: string;
    /** List of capabilities this agent can perform */
    capabilities: string[];
    /** Artifact types this agent requires as input */
    inputArtifacts: string[];
    /** Artifact types this agent produces as output */
    outputArtifacts: string[];
    /** Optional URL for remote agents (unused for local agents) */
    url?: string;
}

/**
 * A2A Task Status - Lifecycle states for a task
 */
export type A2ATaskStatus =
    | "pending"
    | "in_progress"
    | "completed"
    | "failed"
    | "cancelled";

/**
 * A2A Task - A unit of work delegated between agents
 */
export interface A2ATask {
    /** Unique identifier for the task */
    id: string;
    /** Agent Card name of the sender (e.g., "Orchestrator", "Architect") */
    senderId: string;
    /** Agent Card name of the recipient */
    recipientId: string;
    /** Type of task being requested */
    type: string;
    /** Current status of the task */
    status: A2ATaskStatus;
    /** Input data for the task (can be an artifact or user request) */
    input: Record<string, MetaSOPArtifact> | { user_request: string };
    /** Output artifact produced by the task (populated on completion) */
    output?: MetaSOPArtifact;
    /** Additional context for the task */
    context?: Record<string, string | number | boolean | null>;
    /** Timestamp when the task was created */
    createdAt: string;
    /** Timestamp when the task was last updated */
    updatedAt: string;
}

/**
 * A2A Message Part - Multi-modal content within a message
 */
export interface A2AMessagePart {
    /** Type of content: text, json, image, file */
    type: "text" | "json" | "artifact_ref";
    /** The actual content */
    content: string | BackendArtifactData | { artifact_id: string };
    /** Optional MIME type */
    mimeType?: string;
}

/**
 * A2A Message - Communication between agents within a task
 */
export interface A2AMessage {
    /** Reference to the parent task */
    taskId: string;
    /** Agent Card name of the sender */
    senderId: string;
    /** Agent Card name of the recipient */
    recipientId: string;
    /** Message content (for simple text messages) */
    content?: string;
    /** Multi-modal message parts (for complex payloads) */
    parts?: A2AMessagePart[];
    /** Timestamp of the message */
    timestamp: string;
}

/**
 * A2A Event - Events emitted during agent communication
 */
export type A2AEventType =
    | "a2a_task_created"
    | "a2a_message_sent"
    | "a2a_task_completed"
    | "a2a_task_failed";

export interface A2AEvent {
    type: A2AEventType;
    task?: A2ATask;
    message?: A2AMessage;
    timestamp: string;
}
