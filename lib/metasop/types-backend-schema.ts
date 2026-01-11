
/**
 * DEPRECATED: usage of this file is deprecated.
 * Please import types from "@/lib/metasop/types" or directly from specific artifact folders.
 * 
 * Example:
 * import { ArchitectBackendArtifact } from "@/lib/metasop/artifacts/architect/types";
 */

export type { ArchitectBackendArtifact } from "./artifacts/architect/types";
export * from "./artifacts/architect/types"; // Export type guards too

export type { ProductManagerBackendArtifact } from "./artifacts/product-manager/types";
export * from "./artifacts/product-manager/types";

export type { EngineerBackendArtifact } from "./artifacts/engineer/types";
export * from "./artifacts/engineer/types";

export type { QABackendArtifact } from "./artifacts/qa/types";
export * from "./artifacts/qa/types";

export type { DevOpsBackendArtifact } from "./artifacts/devops/types";
export * from "./artifacts/devops/types";

export type { SecurityBackendArtifact } from "./artifacts/security/types";
export * from "./artifacts/security/types";

// Re-export BackendArtifactData from types.ts is not possible if types.ts imports from here (circular)
// But types.ts implementation does NOT import from here anymore.
// However, types.ts defines BackendArtifactData.
// We can import it here to maintain compatibility if anyone used it from here.
import { BackendArtifactData } from "./types";
export type { BackendArtifactData };
