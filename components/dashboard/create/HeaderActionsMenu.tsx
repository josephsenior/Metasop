"use client"

import { useRouter } from "next/navigation"
import {
    MoreHorizontal,
    Save,
    FileText,
    Monitor,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DiagramData } from "@/hooks/use-diagram-generation"

interface HeaderActionsMenuProps {
    currentDiagram: DiagramData | null
    isAuthenticated: boolean
    onSave: () => void
    onDownloadSpecs: () => void
    onExportContext: () => void
}

export function HeaderActionsMenu({
    currentDiagram,
    isAuthenticated,
    onSave,
    onDownloadSpecs,
    onExportContext
}: HeaderActionsMenuProps) {
    const router = useRouter()

    const handleExportPptx = () => {
        const guestSessionId = typeof document !== 'undefined' ? document.cookie
            .split('; ')
            .find(row => row.startsWith('guest_session_id='))
            ?.split('=')[1] : undefined

        const query = guestSessionId ? `?guestSessionId=${guestSessionId}` : ''
        window.location.href = `/api/diagrams/${currentDiagram?.id}/export/pptx${query}`
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg text-foreground hover:bg-muted/50 transition-all">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/98 backdrop-blur-xl border-border/50 shadow-xl rounded-xl p-1.5">

                {/* Primary Action: Save/View */}
                {currentDiagram?.id && !currentDiagram.id.startsWith("temp_") ? (
                    <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/diagrams/${currentDiagram.id}`)}
                        className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-blue-500/10 hover:text-blue-600 focus:bg-blue-500/10 focus:text-blue-600 focus:outline-hidden transition-colors"
                    >
                        <Save className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                        <span>{isAuthenticated ? "View Saved Version" : "View in Session"}</span>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem
                        onClick={onSave}
                        className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-blue-500/10 hover:text-blue-600 focus:bg-blue-500/10 focus:text-blue-600 focus:outline-hidden transition-colors"
                    >
                        <Save className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                        <span>{isAuthenticated ? "Save to Account" : "Save to Session"}</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-border/50 my-1.5" />

                {/* Secondary Actions */}
                <DropdownMenuItem
                    onClick={onExportContext}
                    className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-hidden transition-colors"
                >
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                    <span>Export Context</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/50 my-1.5" />

                {/* Downloads */}
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Downloads
                </div>

                <DropdownMenuItem
                    onClick={handleExportPptx}
                    disabled={!currentDiagram?.id}
                    className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-hidden transition-colors"
                >
                    <Monitor className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                    <span>PowerPoint (.pptx)</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={onDownloadSpecs}
                    className="group flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted focus:bg-muted focus:outline-hidden transition-colors"
                >
                    <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span>Download JSON Specs</span>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
