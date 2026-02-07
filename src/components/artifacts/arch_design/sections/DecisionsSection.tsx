'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { DecisionCard } from "../DecisionCard"
import {
    containerVariants as container
} from "../../shared-components"

interface DecisionsSectionProps {
    decisions: any[]
}

export function DecisionsSection({ decisions }: DecisionsSectionProps) {
    return (
        <TabsContent key="decisions" value="decisions" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {decisions.length > 0 ? (
                    <div className="grid gap-3">
                        {decisions.map((decision: any, i: number) => (
                            <DecisionCard key={i} decision={decision} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        No Architectural Decision Records (ADRs) found.
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
