'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container,
    itemVariants as item
} from "../../shared-components"

interface TasksSectionProps {
    nextTasks: any[]
}

export function TasksSection({ nextTasks }: TasksSectionProps) {
    return (
        <TabsContent key="tasks" value="tasks" className="m-0 outline-none">
            <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3">
                {nextTasks.map((task: any, i: number) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className="group bg-card border border-border/50 p-4 rounded-xl shadow-sm hover:border-orange-500/30 transition-all flex items-start gap-4"
                    >
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-none">
                            <Settings className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] font-bold text-orange-600 border-orange-500/20 uppercase bg-orange-500/5">
                                    Task {i + 1}
                                </Badge>
                                {task.assignee && (
                                    <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground uppercase">
                                        {task.assignee}
                                    </Badge>
                                )}
                                <h4 className="text-sm font-bold text-foreground">{task.task || "Pending Task"}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {task.description || "No description provided."}
                            </p>
                            {task.priority && (
                                <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                    Priority: <span className={cn(task.priority === 'high' ? "text-red-500" : "text-blue-500")}>{task.priority}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </TabsContent>
    )
}
