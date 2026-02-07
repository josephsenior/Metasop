'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Code, Terminal, Layers, FileCode } from "lucide-react"
import {
    containerVariants as container
} from "../../shared-components"

interface ScriptsSectionProps {
    runResults: any
    ScriptCard: React.ComponentType<{ label: string, cmds: string[], icon: any, color: string, bg: string }>
}

export function ScriptsSection({
    runResults,
    ScriptCard
}: ScriptsSectionProps) {
    return (
        <TabsContent key="scripts" value="scripts" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6">
                <ScriptCard
                    label="Environment Setup"
                    cmds={runResults.setup_commands}
                    icon={Settings}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <ScriptCard
                    label="Development Scripts"
                    cmds={runResults.dev_commands}
                    icon={Code}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
                <ScriptCard
                    label="Verification Suite"
                    cmds={runResults.test_commands}
                    icon={Terminal}
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                />
                <ScriptCard
                    label="Build & Bundle"
                    cmds={runResults.build_commands}
                    icon={Layers}
                    color="text-purple-500"
                    bg="bg-purple-500/10"
                />
                {runResults.notes && (
                    <Card className="border-border/50 shadow-sm bg-muted/20">
                        <CardHeader className="p-4 border-b border-border/40">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <FileCode className="h-4 w-4 text-muted-foreground" />
                                Operational Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                                {runResults.notes}
                            </p>
                        </CardContent>
                    </Card>
                )}
                {(!runResults.setup_commands?.length && !runResults.dev_commands?.length && !runResults.test_commands?.length && !runResults.build_commands?.length && !runResults.notes) && (
                    <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No scripts defined.</p>
                    </div>
                )}
            </motion.div>
        </TabsContent>
    )
}
