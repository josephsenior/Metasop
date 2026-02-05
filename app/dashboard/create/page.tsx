"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable"
import { Sparkles, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArtifactsPanel } from "@/components/artifacts/ArtifactsPanel"
import { ProjectChatPanel } from "@/components/chat/ProjectChatPanel"
import { useDiagramGeneration } from "@/hooks/use-diagram-generation"
import { diagramsApi } from "@/lib/api/diagrams"
import { generateAgentContextMarkdown } from "@/lib/metasop/utils/export-context"
import { downloadFile } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

// Modular Components
import { CreateHeader } from "@/components/dashboard/create/CreateHeader"
import { TemplateSidebar } from "@/components/dashboard/create/TemplateSidebar"
import { GenerationFlow } from "@/components/dashboard/create/GenerationFlow"
import { PromptInput } from "@/components/dashboard/create/PromptInput"
import { ClarificationPanel } from "@/components/dashboard/create/ClarificationPanel"
import { GenerationProgress } from "@/components/diagrams/generation-progress"

export default function CreateDiagramPage() {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")

  // Using our custom hook for generation logic
  const {
    prompt, setPrompt,
    isGenerating,
    isScoping,
    guidedMode, setGuidedMode,
    selectedModel, setSelectedModel,
    isReasoningEnabled, setIsReasoningEnabled,
    clarificationQuestions,
    clarificationAnswers, setClarificationAnswers,
    showClarificationPanel,
    uploadedDocuments,
    generationSteps,
    stepSummaries,
    currentDiagram, setCurrentDiagram,
    handleGenerate,
    doStartGeneration,
    handleFileUpload,
    removeDocument,
    isUploading
  } = useDiagramGeneration()

  // Load diagram if ID is in URL
  useEffect(() => {
    const id = searchParams.get("id")
    if (id && (!currentDiagram || currentDiagram.id !== id)) {
      loadDiagram(id)
    }
  }, [searchParams])

  const loadDiagram = async (id: string) => {
    try {
      const data = await diagramsApi.getById(id)
      setCurrentDiagram({
        id: data.id,
        title: data.title,
        description: data.description,
        isGuest: data.id.startsWith("guest_") || data.metadata?.is_guest,
        metadata: data.metadata,
      })
      if (data.metadata?.metasop_artifacts) {
        setPrompt(data.metadata.prompt || "")
      }
    } catch {
      toast({ title: "Load Failed", description: "Could not load the diagram for editing.", variant: "destructive" })
    }
  }

  const handleRefineComplete = (result?: any) => {
    if (result && result.artifacts && currentDiagram) {
      setCurrentDiagram({
        ...currentDiagram,
        metadata: {
          ...currentDiagram.metadata,
          metasop_artifacts: result.artifacts,
        }
      })
    }
  }

  const handleSave = async () => {
    if (!currentDiagram) return
    try {
      if (currentDiagram.id && !currentDiagram.id.startsWith("temp_")) {
        await diagramsApi.update(currentDiagram.id, {
          title: currentDiagram?.title,
          description: currentDiagram?.description,
        })
        toast({ title: "Diagram Updated", description: "All changes have been saved." })
      } else {
        toast({ title: "Account Required", description: "Sign in to save this diagram permanently." })
      }
    } catch {
      toast({ title: "Save Failed", description: "Failed to save the diagram.", variant: "destructive" })
    }
  }

  const handleDownloadSpecs = () => {
    if (!currentDiagram?.metadata?.metasop_artifacts) return
    const data = JSON.stringify(currentDiagram?.metadata?.metasop_artifacts, null, 2)
    downloadFile(data, `metasop-spec-${currentDiagram?.id?.substring(0, 8) || 'export'}.json`, "application/json")
    toast({ title: "Export Successful", description: "Technical specification downloaded as JSON." })
  }

  const handleExportContext = () => {
    if (!currentDiagram?.metadata?.metasop_artifacts) return
    const md = generateAgentContextMarkdown(currentDiagram)
    downloadFile(md, `metasop-context-${currentDiagram?.id?.substring(0, 8) || 'export'}.md`, "text/markdown")
    toast({ title: "Context Exported", description: "Markdown context downloaded for AI usage." })
  }

  const handleSelectTemplate = (template: any) => {
    setPrompt(template.prompt)
    toast({
      title: "Template Loaded",
      description: `Loaded ${template.title} template.`
    })
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <CreateHeader
          isAuthenticated={isAuthenticated}
          currentDiagram={currentDiagram}
          isLeftPanelOpen={isLeftPanelOpen}
          isChatOpen={isChatOpen}
          onToggleLeftPanel={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onSave={handleSave}
          onDownloadSpecs={handleDownloadSpecs}
          onExportContext={handleExportContext}
        />

        <main className="flex-1 min-h-0 relative">
          <ResizablePanelGroup direction="horizontal">
            {/* Sidebar: Templates */}
            {isLeftPanelOpen && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                  <TemplateSidebar onSelectTemplate={handleSelectTemplate} />
                </ResizablePanel>
                <ResizableHandle className="w-1 bg-border/20 transition-colors hover:bg-blue-500/20" />
              </>
            )}

            {/* Main Canvas Area */}
            <ResizablePanel defaultSize={isLeftPanelOpen ? 60 : 80}>
              <div className="h-full flex flex-col relative overflow-hidden bg-background">
                {/* Persistent Progress Bar */}
                <GenerationProgress steps={generationSteps} />

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
                  <AnimatePresence mode="wait">
                    {!currentDiagram ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center p-4"
                      >
                        <div className="relative mb-12">
                          <div className="absolute -inset-8 bg-blue-500/10 rounded-full blur-3xl" />
                          <GenerationFlow
                            steps={generationSteps}
                            summaries={stepSummaries}
                          />
                        </div>

                        {/* Initial state message */}
                        {generationSteps.length === 0 && (
                          <div className="text-center max-w-lg">
                            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center justify-center gap-2">
                              <Sparkles className="h-5 w-5 text-blue-500" />
                              Imagine Your Application
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Describe your software vision in the prompt below. Seven specialized AI agents
                              will collaborate in real-time to architect every layer of your project.
                            </p>
                          </div>
                        )}

                      </motion.div>
                    ) : (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full"
                      >
                        <ArtifactsPanel
                          diagramId={currentDiagram?.id || ""}
                          artifacts={currentDiagram?.metadata?.metasop_artifacts || {}}
                          steps={generationSteps}
                          className="h-full"
                          activeTab={activeTab}
                          onTabChange={setActiveTab}
                          sidebarMode={isLeftPanelOpen}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom Prompt Area */}
                <div className="shrink-0">
                  <PromptInput
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    isScoping={isScoping}
                    guidedMode={guidedMode}
                    onToggleGuided={setGuidedMode}
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    isReasoningEnabled={isReasoningEnabled}
                    onToggleReasoning={setIsReasoningEnabled}
                    uploadedDocuments={uploadedDocuments}
                    onRemoveDocument={removeDocument}
                    onFileUpload={handleFileUpload}
                    isUploading={isUploading}
                  />
                </div>

                {/* Clarification Overlay */}
                {showClarificationPanel && clarificationQuestions && (
                  <ClarificationPanel
                    questions={clarificationQuestions}
                    answers={clarificationAnswers}
                    onAnswerChange={(qid, ans) => setClarificationAnswers((prev: Record<string, string>) => ({ ...prev, [qid]: ans }))}
                    onConfirm={() => doStartGeneration(clarificationAnswers)}
                    onSkip={() => doStartGeneration()}
                    isGenerating={isGenerating}
                  />
                )}
              </div>
            </ResizablePanel>

            {/* Chat Panel */}
            {isChatOpen && (
              <>
                <ResizableHandle className="w-1 bg-border/20 transition-colors hover:bg-blue-500/20" />
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                  <ProjectChatPanel
                    diagramId={currentDiagram?.id}
                    artifacts={currentDiagram?.metadata?.metasop_artifacts || {}}
                    activeTab={activeTab}
                    initialHistory={currentDiagram?.metadata?.chat_history}
                    onRefineComplete={handleRefineComplete}
                    onClose={() => setIsChatOpen(false)}
                  />
                </ResizablePanel>
              </>
            )}

            {/* Mobile Chat Sheet */}
            {currentDiagram && (
              <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white">
                      <MessageSquare className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="p-0 w-[90%] sm:w-[400px]">
                    <ProjectChatPanel
                      diagramId={currentDiagram.id}
                      artifacts={currentDiagram.metadata?.artifacts}
                      activeTab={activeTab}
                      onRefineComplete={handleRefineComplete}
                      onClose={() => { }}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </ResizablePanelGroup>
        </main>
      </div>
    </AuthGuard>
  )
}
