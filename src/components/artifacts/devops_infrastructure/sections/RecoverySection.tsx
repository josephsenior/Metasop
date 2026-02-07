'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Clock, HardDrive, RefreshCcw, Activity } from "lucide-react"
import { TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { containerVariants as container } from "../../shared-components"

interface RecoverySectionProps {
    disaster_recovery: any
}

export function RecoverySection({ disaster_recovery }: RecoverySectionProps) {
    return (
        <TabsContent key="recovery" value="recovery" className="m-0 outline-none space-y-4">
            <motion.div variants={container} initial="hidden" animate="show">
                <Card className="border-red-500/30 bg-black shadow-2xl overflow-hidden relative group">
                    {/* Subtle Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ef4444_0.5px,transparent_0.5px)] bg-size-[16px_16px]" />

                    <div className="p-5 border-b border-red-500/20 flex items-center justify-between relative z-10 bg-black/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-white/90">Disaster Recovery Plan</h3>
                                <p className="text-[10px] text-red-500/60 font-mono tracking-widest uppercase">Emergency Protocol // Level 1</p>
                            </div>
                        </div>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] uppercase font-bold tracking-wider">
                            Critical Path
                        </Badge>
                    </div>

                    <div className="p-6 grid gap-6 md:grid-cols-2 relative z-10">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 shadow-inner flex flex-col gap-2 group/card hover:bg-zinc-900/80 transition-colors">
                                    <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase font-black tracking-widest">
                                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                                        RTO
                                    </div>
                                    <div className="text-2xl font-black text-white">{disaster_recovery?.rto || "—"}</div>
                                    <div className="text-[10px] text-white/20 font-medium">Recovery Time Objective</div>
                                </div>
                                <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 shadow-inner flex flex-col gap-2 group/card hover:bg-zinc-900/80 transition-colors">
                                    <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase font-black tracking-widest">
                                        <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                                        RPO
                                    </div>
                                    <div className="text-2xl font-black text-white">{disaster_recovery?.rpo || "—"}</div>
                                    <div className="text-[10px] text-white/20 font-medium">Recovery Point Objective</div>
                                </div>
                            </div>

                            <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 shadow-inner space-y-3 group/card hover:bg-zinc-900/60 transition-colors">
                                <div className="flex items-center gap-2 text-amber-500/90 font-bold text-xs uppercase tracking-wider">
                                    <RefreshCcw className="h-3.5 w-3.5" />
                                    Backup Strategy
                                </div>
                                <p className="text-xs text-white/70 leading-relaxed font-medium">
                                    {disaster_recovery?.backup_strategy || "No backup strategy defined."}
                                </p>
                            </div>
                        </div>

                        <div className="bg-zinc-900/40 p-5 rounded-xl border border-white/5 shadow-inner space-y-4 group/card hover:bg-zinc-900/60 transition-colors">
                            <div className="flex items-center gap-2 text-red-500/90 font-bold text-xs uppercase tracking-wider">
                                <Activity className="h-3.5 w-3.5" />
                                Failover Plan
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed font-medium">
                                {disaster_recovery?.failover_plan || "No failover plan defined."}
                            </p>

                            <div className="pt-4 border-t border-white/5 mt-4">
                                <div className="flex items-center gap-2 text-blue-400/60 text-[9px] font-mono tracking-tighter">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    MONITORING SYSTEM ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </TabsContent>
    );
}
