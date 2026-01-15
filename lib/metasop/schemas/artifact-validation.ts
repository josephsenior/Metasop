/**
 * Zod schemas for MetaSOP agent artifact validation
 * Ensures type safety and data consistency for all agent outputs
 */

import { z } from "zod";

// ============================================================================
// PRODUCT MANAGER ARTIFACT SCHEMA
// ============================================================================

const UserStorySchema = z.union([
  z.string().min(10, "User story must be at least 10 characters"),
  z.object({
    id: z.string().regex(/^US-[0-9]+$/, "User story ID must match pattern US-{number}").optional(),
    title: z.string().min(5, "Title must be at least 5 characters").max(500, "Title must be at most 500 characters"),
    story: z.string().min(10, "Story must be at least 10 characters").optional(),
    narrative: z.string().min(10, "Narrative must be at least 10 characters").optional(), // Alias for story
    description: z.string().optional(),
    priority: z.string().transform(v => v.toLowerCase()).pipe(z.enum(["critical", "high", "medium", "low"])).optional(),
    story_points: z.number().int().min(1).max(100).optional(),
    acceptance_criteria: z.array(z.string().min(5, "Acceptance criterion must be at least 5 characters")).optional(),
    dependencies: z.array(z.string()).optional(),
    estimated_complexity: z.string().transform(v => v.toLowerCase()).pipe(z.enum(["small", "medium", "large"])).optional(),
    user_value: z.string().min(5, "User value must be at least 5 characters").optional(),
  }),
]);

const AcceptanceCriterionSchema = z.union([
  z.string().min(10, "Acceptance criterion must be at least 10 characters"),
  z.object({
    id: z.string().regex(/^AC-[0-9]+$/, "Acceptance criterion ID must match pattern AC-{number}").optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    criteria: z.string().min(10, "Criteria must be at least 10 characters"),
  }),
]);

export const ProductManagerArtifactSchema = z.object({
  user_stories: z.array(UserStorySchema).min(1, "At least one user story is required"),
  acceptance_criteria: z.array(AcceptanceCriterionSchema).min(1, "At least one acceptance criterion is required"),
  ui_multi_section: z.boolean().optional().default(false),
  ui_sections: z.number().int().min(0).max(20).optional().default(1),
  assumptions: z.array(z.string()).optional(),
  out_of_scope: z.array(z.string()).optional(),
  swot: z.object({
    strengths: z.array(z.string()).optional(),
    weaknesses: z.array(z.string()).optional(),
    opportunities: z.array(z.string()).optional(),
    threats: z.array(z.string()).optional(),
  }).optional(),
  stakeholders: z.array(z.object({
    role: z.string().optional(),
    interest: z.string().optional(),
    influence: z.enum(["high", "medium", "low"]).optional(),
  })).optional(),
  invest_analysis: z.array(z.object({
    user_story_id: z.string().optional(),
    independent: z.boolean().optional(),
    negotiable: z.boolean().optional(),
    valuable: z.boolean().optional(),
    estimatable: z.boolean().optional(),
    small: z.boolean().optional(),
    testable: z.boolean().optional(),
    score: z.number().optional(),
    comments: z.string().optional(),
  })).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
});

// ============================================================================
// ARCHITECT ARTIFACT SCHEMA
// ============================================================================

