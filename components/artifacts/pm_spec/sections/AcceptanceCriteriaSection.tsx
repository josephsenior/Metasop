'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container
} from "../../shared-components"

interface AcceptanceCriteriaSectionProps {
    acceptance: any[]
    CriteriaCard: React.ComponentType<{ criteria: any, index: number }>
}

export function AcceptanceCriteriaSection({
    acceptance,
    CriteriaCard
}: AcceptanceCriteriaSectionProps) {
    return (
        <TabsContent key="acceptance" value="acceptance" className="m-0 outline-none">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
            >
                <Card className={cn("overflow-hidden border-none shadow-none bg-transparent")}>
                    <CardHeader className="px-0 pt-0 pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Global Definition of Done
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        {acceptance.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-xs text-muted-foreground">Generic acceptance criteria not specified.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {acceptance.map((criteria: any, i: number) => (
                                    <CriteriaCard key={i} criteria={criteria} index={i} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    )
}
