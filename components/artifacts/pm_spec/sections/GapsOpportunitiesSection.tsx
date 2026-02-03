'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface GapsOpportunitiesSectionProps {
    gaps: any[]
    opportunities: any[]
}

export function GapsOpportunitiesSection({
    gaps,
    opportunities
}: GapsOpportunitiesSectionProps) {
    return (
        <>
            <TabsContent key="gaps" value="gaps" className="m-0 outline-none">
                <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                    {gaps?.map((gap: any, i: number) => (
                        <motion.div key={i} variants={item} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-bold text-red-700 dark:text-red-400">{gap.gap}</h4>
                                <Badge variant="outline" className={cn(
                                    "text-[10px] uppercase",
                                    gap.priority === 'high' ? "text-red-600 border-red-500/30 bg-red-500/10" :
                                        gap.priority === 'low' ? "text-blue-600 border-blue-500/30 bg-blue-500/10" :
                                            "text-amber-600 border-amber-500/30 bg-amber-500/10"
                                )}>
                                    {gap.priority}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{gap.impact}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </TabsContent>

            <TabsContent key="opportunities" value="opportunities" className="m-0 outline-none">
                <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                    {opportunities?.map((opp: any, i: number) => (
                        <motion.div key={i} variants={item} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{opp.opportunity}</h4>
                                <Badge variant="outline" className={cn(
                                    "text-[10px] uppercase",
                                    opp.feasibility === 'high' ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" :
                                        opp.feasibility === 'low' ? "text-red-600 border-red-500/30 bg-red-500/10" :
                                            "text-blue-600 border-blue-500/30 bg-blue-500/10"
                                )}>
                                    {opp.feasibility} Feasibility
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{opp.value}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </TabsContent>
        </>
    )
}
