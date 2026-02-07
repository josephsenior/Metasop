"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ChevronLeft,
    PanelLeft,
    PanelRight,
    Save,
    Plus,
    Trash,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { diagramsApi } from "@/lib/api/diagrams"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { HeaderActionsMenu } from "./HeaderActionsMenu"
import type { DiagramData } from "@/hooks/use-diagram-generation"

interface CreateHeaderProps {
    isAuthenticated: boolean
    currentDiagram: DiagramData | null
    isLeftPanelOpen: boolean
    isChatOpen: boolean
    onToggleLeftPanel: () => void
    onToggleChat: () => void
    onSave: () => void
    onExportContext: () => void
}

export function CreateHeader({
    isAuthenticated,
    currentDiagram,
    isLeftPanelOpen,
    isChatOpen,
    onToggleLeftPanel,
    onToggleChat,
    onSave,
    onExportContext
}: CreateHeaderProps) {
    const router = useRouter()
    const { toast } = useToast()
    const diagramId = currentDiagram?.id

    const handleDelete = async () => {
        if (!currentDiagram) return
        const { id } = currentDiagram
        if (!id) {
            toast({ title: "Delete Failed", description: "Diagram id is missing.", variant: 'destructive' })
            return
        }

        try {
            await diagramsApi.delete(id)
            toast({ title: "Diagram Deleted", description: "Redirecting to create new diagram." })
            router.push('/dashboard/create')
            // ensure state is fresh
            window.location.reload()
        } catch (err) {
            console.error(err)
            toast({ title: "Delete Failed", description: "Unable to delete diagram.", variant: 'destructive' })
        }
    }

    return (
        <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 shrink-0 z-50">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <Link
                    href={isAuthenticated ? "/dashboard" : "/"}
                    className="flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Back</span>
                </Link>
                {/* Left-panel toggle placed near the back button */}
                {currentDiagram && (
                    <div className="ml-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={isLeftPanelOpen ? "default" : "ghost"}
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 rounded-lg transition-all",
                                            isLeftPanelOpen ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "text-foreground hover:bg-muted"
                                        )}
                                        onClick={onToggleLeftPanel}
                                    >
                                        <PanelLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isLeftPanelOpen ? "Close Menu" : "Open Menu"}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
                <div className="h-4 w-px bg-border hidden sm:block" />
                <h1 className="text-sm font-semibold text-foreground truncate">Create Diagram</h1>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                {currentDiagram && (
                    <TooltipProvider>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/20 rounded-xl border border-border/40 backdrop-blur-md">
                            {/* left-panel toggle moved to the left near Back link */}

                            {/* Chat Toggle */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={isChatOpen ? "default" : "ghost"}
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 rounded-lg transition-all relative",
                                            isChatOpen ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "text-foreground hover:bg-muted"
                                        )}
                                        onClick={onToggleChat}
                                    >
                                        <div className="relative">
                                            <PanelRight className="h-4 w-4" />
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-background animate-pulse" />
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isChatOpen ? "Close Chat" : "Open Chat"}
                                </TooltipContent>
                            </Tooltip>

                            <div className="w-px h-4 bg-border/50 mx-0.5" />

                            {/* Save Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-foreground hover:bg-muted transition-all"
                                        onClick={onSave}
                                    >
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {currentDiagram?.id && !currentDiagram.id.startsWith("temp_") ? "Update Diagram" : "Save Diagram"}
                                </TooltipContent>
                            </Tooltip>

                            <div className="w-px h-4 bg-border/50 mx-0.5" />

                            {/* Create New Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-foreground hover:bg-muted transition-all"
                                        onClick={() => {
                                            router.push('/dashboard/create')
                                            window.location.reload()
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Create New Diagram
                                </TooltipContent>
                            </Tooltip>

                            <div className="w-px h-4 bg-border/50 mx-0.5" />

                            {/* Delete Diagram Button (with confirmation dialog) */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-foreground hover:bg-muted transition-all"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>

                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Diagram</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. Are you sure you want to delete this diagram?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Delete Diagram
                                </TooltipContent>
                            </Tooltip>

                            <div className="w-px h-4 bg-border/50 mx-0.5" />

                            {/* More Actions Dropdown */}
                            <HeaderActionsMenu
                                currentDiagram={currentDiagram}
                                isAuthenticated={isAuthenticated}
                                onSave={onSave}
                                onExportContext={onExportContext}
                            />
                        </div>
                    </TooltipProvider>
                )}
            </div>
        </div>
    )
}
