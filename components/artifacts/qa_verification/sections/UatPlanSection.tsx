'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Target, CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface UatPlanSectionProps {
    manualUatPlan: any
}

export function UatPlanSection({
    manualUatPlan
}: UatPlanSectionProps) {
    return (
        <TabsContent key="uat" value="uat" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show">
                <Card className={cn("border-blue-500/20 bg-blue-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                    <CardHeader className="pb-2 border-b border-blue-500/10 px-4 pt-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            User Acceptance Testing (UAT) Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {manualUatPlan && typeof manualUatPlan === 'object' ? (
                            <>
                                {(manualUatPlan as any).scenarios && Array.isArray((manualUatPlan as any).scenarios) && (manualUatPlan as any).scenarios.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Target className="h-3.5 w-3.5" />
                                            UAT Scenarios
                                        </div>
                                        <ul className="space-y-2">
                                            {(manualUatPlan as any).scenarios.map((scenario: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/30">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                                    <span>{scenario}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {(manualUatPlan as any).acceptance_criteria && Array.isArray((manualUatPlan as any).acceptance_criteria) && (manualUatPlan as any).acceptance_criteria.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Acceptance Criteria
                                        </div>
                                        <ul className="space-y-2">
                                            {(manualUatPlan as any).acceptance_criteria.map((criterion: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/30">
                                                    <ChevronRight className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                                    <span>{criterion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {(manualUatPlan as any).stakeholders && Array.isArray((manualUatPlan as any).stakeholders) && (manualUatPlan as any).stakeholders.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <UserCheck className="h-3.5 w-3.5" />
                                            Stakeholders
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(manualUatPlan as any).stakeholders.map((stakeholder: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-[9px] border-blue-500/30 text-blue-600 bg-blue-500/5">
                                                    {stakeholder}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                {typeof manualUatPlan === 'string' ? manualUatPlan : "No UAT plan defined."}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    )
}
