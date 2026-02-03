'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Type, Box, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

function ColorTokenCard({ name, value }: { name: string, value: string }) {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(`var(--${name})`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.div variants={item} className="group flex flex-col items-center">
            <div
                className="h-16 w-16 rounded-2xl border border-border shadow-soft group-hover:scale-110 transition-transform cursor-pointer relative flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: value }}
                onClick={handleCopy}
            >
                <div className="absolute inset-0 bg-black/10 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {copied ? <Check className="h-4 w-4 text-white drop-shadow-md" /> : <Copy className="h-4 w-4 text-white drop-shadow-md" />}
                </div>
            </div>
            <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter text-foreground/80 truncate max-w-full px-1">{name}</span>
            <span className="text-[9px] text-muted-foreground font-mono">{value}</span>
        </motion.div>
    )
}

interface TokensSectionProps {
    designTokens: any
}

export function TokensSection({ designTokens }: TokensSectionProps) {
    return (
        <TabsContent key="tokens" value="tokens" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Colors */}
                    <Card className={cn("border-border/50", styles.colors.bgCard)}>
                        <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <Palette className="h-4 w-4 text-indigo-500" />
                                Color Palette
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-4 pb-4">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {designTokens.colors && Object.entries(designTokens.colors).map(([name, value]: [string, any]) => (
                                    <ColorTokenCard key={name} name={name} value={value} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Typography */}
                    <Card className={cn("border-border/50", styles.colors.bgCard)}>
                        <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <Type className="h-4 w-4 text-purple-500" />
                                Typography Specimen
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-4 pb-4 space-y-4">
                            <div className="space-y-2 p-4 bg-muted/10 rounded-lg border border-border/40">
                                <div className="text-2xl font-bold tracking-tighter text-foreground">Aα Bβ Cγ</div>
                                <p className="text-sm text-muted-foreground leading-relaxed">The quick brown fox jumps over the lazy dog.</p>
                                <div className="flex gap-2">
                                    {designTokens?.typography?.fontFamily && (
                                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block border border-border/40">
                                            Body: {designTokens.typography.fontFamily}
                                        </div>
                                    )}
                                    {designTokens?.typography?.headingFont && (
                                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block border border-border/40">
                                            Headings: {designTokens.typography.headingFont}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scales</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {designTokens.typography?.fontSize && Object.entries(designTokens.typography.fontSize).map(([k, v]: [string, any]) => (
                                            <Badge key={k} variant="secondary" className="text-[9px] font-mono">{k}:{v}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Weights</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {designTokens.typography?.fontWeight && Object.entries(designTokens.typography.fontWeight).map(([k, v]: [string, any]) => (
                                            <Badge key={k} variant="outline" className="text-[9px] font-mono">{k}:{v}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Spacing & Effects */}
                {(designTokens.spacing || designTokens.borderRadius || designTokens.shadows) && (
                    <Card className={cn("border-border/50", styles.colors.bgCard)}>
                        <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <Box className="h-4 w-4 text-amber-500" />
                                Effects & Geometry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {designTokens.spacing && (
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Spacing Scale</span>
                                        <div className="flex items-end gap-2 justify-start h-16">
                                            {Object.entries(designTokens.spacing).slice(0, 8).map(([k, v]: [string, any], i: number) => {
                                                const size = parseInt(v as string) * 2 || (i + 1) * 8
                                                return (
                                                    <div key={k} className="flex flex-col items-center gap-1.5 group">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: Math.min(size, 48) }}
                                                            className="w-4 bg-indigo-500/40 rounded-t-sm group-hover:bg-indigo-500 transition-colors"
                                                        />
                                                        <div className="text-[8px] font-mono text-muted-foreground">{k}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                                {designTokens.borderRadius && (
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Border Radius</span>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(designTokens.borderRadius).map(([k, v]: [string, any]) => (
                                                <div key={k} className="flex flex-col items-center gap-1">
                                                    <div className="w-8 h-8 border border-foreground/20 bg-muted/20" style={{ borderRadius: v }} />
                                                    <span className="text-[8px] font-mono text-muted-foreground">{k}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {designTokens.shadows && (
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shadows & Elevation</span>
                                        <div className="flex flex-wrap gap-4">
                                            {Object.entries(designTokens.shadows).map(([k, v]: [string, any]) => (
                                                <div key={k} className="flex flex-col items-center gap-2 group">
                                                    <div
                                                        className="w-10 h-10 border border-border bg-card rounded-lg transition-transform group-hover:scale-110"
                                                        style={{ boxShadow: v as string }}
                                                    />
                                                    <span className="text-[8px] font-mono text-muted-foreground">{k}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </TabsContent>
    )
}
