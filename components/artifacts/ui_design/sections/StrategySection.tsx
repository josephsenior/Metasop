'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Layout, Search, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface StrategySectionProps {
    visualPhilosophy?: string
    layoutStrategy?: string
    informationArchitecture?: string
    responsiveStrategy?: string
}

export function StrategySection({
    visualPhilosophy,
    layoutStrategy,
    informationArchitecture,
    responsiveStrategy
}: StrategySectionProps) {
    return (
        <TabsContent key="strategy" value="strategy" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visualPhilosophy && (
                        <Card className={cn("border-indigo-500/20 bg-indigo-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-indigo-500/10 px-4 pt-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Target className="h-4 w-4 text-indigo-500" />
                                    Visual Philosophy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="text-xs text-foreground/80 leading-relaxed italic">
                                    "{visualPhilosophy}"
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {layoutStrategy && (
                        <Card className={cn("border-blue-500/20 bg-blue-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-blue-500/10 px-4 pt-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Layout className="h-4 w-4 text-blue-500" />
                                    Layout Strategy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="text-xs text-foreground/80 leading-relaxed">
                                    {layoutStrategy}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {informationArchitecture && (
                        <Card className={cn("border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-emerald-500/10 px-4 pt-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Search className="h-4 w-4 text-emerald-500" />
                                    Information Architecture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="text-xs text-foreground/80 leading-relaxed">
                                    {informationArchitecture}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {responsiveStrategy && (
                        <Card className={cn("border-purple-500/20 bg-purple-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-purple-500/10 px-4 pt-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-purple-500" />
                                    Responsive Strategy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="text-xs text-foreground/80 leading-relaxed">
                                    {responsiveStrategy}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </motion.div>
        </TabsContent>
    )
}
