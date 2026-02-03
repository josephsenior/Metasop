'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle2, ScanSearch, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface SecurityPlanSectionProps {
    securityPlan: any
}

export function SecurityPlanSection({
    securityPlan
}: SecurityPlanSectionProps) {
    return (
        <TabsContent key="security" value="security" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {securityPlan ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className={cn("border-purple-500/20 shadow-sm", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-border/40 px-4 pt-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-purple-500" />
                                        Auth Verification
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-[9px] bg-purple-500/10 text-purple-600 border-purple-200">
                                        {securityPlan.auth_verification_steps?.length || 0} STEPS
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                {securityPlan.auth_verification_steps && securityPlan.auth_verification_steps.length > 0 ? (
                                    <ul className="space-y-2 mt-2">
                                        {securityPlan.auth_verification_steps.map((step: string, i: number) => (
                                            <motion.li variants={item} key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/30">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                <span>{step}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic py-4 text-center">No authentication verification steps defined.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className={cn("border-red-500/20 shadow-sm", styles.colors.bgCard)}>
                            <CardHeader className="pb-2 border-b border-border/40 px-4 pt-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <ScanSearch className="h-4 w-4 text-red-500" />
                                    Vulnerability Strategy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                                    <p className="text-xs text-foreground/80 leading-relaxed font-mono">
                                        {securityPlan.vulnerability_scan_strategy || "No strategy defined."}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                    <ShieldAlert className="h-3 w-3" />
                                    Security Audit Protocol
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No security plan defined.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
