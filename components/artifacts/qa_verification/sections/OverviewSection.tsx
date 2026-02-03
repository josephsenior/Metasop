'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Map, Layers, ChevronRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface OverviewSectionProps {
    description?: string
    testStrategy: any
}

export function OverviewSection({
    description,
    testStrategy
}: OverviewSectionProps) {
    return (
        <TabsContent key="overview" value="overview" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Map className="h-4 w-4 text-purple-500" />
                            QA Philosophy & Approach
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("leading-relaxed", styles.typography.body)}>
                            {description || "Comprehensive quality assurance strategy designed to ensure maximum system reliability and performance."}
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Layers className="h-4 w-4 text-blue-500" />
                                Testing Methodology
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-3">
                                <div className="flex items-center gap-2">
                                    <ChevronRight className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Core Approach</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {testStrategy.approach || "Layered verification strategy covering unit, integration, and E2E flows."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    { label: 'Unit', val: testStrategy.unit },
                                    { label: 'Integration', val: testStrategy.integration },
                                    { label: 'E2E', val: testStrategy.e2e }
                                ].map((item) => (
                                    <div key={item.label} className="bg-muted/30 p-3 rounded-lg border border-border/40 flex flex-col gap-2">
                                        <div className="text-[9px] uppercase font-bold text-muted-foreground">{item.label}</div>
                                        <p className="text-[10px] leading-snug text-foreground/90 font-medium">
                                            {item.val || "Standard Compliance"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Tooling Ecosystem
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                The following tools have been selected to provide maximum coverage and precise feedback loops during the development lifecycle.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {testStrategy.tools?.map((tool: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-amber-500/5 text-amber-700 border-amber-500/20 px-2 py-1">
                                        {tool}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </TabsContent>
    )
}
