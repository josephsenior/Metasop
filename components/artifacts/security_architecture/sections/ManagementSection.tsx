'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Activity, AlertTriangle } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface ManagementSectionProps {
    vulnerability_management: any
    security_monitoring: any
}

export function ManagementSection({ vulnerability_management, security_monitoring }: ManagementSectionProps) {
    return (
        <TabsContent key="management" value="management" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vulnerability_management && (
                    <Card className="border-none shadow-sm bg-card h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Eye className="h-4 w-4 text-pink-500" />
                                Vulnerability Mgmt
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                <span className="text-muted-foreground">Scan Frequency</span>
                                <span className="font-medium">{vulnerability_management.scanning_frequency || "Not specified"}</span>
                            </div>
                            {vulnerability_management.remediation_sla && (
                                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                    <span className="text-muted-foreground">Remediation SLA</span>
                                    <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5">
                                        {vulnerability_management.remediation_sla}
                                    </Badge>
                                </div>
                            )}
                            {vulnerability_management.tools && vulnerability_management.tools.length > 0 && (
                                <div className="space-y-1 pt-2">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold">Tools</div>
                                    <div className="flex flex-wrap gap-1">
                                        {vulnerability_management.tools.map((t: string, i: number) => (
                                            <Badge key={i} variant="outline" className="text-[9px] font-mono px-1">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {security_monitoring && (
                    <Card className="border-none shadow-sm bg-card h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-orange-500" />
                                Monitoring
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {security_monitoring.siem_solution && (
                                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                    <span className="text-muted-foreground">SIEM Solution</span>
                                    <span className="font-medium">{security_monitoring.siem_solution}</span>
                                </div>
                            )}
                            {security_monitoring.logging_strategy && (
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold">Logging Strategy</div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/20 border border-border/30 rounded-lg p-2 italic">
                                        {security_monitoring.logging_strategy}
                                    </p>
                                </div>
                            )}
                            {security_monitoring.alerting_thresholds && (
                                <div className="space-y-1 pt-2 border-t border-border/40">
                                    <div className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                                        Alert Thresholds
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {security_monitoring.alerting_thresholds}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </TabsContent>
    )
}
