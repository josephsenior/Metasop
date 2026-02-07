import type { Diagram } from "@/types/diagram"

export class OpenAPIGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate OpenAPI 3.0 specification
   */
  generateOpenAPISpec(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []

    const spec: any = {
      openapi: "3.0.0",
      info: {
        title: this.diagram.title,
        description: this.diagram.description,
        version: "1.0.0",
        contact: {
          name: "API Support",
        },
      },
      servers: [
        {
          url: "https://api.example.com/v1",
          description: "Production server",
        },
        {
          url: "https://staging-api.example.com/v1",
          description: "Staging server",
        },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    }

    // Generate paths from API endpoints
    apiArray.forEach((api: any) => {
      const method = (api.method || "GET").toLowerCase()
      const path = api.path || api.endpoint || "/api/endpoint"
      
      if (!spec.paths[path]) {
        spec.paths[path] = {}
      }

      const operation: any = {
        summary: api.description || `${method.toUpperCase()} ${path}`,
        operationId: `${method}_${path.replace(/\//g, "_").replace(/^_/, "")}`,
        tags: [api.tag || "default"],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
          },
          "401": {
            description: "Unauthorized",
          },
          "500": {
            description: "Internal server error",
          },
        },
      }

      if (api.auth_required) {
        operation.security = [{ bearerAuth: [] }]
      }

      if (method === "post" || method === "put" || method === "patch") {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {},
              },
            },
          },
        }
      }

      if (method === "get" && path.includes("{id}")) {
        operation.parameters = [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
            description: "Resource identifier",
          },
        ]
      }

      spec.paths[path][method] = operation
    })

    return JSON.stringify(spec, null, 2)
  }
}

