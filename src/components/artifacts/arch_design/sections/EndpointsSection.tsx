'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { ApiEndpointCard } from "../ApiEndpointCard"
import {
    containerVariants as container
} from "../../shared-components"

interface EndpointsSectionProps {
    apiEndpoints: any[]
}

export function EndpointsSection({ apiEndpoints }: EndpointsSectionProps) {
    return (
        <TabsContent key="api" value="api" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apiEndpoints.map((endpoint: any, i: number) => (
                    <ApiEndpointCard key={i} api={endpoint} />
                ))}
            </motion.div>
        </TabsContent>
    )
}
