'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface Threat {
    threat: string
    severity: string
    description?: string
    impact?: string
    likelihood?: string
    affected_components?: string[]
    mitigation?: string
    owasp_ref?: string
    cwe_ref?: string
}

interface ThreatModelSectionProps {
    threat_model: Threat[]
    getSeverityStyles: (severity: string) => string
}

export function ThreatModelSection({ threat_model, getSeverityStyles }: ThreatModelSectionProps) {
    return (
        <TabsContent key="threats" value="threats" className="m-0 outline-none">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                {threat_model.map((threat, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className={cn(
                            "group border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md",
                            styles.colors.bgCard, styles.colors.borderMuted
                        )}
                    >
                        <div className={cn("p-3 border-b flex justify-between items-center bg-muted/30", styles.colors.borderMuted)}>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-red-500" />
                                <span className="font-semibold text-sm">{threat.threat}</span>
                            </div>
                            <Badge variant="outline" className={cn("text-[9px] uppercase font-mono px-1.5", getSeverityStyles(threat.severity))}>
                                {threat.severity}
                            </Badge>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">{threat.description}</p>

                            <div className="grid grid-cols-2 gap-2">
                                {threat.impact && (
                                    <div className="bg-muted/30 p-2 rounded-lg border border-border/40">
                                        <div className="text-[9px] uppercase font-bold text-muted-foreground/60 mb-0.5">Impact</div>
                                        <div className="text-[10px] font-medium text-foreground capitalize">{threat.impact}</div>
                                    </div>
                                )}
                                {threat.likelihood && (
                                    <div className="bg-muted/30 p-2 rounded-lg border border-border/40">
                                        <div className="text-[9px] uppercase font-bold text-muted-foreground/60 mb-0.5">Likelihood</div>
                                        <div className="text-[10px] font-medium text-foreground capitalize">{threat.likelihood}</div>
                                    </div>
                                )}
                            </div>

                            {threat.affected_components && threat.affected_components.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="text-[9px] uppercase font-bold text-muted-foreground/60">Affected Components</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {threat.affected_components.map((comp, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-[9px] font-mono px-1.5 py-0 h-4 bg-red-500/5 text-red-600 border-red-500/10 dark:bg-red-500/10 dark:text-red-400">
                                                {comp}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(threat.owasp_ref || threat.cwe_ref) && (
                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/20">
                                    {threat.owasp_ref && (
                                        <Badge variant="outline" className="text-[8px] bg-amber-500/5 text-amber-600 border-amber-500/20 font-mono">
                                            {threat.owasp_ref}
                                        </Badge>
                                    )}
                                    {threat.cwe_ref && (
                                        <Badge variant="outline" className="text-[8px] bg-indigo-500/5 text-indigo-600 border-indigo-500/20 font-mono">
                                            {threat.cwe_ref}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {threat.mitigation && (
                                <div className="bg-muted/10 border border-emerald-500/10 rounded-lg p-2.5">
                                    <div className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1 mb-1">
                                        <ShieldCheck className="h-3 w-3" /> Mitigation
                                    </div>
                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed">{threat.mitigation}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
                {threat_model.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No threats identified.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
