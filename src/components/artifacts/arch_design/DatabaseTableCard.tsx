'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Database, Key, ArrowRight } from "lucide-react"
import { artifactStyles as styles } from "../shared-styles"
import { itemVariants as item } from "../shared-components"

interface DatabaseTableCardProps {
    table: any
}

export function DatabaseTableCard({ table }: DatabaseTableCardProps) {
    return (
        <motion.div variants={item} className={cn(
            "overflow-hidden rounded-xl border shadow-sm h-full",
            styles.colors.bgCard, styles.colors.borderMuted
        )}>
            <div className="bg-purple-500/5 px-4 py-3 border-b border-purple-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-bold font-mono text-foreground">{table.name}</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono opacity-60">{table.columns?.length || 0} COLS</Badge>
            </div>

            <div className="p-3 space-y-3">
                {table.description && (
                    <p className={cn("italic", styles.typography.bodyTiny, styles.colors.textMuted)}>{table.description}</p>
                )}

                <div className="space-y-1">
                    {(table.columns || []).map((col: any, j: number) => (
                        <div key={j} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/30 text-[10px] font-mono group hover:bg-muted/50 transition-colors">
                            <span className={cn("text-foreground/80 flex items-center gap-1.5", col.constraints?.includes('PRIMARY KEY') ? "font-bold text-purple-600" : "")}>
                                {col.constraints?.includes('PRIMARY KEY') && <Key className="h-2.5 w-2.5" />}
                                {col.name}
                            </span>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground/40 italic">{col.description && `// ${col.description}`}</span>
                                    <span className="text-muted-foreground/60">{col.type}</span>
                                </div>
                                {col.constraints && col.constraints.length > 0 && (
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {col.constraints.filter((c: string) => c !== 'PRIMARY KEY').map((c: string, idx: number) => (
                                            <span key={idx} className="text-[8px] px-1 py-0 rounded bg-purple-500/10 text-purple-600/70 border border-purple-500/10 uppercase font-bold">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {table.indexes && table.indexes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Indexes</span>
                        <div className="flex flex-wrap gap-1.5">
                            {table.indexes.map((idx: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-[8px] font-mono opacity-70 bg-purple-500/5" title={idx.reason}>
                                    {idx.type?.toUpperCase() || 'BTREE'}: {idx.columns.join(', ')}
                                    {idx.reason && <span className="ml-1 opacity-50 italic">- {idx.reason}</span>}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {table.relationships && table.relationships.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Relationships</span>
                        <div className="space-y-2 text-[10px]">
                            {table.relationships.map((rel: any, idx: number) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ArrowRight className="h-2.5 w-2.5 text-purple-500" />
                                        <span className="font-mono">{rel.from}</span>
                                        <span className="text-[8px] opacity-40">➔</span>
                                        <span className="font-mono text-purple-500">{rel.to}</span>
                                        <span className="text-[8px] italic opacity-60">
                                            ({rel.type}{rel.through ? ` via ${rel.through}` : ''})
                                        </span>
                                    </div>
                                    {rel.description && (
                                        <div className="pl-4 text-[9px] text-muted-foreground/70 italic">
                                            {rel.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
