import type { z } from "zod";

import { QAArtifactSchema } from "@/lib/metasop/schemas/agents/qa";

export type QABackendArtifact = z.infer<typeof QAArtifactSchema>;
