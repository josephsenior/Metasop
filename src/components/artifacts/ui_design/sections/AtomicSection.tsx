'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Box, Grid, Layout } from "lucide-react"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface AtomicSectionProps {
    atomicStructure?: {
        atoms?: string[]
        molecules?: string[]
        organisms?: string[]
    }
}

export function AtomicSection({ atomicStructure }: AtomicSectionProps) {
    return (
        <TabsContent key="atomic" value="atomic" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Atoms */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-muted/20 text-blue-600">
                            <Box className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Atoms</h3>
                        <Badge variant="outline" className="ml-auto text-[10px] font-mono">{atomicStructure?.atoms?.length || 0}</Badge>
                    </div>
                    <div className="grid gap-2">
                        {atomicStructure?.atoms?.map((atom: string, i: number) => (
                            <motion.div key={i} variants={item} className="p-3 bg-card border border-border/50 rounded-xl hover:border-blue-500/30 transition-all shadow-sm">
                                <span className="text-xs font-medium text-foreground/80">{atom}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Molecules */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-muted/20 text-purple-600">
                            <Grid className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Molecules</h3>
                        <Badge variant="outline" className="ml-auto text-[10px] font-mono">{atomicStructure?.molecules?.length || 0}</Badge>
                    </div>
                    <div className="grid gap-2">
                        {atomicStructure?.molecules?.map((mol: string, i: number) => (
                            <motion.div key={i} variants={item} className="p-3 bg-card border border-border/50 rounded-xl hover:border-purple-500/30 transition-all shadow-sm">
                                <span className="text-xs font-medium text-foreground/80">{mol}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Organisms */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-muted/20 text-orange-600">
                            <Layout className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Organisms</h3>
                        <Badge variant="outline" className="ml-auto text-[10px] font-mono">{atomicStructure?.organisms?.length || 0}</Badge>
                    </div>
                    <div className="grid gap-2">
                        {atomicStructure?.organisms?.map((org: string, i: number) => (
                            <motion.div key={i} variants={item} className="p-3 bg-card border border-border/50 rounded-xl hover:border-orange-500/30 transition-all shadow-sm">
                                <span className="text-xs font-medium text-foreground/80">{org}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </TabsContent>
    )
}
