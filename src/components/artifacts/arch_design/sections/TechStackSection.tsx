'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Cpu } from "lucide-react"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface TechStackSectionProps {
    technologyStack: any
}

export function TechStackSection({ technologyStack }: TechStackSectionProps) {
    return (
        <TabsContent key="stack" value="stack" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {technologyStack && Object.entries(technologyStack).map(([category, items]: [string, any]) => (
                    <motion.div
                        key={category}
                        variants={item}
                        className="bg-card border border-border/50 p-4 rounded-xl shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-6 rounded-md bg-muted/20 flex items-center justify-center">
                                <Cpu className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{category}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(items) ? items.map((t: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] font-mono bg-blue-500/5 text-blue-600 border-blue-500/10">
                                    {t}
                                </Badge>
                            )) : <span className="text-xs text-muted-foreground">{String(items)}</span>}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </TabsContent>
    )
}
