import type { z } from "zod";

import { ArchitectArtifactSchema } from "@/lib/metasop/schemas/agents/architect";

export type ArchitectBackendArtifact = z.infer<typeof ArchitectArtifactSchema>;
