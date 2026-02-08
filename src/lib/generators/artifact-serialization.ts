import type { Diagram } from "@/types/diagram";
import type { MetaSOPResult } from "@/lib/metasop/types";

export type MetaSOPArtifactKey = keyof MetaSOPResult["artifacts"];

export function getArtifactContent(diagram: Diagram, key: MetaSOPArtifactKey): unknown {
  return diagram.metadata?.metasop_artifacts?.[key]?.content;
}

export function getAllArtifacts(diagram: Diagram): unknown {
  return diagram.metadata?.metasop_artifacts;
}

export function getAllArtifactsContent(diagram: Diagram): Record<string, unknown> | undefined {
  const artifacts = diagram.metadata?.metasop_artifacts;
  if (!artifacts || typeof artifacts !== "object") return undefined;

  const out: Record<string, unknown> = {};
  for (const [key, artifact] of Object.entries(artifacts as Record<string, any>)) {
    out[key] = artifact?.content;
  }
  return out;
}

export function stringifyArtifact(value: unknown): string {
  if (value === undefined) return "";
  return JSON.stringify(
    value,
    (_key, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}