const APISchema = z.object({
  path: z.string().regex(/^\/.*/, "API path must start with /"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  description: z.string().min(10, "API description must be at least 10 characters"),
  // endpoint removed as it is not in JSON schema
  request_schema: z.record(z.string(), z.any()).optional().describe("A map of field names to their types/descriptions"),
  response_schema: z.record(z.string(), z.any()).optional().describe("A map of field names to their types/descriptions"),
  auth_required: z.boolean().optional(),
  rate_limit: z.string().optional(),
});

const DecisionSchema = z.object({
  decision: z.string().min(5, "Decision must be at least 5 characters"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  tradeoffs: z.string().min(5, "Tradeoffs must be at least 5 characters"),
  alternatives: z.array(z.string()).optional(),
  status: z.string().optional(),
  rationale: z.string().optional(),
  consequences: z.string().optional(),
});

const NextTaskSchema = z.object({
  role: z.enum(["Engineer", "DevOps", "QA", "Designer", "Product Manager"]),
  task: z.string().min(10, "Task must be at least 10 characters"),
  title: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  description: z.string().optional(),
});

const TableColumnSchema = z.object({
  name: z.string().regex(/^[a-z_][a-z0-9_]*$/, "Column name must be snake_case"),
  type: z.string().min(1, "Column type is required"),
  constraints: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const TableIndexSchema = z.object({
  columns: z.array(z.string()).min(1, "At least one column is required"),
  type: z.enum(["btree", "hash", "gin", "gist"]).optional(),
  reason: z.string().optional(),
});

const TableRelationshipSchema = z.object({
  type: z.enum(["one-to-one", "one-to-many", "many-to-one", "many-to-many"]),
  from: z.string().min(1, "From column is required"),
  to: z.string().min(1, "To reference is required"),
  through: z.string().optional(),
  description: z.string().optional(),
});

const TableSchema = z.object({
  name: z.string().regex(/^[a-z_][a-z0-9_]*$/, "Table name must be snake_case"),
  description: z.string().optional(),
  columns: z.array(TableColumnSchema).min(1, "At least one column is required"),
  indexes: z.array(TableIndexSchema).optional(),
  relationships: z.array(TableRelationshipSchema).optional(),
});

const DatabaseSchemaSchema = z.object({
  tables: z.array(TableSchema).optional(),
  migrations_strategy: z.string().optional(),
});

const TechnologyStackSchema = z.object({
  frontend: z.array(z.string()).optional(),
  backend: z.array(z.string()).optional(),
  database: z.array(z.string()).optional(),
  authentication: z.array(z.string()).optional(),
  hosting: z.array(z.string()).optional(),
  other: z.array(z.string()).optional(),
});

const IntegrationPointSchema = z.object({
  service: z.string().min(1, "Service name is required"),
  name: z.string().optional(),
  system: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  api_docs: z.string().url("API docs must be a valid URL").optional(),
});

const ScalabilityApproachSchema = z.object({
  horizontal_scaling: z.string().optional(),
  database_scaling: z.string().optional(),
  caching_strategy: z.string().optional(),
  performance_targets: z.string().optional(),
});

export const ArchitectArtifactSchema = z.object({
  design_doc: z.string().min(100, "Design document must be at least 100 characters"),
  apis: z.array(APISchema).min(1, "At least one API is required"),
  decisions: z.array(DecisionSchema).min(1, "At least one decision is required"),
  next_tasks: z.array(NextTaskSchema).min(1, "At least one next task is required"),
  database_schema: DatabaseSchemaSchema.optional(),
  technology_stack: TechnologyStackSchema.optional(),
  integration_points: z.array(IntegrationPointSchema).optional(),
  security_considerations: z.array(z.string().min(10, "Security consideration must be at least 10 characters")).optional(),
  scalability_approach: ScalabilityApproachSchema.optional(),
});

// ============================================================================
// ENGINEER ARTIFACT SCHEMA
// ============================================================================

const FileNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    name: z.string().min(1, "File/folder name is required"),
    path: z.string().optional(),
    file: z.string().optional(),
    type: z.enum(["file", "folder", "directory"]).optional(),
    description: z.string().min(5, "Description must be at least 5 characters").optional(),
    children: z.array(FileNodeSchema).optional(),
  })
);

const RunResultsSchema = z.object({
  setup_commands: z.array(z.string()).optional(),
  test_commands: z.array(z.string()).optional(),
  dev_commands: z.array(z.string()).optional(),
});

const TechnicalDecisionSchema = z.object({
  decision: z.string().min(1, "Decision is required"),
  rationale: z.string().min(1, "Rationale is required"),
  alternatives: z.string().optional(),
});

const EnvironmentVariableSchema = z.object({
  name: z.string().min(1, "Environment variable name is required"),
  description: z.string().min(1, "Description is required"),
  example: z.string().optional(),
});

export const EngineerArtifactSchema = z.object({
  artifact_path: z.string().min(1, "Artifact path is required"),
  tests_added: z.boolean().optional(),
  run_results: RunResultsSchema,
  files: z.array(FileNodeSchema).optional(),
  file_changes: z.array(FileNodeSchema).optional(),
  components: z.array(FileNodeSchema).optional(),
  file_structure: FileNodeSchema.optional(),
  implementation_plan: z.string().min(50, "Implementation plan must be at least 50 characters").optional(),
  plan: z.string().min(50, "Plan must be at least 50 characters").optional(),
  dependencies: z.array(z.string().min(1, "Dependency must not be empty")),
  technical_decisions: z.array(TechnicalDecisionSchema).optional(),
  environment_variables: z.array(EnvironmentVariableSchema).optional(),
}).refine(data => data.implementation_plan || data.plan || data.file_structure, {
  message: "Either implementation_plan, plan, or file_structure must be present",
  path: ["implementation_plan"]
});

// ============================================================================
// QA ARTIFACT SCHEMA
// ============================================================================

const CoverageSchema = z
  .object({
    percentage: z.number().min(0).max(100).optional(),
    lines: z.number().min(0).max(100).optional(),
    statements: z.number().min(0).max(100).optional(),
    functions: z.number().min(0).max(100).optional(),
    branches: z.number().min(0).max(100).optional(),
  })
  .nullable()
  .optional();

const CoverageDeltaSchema = z
  .object({
    lines: z.string().regex(/^[+-]?[0-9]+\.?[0-9]*%$/, "Coverage delta must match pattern +/-number%").optional(),
    statements: z.string().regex(/^[+-]?[0-9]+\.?[0-9]*%$/, "Coverage delta must match pattern +/-number%").optional(),
    functions: z.string().regex(/^[+-]?[0-9]+\.?[0-9]*%$/, "Coverage delta must match pattern +/-number%").optional(),
    branches: z.string().regex(/^[+-]?[0-9]+\.?[0-9]*%$/, "Coverage delta must match pattern +/-number%").optional(),
  })
  .nullable()
  .optional();

const SecurityFindingSchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  vulnerability: z.string().min(1, "Vulnerability name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  affected_endpoints: z.array(z.string()).optional(),
  remediation: z.string().optional(),
  cve: z.string().regex(/^CVE-[0-9]{4}-[0-9]{4,}$/, "CVE must match pattern CVE-YYYY-NNNN+").optional(),
});

