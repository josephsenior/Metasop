'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface AccessibilityPlanSectionProps {
    accessibilityPlan: any
}

export function AccessibilityPlanSection({
    accessibilityPlan
}: AccessibilityPlanSectionProps) {
    return (
        <TabsContent key="accessibility" value="accessibility" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {accessibilityPlan && typeof accessibilityPlan === 'object' ? (
                    <>
                        <Card className={cn("border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-emerald-500/10 px-4 pt-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-emerald-500" />
                                    WCAG Compliance & Accessibility Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {(accessibilityPlan as any).standard && (
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                            {(accessibilityPlan as any).standard}
                                        </Badge>
                                    </div>
                                )}

                                {(accessibilityPlan as any).automated_tools && Array.isArray((accessibilityPlan as any).automated_tools) && (accessibilityPlan as any).automated_tools.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Automated Tools</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(accessibilityPlan as any).automated_tools.map((tool: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                                    {tool}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(accessibilityPlan as any).manual_checks && Array.isArray((accessibilityPlan as any).manual_checks) && (accessibilityPlan as any).manual_checks.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manual Checks</div>
                                        <ul className="space-y-2">
                                            {(accessibilityPlan as any).manual_checks.map((check: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                                    <span>{check}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {(accessibilityPlan as any).screen_readers && Array.isArray((accessibilityPlan as any).screen_readers) && (accessibilityPlan as any).screen_readers.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Screen Readers</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(accessibilityPlan as any).screen_readers.map((reader: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                                    {reader}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card className={cn("border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                        <CardHeader className="pb-2 border-b border-emerald-500/10 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="h-4 w-4 text-emerald-500" />
                                WCAG Compliance & Accessibility Plan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                {typeof accessibilityPlan === 'string' ? accessibilityPlan : "No specific accessibility plan defined."}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </TabsContent>
    )
}
