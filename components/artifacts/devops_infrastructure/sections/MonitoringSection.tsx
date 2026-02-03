'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Activity, Terminal, Server, Zap } from "lucide-react"
import { TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { containerVariants as container } from "../../shared-components"

interface MonitoringSectionProps {
    monitoring: any
    scaling: any
}

export function MonitoringSection({ monitoring, scaling }: MonitoringSectionProps) {
    return (
        <TabsContent key="monitor" value="monitor" className="m-0 outline-none space-y-4">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="h-full">
                    <div className="p-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        <h3 className="text-sm font-semibold">Alerting Rules</h3>
                    </div>
                    <div className="p-0">
                        {monitoring?.alerts?.map((alert: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        alert.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                            alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                    )} />
                                    <div>
                                        <div className="text-sm font-medium leading-none mb-1">{alert.name}</div>
                                        <div className="text-[10px] font-mono text-muted-foreground">{alert.condition}</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "text-[9px] uppercase font-bold",
                                    alert.severity === 'critical' ? 'text-red-600 border-red-200 bg-red-50' :
                                        alert.severity === 'warning' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                            'text-blue-600 border-blue-200 bg-blue-50'
                                )}>
                                    {alert.severity || 'info'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="space-y-4 h-full">
                    <Card className="h-full border-border/60 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-border/40 bg-zinc-950 flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-semibold text-zinc-100 font-mono">Observability Stack</h3>
                        </div>
                        <div className="p-4 bg-zinc-950 min-h-[300px] font-mono text-xs space-y-6">
                            {monitoring?.metrics && monitoring.metrics.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                        <Activity className="h-3 w-3" />
                                        SLOs & Metrics
                                    </div>
                                    <div className="grid gap-2">
                                        {monitoring.metrics.map((m: any, i: number) => (
                                            <div key={i} className="group flex items-center justify-between bg-zinc-900/50 p-2.5 rounded border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-emerald-400 font-bold uppercase text-[9px]">{m.name}</span>
                                                    <span className="text-zinc-400 text-[10px]">{m.threshold}</span>
                                                </div>
                                                <div className="text-zinc-500 text-[9px] italic text-right">
                                                    {m.action}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {monitoring?.tools && monitoring.tools.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                        <Server className="h-3 w-3" />
                                        Monitoring Stack
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {monitoring.tools.map((tool: string, i: number) => (
                                            <Badge key={i} variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-400 font-mono text-[10px]">
                                                {tool}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 pt-2">
                                <div className="space-y-2">
                                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Logging Pipeline</div>
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500 text-[9px] uppercase font-bold">Retention</span>
                                            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-300 font-mono">
                                                {monitoring?.logging?.retention || '30 days'}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-zinc-500 text-[9px] uppercase font-bold block">Log Stack</span>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {monitoring?.logging?.tools?.map((t: string, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {scaling?.auto_scaling && (
                            <div className="lg:col-span-5 border-t border-zinc-800 p-4 bg-zinc-900/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Auto-Scaling Configuration</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Replicas</div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-400">Min/Max</span>
                                            <span className="text-sm font-mono text-zinc-100">{scaling.auto_scaling.min_replicas} - {scaling.auto_scaling.max_replicas}</span>
                                        </div>
                                    </div>
                                    {scaling.auto_scaling.metrics && (
                                        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Metrics</div>
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(scaling.auto_scaling.metrics).map(([k, v]: [string, any]) => (
                                                    <Badge key={k} variant="outline" className="text-[9px] border-zinc-700 text-zinc-400 font-mono">
                                                        {k}: {typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {scaling.auto_scaling.triggers && scaling.auto_scaling.triggers.length > 0 && (
                                        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2 md:col-span-1">
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Triggers</div>
                                            <div className="space-y-1.5">
                                                {scaling.auto_scaling.triggers.map((t: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                                                        <span className="font-bold text-amber-500/70">{t.type}</span>
                                                        <span>{t.threshold}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </motion.div>
        </TabsContent>
    );
}