const PerformanceMetricsSchema = z.object({
  api_response_time_p95: z.string().optional(),
  page_load_time: z.string().optional(),
  database_query_time: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
  first_contentful_paint: z.string().optional(),
  time_to_interactive: z.string().optional(),
  largest_contentful_paint: z.string().optional(),
});

const ReportSchema = z.array(
  z.object({
    category: z.enum(["authentication", "api", "ui", "security", "performance", "database", "integration"]).optional(),
    title: z.string().optional(),
    status: z.enum(["pass", "fail", "warning"]).optional(),
    details: z.string().optional(),
    recommendations: z.array(z.string()).optional(),
  })
);

export const QAArtifactSchema = z.object({
  ok: z.boolean(),
  test_strategy: z.object({
    unit: z.string().min(10, "Unit test strategy must be descriptive"),
    integration: z.string().min(10, "Integration test strategy must be descriptive"),
    e2e: z.string().min(10, "E2E test strategy must be descriptive"),
  }),
  test_cases: z.array(
    z.object({
      name: z.string().min(5, "Test case name must be at least 5 characters"),
      description: z.string().optional(),
      priority: z.enum(["critical", "high", "medium", "low"]),
      type: z.enum(["unit", "integration", "e2e", "performance", "security"]),
      gherkin: z.string().optional(),
      expected_result: z.string().optional(),
    })
  ).min(1, "At least one test case is required"),
  security_plan: z
    .object({
      auth_verification_steps: z.array(z.string()).optional(),
      vulnerability_scan_strategy: z.string().optional(),
    })
    .optional(),
  manual_verification_steps: z.array(z.string()).optional(),
  risk_analysis: z
    .array(
      z.object({
        risk: z.string().optional(),
        impact: z.enum(["high", "medium", "low"]).optional(),
        mitigation: z.string().optional(),
      })
    )
    .optional(),
  summary: z.string().optional(),
  report: ReportSchema.optional(),
  coverage: CoverageSchema.optional(),
  coverage_delta: CoverageDeltaSchema.optional(),
  security_findings: z.array(SecurityFindingSchema).optional(),
  performance_metrics: PerformanceMetricsSchema.optional(),
  description: z.string().optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateProductManagerArtifact(data: unknown) {
  return ProductManagerArtifactSchema.parse(data);
}

export function validateArchitectArtifact(data: unknown) {
  return ArchitectArtifactSchema.parse(data);
}

export function validateEngineerArtifact(data: unknown) {
  return EngineerArtifactSchema.parse(data);
}

export function validateQAArtifact(data: unknown) {
  return QAArtifactSchema.parse(data);
}

// Safe validation (returns result instead of throwing)
export function safeValidateProductManagerArtifact(data: unknown) {
  return ProductManagerArtifactSchema.safeParse(data);
}

export function safeValidateArchitectArtifact(data: unknown) {
  return ArchitectArtifactSchema.safeParse(data);
}

export function safeValidateEngineerArtifact(data: unknown) {
  return EngineerArtifactSchema.safeParse(data);
}

export function safeValidateQAArtifact(data: unknown) {
  return QAArtifactSchema.safeParse(data);
}

// ============================================================================
// DEVOPS ARTIFACT SCHEMA
// ============================================================================

const InfrastructureServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  type: z.enum(["compute", "database", "storage", "networking", "monitoring", "security", "cdn", "load-balancer"]),
  configuration: z.record(z.string(), z.any()).optional(),
  description: z.string().optional(),
});

