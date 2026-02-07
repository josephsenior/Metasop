import type { z } from "zod";

import { SecurityArtifactSchema } from "@/lib/metasop/schemas/agents/security";

export type SecurityBackendArtifact = z.infer<typeof SecurityArtifactSchema>;
