import type { z } from "zod";

import { DevOpsArtifactSchema } from "@/lib/metasop/schemas/agents/devops";

export type DevOpsBackendArtifact = z.infer<typeof DevOpsArtifactSchema>;