const InfrastructureSchema = z.object({
  cloud_provider: z.enum(["AWS", "GCP", "Azure", "self-hosted", "hybrid"]),
  services: z.array(InfrastructureServiceSchema).min(1, "At least one service is required"),
  regions: z.array(z.string()).optional(),
});

const CICDTriggerSchema = z.object({
  type: z.enum(["push", "pull_request", "schedule", "manual"]),
  branch: z.string().optional(),
  description: z.string().optional(),
});

const CICDPipelineStageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  steps: z.array(z.string()).min(1, "At least one step is required"),
  description: z.string().optional(),
});

const CICDSchema = z.object({
  pipeline_stages: z.array(CICDPipelineStageSchema).min(1, "At least one pipeline stage is required"),
  tools: z.array(z.string()).min(1, "At least one CI/CD tool is required"),
  triggers: z.array(CICDTriggerSchema).optional(),
});

const KubernetesDeploymentSchema = z.object({
  name: z.string().min(1, "Deployment name is required"),
  replicas: z.number().int().min(1).optional(),
  resources: z
    .object({
      cpu: z.string().optional(),
      memory: z.string().optional(),
    })
    .optional(),
});

const KubernetesServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  type: z.enum(["ClusterIP", "NodePort", "LoadBalancer"]).optional(),
  ports: z
    .array(
      z.object({
        port: z.number().int().min(1),
        targetPort: z.number().int().min(1),
      })
    )
    .optional(),
});

const KubernetesSchema = z.object({
  namespace: z.string().optional(),
  deployments: z.array(KubernetesDeploymentSchema).optional(),
  services: z.array(KubernetesServiceSchema).optional(),
});

const ContainerizationSchema = z.object({
  dockerfile: z.string().optional(),
  docker_compose: z.string().optional(),
  kubernetes: KubernetesSchema.optional(),
});

const DeploymentEnvironmentSchema = z.object({
  name: z.string().min(1, "Environment name is required"),
  configuration: z.record(z.string(), z.any()),
  description: z.string().optional(),
});

const DeploymentSchema = z.object({
  strategy: z.enum(["blue-green", "canary", "rolling", "recreate", "none"]),
  environments: z.array(DeploymentEnvironmentSchema).min(1, "At least one environment is required"),
  rollback_strategy: z.string().optional(),
});

const MonitoringAlertSchema = z.object({
  name: z.string().min(1, "Alert name is required"),
  condition: z.string().min(1, "Alert condition is required"),
  severity: z.enum(["critical", "warning", "info"]).optional(),
});

const MonitoringLoggingSchema = z.object({
  tools: z.array(z.string()).optional(),
  retention: z.string().optional(),
});

const MonitoringSchema = z.object({
  tools: z.array(z.string()).min(1, "At least one monitoring tool is required"),
  metrics: z.array(z.string()).min(1, "At least one metric is required"),
  alerts: z.array(MonitoringAlertSchema).optional(),
  logging: MonitoringLoggingSchema.optional(),
});

const AutoScalingSchema = z.object({
  enabled: z.boolean(),
  min_replicas: z.number().int().min(1).optional(),
  max_replicas: z.number().int().min(1).optional(),
  target_cpu: z.number().min(0).max(100).optional(),
  target_memory: z.number().min(0).max(100).optional(),
});

