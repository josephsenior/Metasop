'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, Zap, Layout } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface ComponentLibrarySectionProps {
    rootNode: any
    hierarchyNodes: any[]
    uiPatterns: string[]
}

export function ComponentLibrarySection({
    rootNode,
    hierarchyNodes,
    uiPatterns
}: ComponentLibrarySectionProps) {

    const renderHierarchyNodes = (nodes: any[], depth = 0, keyPath = "h"): React.ReactNode => {
        if (!Array.isArray(nodes) || nodes.length === 0) return null
        return nodes.map((child: any, i: number) => {
            const nextKey = `${keyPath}.${i}`
            return (
                <div key={nextKey} className="relative space-y-2" style={{ marginLeft: `${depth * 12}px` }}>
                    <div className={cn("bg-card border border-border/40 p-3 rounded-lg shadow-sm hover:border-primary/20 transition-colors", styles.colors.bgCard)}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-2">
                                <div className="w-1 h-3 rounded-full bg-primary/40" />
                                {child.name || "Component"}
                            </span>
                            {child.type && (
                                <Badge variant="secondary" className="text-[8px] h-4 font-mono uppercase bg-muted/50 border border-border/40">
                                    {child.type}
                                </Badge>
                            )}
                        </div>
                        {child.description && (
                            <p className="text-[10px] text-muted-foreground leading-tight">{child.description}</p>
                        )}
                        {child.children && child.children.length > 0 && (
                            <div className="mt-2 space-y-2 border-l border-border/50">
                                {renderHierarchyNodes(child.children, depth + 1, nextKey)}
                            </div>
                        )}
                    </div>
                </div>
            )
        })
    }

    return (
        <TabsContent key="library" value="library" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {rootNode && (
                        <div className="mb-4">
                            <div className={cn("bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl shadow-sm", styles.colors.bgCard)}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        Root: {rootNode}
                                    </span>
                                    <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px] uppercase">Entry Point</Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground italic">Primary application entry point and container component.</p>
                            </div>
                            {hierarchyNodes.length > 0 && (
                                <div className="mt-4 ml-4 pl-4 border-l-2 border-dashed border-indigo-500/20">
                                    {renderHierarchyNodes(hierarchyNodes)}
                                </div>
                            )}
                        </div>
                    )}
                    {!rootNode && hierarchyNodes.length > 0 ? (
                        renderHierarchyNodes(hierarchyNodes)
                    ) : !rootNode && hierarchyNodes.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                            <Layers className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No component hierarchy defined.</p>
                        </div>
                    ) : null}
                </div>
                <div className="space-y-4">
                    {uiPatterns.length > 0 && (
                        <Card className={cn("border-border/50", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Layout className="h-3 w-3" />
                                    UI Patterns
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-1">
                                    {uiPatterns.map((pattern: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border/40 last:border-0 hover:bg-muted/30 px-1 rounded transition-colors">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            <span className="text-muted-foreground">{pattern}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </motion.div>
        </TabsContent>
    )
}
