"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { diagramsApi } from "@/lib/api/diagrams"
import { useToast } from "@/components/ui/use-toast"
import { ArtifactsPanel } from "@/components/artifacts/ArtifactsPanel"
import { ProjectChatPanel } from "@/components/chat/ProjectChatPanel"
import type { Diagram } from "@/types/diagram"
import {
  ArrowLeft,
  Share2,
  Edit,
  MoreVertical,
  Copy,
  Trash2,
  Maximize2,
  Info,
  Code2,
  Loader2,
  AlertCircle,
  Keyboard,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Download,
  FileText,
  Presentation
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useFullscreen } from "@/hooks/use-fullscreen"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DiagramViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const resolvedParams = use(params)
  const [diagram, setDiagram] = useState<Diagram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestDiagram, setIsGuestDiagram] = useState(false)
  const [compactView, setCompactView] = useState(false)
  const [activeArtifactTab, setActiveArtifactTab] = useState("summary")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const diagramViewerRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  const handleToggleFullscreen = () => {
    if (diagramViewerRef.current) {
      toggleFullscreen(diagramViewerRef.current)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      // F11 or F for fullscreen
      if (e.key === 'F11' || (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey)) {
        e.preventDefault()
        handleToggleFullscreen()
      }
      // C for compact view
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setCompactView(!compactView)
      }
      // [ for left panel
      if (e.key === '[' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setIsLeftPanelOpen(!isLeftPanelOpen)
      }
      // ] for right panel
      if (e.key === ']' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setIsChatOpen(!isChatOpen)
      }
      // ? for help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setShowShortcutsHelp(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [compactView, isFullscreen])

  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  useEffect(() => {
    loadDiagram()
  }, [resolvedParams.id])

  const loadDiagram = async () => {
    try {
      setIsLoading(true)

      // Load from API (now supports both auth and guest)
      const data = await diagramsApi.getById(resolvedParams.id)

      // Debug: Log artifact structure
      console.log("[Diagram View] Loaded diagram:", {
        id: data.id,
        hasMetadata: !!data.metadata,
        hasArtifacts: !!data.metadata?.metasop_artifacts,
        artifactKeys: data.metadata?.metasop_artifacts ? Object.keys(data.metadata.metasop_artifacts) : [],
        artifacts: data.metadata?.metasop_artifacts
      })

      setDiagram(data)

      // Check if this is a guest diagram based on ID or metadata
      if (resolvedParams.id.startsWith("guest_") || data.metadata?.is_guest) {
        setIsGuestDiagram(true)
      }
    } catch {
      setDiagram(null)
      // Don'tredirect automatically - show error state
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefineComplete = (result?: any) => {
    if (result && result.artifacts && diagram) {
      // Optimistic update: update the local state with new artifacts
      setDiagram({
        ...diagram,
        metadata: {
          ...diagram.metadata,
          metasop_artifacts: result.artifacts,
          metasop_report: result.report || diagram.metadata?.metasop_report,
          metasop_steps: result.steps || diagram.metadata?.metasop_steps,
        }
      })
    }
  }

  const handleShare = async () => {
    if (!diagram) return

    try {
      const shareUrl = `${window.location.origin}/dashboard/diagrams/${resolvedParams.id}`
      if (navigator.share) {
        await navigator.share({
          title: diagram.title,
          text: diagram.description,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link copied!",
          description: "Diagram link has been copied to clipboard.",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleCopy = async () => {
    if (!diagram) return

    try {
      const duplicated = await diagramsApi.duplicate(resolvedParams.id)
      toast({
        title: "Diagram duplicated",
        description: "A copy of this diagram has been created.",
      })
      router.push(`/dashboard/diagrams/${duplicated.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to duplicate diagram",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!diagram) return

    if (!confirm("Are you sure you want to delete this diagram? This action cannot be undone.")) {
      return
    }

    try {
      await diagramsApi.delete(resolvedParams.id)
      toast({
        title: "Diagram deleted",
        description: "The diagram has been permanently deleted.",
        variant: "destructive",
      })

      if (isAuthenticated) {
        router.push("/dashboard/diagrams")
      } else {
        router.push("/dashboard/create")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete diagram",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <AuthGuard requireAuth={!isGuestDiagram}>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  if (!diagram) {
    return (
      <AuthGuard requireAuth={!isGuestDiagram}>
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-md mx-auto text-center space-y-4 pt-16">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Diagram Not Found</h2>
              <p className="text-muted-foreground">
                The diagram you are looking for could not be found or you don't have permission to view it.
              </p>
              <Button onClick={() => router.push(isAuthenticated ? "/dashboard/diagrams" : "/dashboard/create")}>
                Go Back
              </Button>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={!isGuestDiagram}>
      <div className="min-h-screen bg-background">
        <DashboardHeader />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href={isAuthenticated ? "/dashboard/diagrams" : "/dashboard/create"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {isAuthenticated ? "Back to Diagrams" : "Back to Create"}
          </Link>

          {/* Session notice */}
          <Alert className="border-blue-600/30 bg-blue-600/10 mb-6">
            <AlertCircle className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            <AlertDescription className="text-sm">
              <span className="font-medium">Local storage.</span> Diagrams are saved to your device and persist across sessions.
            </AlertDescription>
          </Alert>

          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{diagram.title}</h1>
                <StatusBadge status={diagram.status as "completed" | "processing" | "failed" | "pending"} />
              </div>
              <p className="text-muted-foreground">{diagram.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isLeftPanelOpen ? "default" : "outline"}
                      size="icon"
                      className={cn(
                        "h-9 w-9 transition-all",
                        isLeftPanelOpen ? "bg-blue-600 hover:bg-blue-700" : "text-foreground"
                      )}
                      onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                    >
                      <PanelLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Toggle Left Sidebar
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isChatOpen ? "default" : "outline"}
                      size="icon"
                      className={cn(
                        "h-9 w-9 transition-all",
                        isChatOpen ? "bg-blue-600 hover:bg-blue-700" : "text-foreground"
                      )}
                      onClick={() => setIsChatOpen(!isChatOpen)}
                    >
                      <div className="relative">
                        <PanelRight className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-background animate-pulse" />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Toggle AI Architect Chat
                  </TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => router.push(`/dashboard/create?id=${diagram.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Edit Diagram
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Share diagram link
                  </TooltipContent>
                </Tooltip>



                <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
                  <DialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <Keyboard className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Keyboard shortcuts <Kbd>?</Kbd>
                      </TooltipContent>
                    </Tooltip>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Keyboard Shortcuts</DialogTitle>
                      <DialogDescription>
                        Quick actions for navigating and controlling the diagram viewer
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Toggle Fullscreen</span>
                        <Kbd>F</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Toggle Left Panel</span>
                        <Kbd>[</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Toggle Right Chat</span>
                        <Kbd>]</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Toggle Compact View</span>
                        <Kbd>C</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Show Shortcuts</span>
                        <Kbd>?</Kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pan</span>
                        <span className="text-xs text-muted-foreground">Click + Drag</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Zoom</span>
                        <span className="text-xs text-muted-foreground">Scroll or Controls</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Select Node</span>
                        <span className="text-xs text-muted-foreground">Click</span>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/create?id=${diagram.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => {
                        const guestSessionId = document.cookie.split('; ').find(row => row.startsWith('guest_session_id='))?.split('=')[1];
                        const query = guestSessionId ? `&guestSessionId=${guestSessionId}` : '';
                        window.open(`/api/diagrams/${diagram.id}/export?format=markdown&artifact=documentation${query}`, "_blank")
                      }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const guestSessionId = document.cookie.split('; ').find(row => row.startsWith('guest_session_id='))?.split('=')[1];
                        const query = guestSessionId ? `&guestSessionId=${guestSessionId}` : '';
                        window.open(`/api/diagrams/${diagram.id}/export?format=pdf&artifact=documentation${query}`, "_blank")
                      }}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const guestSessionId = document.cookie.split('; ').find(row => row.startsWith('guest_session_id='))?.split('=')[1];
                        const query = guestSessionId ? `&guestSessionId=${guestSessionId}` : ''; // append to existing query params
                        window.open(`/api/diagrams/${diagram.id}/export?format=pptx&artifact=documentation${query}`, "_blank")
                      }}>
                        <Presentation className="mr-2 h-4 w-4" />
                        PowerPoint (.pptx)
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="flex-1 w-full min-w-0 min-h-0">
              <Tabs defaultValue="view" className="space-y-4 flex flex-col h-full min-h-0">
                <TabsList className="shrink-0">
                  <TabsTrigger value="view" className="gap-2">
                    <Maximize2 className="h-4 w-4" />
                    View
                  </TabsTrigger>
                  <TabsTrigger value="info" className="gap-2">
                    <Info className="h-4 w-4" />
                    Information
                  </TabsTrigger>
                  <TabsTrigger value="json" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    JSON
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="space-y-4 flex-1 min-h-0">
                  <Card className="border-border bg-card/80 backdrop-blur-sm overflow-hidden h-full">
                    <CardContent className="p-0 h-full min-h-[600px] max-h-[1000px]">
                      <div className="w-full h-full">
                        {(() => {
                          // Handle both nested structures: metadata.metasop_artifacts.metasop_artifacts or metadata.metasop_artifacts
                          const artifacts = diagram.metadata?.metasop_artifacts?.metasop_artifacts || diagram.metadata?.metasop_artifacts
                          return artifacts ? (
                            <ArtifactsPanel
                              diagramId={diagram.id}
                              artifacts={artifacts}
                              className="h-full"
                              activeTab={activeArtifactTab}
                              onTabChange={setActiveArtifactTab}
                              sidebarMode={isLeftPanelOpen}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-muted-foreground">
                              <Loader2 className="h-8 w-8 animate-spin mb-4" />
                              <p>Loading agent artifacts...</p>
                            </div>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="info">
                  <Card className="border-border bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Diagram Information</CardTitle>
                      <CardDescription>Details about this architecture diagram</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Status</p>
                          <StatusBadge status={diagram.status as "completed" | "processing" | "failed" | "pending"} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Artifacts</p>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const artifacts = diagram.metadata?.metasop_artifacts?.metasop_artifacts || diagram.metadata?.metasop_artifacts
                              return artifacts ? Object.keys(artifacts).length : 0
                            })()} agents
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Created</p>
                          <p className="text-sm text-muted-foreground">{new Date(diagram.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Last Updated</p>
                          <p className="text-sm text-muted-foreground">{new Date(diagram.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="json">
                  <Card className="border-border bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Diagram JSON</CardTitle>
                      <CardDescription>Raw JSON representation of the diagram</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="p-4 rounded-lg bg-muted overflow-auto text-sm max-h-[600px]">
                        {JSON.stringify(diagram, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop Chat Panel */}
            {(() => {
              const artifacts = diagram.metadata?.metasop_artifacts?.metasop_artifacts || diagram.metadata?.metasop_artifacts
              return artifacts && isChatOpen ? (
                <div className="hidden lg:block w-96 shrink-0 h-full min-h-[648px] max-h-[1048px] sticky top-8">
                  <ProjectChatPanel
                    diagramId={diagram.id}
                    artifacts={artifacts}
                    activeTab={activeArtifactTab}
                    initialHistory={diagram.metadata?.chat_history}
                    onRefineComplete={handleRefineComplete}
                  />
                </div>
              ) : null
            })()}
          </div>

          {/* Mobile Chat Sheet */}
          {(() => {
            const artifacts = diagram.metadata?.metasop_artifacts?.metasop_artifacts || diagram.metadata?.metasop_artifacts
            return artifacts ? (
              <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white">
                      <MessageSquare className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="p-0 w-[90%] sm:w-[400px]">
                    <ProjectChatPanel
                      diagramId={diagram.id}
                      artifacts={artifacts}
                      activeTab={activeArtifactTab}
                      initialHistory={diagram.metadata?.chat_history}
                      onRefineComplete={handleRefineComplete}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            ) : null
          })()}

        </main>
      </div>
    </AuthGuard>
  )
}

