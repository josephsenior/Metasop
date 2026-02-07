'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { DatabaseTableCard } from "../DatabaseTableCard"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Database, Settings } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface DatabaseSectionProps {
    databaseSchema: any
}

export function DatabaseSection({ databaseSchema }: DatabaseSectionProps) {
    return (
        <TabsContent key="db" value="db" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {databaseSchema?.tables && databaseSchema.tables.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {databaseSchema.tables.map((table: any, i: number) => (
                            <DatabaseTableCard key={i} table={table} />
                        ))}
                        {databaseSchema.migrations_strategy && (
                            <Card className="lg:col-span-2 border-dashed bg-muted/5">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Settings className="h-3 w-3" /> Migrations Strategy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    <p className="text-xs text-muted-foreground leading-relaxed italic">{databaseSchema.migrations_strategy}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/30 rounded-xl bg-muted/5">
                        <Database className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No relational schema defined.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
