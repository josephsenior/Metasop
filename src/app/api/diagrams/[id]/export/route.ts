import { NextRequest, NextResponse } from "next/server"
import { createErrorResponse, addGuestCookie } from "@/lib/api/response"
import { handleGuestAuth } from "@/lib/middleware/guest-auth"
import { diagramDb } from "@/lib/diagrams/db"
import { DocumentationGenerator } from "@/lib/generators/documentation-generator"
import { PDFGenerator } from "@/lib/generators/pdf-generator"
import { CodeGenerator } from "@/lib/generators/code-generator"
import { OpenAPIGenerator } from "@/lib/generators/openapi-generator"
import { SQLGenerator } from "@/lib/generators/sql-generator"
import { EstimatesGenerator } from "@/lib/generators/estimates-generator"
import { DeploymentGenerator } from "@/lib/generators/deployment-generator"
import { IaCGenerator } from "@/lib/generators/iac-generator"
import { ADRGenerator } from "@/lib/generators/adr-generator"
import { ERDGenerator } from "@/lib/generators/erd-generator"
import { TechComparisonGenerator } from "@/lib/generators/tech-comparison-generator"
import { TestPlanGenerator } from "@/lib/generators/test-plan-generator"
import { SecurityAuditGenerator } from "@/lib/generators/security-audit-generator"
import { APIClientGenerator } from "@/lib/generators/api-client-generator"
import { MermaidGenerator } from "@/lib/generators/mermaid-generator"
import { PPTXGenerator } from "@/lib/generators/pptx-generator"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { canProceed, userId: authedUserId, reason, sessionId } = await handleGuestAuth(request);
    const cookieOpt = sessionId ? { guestSessionId: sessionId } : undefined;
    if (!canProceed || !authedUserId) {
      return createErrorResponse(reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = authedUserId;

    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "markdown"
    const artifact = searchParams.get("artifact") || "documentation"

    // Get diagram
    const diagram = await diagramDb.findById(resolvedParams.id, userId)
    if (!diagram) {
      return createErrorResponse("Diagram not found", 404, cookieOpt)
    }

    // Check if user has access (or if it's a guest diagram)
    if (diagram.userId !== userId && !diagram.id.startsWith("guest_")) {
      // Fallback: Check query param for guest session
      const paramSessionId = searchParams.get('guestSessionId');

      if (paramSessionId) {
        const paramUserId = paramSessionId.startsWith("guest_") ? paramSessionId : `guest_${paramSessionId}`;
        if (paramUserId !== diagram.userId) {
          return createErrorResponse("Unauthorized", 403, cookieOpt)
        }
      } else {
        return createErrorResponse("Unauthorized", 403, cookieOpt)
      }
    }

    let content: string | Blob | Buffer
    let contentType: string
    let filename: string

    switch (artifact) {
      case "documentation":
        if (format === "markdown") {
          const generator = new DocumentationGenerator(diagram)
          content = generator.generateMarkdown()
          contentType = "text/markdown"
          filename = `${diagram.title.replace(/\s+/g, "-")}-documentation.md`
        } else if (format === "pdf") {
          const pdfGen = new PDFGenerator(diagram)
          content = await pdfGen.generatePDF()
          contentType = "application/pdf"
          filename = `${diagram.title.replace(/\s+/g, "-")}-documentation.pdf`
        } else if (format === "html") {
          const generator = new DocumentationGenerator(diagram)
          const markdown = generator.generateMarkdown()
          // Simple markdown to HTML conversion
          content = markdownToHtml(markdown)
          contentType = "text/html"
          filename = `${diagram.title.replace(/\s+/g, "-")}-documentation.html`
        } else if (format === "pptx") {
          const pptxGen = new PPTXGenerator(diagram)
          const buffer = await pptxGen.generate()
          content = buffer
          contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          filename = `${diagram.title.replace(/\s+/g, "-")}-presentation.pptx`
        } else {
          return createErrorResponse("Unsupported format for documentation. Use 'markdown', 'pdf', 'html', or 'pptx'", 400, cookieOpt)
        }
        break

      case "openapi":
        const openApiGen = new OpenAPIGenerator(diagram)
        content = openApiGen.generateOpenAPISpec()
        contentType = "application/json"
        filename = `${diagram.title.replace(/\s+/g, "-")}-openapi.json`
        break

      case "sql":
        const sqlGen = new SQLGenerator(diagram)
        if (format === "migration") {
          content = sqlGen.generateMigration()
          contentType = "text/plain"
          filename = `${diagram.title.replace(/\s+/g, "-")}-migration.sql`
        } else if (format === "seed") {
          content = sqlGen.generateSeedData()
          contentType = "text/plain"
          filename = `${diagram.title.replace(/\s+/g, "-")}-seed.sql`
        } else {
          return createErrorResponse("Unsupported format for SQL. Use 'migration' or 'seed'", 400, cookieOpt)
        }
        break

      case "estimates":
        const estimatesGen = new EstimatesGenerator(diagram)
        const devEstimate = estimatesGen.calculateDevelopmentEstimate()
        const costEstimate = estimatesGen.calculateCostEstimate(devEstimate)
        const complexity = estimatesGen.calculateComplexity()

        content = JSON.stringify({
          development: devEstimate,
          cost: costEstimate,
          complexity,
        }, null, 2)
        contentType = "application/json"
        filename = `${diagram.title.replace(/\s+/g, "-")}-estimates.json`
        break

      case "deployment":
        const deploymentGen = new DeploymentGenerator(diagram)
        content = deploymentGen.generateDeploymentGuide()
        contentType = "text/markdown"
        filename = `${diagram.title.replace(/\s+/g, "-")}-deployment-guide.md`
        break

      case "adr":
        const adrGen = new ADRGenerator(diagram)
        content = adrGen.generateADRs()
        contentType = "text/markdown"
        filename = `${diagram.title.replace(/\s+/g, "-")}-adrs.md`
        break

      case "erd":
        const erdGen = new ERDGenerator(diagram)
        if (format === "mermaid") {
          content = erdGen.generateMermaidERD()
          contentType = "text/plain"
          filename = `${diagram.title.replace(/\s+/g, "-")}-erd.mmd`
        } else if (format === "plantuml") {
          content = erdGen.generatePlantUMLERD()
          contentType = "text/plain"
          filename = `${diagram.title.replace(/\s+/g, "-")}-erd.puml`
        } else if (format === "markdown") {
          content = erdGen.generateMarkdownERD()
          contentType = "text/markdown"
          filename = `${diagram.title.replace(/\s+/g, "-")}-erd.md`
        } else {
          return createErrorResponse("Unsupported format for ERD. Use 'mermaid', 'plantuml', or 'markdown'", 400, cookieOpt)
        }
        break

      case "tech-comparison":
        const techCompGen = new TechComparisonGenerator(diagram)
        content = techCompGen.generateMarkdownComparison()
        contentType = "text/markdown"
        filename = `${diagram.title.replace(/\s+/g, "-")}-tech-comparison.md`
        break

      case "test-plan":
        const testPlanGen = new TestPlanGenerator(diagram)
        content = testPlanGen.generateTestPlan()
        contentType = "text/markdown"
        filename = `${diagram.title.replace(/\s+/g, "-")}-test-plan.md`
        break

      case "security-audit":
        const securityAuditGen = new SecurityAuditGenerator(diagram)
        content = securityAuditGen.generateSecurityAudit()
        contentType = "text/markdown"
        filename = `${diagram.title.replace(/\s+/g, "-")}-security-audit.md`
        break

      case "mermaid":
        const mermaidGen = new MermaidGenerator(diagram)
        if (format === "flowchart") {
          content = mermaidGen.generateMermaidDiagram()
          contentType = "text/plain"
          filename = `${diagram.title.replace(/\s+/g, "-")}-diagram.mmd`
        } else if (format === "sequence") {
          content = mermaidGen.generateSequenceDiagram()
          contentType = "text/plain"
          filename = `${diagram.title.replace(/\s+/g, "-")}-sequence.mmd`
        } else {
          return createErrorResponse("Unsupported format for Mermaid. Use 'flowchart' or 'sequence'", 400, cookieOpt)
        }
        break

      default:
        return createErrorResponse(`Unknown artifact type: ${artifact}`, 400, cookieOpt)
    }

    // Return file
    const res = new NextResponse(content as any, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
    if (cookieOpt?.guestSessionId) addGuestCookie(res, cookieOpt.guestSessionId);
    return res;
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401)
    }
    console.error("Export error:", error)
    return createErrorResponse(error.message || "Failed to export artifact", 500)
  }
}

