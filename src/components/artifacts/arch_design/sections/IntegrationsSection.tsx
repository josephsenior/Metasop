'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Lock, BookOpen } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface IntegrationsSectionProps {
    integrationPoints: any[]
}

export function IntegrationsSection({ integrationPoints }: IntegrationsSectionProps) {
    return (
        <TabsContent key="integrations" value="integrations" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {integrationPoints.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {integrationPoints.map((point: any, i: number) => (
                            <Card key={i} className="bg-card border-border/50 hover:border-purple-500/30 transition-all group overflow-hidden">
                                <div className="h-1 w-full bg-purple-500/20 group-hover:bg-purple-500/40 transition-colors" />
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                                                <Share2 className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="font-bold text-sm tracking-tight">{point.service}</div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-10">
                                        {point.purpose || point.description || "External system integration."}
                                    </p>

                                    <div className="space-y-2 pt-3 border-t border-border/20">
                                        {point.authentication && (
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                                                    <Lock className="h-2.5 w-2.5" />
                                                    <span className="uppercase tracking-tight">Auth:</span>
                                                </div>
                                                <span className="text-muted-foreground font-medium">{point.authentication}</span>
                                            </div>
                                        )}
                                        {point.api_docs && (
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5 text-blue-500 font-medium">
                                                    <BookOpen className="h-2.5 w-2.5" />
                                                    <span className="uppercase tracking-tight">Docs:</span>
                                                </div>
                                                <a
                                                    href={point.api_docs}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline font-mono truncate max-w-[150px]"
                                                >
                                                    {new URL(point.api_docs).hostname}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/30 rounded-xl bg-muted/5">
                        <Share2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No external integrations defined.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
