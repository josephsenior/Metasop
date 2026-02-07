'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container
} from "../../shared-components"

interface SitemapSectionProps {
    websiteLayout?: {
        pages?: any[]
    }
}

export function SitemapSection({ websiteLayout }: SitemapSectionProps) {
    return (
        <TabsContent key="sitemap" value="sitemap" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {websiteLayout?.pages?.map((page: any, idx: number) => (
                        <Card key={idx} className={cn("border-border/50 overflow-hidden", styles.colors.bgCard)}>
                            <div className="h-1 bg-primary/20 w-full" />
                            <CardHeader className="pb-2 px-4 pt-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold text-foreground">{page.name}</CardTitle>
                                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{page.route}</div>
                                </div>
                                <Badge variant="outline" className="text-[8px] uppercase h-5">Page</Badge>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-2">
                                <div className="flex flex-col gap-3">
                                    {page.sections?.map((section: any, sIdx: number) => {
                                        const sectionName = typeof section === 'string' ? section : section.name;
                                        const components = typeof section === 'object' ? section.components : [];

                                        return (
                                            <div key={sIdx} className="space-y-1.5">
                                                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded border border-border/40 group hover:border-primary/30 transition-colors">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary" />
                                                    <span className="text-[10px] font-medium text-foreground/80">{sectionName}</span>
                                                </div>
                                                {components && components.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 pl-3">
                                                        {components.map((comp: string, cIdx: number) => (
                                                            <span key={cIdx} className="text-[8px] font-mono text-muted-foreground/70 bg-muted/10 px-1 py-0.5 rounded border border-border/10">
                                                                {comp}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </TabsContent>
    )
}
