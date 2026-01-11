/**
 * MetaSOP Orchestration Pipeline Diagram
 * EXACT MERMAID FLOWCHART IMPLEMENTATION
 * This file represents the "Static Example" which MUST match the exact schema produced by the Agents.
 */

import type { DiagramNode, DiagramEdge } from "@/types/diagram"

export const exampleDiagram: {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  title: string
  description: string
} = {
  title: "MetaSOP Complete Artifact Flow",
  description: "End-to-end artifact lineage and dependency graph",
  nodes: [
    // ============================================================
    // Requirements (Column 1: x=0)
    // ============================================================
    {
      id: "US", type: "component", label: "User Stories", position: { x: 0, y: 0 },
      data: {
        label: "user_stories", nodeCategory: "artifact", artifactType: "user_stories", items: [
          { id: "US-1", title: "User Authentication", priority: "High" },
          { id: "US-2", title: "Task Management CRUD", priority: "Critical" },
          { id: "US-3", title: "UserProfile Settings", priority: "Medium" }
        ]
      }
    },
    {
      id: "AC", type: "component", label: "Acceptance Criteria", position: { x: 0, y: 150 },
      data: { label: "acceptance_criteria", nodeCategory: "artifact", items: ["Secure Login", "Responsive UI", "99% Uptime"] }
    },
    {
      id: "AS", type: "component", label: "Assumptions", position: { x: 0, y: 300 },
      data: { label: "assumptions", nodeCategory: "artifact", items: ["Modern Browser Support", "Stable Internet Connection"] }
    },
    {
      id: "OOS", type: "component", label: "Out of Scope", position: { x: 0, y: 450 },
      data: { label: "out_of_scope", nodeCategory: "artifact", items: ["Native Mobile App", "Offline Mode"] }
    },

    // ============================================================
    // Design (Column 2: x=400)
    // ============================================================
    {
      id: "DD", type: "component", label: "Design Doc", position: { x: 400, y: 150 },
      data: { label: "design_doc", nodeCategory: "artifact", description: "Architecture Overview & Patterns" }
    },
    {
      id: "DEC", type: "component", label: "Decisions", position: { x: 400, y: 300 },
      data: { label: "decisions", nodeCategory: "artifact", items: ["PostgreSQL for Relational Data", "JWT for Stateless Auth"] }
    },
    {
      id: "TS", type: "component", label: "Tech Stack", position: { x: 400, y: 450 },
      data: { label: "technology_stack", nodeCategory: "artifact", items: ["Next.js", "React", "Prisma", "Tailwind"] }
    },
    {
      id: "DBS", type: "component", label: "DB Schema", position: { x: 400, y: 600 },
      data: {
        label: "database_schema", nodeCategory: "artifact", artifactType: "database_schema",
        // Compliant with Architect Schema (tables array with columns objects)
        tables: [
          {
            name: "users",
            columns: [
              { name: "id", type: "UUID" },
              { name: "email", type: "VARCHAR" },
              { name: "password_hash", type: "VARCHAR" }
            ]
          },
          {
            name: "todos",
            columns: [
              { name: "id", type: "UUID" },
              { name: "title", type: "VARCHAR" },
              { name: "completed", type: "BOOLEAN" },
              { name: "user_id", type: "UUID" }
            ]
          }
        ]
      }
    },

    // ============================================================
    // Security (Column 2-B: x=400, y=below design)
    // ============================================================
    {
      id: "SA", type: "component", label: "Security Arch", position: { x: 400, y: 1100 },
      data: { label: "security_architecture", nodeCategory: "artifact", items: ["OAuth2 Flow", "RBAC Model"] }
    },
    {
      id: "TM", type: "component", label: "Threat Model", position: { x: 600, y: 1100 },
      data: {
        label: "threat_model", nodeCategory: "artifact", artifactType: "threat_model", items: [
          { threat: "SQL Injection", severity: "Critical", mitigation: "Use Prisma ORM (Prepared Statements)" },
          { threat: "XSS Attacks", severity: "High", mitigation: "React Auto-Escaping + CSP" }
        ]
      }
    },
    {
      id: "ENC", type: "component", label: "Encryption", position: { x: 600, y: 1200 },
      data: { label: "encryption", nodeCategory: "artifact", items: ["AES-256 (At Rest)", "TLS 1.3 (In Transit)"] }
    },
    {
      id: "SC", type: "component", label: "Security Controls", position: { x: 600, y: 1300 },
      data: { label: "security_controls", nodeCategory: "artifact", items: ["WAF Enabled", "Rate Limiting"] }
    },
    {
      id: "COMP", type: "component", label: "Compliance", position: { x: 600, y: 1400 },
      data: { label: "compliance", nodeCategory: "artifact", items: ["GDPR Ready", "SOC2 Controls"] }
    },

    // ============================================================
    // API (Column 3: x=800)
    // ============================================================
    {
      id: "API1", type: "component", label: "APIs", position: { x: 800, y: 450 },
      data: {
        label: "apis", nodeCategory: "artifact", artifactType: "apis", items: [
          { method: "POST", path: "/auth/login", description: "User Login" },
          { method: "GET", path: "/todos", description: "List todos" }
        ]
      }
    },
    {
      id: "ITS", type: "component", label: "Integration Specs", position: { x: 800, y: 600 },
      data: { label: "integration_test_spec", nodeCategory: "artifact", items: ["Auth Flow Spec", "Data Sync Spec"] }
    },

    // ============================================================
    // Implementation (Column 4: x=1200)
    // ============================================================
    {
      id: "IP", type: "component", label: "Impl Plan", position: { x: 1200, y: 150 },
      data: { label: "implementation_plan", nodeCategory: "artifact", items: ["Phase 1: Setup", "Phase 2: Core"] }
    },
    {
      id: "AP", type: "component", label: "Artifact Path", position: { x: 1400, y: 150 },
      data: { label: "artifact_path", nodeCategory: "artifact", description: "/src/app" }
    },
    {
      id: "FS", type: "component", label: "File Structure", position: { x: 1600, y: 150 },
      data: {
        label: "file_structure",
        nodeCategory: "artifact",
        artifactType: "file_structure",
        // Compliant with Engineer Schema (Recursive Object)
        file_structure: {
          name: "project-root",
          type: "directory",
          children: [
            {
              name: "app", type: "directory", children: [
                { name: "page.tsx", type: "file" },
                { name: "layout.tsx", type: "file" }
              ]
            },
            {
              name: "components", type: "directory", children: [
                { name: "ui", type: "directory" },
                { name: "features", type: "directory" }
              ]
            },
            {
              name: "lib", type: "directory", children: [
                { name: "utils.ts", type: "file" },
                { name: "db.ts", type: "file" }
              ]
            }
          ]
        }
      }
    },
    {
      id: "DEP", type: "component", label: "Dependencies", position: { x: 1400, y: 250 },
      data: { label: "dependencies", nodeCategory: "artifact", items: ["next @latest", "prisma @5.x"] }
    },
    {
      id: "TD", type: "component", label: "Tech Decisions", position: { x: 1400, y: 350 },
      data: { label: "technical_decisions", nodeCategory: "artifact", items: ["Server Actions", "RSC"] }
    },
    {
      id: "ENV", type: "component", label: "Env Vars", position: { x: 1400, y: 450 },
      data: { label: "environment_variables", nodeCategory: "artifact", items: ["DATABASE_URL", "JWT_SECRET"] }
    },

    // ============================================================
    // UI (Column 4-B: x=1200, y=below impl)
    // ============================================================
    {
      id: "CS", type: "component", label: "Component Specs", position: { x: 1600, y: 600 },
      data: { label: "component_specs", nodeCategory: "artifact", items: ["Button Props", "Card Slots"] }
    },
    {
      id: "DT", type: "component", label: "Design Tokens", position: { x: 1400, y: 750 },
      data: {
        label: "design_system",
        nodeCategory: "artifact",
        artifactType: "design_system",
        items: [
          { name: "Primary: Blue-500 (#3b82f6)" },
          { name: "Surface: Slate-50" },
          { name: "Spacing: 4px base" }
        ]
      }
    },
    {
      id: "UP", type: "component", label: "UI Patterns", position: { x: 1400, y: 850 },
      data: { label: "ui_patterns", nodeCategory: "artifact", items: ["Card Layout", "Modal Form"] }
    },
    {
      id: "LB", type: "component", label: "Layout Breakpoints", position: { x: 1400, y: 950 },
      data: { label: "layout_breakpoints", nodeCategory: "artifact", items: ["sm: 640px", "lg: 1024px"] }
    },
    {
      id: "AX", type: "component", label: "Accessibility", position: { x: 1400, y: 1050 },
      data: { label: "accessibility", nodeCategory: "artifact", items: ["WCAG AA Compliant", "ARIA Labels"] }
    },

    // ============================================================
    // Infrastructure (Column 4-C: x=1200, parallel)
    // ============================================================
    {
      id: "INFR", type: "component", label: "Infrastructure", position: { x: 1200, y: 1200 },
      data: { label: "infrastructure", nodeCategory: "artifact", artifactType: "infrastructure", items: [{ name: "AWS ECS Cluster" }, { name: "RDS Postgres" }] }
    },
    {
      id: "CI", type: "component", label: "CI/CD", position: { x: 1400, y: 1200 },
      data: { label: "cicd", nodeCategory: "artifact", items: ["GitHub Actions", "Docker Build"] }
    },
    {
      id: "CONT", type: "component", label: "Containerization", position: { x: 1400, y: 1300 },
      data: { label: "containerization", nodeCategory: "artifact", items: ["Dockerfile", "docker-compose"] }
    },
    {
      id: "DEPLOY", type: "component", label: "Deployment", position: { x: 1600, y: 1300 },
      data: { label: "deployment", nodeCategory: "artifact", items: ["Blue/Green", "Rolling Update"] }
    },
    {
      id: "MON", type: "component", label: "Monitoring", position: { x: 1800, y: 1250 },
      data: { label: "monitoring", nodeCategory: "artifact", items: ["Prometheus", "Grafana"] }
    },
    {
      id: "SCALE", type: "component", label: "Scaling", position: { x: 1800, y: 1350 },
      data: { label: "scaling", nodeCategory: "artifact", items: ["Auto-scaling Group", "Load Balancer"] }
    },

    // ============================================================
    // Testing (Column 5: x=1600)
    // ============================================================
    {
      id: "RR", type: "component", label: "Run Results", position: { x: 1600, y: 1600 },
      data: { label: "run_results", nodeCategory: "artifact", items: ["Build: SUCCESS", "Lint: PASS"] }
    },
    {
      id: "TESTS", type: "component", label: "Tests", position: { x: 1800, y: 1600 },
      data: { label: "tests", nodeCategory: "artifact", items: ["Unit Tests", "Integration Tests"] }
    },
    {
      id: "TR", type: "component", label: "Test Results", position: { x: 2000, y: 1600 },
      data: {
        label: "test_results", nodeCategory: "artifact", artifactType: "test_results", items: [
          { name: "Authentication Tests", status: "passed" }, { name: "API Integration", status: "passed" }
        ]
      }
    },
    {
      id: "VAC", type: "component", label: "Validated AC", position: { x: 2200, y: 1500 },
      data: { label: "validated_ac", nodeCategory: "artifact", items: ["Login Verified", "UI Verified"] }
    },
    {
      id: "PERF", type: "component", label: "Performance", position: { x: 2200, y: 1600 },
      data: { label: "performance_requirements", nodeCategory: "artifact", items: ["Latency < 200ms", "TTFB < 50ms"] }
    },
    {
      id: "SF", type: "component", label: "Security Findings", position: { x: 2200, y: 1700 },
      data: { label: "security_findings", nodeCategory: "artifact", items: ["No Critical Issues", "Deps Updated"] }
    },
    {
      id: "OK", type: "gateway", label: "OK", position: { x: 2400, y: 1600 },
      data: { label: "ok", nodeCategory: "decision", description: "Ready for Release" }
    },
  ],
  edges: [
    // Requirements -> Design
    { id: "US-DD", from: "US", to: "DD" },
    { id: "AC-DD", from: "AC", to: "DD" },
    { id: "AS-DD", from: "AS", to: "DD" },
    { id: "OOS-DD", from: "OOS", to: "DD" },

    // Design Internal
    { id: "DD-DEC", from: "DD", to: "DEC" },
    { id: "DD-TS", from: "DD", to: "TS" },
    { id: "DD-DBS", from: "DD", to: "DBS" },

    // Design -> API
    { id: "TS-API1", from: "TS", to: "API1" },
    { id: "DBS-API1", from: "DBS", to: "API1" },
    { id: "API1-ITS", from: "API1", to: "ITS" },

    // Design -> Implementation
    { id: "DD-IP", from: "DD", to: "IP" },
    { id: "IP-AP", from: "IP", to: "AP" },
    { id: "AP-FS", from: "AP", to: "FS" },
    { id: "IP-DEP", from: "IP", to: "DEP" },
    { id: "IP-TD", from: "IP", to: "TD" },
    { id: "IP-ENV", from: "IP", to: "ENV" },

    // API -> UI
    { id: "API1-CS", from: "API1", to: "CS" },
    { id: "DT-CS", from: "DT", to: "CS" },
    { id: "UP-CS", from: "UP", to: "CS" },
    { id: "LB-CS", from: "LB", to: "CS" },
    { id: "AX-CS", from: "AX", to: "CS" },

    // Design -> Security
    { id: "DD-SA", from: "DD", to: "SA" },
    { id: "SA-TM", from: "SA", to: "TM" },
    { id: "SA-ENC", from: "SA", to: "ENC" },
    { id: "SA-SC", from: "SA", to: "SC" },
    { id: "SA-COMP", from: "SA", to: "COMP" },

    // Design -> Infrastructure
    { id: "TS-INFR", from: "TS", to: "INFR" },
    { id: "INFR-CI", from: "INFR", to: "CI" },
    { id: "INFR-CONT", from: "INFR", to: "CONT" },
    { id: "CONT-DEPLOY", from: "CONT", to: "DEPLOY" },
    { id: "DEPLOY-MON", from: "DEPLOY", to: "MON" },
    { id: "DEPLOY-SCALE", from: "DEPLOY", to: "SCALE" },

    // Infrastructure -> Testing
    { id: "CI-RR", from: "CI", to: "RR" },
    { id: "RR-TESTS", from: "RR", to: "TESTS" },
    { id: "TESTS-TR", from: "TESTS", to: "TR" },
    { id: "TR-VAC", from: "TR", to: "VAC" },
    { id: "TR-PERF", from: "TR", to: "PERF" },
    { id: "TR-SF", from: "TR", to: "SF" },
    { id: "VAC-OK", from: "VAC", to: "OK" },
    { id: "PERF-OK", from: "PERF", to: "OK" },
    { id: "SF-OK", from: "SF", to: "OK" },
  ]
}
