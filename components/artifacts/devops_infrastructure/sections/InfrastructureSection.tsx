'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Globe } from "lucide-react"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { containerVariants as container } from "../../shared-components"
import { ServiceCard } from "../ServiceCard"

interface InfrastructureSectionProps {
    infrastructure: any
    regions: string[]
    services: any[]
}

export function InfrastructureSection({ infrastructure, regions, services }: InfrastructureSectionProps) {
    return (
        <TabsContent key="infra" value="infra" className="m-0 outline-none space-y-4">
            {regions.length > 0 && (
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg w-fit">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex gap-1.5 flex-wrap">
                        {infrastructure?.iac && (
                            <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5 bg-indigo-500/5 text-indigo-600 border-indigo-500/20">
                                IaC: {infrastructure.iac}
                            </Badge>
                        )}
                        {regions.map((region: string) => (
                            <Badge key={region} variant="secondary" className="text-[10px] font-mono h-5 px-1.5 bg-background border border-border/50">
                                {region}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                {services.map((service: any, i: number) => (
                    <ServiceCard key={i} service={service} />
                ))}
            </motion.div>
        </TabsContent>
    );
}
