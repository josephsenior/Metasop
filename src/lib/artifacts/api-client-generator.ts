import type { Diagram } from "@/types/diagram"

export class APIClientGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate TypeScript/JavaScript SDK
   */
  generateTypeScriptSDK(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []

    let sdk = `/**
 * ${this.diagram.title} API Client SDK
 * Generated: ${new Date().toLocaleString()}
 */

export interface ApiConfig {
  baseUrl: string
  apiKey?: string
  token?: string
  timeout?: number
}

export class ApiClient {
  private baseUrl: string
  private apiKey?: string
  private token?: string
  private timeout: number

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\\/$/, '')
    this.apiKey = config.apiKey
    this.token = config.token
    this.timeout = config.timeout || 30000
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.baseUrl}\${endpoint}\`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = \`Bearer \${this.token}\`
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(error.message || \`HTTP \${response.status}: \${response.statusText}\`)
      }

      return await response.json()
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

`

    // Generate methods for each API endpoint
    apiArray.forEach((api: any) => {
      const method = (api.method || "GET").toUpperCase()
      const path = api.path || api.endpoint || "/api/endpoint"
      const methodName = this.pathToMethodName(path, method)
      const needsAuth = api.auth_required

      if (method === "GET") {
        sdk += `  /**
   * ${api.description || `${method} ${path}`}
   ${needsAuth ? "   * @requires Authentication" : ""}
   */
  async ${methodName}(params?: Record<string, any>): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<any>(\`${path}\${queryString}\`, {
      method: '${method}',
    })
  }

`
      } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        sdk += `  /**
   * ${api.description || `${method} ${path}`}
   ${needsAuth ? "   * @requires Authentication" : ""}
   */
  async ${methodName}(data: any): Promise<any> {
    return this.request<any>('${path}', {
      method: '${method}',
      body: JSON.stringify(data),
    })
  }

`
      } else if (method === "DELETE") {
        sdk += `  /**
   * ${api.description || `${method} ${path}`}
   ${needsAuth ? "   * @requires Authentication" : ""}
   */
  async ${methodName}(id: string): Promise<any> {
    return this.request<any>(\`\${${JSON.stringify(path)}.replace('{id}', id)}\`, {
      method: '${method}',
    })
  }

`
      }
    })

    sdk += `}

// Export singleton instance factory
export function createClient(config: ApiConfig): ApiClient {
  return new ApiClient(config)
}

// Default export
export default ApiClient
`

    return sdk
  }

  /**
   * Generate Python SDK
   */
  generatePythonSDK(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []

    let sdk = `"""
${this.diagram.title} API Client SDK
Generated: ${new Date().toLocaleString()}
"""

import requests
from typing import Optional, Dict, Any
from urllib.parse import urljoin


class ApiClient:
    """API Client for ${this.diagram.title}"""
    
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        token: Optional[str] = None,
        timeout: int = 30
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.token = token
        self.timeout = timeout
        self.session = requests.Session()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        elif self.api_key:
            headers['X-API-Key'] = self.api_key
        return headers
    
    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Any:
        """Make HTTP request"""
        url = urljoin(self.base_url, endpoint)
        headers = self._get_headers()
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=data,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed: {str(e)}")

`

    // Generate methods for each API endpoint
    apiArray.forEach((api: any) => {
      const method = (api.method || "GET").toUpperCase()
      const path = api.path || api.endpoint || "/api/endpoint"
      const methodName = this.pathToMethodName(path, method)
      const needsAuth = api.auth_required

      if (method === "GET") {
        sdk += `    def ${methodName}(self, params: Optional[Dict[str, Any]] = None) -> Any:
        """
        ${api.description || `${method} ${path}`}
        ${needsAuth ? "        Requires authentication" : ""}
        """
        return self._request('${method}', '${path}', params=params)

`
      } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        sdk += `    def ${methodName}(self, data: Dict[str, Any]) -> Any:
        """
        ${api.description || `${method} ${path}`}
        ${needsAuth ? "        Requires authentication" : ""}
        """
        return self._request('${method}', '${path}', data=data)

`
      } else if (method === "DELETE") {
        sdk += `    def ${methodName}(self, id: str) -> Any:
        """
        ${api.description || `${method} ${path}`}
        ${needsAuth ? "        Requires authentication" : ""}
        """
        return self._request('${method}', ${JSON.stringify(path)}.replace('{id}', id))

`
      }
    })

    sdk += `
# Factory function
def create_client(
    base_url: str,
    api_key: Optional[str] = None,
    token: Optional[str] = None,
    timeout: int = 30
) -> ApiClient:
    """Create and return an API client instance"""
    return ApiClient(base_url, api_key, token, timeout)
`

    return sdk
  }

  /**
   * Generate cURL examples
   */
  generateCurlExamples(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []

    let examples = `# cURL Examples for ${this.diagram.title} API\n\n`
    examples += `Base URL: https://api.example.com\n\n`
    examples += `## Authentication\n\n`
    examples += `\`\`\`bash\n`
    examples += `# Using Bearer Token\n`
    examples += `export TOKEN="your-auth-token"\n\n`
    examples += `# Using API Key\n`
    examples += `export API_KEY="your-api-key"\n\n`
    examples += `\`\`\`\n\n`

    apiArray.forEach((api: any, idx: number) => {
      const method = (api.method || "GET").toUpperCase()
      const path = api.path || api.endpoint || "/api/endpoint"
      const needsAuth = api.auth_required

      examples += `## Example ${idx + 1}: ${method} ${path}\n\n`
      examples += `${api.description || "API endpoint"}\n\n`
      examples += `\`\`\`bash\n`

      if (method === "GET") {
        examples += `curl -X ${method} \\\n`
        examples += `  "${path}" \\\n`
        if (needsAuth) {
          examples += `  -H "Authorization: Bearer $TOKEN" \\\n`
        }
        examples += `  -H "Content-Type: application/json"\n`
      } else if (method === "POST" || method === "PUT" || method === "PATCH") {
        examples += `curl -X ${method} \\\n`
        examples += `  "${path}" \\\n`
        if (needsAuth) {
          examples += `  -H "Authorization: Bearer $TOKEN" \\\n`
        }
        examples += `  -H "Content-Type: application/json" \\\n`
        examples += `  -d '{\n`
        examples += `    "key": "value"\n`
        examples += `  }'\n`
      } else if (method === "DELETE") {
        examples += `curl -X ${method} \\\n`
        examples += `  "${path.replace('{id}', '123')}" \\\n`
        if (needsAuth) {
          examples += `  -H "Authorization: Bearer $TOKEN" \\\n`
        }
        examples += `  -H "Content-Type: application/json"\n`
      }

      examples += `\`\`\`\n\n`
    })

    return examples
  }

  private pathToMethodName(path: string, method: string): string {
    // Convert /api/users/{id} -> getUsersById or getUser
    const parts = path
      .replace(/^\/api\//, '')
      .replace(/\{(\w+)\}/g, '')
      .split('/')
      .filter(p => p.length > 0)

    const methodPrefix = method.toLowerCase()
    const nameParts = parts.map(part => {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })

    let methodName = methodPrefix
    if (method === "GET" && parts.length > 0) {
      methodName = "get" + nameParts.join("")
    } else if (method === "POST") {
      methodName = "create" + (nameParts[0] || "Resource")
    } else if (method === "PUT" || method === "PATCH") {
      methodName = "update" + (nameParts[0] || "Resource")
    } else if (method === "DELETE") {
      methodName = "delete" + (nameParts[0] || "Resource")
    }

    return methodName.charAt(0).toLowerCase() + methodName.slice(1)
  }
}

