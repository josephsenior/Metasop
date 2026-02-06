'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Map, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface OverviewSectionProps {
    summary?: string
    description?: string
    ui_multi_section?: boolean
    swot?: any
}

export function OverviewSection({
    summary,
    description,
    ui_multi_section,
    swot
}: OverviewSectionProps) {
    return (
        <TabsContent key="overview" value="overview" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                {summary && (
                    <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                Strategic Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className={cn("leading-relaxed text-muted-foreground text-xs")}>
                                {summary}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Map className="h-4 w-4 text-orange-500" />
                            Product Vision
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("leading-relaxed", styles.typography.body)}>
                            {description || "The product vision and high-level strategy for this implementation."}
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className={cn("border-none shadow-sm h-full md:col-span-2", styles.colors.bgCard)}>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Layers className="h-4 w-4 text-indigo-500" />
                                UI Architecture Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                                <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Navigation Pattern</div>
                                    <div className="text-sm font-bold text-foreground">{ui_multi_section ? "Multi-Section (Sidebar/Tabs)" : "Single-View Experience"}</div>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "font-mono text-[10px] h-6",
                                    ui_multi_section ? "border-indigo-500/30 text-indigo-600" : "border-amber-500/30 text-amber-600"
                                )}>
                                    {ui_multi_section ? "COMPLEX" : "LITE"}
                                </Badge>
                            </div>

                            {swot && (
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="p-2 rounded bg-muted/20 border border-emerald-500/10">
                                        <div className="text-[9px] font-bold text-emerald-600 uppercase">Strengths</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{swot.strengths?.length || 0} items</div>
                                    </div>
                                    <div className="p-2 rounded bg-muted/20 border border-red-500/10">
                                        <div className="text-[9px] font-bold text-red-600 uppercase">Weaknesses</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{swot.weaknesses?.length || 0} items</div>
                                    </div>
                                </div>
                            )}

                            <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                This strategy was determined by the PM to best serve the identified core workflows and user experience requirements.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </TabsContent>
    )
}
