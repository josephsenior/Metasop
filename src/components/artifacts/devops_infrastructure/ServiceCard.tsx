'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Cpu, Database, Network, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../shared-styles"
import { itemVariants as item } from "../shared-components"

interface ServiceCardProps {
    service: any
}

export function ServiceCard({ service }: ServiceCardProps) {
    const isCompute = service.type === 'compute'
    const isDatabase = service.type === 'database'
    const isNetworking = service.type === 'networking'

    return (
        <motion.div variants={item} className={cn(
            "group relative border p-4 rounded-xl shadow-sm transition-all flex flex-col h-full hover:shadow-md",
            styles.colors.bgCard, styles.colors.borderMuted
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2.5 rounded-xl border shadow-sm transition-all group-hover:scale-105",
                        isCompute ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
                            isDatabase ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" :
                                isNetworking ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                                    "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400"
                    )}>
                        {isCompute ? <Cpu className="h-5 w-5" /> :
                            isDatabase ? <Database className="h-5 w-5" /> :
                                isNetworking ? <Network className="h-5 w-5" /> :
                                    <Server className="h-5 w-5" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                            {service.name}
                        </h4>
                        <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 mt-1 uppercase bg-muted/50 text-muted-foreground border-border/50">
                            {service.type}
                        </Badge>
                    </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            </div>

            <p className={cn("flex-1 mb-4", styles.typography.bodySmall, styles.colors.textMuted)}>
                {service.description}
            </p>

            {service.configuration && Object.keys(service.configuration).length > 0 && (
                <div className="bg-muted/30 rounded-lg p-2.5 grid grid-cols-2 gap-2 border border-border/40">
                    {Object.entries(service.configuration).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-tight truncate">
                                {k.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-foreground truncate" title={String(v)}>
                                {String(v)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}
