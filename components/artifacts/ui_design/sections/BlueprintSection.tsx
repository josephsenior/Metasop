'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Laptop, Smartphone, Tablet, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface BlueprintSectionProps {
    layoutBreakpoints?: any
    componentSpecs: any[]
}

export function BlueprintSection({
    layoutBreakpoints,
    componentSpecs
}: BlueprintSectionProps) {
    return (
        <TabsContent key="arch" value="arch" className="m-0 outline-none">
            {layoutBreakpoints && (
                <Card className="mb-4 bg-muted/20 border-border/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-px h-full bg-linear-to-b from-transparent via-blue-500/20 to-transparent" />
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between relative z-10">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Laptop className="h-4 w-4 text-primary" />
                                Responsive Breakpoints
                            </h4>
                            <p className="text-[10px] text-muted-foreground">Layout adaptation strategy</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 justify-center md:justify-end">
                            {[
                                { k: 'sm', icon: Smartphone, w: 'w-6' },
                                { k: 'md', icon: Tablet, w: 'w-8' },
                                { k: 'lg', icon: Laptop, w: 'w-10' },
                                { k: 'xl', icon: Monitor, w: 'w-12' },
                                { k: '2xl', icon: Monitor, w: 'w-16' }
                            ].map((bp) => {
                                const val = (layoutBreakpoints as any)[bp.k]
                                if (!val) return null
                                return (
                                    <div key={bp.k} className="flex flex-col items-center gap-1.5 p-2 bg-background/50 rounded-lg border border-border/50 min-w-[70px]">
                                        <bp.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-bold font-mono">{val}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase">{bp.k}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Card>
            )}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {componentSpecs.map((spec: any, i: number) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className={cn("bg-card border border-border/50 p-4 rounded-xl shadow-sm hover:border-primary/20 transition-all", styles.colors.bgCard)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold">{spec.name}</h4>
                            <Badge variant="outline" className="text-[9px]">{spec.type || 'Component'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{spec.description}</p>
                        <div className="space-y-2 pt-2 border-t border-border/40">
                            {spec.props && Array.isArray(spec.props) && (
                                <div className="grid grid-cols-1 gap-2 text-[10px]">
                                    {spec.props.map((p: any, idx: number) => (
                                        <div key={idx} className="flex flex-col gap-1 bg-muted/30 px-2 py-2 rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono font-bold text-foreground">{p.name}</span>
                                                <Badge variant="outline" className="text-[8px] h-4 uppercase">{p.type}</Badge>
                                            </div>
                                            {p.description && <p className="text-muted-foreground/80 italic">{p.description}</p>}
                                            {p.default && <div className="text-[8px] text-muted-foreground/60 mt-0.5">Default: <span className="font-mono">{p.default}</span></div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {spec.variants?.map((v: string) => (
                                    <Badge key={v} variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary/60 border-primary/10">Variant: {v}</Badge>
                                ))}
                                {spec.states?.map((s: string) => (
                                    <Badge key={s} variant="outline" className="text-[8px] h-4 bg-amber-500/5 text-amber-600/70 border-amber-500/10">State: {s}</Badge>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </TabsContent>
    )
}
