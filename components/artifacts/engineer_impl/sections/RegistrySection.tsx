'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface RegistrySectionProps {
    dependencies: string[]
}

export function RegistrySection({
    dependencies
}: RegistrySectionProps) {
    return (
        <TabsContent key="deps" value="deps" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show">
                <Card className={cn("border-none shadow-none bg-transparent")}>
                    <CardHeader className="px-0 pt-0 pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Package className="h-4 w-4 text-emerald-500" />
                            Package Manifest
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        {dependencies.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {dependencies.map((dep: string, i: number) => (
                                    <motion.div
                                        key={i}
                                        variants={item}
                                        className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-lg border border-border/50 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-xs font-mono shadow-sm"
                                    >
                                        <Package className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500" />
                                        <span>{dep}</span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                                <p className="text-sm">No dependencies listed.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    )
}
