'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { RefreshCcw } from "lucide-react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { containerVariants as container, itemVariants as item } from "../../shared-components"

interface DeploymentSectionProps {
    environments: any[]
    deployment: any
}

export function DeploymentSection({ environments, deployment }: DeploymentSectionProps) {
    return (
        <TabsContent key="deploy" value="deploy" className="m-0 outline-none space-y-4">
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {environments.map((env: any, i: number) => (
                    <motion.div key={i} variants={item}>
                        <Card className="border-border/60 hover:border-emerald-500/30 transition-all hover:shadow-md h-full">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={cn(
                                        "uppercase font-bold tracking-wider text-[10px]",
                                        env.name.toLowerCase().includes('prod') ? "border-red-500/30 text-red-600 bg-red-500/5" :
                                            env.name.toLowerCase().includes('stage') ? "border-orange-500/30 text-orange-600 bg-orange-500/5" :
                                                "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                                    )}>
                                        {env.name}
                                    </Badge>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>

                                <div className="space-y-2 py-2">
                                    {env.configuration && Object.entries(env.configuration).map(([k, v], idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                                            <span className="font-mono font-medium">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-muted-foreground border-t border-border/50 pt-3 mt-2">
                                    {env.description}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
                {deployment?.rollback_strategy && (
                    <Card className="col-span-full border-dashed border-red-500/20 bg-red-500/5">
                        <CardContent className="p-3 flex items-center gap-3">
                            <RefreshCcw className="h-4 w-4 text-red-500" />
                            <div className="text-xs">
                                <span className="font-bold text-red-700 dark:text-red-400 mr-2 uppercase">Rollback Strategy:</span>
                                <span className="text-muted-foreground italic">{deployment.rollback_strategy}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </TabsContent>
    );
}
