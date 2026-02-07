import type { z } from "zod";

import { ProductManagerArtifactSchema } from "@/lib/metasop/schemas/agents/product-manager";

export type ProductManagerBackendArtifact = z.infer<typeof ProductManagerArtifactSchema>;