/**
 * POST /api/diagrams/[id]/export - Generate and download project scaffold
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { canProceed, userId: authedUserId, reason, sessionId } = await handleGuestAuth(request);
    const cookieOpt = sessionId ? { guestSessionId: sessionId } : undefined;
    if (!canProceed || !authedUserId) {
      return createErrorResponse(reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = authedUserId;

    const resolvedParams = await params
    const body = await request.json()
    const artifact = body.artifact || "scaffold"

    // Get diagram
    const diagram = await diagramDb.findById(resolvedParams.id, userId)
    if (!diagram) {
      return createErrorResponse("Diagram not found", 404, cookieOpt)
    }

    if (diagram.userId !== userId && !diagram.id.startsWith("guest_")) {
      // Fallback: Check query param for guest session (params are in url for POST too usually, or check body but URL is safer for consistency)
      const { searchParams } = new URL(request.url);
      const paramSessionId = searchParams.get('guestSessionId');

      if (paramSessionId) {
        const paramUserId = paramSessionId.startsWith("guest_") ? paramSessionId : `guest_${paramSessionId}`;
        if (paramUserId !== diagram.userId) {
          return createErrorResponse("Unauthorized", 403, cookieOpt)
        }
      } else {
        return createErrorResponse("Unauthorized", 403, cookieOpt)
      }
    }

    if (artifact === "scaffold") {
      const codeGen = new CodeGenerator(diagram)
      const zipBlob = await codeGen.generateProjectScaffold()

      const filename = `${diagram.title.replace(/\s+/g, "-")}-scaffold.zip`

      const res = new NextResponse(zipBlob, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
      if (cookieOpt?.guestSessionId) addGuestCookie(res, cookieOpt.guestSessionId);
      return res;
    }

    if (artifact === "api-client") {
      const apiClientGen = new APIClientGenerator(diagram)
      const format = body.format || "typescript"

      // Dynamically import JSZip to avoid SSR issues
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      if (format === "typescript" || format === "all") {
        const tsSdk = apiClientGen.generateTypeScriptSDK()
        zip.file("sdk/typescript/index.ts", tsSdk)
        zip.file("sdk/typescript/package.json", JSON.stringify({
          name: `${diagram.title.toLowerCase().replace(/\s+/g, "-")}-api-client`,
          version: "1.0.0",
          main: "index.ts",
          types: "index.ts",
        }, null, 2))
        zip.file("sdk/typescript/README.md", `# ${diagram.title} API Client (TypeScript)\n\nInstall: \`npm install\`\n\nUsage:\n\`\`\`typescript\nimport { createClient } from './index'\n\nconst client = createClient({\n  baseUrl: 'https://api.example.com',\n  token: 'your-token'\n})\n\nconst data = await client.getUsers()\n\`\`\`\n`)
      }

      if (format === "python" || format === "all") {
        const pySdk = apiClientGen.generatePythonSDK()
        zip.file("sdk/python/client.py", pySdk)
        zip.file("sdk/python/requirements.txt", "requests>=2.31.0\n")
        zip.file("sdk/python/README.md", `# ${diagram.title} API Client (Python)\n\nInstall: \`pip install -r requirements.txt\`\n\nUsage:\n\`\`\`python\nfrom client import create_client\n\nclient = create_client(\n    base_url='https://api.example.com',\n    token='your-token'\n)\n\ndata = client.get_users()\n\`\`\`\n`)
      }

      if (format === "curl" || format === "all") {
        const curlExamples = apiClientGen.generateCurlExamples()
        zip.file("sdk/curl/examples.md", curlExamples)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const filename = `${diagram.title.replace(/\s+/g, "-")}-api-client-sdk.zip`

      const resApi = new NextResponse(zipBlob, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
      if (cookieOpt?.guestSessionId) addGuestCookie(resApi, cookieOpt.guestSessionId);
      return resApi;
    }

    if (artifact === "iac") {
      const iacGen = new IaCGenerator(diagram)
      const format = body.format || "docker-compose"

      let content: string
      let filename: string
      let contentType = "text/plain"

      if (format === "docker-compose") {
        content = iacGen.generateDockerCompose()
        filename = "docker-compose.yml"
      } else if (format === "kubernetes") {
        const manifests = iacGen.generateKubernetesManifests()
        content = `# Kubernetes Manifests\n\n## Deployment\n\`\`\`yaml\n${manifests.deployment}\n\`\`\`\n\n## Service\n\`\`\`yaml\n${manifests.service}\n\`\`\`\n\n## Ingress\n\`\`\`yaml\n${manifests.ingress || ""}\n\`\`\`\n`
        filename = "kubernetes-manifests.md"
        contentType = "text/markdown"
      } else if (format === "terraform") {
        content = iacGen.generateTerraform()
        filename = "main.tf"
      } else {
        return createErrorResponse("Unsupported IaC format. Use 'docker-compose', 'kubernetes', or 'terraform'", 400, cookieOpt)
      }

      const resIac = new NextResponse(content, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
      if (cookieOpt?.guestSessionId) addGuestCookie(resIac, cookieOpt.guestSessionId);
      return resIac;
    }

    return createErrorResponse(`Unknown artifact type: ${artifact}`, 400, cookieOpt)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401)
    }
    console.error("Export error:", error)
    return createErrorResponse(error.message || "Failed to export artifact", 500)
  }
}

/**
 * Convert markdown to HTML
 */
function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML converter
  let html = markdown
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`(.*?)`/gim, "<code>$1</code>")
    .replace(/\n/gim, "<br>")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`
}

