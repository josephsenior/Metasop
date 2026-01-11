"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Code, Key, Zap, Book } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back to home link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-400 mb-4">
              <Code className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              API Reference
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Integrate ArchitectAI into your workflow with our RESTful API. Available for Teams plan and above.
            </p>
          </div>

          {/* Authentication */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Authentication</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  All API requests require authentication using an API key. Include your API key in the Authorization header:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <code className="text-sm text-foreground">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-6 mb-12">
            {/* Generate Diagram Endpoint */}
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-mono font-semibold bg-blue-600/10 text-blue-700 dark:text-blue-400">
                    POST
                  </span>
                  <CardTitle className="text-lg font-mono">/api/v1/diagrams/generate</CardTitle>
                </div>
                <CardDescription>Generate an architecture diagram from a text description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Request Body</h4>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <pre className="text-xs text-foreground overflow-x-auto">
{`{
  "prompt": "Create a todo app with authentication",
  "options": {
    "includeStateManagement": true,
    "includeAPIs": true,
    "exportFormat": "json"
  }
}`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Response</h4>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <pre className="text-xs text-foreground overflow-x-auto">
{`{
  "id": "diagram_123",
  "status": "completed",
  "diagram": {
    "nodes": [...],
    "edges": [...]
  },
  "metadata": {
    "components": [...],
    "apis": [...]
  }
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Get Diagram Endpoint */}
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                    GET
                  </span>
                  <CardTitle className="text-lg font-mono">/api/v1/diagrams/{`{id}`}</CardTitle>
                </div>
                <CardDescription>Retrieve a previously generated diagram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <code className="text-sm text-foreground">
                    GET /api/v1/diagrams/diagram_123
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* List Diagrams Endpoint */}
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                    GET
                  </span>
                  <CardTitle className="text-lg font-mono">/api/v1/diagrams</CardTitle>
                </div>
                <CardDescription>List all your generated diagrams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <code className="text-sm text-foreground">
                    GET /api/v1/diagrams?limit=10&offset=0
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rate Limits */}
          <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-500/5 to-blue-600/5 -z-10" />
            
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Rate Limits</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  API rate limits are based on your subscription plan:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong className="text-foreground">Teams:</strong> 100 requests per minute</li>
                  <li><strong className="text-foreground">Enterprise:</strong> Custom rate limits</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Rate limit information is included in response headers: <code className="text-xs bg-muted px-1 py-0.5 rounded">X-RateLimit-Remaining</code>
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Need API access? Upgrade to Teams plan or contact us for Enterprise options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" asChild>
                <Link href="/#pricing">View Pricing</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/help">
                  <Book className="h-4 w-4 inline mr-2" />
                  Get Help
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

