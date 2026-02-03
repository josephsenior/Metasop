'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { ShieldCheck, Lock, Zap, Layers, Database, Settings, Cpu } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface AdvancedSectionProps {
    securityConsiderations: string[]
    scalabilityApproach: any
}

export function AdvancedSection({ securityConsiderations, scalabilityApproach }: AdvancedSectionProps) {
    return (
        <TabsContent key="advanced" value="advanced" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

                {securityConsiderations.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-red-500" /> Security Considerations
                        </h3>
                        <div className="grid gap-2">
                            {securityConsiderations.map((sec: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                    <Lock className="h-3 w-3 mt-0.5 text-red-500" />
                                    <span>{sec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {scalabilityApproach && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" /> Scalability & Performance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(scalabilityApproach || {}).map(([key, val]) => {
                                if (!val) return null;

                                const icons: Record<string, any> = {
                                    horizontal_scaling: Layers,
                                    database_scaling: Database,
                                    caching_strategy: Zap,
                                    performance_targets: Cpu
                                };
                                const Icon = icons[key] || Settings;

                                return (
                                    <div key={key} className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded bg-amber-500/10 flex items-center justify-center">
                                                <Icon className="h-3 w-3 text-amber-600" />
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                                                {key.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                        {typeof val === 'object' ? (
                                            <div className="space-y-1.5 pl-7">
                                                {Object.entries(val as object).map(([subKey, subVal]) => (
                                                    <div key={subKey} className="text-[11px] leading-relaxed">
                                                        <span className="text-amber-600/80 font-bold uppercase text-[9px] mr-1">{subKey.replace(/_/g, ' ')}:</span>
                                                        <span className="text-muted-foreground">{String(subVal)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                                                {String(val)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
