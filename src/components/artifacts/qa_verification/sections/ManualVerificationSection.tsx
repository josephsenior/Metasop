'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MousePointerClick } from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../../shared-styles"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface ManualVerificationSectionProps {
    manualVerification: string[]
}

export function ManualVerificationSection({
    manualVerification
}: ManualVerificationSectionProps) {
    return (
        <TabsContent key="manual" value="manual" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show">
                <Card className={cn("border-border/50 shadow-sm", styles.colors.bgCard)}>
                    <CardHeader className="pb-2 border-b border-border/40 px-4 pt-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <MousePointerClick className="h-4 w-4 text-blue-500" />
                            Manual Verification Checklist
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid gap-2">
                            {manualVerification.map((step: string, i: number) => (
                                <motion.div
                                    variants={item}
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/40 transition-colors group"
                                >
                                    <div className="flex-none h-5 w-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all" />
                                    <span className="text-xs text-foreground/90 font-medium">{step}</span>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    )
}
