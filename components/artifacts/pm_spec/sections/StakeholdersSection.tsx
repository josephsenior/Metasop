'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface StakeholdersSectionProps {
    stakeholders: any[]
}

export function StakeholdersSection({ stakeholders }: StakeholdersSectionProps) {
    return (
        <TabsContent key="stakeholders" value="stakeholders" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 md:grid-cols-2">
                {stakeholders?.map((s: any, i: number) => (
                    <motion.div key={i} variants={item} className="p-4 rounded-xl border border-border/50 bg-card hover:border-blue-500/30 transition-all flex flex-col gap-4 group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted/20 border border-blue-500/10 flex items-center justify-center shrink-0">
                                    <Users className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-foreground">{s.role}</div>
                                    <div className="text-xs text-muted-foreground">Stakeholder</div>
                                </div>
                            </div>
                            <Badge variant="outline" className={cn(
                                "capitalize",
                                s.influence === 'high' ? "text-purple-500 border-purple-500/20" :
                                    s.influence === 'low' ? "text-slate-500 border-slate-500/20" :
                                        "text-blue-500 border-blue-500/20"
                            )}>
                                {s.influence} Influence
                            </Badge>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground italic border border-border/20">
                            "{s.interest}"
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </TabsContent>
    )
}
