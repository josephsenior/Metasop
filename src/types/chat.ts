export type ChatMessageRole = "user" | "assistant";

export type ChatMessageType = "info" | "refinement" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  type?: ChatMessageType;
  detail?: string;
  timestamp: Date;
}

/**
 * JSON-serializable version stored in DB metadata.
 * `timestamp` is persisted as an ISO string.
 */
export interface SerializedChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  type?: ChatMessageType;
  detail?: string;
  timestamp: string;
}

export type ChatHistoryMessage = ChatMessage | SerializedChatMessage;