const ManualScalingSchema = z.object({
  replicas: z.number().int().min(1),
});

const ScalingSchema = z.object({
  auto_scaling: AutoScalingSchema.optional(),
  manual_scaling: ManualScalingSchema.optional(),
});

export const DevOpsArtifactSchema = z.object({
  infrastructure: InfrastructureSchema,
  cicd: CICDSchema,
  containerization: ContainerizationSchema.optional(),
  deployment: DeploymentSchema,
  monitoring: MonitoringSchema,
  scaling: ScalingSchema.optional(),
  disaster_recovery: z.object({
    rpo: z.string(),
    rto: z.string(),
    backup_strategy: z.string(),
    failover_plan: z.string().optional(),
  }),
  summary: z.string(),
  description: z.string(),
  cloud_provider: z.string().optional(),
  infra_components: z.number().optional(),
});

export function validateDevOpsArtifact(data: unknown) {
  return DevOpsArtifactSchema.parse(data);
}

export function safeValidateDevOpsArtifact(data: unknown) {
  return DevOpsArtifactSchema.safeParse(data);
}

// ============================================================================
// SECURITY ARTIFACT SCHEMA
// ============================================================================

const AuthenticationSchema = z.object({
  method: z.enum(["OAuth2", "JWT", "SAML", "OpenID Connect", "custom", "session-based"]),
  providers: z.array(z.string()).optional(),
  token_expiry: z.string().optional(),
  refresh_tokens: z.boolean().optional(),
  multi_factor_auth: z.boolean().optional(),
  description: z.string().optional(),
  mfa_enabled: z.boolean().optional(),
});

const AuthorizationPolicySchema = z.object({
  resource: z.string().min(1, "Resource name is required"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
  roles: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const AuthorizationSchema = z.object({
  model: z.enum(["RBAC", "ABAC", "PBAC", "ACL", "none"]),
  policies: z.array(AuthorizationPolicySchema).optional(),
  description: z.string().optional(),
});

const SessionManagementSchema = z.object({
  strategy: z.enum(["stateless", "stateful", "hybrid"]),
  session_timeout: z.string().optional(),
  secure_cookies: z.boolean().optional(),
  http_only_cookies: z.boolean().optional(),
  same_site_policy: z.enum(["strict", "lax", "none"]).optional(),
});

const SecurityArchitectureSchema = z.object({
  authentication: AuthenticationSchema,
  authorization: AuthorizationSchema,
  session_management: SessionManagementSchema.optional(),
});

const ThreatModelSchema = z.object({
  threat: z.string().min(10, "Threat description must be at least 10 characters"),
  severity: z.enum(["critical", "high", "medium", "low"]),
  likelihood: z.enum(["high", "medium", "low"]).optional(),
  impact: z.string().optional(),
  mitigation: z.string().min(10, "Mitigation must be at least 10 characters"),
  affected_components: z.array(z.string()).optional(),
});

const DataAtRestEncryptionSchema = z.object({
  method: z.string().min(1, "Encryption method is required"),
  key_management: z.string().min(1, "Key management solution is required"),
  description: z.string().optional(),
});

const DataInTransitEncryptionSchema = z.object({
  method: z.string().min(1, "Encryption method is required"),
  certificate_management: z.string().optional(),
  description: z.string().optional(),
});

const KeyManagementSchema = z.object({
  strategy: z.string().min(1, "Key management strategy is required"),
  rotation_policy: z.string().optional(),
  description: z.string().optional(),
});

const EncryptionSchema = z.object({
  data_at_rest: DataAtRestEncryptionSchema,
  data_in_transit: DataInTransitEncryptionSchema,
  key_management: KeyManagementSchema,
  envelope_encryption: z.boolean().optional(),
  secrets_management: z.string().optional(),
});

const ComplianceSchema = z.object({
  standard: z.enum(["GDPR", "HIPAA", "SOC2", "PCI-DSS", "ISO27001", "CCPA", "other"]),
  requirements: z.array(z.string()).min(1, "At least one requirement is required"),
  implementation_status: z.enum(["planned", "in-progress", "compliant"]).optional(),
  description: z.string().optional(),
});

const SecurityControlSchema = z.object({
  control: z.string().min(10, "Control name must be at least 10 characters"),
  category: z.enum(["preventive", "detective", "corrective", "compensating"]).optional(),
  implementation: z.string().min(10, "Implementation must be at least 10 characters"),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
});

const VulnerabilityManagementSchema = z.object({
  scanning_frequency: z.string().optional(),
  tools: z.array(z.string()).optional(),
  patch_management: z.string().optional(),
});

const SecurityMonitoringSchema = z.object({
  tools: z.array(z.string()).optional(),
  log_retention: z.string().optional(),
  incident_response_plan: z.string().optional(),
});

export const SecurityArtifactSchema = z.object({
  security_architecture: SecurityArchitectureSchema,
  threat_model: z.array(ThreatModelSchema).min(2, "At least 2 threats are required"),
  encryption: EncryptionSchema,
  compliance: z.array(ComplianceSchema).optional(),
  security_controls: z.array(SecurityControlSchema).min(3, "At least 3 security controls are required"),
  vulnerability_management: VulnerabilityManagementSchema.optional(),
  security_monitoring: SecurityMonitoringSchema.optional(),
});

export function validateSecurityArtifact(data: unknown) {
  return SecurityArtifactSchema.parse(data);
}

export function safeValidateSecurityArtifact(data: unknown) {
  return SecurityArtifactSchema.safeParse(data);
}

// ============================================================================
// UI DESIGNER ARTIFACT SCHEMA
// ============================================================================

const A2UINodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(["View", "Container", "ScrollView", "Stack", "Grid", "Card", "Button", "TextInput", "Text", "Image", "Icon", "Divider", "List"]),
    props: z.record(z.string(), z.any()).optional(),
    children: z.array(z.lazy(() => A2UINodeSchema)).optional(),
  })
);

