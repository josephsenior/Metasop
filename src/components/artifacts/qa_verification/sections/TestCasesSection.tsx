'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { ListTodo } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface TestCasesSectionProps {
    testCases: any[]
    TestPlanCard: React.ComponentType<{ tc: any }>
}

export function TestCasesSection({
    testCases,
    TestPlanCard
}: TestCasesSectionProps) {
    return (
        <TabsContent key="cases" value="cases" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCases.map((tc: any, i: number) => (
                    <TestPlanCard key={i} tc={tc} />
                ))}
                {testCases.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No test cases defined.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
