'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import {
    containerVariants as container
} from "../../shared-components"

interface AssumptionsSectionProps {
    assumptions: any[]
    out_of_scope: any[]
    AssumptionCard: React.ComponentType<{ text: string, type: 'assumption' | 'outofscope' }>
}

export function AssumptionsSection({
    assumptions,
    out_of_scope,
    AssumptionCard
}: AssumptionsSectionProps) {
    return (
        <>
            <TabsContent key="assumptions" value="assumptions" className="m-0 outline-none">
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    <div className="grid gap-3">
                        {assumptions.map((item: any, i: number) => {
                            const text = typeof item === 'string' ? item : item.description || item.title
                            return <AssumptionCard key={i} text={text} type="assumption" />
                        })}
                    </div>
                </motion.div>
            </TabsContent>

            <TabsContent key="outofscope" value="outofscope" className="m-0 outline-none">
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    <div className="grid gap-3">
                        {out_of_scope.map((item: any, i: number) => {
                            const text = typeof item === 'string' ? item : item.description || item.title
                            return <AssumptionCard key={i} text={text} type="outofscope" />
                        })}
                    </div>
                </motion.div>
            </TabsContent>
        </>
    )
}
