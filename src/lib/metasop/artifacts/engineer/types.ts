import type { z } from "zod";

import { EngineerArtifactSchema } from "@/lib/metasop/schemas/agents/engineer";

export type EngineerBackendArtifact = z.infer<typeof EngineerArtifactSchema>;
