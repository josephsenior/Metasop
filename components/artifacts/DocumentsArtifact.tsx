'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
    FileText, 
    Trash2, 
    Plus, 
    Loader2, 
    ExternalLink,
    Search,
    Calendar,
    Clock,
    Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
    containerVariants as container
} from "./shared-components"

interface Document {
    id: string
    name: string
    type: string
    content: string
    url?: string
    created_at: string
}

interface DocumentsArtifactProps {
    diagramId: string
    documents: Document[]
    onDocumentAdded?: () => void
}

export default function DocumentsArtifact({ 
    diagramId, 
    documents = [], 
    onDocumentAdded 
}: DocumentsArtifactProps) {
    const { toast } = useToast()
    const [isUploading, setIsUploading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedDoc, setSelectedDoc] = React.useState<Document | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const filteredDocs = documents.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Read file content
            const reader = new FileReader()
            reader.onload = async (event) => {
                const content = event.target?.result as string
                
                // Upload to API
                try {
                    const response = await fetch(`/api/diagrams/${diagramId}/documents`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: file.name,
                            type: file.name.split('.').pop() || 'txt',
                            content: content,
                            url: "" // Optional URL if we had a storage provider
                        }),
                    })

                    if (!response.ok) {
                        throw new Error('Failed to upload document')
                    }

                    toast({
                        title: "Document Uploaded",
                        description: `${file.name} has been added to the project context.`,
                    })

                    if (onDocumentAdded) {
                        onDocumentAdded()
                    }
                } catch (error: any) {
                    toast({
                        title: "Upload Error",
                        description: error.message,
                        variant: "destructive",
                    })
                } finally {
                    setIsUploading(false)
                }
            }
            reader.readAsText(file)
        } catch (error: any) {
            setIsUploading(false)
            toast({
                title: "File Error",
                description: "Failed to read the file.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="space-y-6">
            <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {/* Documents List */}
                <Card className={cn("md:col-span-1 border-border bg-card/50 overflow-hidden")}>
                    <CardHeader className="pb-3 border-b border-border/10 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Project Documents
                            </CardTitle>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                                onClick={handleUploadClick}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Plus className="h-3 w-3" />
                                )}
                                Upload
                            </Button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".txt,.md,.json,.csv,.pdf" // Add supported types
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="mt-4 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search documents..."
                                className="pl-9 h-9 bg-background/50 border-border/50 text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            {filteredDocs.length > 0 ? (
                                <div className="divide-y divide-border/10">
                                    {filteredDocs.map((doc) => (
                                        <div 
                                            key={doc.id}
                                            className={cn(
                                                "p-4 hover:bg-muted/30 cursor-pointer transition-colors group",
                                                selectedDoc?.id === doc.id ? "bg-blue-500/5 border-r-2 border-blue-500" : ""
                                            )}
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    doc.type === 'pdf' ? "bg-red-500/10 text-red-500" :
                                                    doc.type === 'docx' ? "bg-blue-500/10 text-blue-500" :
                                                    "bg-muted text-muted-foreground"
                                                )}>
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate pr-6">{doc.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-mono">
                                                            {doc.type}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-2.5 w-2.5" />
                                                            {new Date(doc.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 p-6 text-center text-muted-foreground">
                                    <Archive className="h-8 w-8 mb-3 opacity-20" />
                                    <p className="text-sm">No documents found</p>
                                    <p className="text-xs opacity-60">Upload files to provide additional project context.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Document Viewer */}
                <Card className="md:col-span-2 border-border bg-card/50 overflow-hidden flex flex-col">
                    {selectedDoc ? (
                        <>
                            <CardHeader className="pb-3 border-b border-border/10 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{selectedDoc.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <Clock className="h-3 w-3" />
                                            Uploaded on {new Date(selectedDoc.created_at).toLocaleString()}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="h-8 gap-1">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Open
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <ScrollArea className="h-[535px] p-6">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <pre className="p-4 rounded-xl bg-muted/50 border border-border/20 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                                            {selectedDoc.content}
                                        </pre>
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 p-12 text-center text-muted-foreground">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 opacity-20" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">Select a document</h3>
                            <p className="text-sm max-w-xs">
                                Select a document from the list to view its contents and see how it's being used as project context.
                            </p>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}
