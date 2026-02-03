'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accessibility, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface AccessibilitySectionProps {
    accessibility?: any
}

export function AccessibilitySection({ accessibility }: AccessibilitySectionProps) {
    return (
        <TabsContent key="accessibility" value="accessibility" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show">
                <Card className={cn("border-border/50", styles.colors.bgCard)}>
                    <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Accessibility className="h-4 w-4 text-emerald-500" />
                            Accessibility Guidelines
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {accessibility ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/40">
                                        <span className="text-xs font-medium">Compliance Standard</span>
                                        {((accessibility as any).standard || accessibility.wcag_level) && (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                {(accessibility as any).standard || `WCAG ${accessibility.wcag_level}`}
                                            </Badge>
                                        )}
                                    </div>

                                    {Array.isArray((accessibility as any).guidelines) && (
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Key Guidelines</span>
                                            {(accessibility as any).guidelines.map((guide: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-card border border-border/40">
                                                    <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                    <span className="text-muted-foreground leading-relaxed">{guide}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {[
                                            { k: 'aria_labels', l: 'ARIA Labels' },
                                            { k: 'keyboard_navigation', l: 'Keyboard Nav' },
                                            { k: 'screen_reader_support', l: 'Screen Reader' },
                                            { k: 'focus_indicators', l: 'Focus Ring' }
                                        ].map((feat, idx) => {
                                            const enabled = (accessibility as any)[feat.k]
                                            if (!enabled) return null
                                            return (
                                                <Badge key={idx} variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[9px] gap-1 px-1.5 h-5">
                                                    <Check className="h-2.5 w-2.5" /> {feat.l}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                    {Array.isArray((accessibility as any).checklist) && (
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Checklist</span>
                                            {(accessibility as any).checklist.map((item: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground italic">
                                No accessibility guidelines defined.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    )
}
