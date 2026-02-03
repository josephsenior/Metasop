'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface FsTreeSectionProps {
    fileStructure: any
    FileSystemNode: React.ComponentType<{ node: any }>
    generateProjectZip: (node: any, zip: any) => void
    JSZip: any
    downloadFile: (content: any, fileName: string, mimeType: string) => void
}

export function FsTreeSection({
    fileStructure,
    FileSystemNode,
    generateProjectZip,
    JSZip,
    downloadFile
}: FsTreeSectionProps) {
    return (
        <TabsContent key="struct" value="struct" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4">
                <Card className="h-full border-border/50 shadow-sm overflow-hidden">
                    <div className="p-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">File System Tree</span>
                        <div className="flex items-center gap-3">
                            {fileStructure && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                    onClick={async () => {
                                        const zip = new JSZip();
                                        generateProjectZip(fileStructure, zip);
                                        const content = await zip.generateAsync({ type: "blob" });
                                        downloadFile(content as any, `project-structure.zip`, "application/zip");
                                    }}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Export Project ZIP
                                </Button>
                            )}
                            <div className="flex gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-border" />
                                <div className="h-2 w-2 rounded-full bg-border" />
                                <div className="h-2 w-2 rounded-full bg-border" />
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        {fileStructure ? (
                            <ScrollArea className="h-[500px] w-full p-4">
                                <FileSystemNode node={fileStructure} />
                            </ScrollArea>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground italic">
                                No structure metadata available.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    )
}