const WebsiteLayoutSchema = z.object({
  pages: z.array(z.object({
    name: z.string(),
    route: z.string(),
    sections: z.array(z.string()).optional(),
  })).min(1, "At least one page is required"),
});

const ComponentHierarchySchema = z.object({
  root: z.string(),
  children: z.array(z.object({
    name: z.string(),
    props: z.array(z.string()).optional(),
    children: z.array(z.any()).optional(),
    description: z.string().optional(),
  })),
});

const DesignTokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string().optional(),
    text: z.string().optional(),
    accent: z.string().optional(),
    error: z.string().optional(),
    success: z.string().optional(),
    warning: z.string().optional(),
  }),
  spacing: z.record(z.string(), z.string()),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.record(z.string(), z.string()).optional(),
    fontWeight: z.record(z.string(), z.string()).optional(),
    lineHeight: z.record(z.string(), z.string()).optional(),
  }),
  borderRadius: z.record(z.string(), z.string()).optional(),
  shadows: z.record(z.string(), z.string()).optional(),
});

const ComponentSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().optional(),
    description: z.string().optional(),
    default: z.string().optional(),
  })).optional().or(z.record(z.any()).transform(obj => {
    // If we get an object instead of array, convert it
    return Object.entries(obj).map(([name, type]) => ({ name, type: String(type) }));
  })),
  variants: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
});

export const UIDesignerArtifactSchema = z.object({
  schema_version: z.string().optional(),
  a2ui_manifest: z.object({
    root: A2UINodeSchema,
  }).optional(),
  component_hierarchy: ComponentHierarchySchema,
  design_tokens: DesignTokensSchema,
  ui_patterns: z.array(z.string()).optional(),
  component_specs: z.array(ComponentSpecSchema).optional(),
  layout_breakpoints: z.record(z.string(), z.string()).optional(),
  atomic_structure: z.object({
    atoms: z.array(z.string()),
    molecules: z.array(z.string()),
    organisms: z.array(z.string()),
  }).optional(),
  accessibility: z.object({
    aria_labels: z.boolean().optional(),
    keyboard_navigation: z.boolean().optional(),
    screen_reader_support: z.boolean().optional(),
    color_contrast: z.string().optional(),
    focus_indicators: z.boolean().optional(),
    wcag_level: z.enum(["A", "AA", "AAA"]).optional(),
  }).optional(),
  website_layout: WebsiteLayoutSchema.optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
});

export function validateUIDesignerArtifact(data: unknown) {
  return UIDesignerArtifactSchema.parse(data);
}

export function safeValidateUIDesignerArtifact(data: unknown) {
  return UIDesignerArtifactSchema.safeParse(data);
}

