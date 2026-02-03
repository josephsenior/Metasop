'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Binary, Layers } from "lucide-react"
import { artifactStyles as styles } from "../shared-styles"
import { itemVariants as item } from "../shared-components"

interface DecisionCardProps {
    decision: any
    index: number
}

export function DecisionCard({ decision, index }: DecisionCardProps) {
    return (
        <motion.div variants={item} className={cn(
            "group relative p-4 rounded-xl border transition-all hover:border-green-500/30",
            styles.colors.bgCard, styles.colors.borderMuted
        )}>
            <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-none group-hover:bg-green-500/20 transition-colors">
                    <Binary className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-green-600/70 border border-green-500/20 px-1.5 rounded-sm whitespace-nowrap">
                            ADR-{index + 1}
                        </span>
                        {decision.status && (
                            <Badge variant="outline" className={cn(
                                "text-[9px] px-1.5 py-0 uppercase border-0",
                                decision.status === 'accepted' ? "bg-green-500/10 text-green-700" :
                                    decision.status === 'superseded' ? "bg-red-500/10 text-red-700 decoration-line-through" :
                                        "bg-amber-500/10 text-amber-700"
                            )}>
                                {decision.status}
                            </Badge>
                        )}
                        <h4 className={cn("truncate group-hover:text-green-600 transition-colors flex-1", styles.typography.h4)}>
                            {decision.decision || `Decision ${index + 1}`}
                        </h4>
                    </div>
                    <p className={cn("mb-3", styles.typography.bodySmall, styles.colors.textMuted)}>
                        {decision.reason}
                    </p>

                    <div className="space-y-3">
                        {decision.rationale && (
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5">
                                <div className="text-[9px] font-bold text-blue-600 uppercase mb-1">Rationale</div>
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed italic">{decision.rationale}</p>
                            </div>
                        )}

                        {decision.tradeoffs && (
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                                <div className="text-[9px] font-bold text-amber-600 uppercase mb-1">Tradeoffs</div>
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed italic">{decision.tradeoffs}</p>
                            </div>
                        )}

                        {decision.consequences && (
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5">
                                <div className="text-[9px] font-bold text-blue-600 uppercase mb-1">Consequences</div>
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">{decision.consequences}</p>
                            </div>
                        )}

                        {decision.alternatives && Array.isArray(decision.alternatives) && decision.alternatives.length > 0 && (
                            <div className="flex items-start gap-2 text-[10px] text-muted-foreground/60 bg-muted/20 p-2 rounded">
                                <Layers className="h-3 w-3 mt-0.5 flex-none" />
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="mr-1">Alternatives:</span>
                                    {decision.alternatives.map((alt: string, i: number) => (
                                        <span key={i} className="underline decoration-muted-foreground/20">{alt}{i < decision.alternatives.length - 1 ? ',' : ''}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
