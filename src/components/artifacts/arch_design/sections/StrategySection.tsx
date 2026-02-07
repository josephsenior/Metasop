'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { BookOpen, Layers, Share2, Database, Network, ShieldCheck, Zap } from "lucide-react"
import { PhilosophySection, BlueprintHeader } from "../sub-components"
import {
    containerVariants as container
} from "../../shared-components"

interface StrategySectionProps {
    summary?: string
    title?: string
    design_doc?: string
}

export function StrategySection({
    summary,
    title,
    design_doc
}: StrategySectionProps) {
    return (
        <TabsContent key="design" value="design" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show">
                <div className="w-full py-2">
                    <BlueprintHeader
                        summary={summary}
                        title={title}
                    />

                    {design_doc ? (
                        <div className="space-y-4">
                            {(() => {
                                const normalizedDoc = design_doc
                                    .replace(/\\n/g, '\n')
                                    .trim();

                                const rawSections = normalizedDoc
                                    .split(/\n(?=#+ )|^#+ /m)
                                    .filter(s => s.trim().length > 0);

                                const processedSections: { title: string; content: string }[] = [];
                                let pendingTitles: string[] = [];

                                rawSections.forEach(section => {
                                    const lines = section.trim().split('\n');
                                    const title = lines[0].replace(/^#+ /, '').trim();
                                    const content = lines.slice(1).join('\n').trim();

                                    if (!content) {
                                        pendingTitles.push(title);
                                    } else {
                                        const fullTitle = pendingTitles.length > 0
                                            ? `${pendingTitles.join(' › ')} › ${title}`
                                            : title;

                                        processedSections.push({ title: fullTitle, content });
                                        pendingTitles = [];
                                    }
                                });

                                if (processedSections.length === 0 && pendingTitles.length > 0) {
                                    processedSections.push({
                                        title: pendingTitles.join(' › '),
                                        content: normalizedDoc.replace(/^#+ .*\n?/gm, '').trim() || "Details pending documentation."
                                    });
                                }

                                return processedSections.map((section, idx) => {
                                    let icon = Layers;
                                    let color = "text-blue-600";

                                    const lowerTitle = section.title.toLowerCase();
                                    if (lowerTitle.includes('pattern') || lowerTitle.includes('style')) {
                                        icon = Share2;
                                        color = "text-purple-600";
                                    } else if (lowerTitle.includes('data') || lowerTitle.includes('state')) {
                                        icon = Database;
                                        color = "text-amber-600";
                                    } else if (lowerTitle.includes('flow') || lowerTitle.includes('process')) {
                                        icon = Network;
                                        color = "text-emerald-600";
                                    } else if (lowerTitle.includes('security') || lowerTitle.includes('risk')) {
                                        icon = ShieldCheck;
                                        color = "text-red-600";
                                    } else if (lowerTitle.includes('overview') || lowerTitle.includes('summary')) {
                                        icon = BookOpen;
                                        color = "text-blue-600";
                                    } else if (lowerTitle.includes('scale') || lowerTitle.includes('performance')) {
                                        icon = Zap;
                                        color = "text-amber-500";
                                    }

                                    return (
                                        <PhilosophySection
                                            key={idx}
                                            title={section.title}
                                            content={section.content}
                                            icon={icon}
                                            color={color}
                                        />
                                    );
                                });
                            })()}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-2xl bg-muted/5">
                            <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-medium">System Manifesto Pending</p>
                            <p className="text-[10px] opacity-60 mt-1">Foundational principles are being drafted by the architect.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </TabsContent>
    )
}
