'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Cpu } from "lucide-react"
import { artifactStyles as styles } from "../shared-styles"
import { itemVariants as item } from "../shared-components"

interface MarkdownTextProps {
    content: string
    className?: string
}

/**
 * Lightweight markdown renderer for bold text
 */
export function MarkdownText({ content, className }: MarkdownTextProps) {
    if (!content) return null;

    // Handle bold text **bold**
    const parts = content.split(/(\*\*.*?\*\*)/g);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <strong key={i} className="font-bold text-foreground">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                return part;
            })}
        </span>
    );
}

interface PhilosophySectionProps {
    title: string
    content?: string
    icon: any
    color: string
}

export function PhilosophySection({ title, content, icon: Icon, color }: PhilosophySectionProps) {
    const isPending = !content || !content.trim();

    return (
        <motion.div variants={item} className="mb-4">
            <Card className="border-border/50 shadow-sm overflow-hidden group relative">
                {/* Subtle Blueprint Grid Accent */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:15px_15px] group-hover:opacity-[0.05] transition-opacity" />

                <div className={cn("px-4 py-3 border-b flex items-center justify-between bg-muted/20", styles.colors.borderMuted)}>
                    <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", color)} />
                        <h4 className={cn("font-bold text-sm tracking-tight", color)}>
                            {title}
                        </h4>
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-tighter hidden sm:block">
                        Spec-{title.slice(0, 3).toUpperCase()}-{(Math.random() * 1000).toFixed(0)}
                    </div>
                </div>

                <div className="p-4 bg-card relative z-10">
                    {isPending ? (
                        <p className={cn("text-xs text-muted-foreground italic", styles.typography.bodySmall)}>
                            Implementation details pending for this section.
                        </p>
                    ) : (
                        <div className={cn("whitespace-pre-wrap leading-relaxed space-y-2", styles.typography.bodySmall, styles.colors.textMuted)}>
                            {content.trim().split('\n').map((line, i) => (
                                <p key={i}>
                                    <MarkdownText content={line} />
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* Technical Corner Indicator */}
                <div className="absolute bottom-0 right-0 w-8 h-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                    <div className="absolute bottom-1 right-1 w-full h-full border-b border-r border-blue-600 rounded-br-sm" />
                </div>
            </Card>
        </motion.div>
    );
}

interface BlueprintHeaderProps {
    summary?: string
    title?: string
}

export function BlueprintHeader({ summary, title }: BlueprintHeaderProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 mb-8 group">
            {/* Blueprint Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* Decorative Blueprint Corner (Top Right) */}
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="w-16 h-16 border-t-2 border-r-2 border-blue-500 rounded-tr-xl" />
                <div className="absolute top-1.5 right-1.5 w-10 h-10 border-t border-r border-blue-400 opacity-50" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:scale-105 transition-transform">
                        <Cpu className="h-5 w-5 text-blue-500 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black tracking-[0.2em] uppercase text-blue-600 dark:text-blue-400">Architectural Manifesto</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-wider">PROJECT-ID: MS-{(Math.random() * 9999).toFixed(0)}</p>
                            <div className="h-1 w-1 rounded-full bg-blue-500/30" />
                            <p className="text-[10px] text-blue-500/60 font-mono tracking-wider">REV: 01.A</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground/90">{title || "Foundational Engineering Specs"}</h2>
                    <p className={cn("italic leading-relaxed max-w-2xl", styles.typography.body, styles.colors.textMuted)}>
                        {summary || "The foundational engineering principles and systemic patterns governing the project's technical evolution."}
                    </p>
                </div>
            </div>
        </div>
    );
}
