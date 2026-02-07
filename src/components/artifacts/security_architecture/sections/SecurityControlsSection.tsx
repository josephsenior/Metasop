'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface SecurityControl {
    control?: string
    name?: string
    category?: string
    priority?: string
    type?: string
    description?: string
    implementation?: string
    id?: string
}

interface SecurityControlsSectionProps {
    security_controls: SecurityControl[]
}

export function SecurityControlsSection({ security_controls }: SecurityControlsSectionProps) {
    return (
        <TabsContent key="controls" value="controls" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {security_controls.map((control, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className="flex items-start gap-4 p-4 border rounded-xl bg-card hover:bg-muted/10 transition-colors shadow-sm"
                    >
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Shield className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold">{control.control || control.name}</h4>
                                    <div className="flex gap-1">
                                        {control.category && (
                                            <Badge variant="outline" className="text-[8px] font-mono opacity-60 uppercase">{control.category}</Badge>
                                        )}
                                        {control.priority && (
                                            <Badge variant="outline" className={cn(
                                                "text-[8px] font-mono uppercase",
                                                control.priority === 'high' ? "text-red-500 border-red-500/20" : "text-blue-500 border-blue-500/20"
                                            )}>P: {control.priority}</Badge>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-[9px] uppercase">{control.type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{control.description}</p>

                            {control.implementation && (
                                <div className="mt-2 p-2 rounded bg-blue-500/5 border border-blue-500/10">
                                    <div className="text-[9px] font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                                        <CheckCircle className="h-2.5 w-2.5" /> Implementation Detail
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                        {control.implementation}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    {control.id || `CTRL-${i + 1}`}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </TabsContent>
    )
}
