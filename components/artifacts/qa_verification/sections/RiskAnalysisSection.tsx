'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { ShieldAlert } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface RiskAnalysisSectionProps {
    riskAnalysis: any[]
    RiskCard: React.ComponentType<{ risk: any }>
}

export function RiskAnalysisSection({
    riskAnalysis,
    RiskCard
}: RiskAnalysisSectionProps) {
    return (
        <TabsContent key="risks" value="risks" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riskAnalysis.map((risk: any, i: number) => (
                        <RiskCard key={i} risk={risk} />
                    ))}
                </div>
                {riskAnalysis.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No risk analysis provided.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
