'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"
import { artifactStyles as styles } from "../shared-styles"
import { CopyButton, itemVariants as item } from "../shared-components"

interface ApiEndpointCardProps {
    api: any
}

export function ApiEndpointCard({ api }: ApiEndpointCardProps) {
    const methodColors = {
        GET: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
        POST: "text-blue-500 border-blue-500/20 bg-blue-500/5",
        PUT: "text-amber-500 border-amber-500/20 bg-amber-500/5",
        DELETE: "text-red-500 border-red-500/20 bg-red-500/5",
        PATCH: "text-purple-500 border-purple-500/20 bg-purple-500/5",
    }

    return (
        <motion.div variants={item} className={cn(
            "group relative flex flex-col p-4 rounded-xl border transition-all hover:shadow-md h-full",
            styles.colors.bgCard, styles.colors.borderMuted
        )}>
            <CopyButton text={`${api.method} ${api.path}`} />

            <div className="flex items-center justify-between mb-3 pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn(
                        "font-mono text-[10px] uppercase font-bold px-1.5 py-0.5",
                        (methodColors as any)[api.method] || "text-gray-500 border-gray-500/20 bg-gray-500/5"
                    )}>
                        {api.method}
                    </Badge>
                    <code className="text-[11px] font-mono font-bold text-foreground/80 break-all">{api.path}</code>
                </div>
                {api.auth_required && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium px-1.5 py-0.5 rounded bg-amber-500/10">
                        <Lock className="h-2.5 w-2.5" /> Auth
                    </div>
                )}
            </div>

            <p className={cn("flex-1 mb-4", styles.typography.bodySmall, styles.colors.textMuted)}>
                {api.description}
            </p>

            <div className="space-y-2 pt-3 border-t border-border/20">
                {api.rate_limit && (
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Rate Limit:</span>
                        <span className="font-medium text-foreground">{api.rate_limit}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/20">
                {['request_schema', 'response_schema'].map((schemaKey) => {
                    const raw = api[schemaKey]
                    if (!raw) return null

                    let content = raw
                    if (typeof raw === 'string') {
                        try {
                            content = JSON.parse(raw)
                        } catch {
                            content = raw // Fallback to raw string
                        }
                    }

                    const isObj = typeof content === 'object' && content !== null

                    return (
                        <div key={schemaKey} className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                                {schemaKey.replace('_schema', '')} Body
                            </span>
                            <div className="bg-muted/40 rounded p-2 text-[10px] font-mono overflow-hidden">
                                {isObj ? (
                                    <div className="space-y-0.5">
                                        {Object.entries(content).map(([k, v]: [string, any]) => (
                                            <div key={k} className="flex gap-1">
                                                <span className="text-blue-600 dark:text-blue-400">{k}:</span>
                                                <span className="text-muted-foreground truncate">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="break-all text-muted-foreground">{String(content)}</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    )
}
