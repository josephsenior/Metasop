import type { z } from "zod";

import { UIDesignerArtifactSchema } from "@/lib/metasop/schemas/agents/ui-designer";

export type UIDesignerBackendArtifact = z.infer<typeof UIDesignerArtifactSchema>;
