'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ShieldAlert, TrendingUp, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface SWOTSectionProps {
    swot: {
        strengths: string[]
        weaknesses: string[]
        opportunities: string[]
        threats: string[]
    }
}

export function SWOTSection({ swot }: SWOTSectionProps) {
    if (!swot) return null

    const sections = [
        { label: "Strengths", items: swot.strengths, color: "emerald", icon: Zap },
        { label: "Weaknesses", items: swot.weaknesses, color: "red", icon: ShieldAlert },
        { label: "Opportunities", items: swot.opportunities, color: "blue", icon: TrendingUp },
        { label: "Threats", items: swot.threats, color: "amber", icon: Ban },
    ]

    return (
        <TabsContent key="swot" value="swot" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section) => (
                    <motion.div key={section.label} variants={item}>
                        <Card className="h-full border border-border/40 bg-card overflow-hidden">
                            <div className={cn("h-1 w-full",
                                section.color === "emerald" ? "bg-emerald-500/40" :
                                    section.color === "red" ? "bg-red-500/40" :
                                        section.color === "blue" ? "bg-blue-500/40" : "bg-amber-500/40"
                            )} />
                            <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between">
                                <CardTitle className={cn("text-xs font-black uppercase tracking-widest",
                                    section.color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
                                        section.color === "red" ? "text-red-600 dark:text-red-400" :
                                            section.color === "blue" ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"
                                )}>
                                    {section.label}
                                </CardTitle>
                                <section.icon className={cn("h-4 w-4",
                                    section.color === "emerald" ? "text-emerald-500/50" :
                                        section.color === "red" ? "text-red-500/50" :
                                            section.color === "blue" ? "text-blue-500/50" : "text-amber-500/50"
                                )} />
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-0">
                                <ul className="space-y-3">
                                    {section.items?.map((itemSnippet: string, i: number) => (
                                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-3 group">
                                            <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-150",
                                                section.color === "emerald" ? "bg-emerald-500/50" :
                                                    section.color === "red" ? "bg-red-500/50" :
                                                        section.color === "blue" ? "bg-blue-500/50" : "bg-amber-500/50"
                                            )} />
                                            <span className="leading-relaxed">{itemSnippet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </TabsContent>
    )
}
