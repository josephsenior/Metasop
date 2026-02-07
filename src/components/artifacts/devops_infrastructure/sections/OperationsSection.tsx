'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Box, Terminal, Network, Download, Zap } from "lucide-react"
import { TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, downloadFile } from "@/lib/utils"
import { CopyButton, containerVariants as container } from "../../shared-components"

interface OperationsSectionProps {
    containerization: any
    scaling: any
}

export function OperationsSection({ containerization, scaling }: OperationsSectionProps) {
    const [activeFile, setActiveFile] = React.useState<'dockerfile' | 'compose'>('dockerfile')

    return (
        <TabsContent key="ops" value="ops" className="m-0 outline-none space-y-4">
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                {containerization && (
                    <Card className="overflow-hidden border-border/60 shadow-sm">
                        <div className="bg-zinc-950 p-1 flex items-center justify-between gap-1 border-b border-zinc-800 pr-2">
                            <div className="flex items-center gap-1">
                                <div className="flex gap-1.5 px-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500 ml-2">Container Runtime Specification</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 bg-zinc-950 min-h-[400px]">
                            {/* File Explorer Sidebar */}
                            <div className="lg:col-span-1 border-r border-zinc-800 p-2 space-y-1">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-1 tracking-wider">Files</div>
                                {containerization.dockerfile && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors",
                                            activeFile === 'dockerfile' ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900"
                                        )}
                                        onClick={() => setActiveFile('dockerfile')}
                                    >
                                        <Terminal className="h-3.5 w-3.5" />
                                        Dockerfile
                                    </div>
                                )}
                                {containerization.docker_compose && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors",
                                            activeFile === 'compose' ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900"
                                        )}
                                        onClick={() => setActiveFile('compose')}
                                    >
                                        <Box className="h-3.5 w-3.5" />
                                        compose.yml
                                    </div>
                                )}

                                <div className="mt-4 text-[10px] font-bold text-zinc-500 uppercase px-2 py-1 tracking-wider">Cluster {containerization.kubernetes?.namespace && `(${containerization.kubernetes.namespace})`}</div>
                                {containerization.kubernetes?.deployments?.map((d: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-1 px-2 py-1.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900 rounded-md text-xs transition-colors">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 truncate">
                                                <Box className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="truncate">{d.name}</span>
                                            </div>
                                            <span className="text-[9px] bg-zinc-800 px-1 rounded text-zinc-500">{d.replicas}</span>
                                        </div>
                                        {d.resources && (
                                            <div className="text-[8px] text-zinc-600 flex gap-2 pl-5">
                                                <span>CPU: {d.resources.cpu}</span>
                                                <span>MEM: {d.resources.memory}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {containerization.kubernetes?.services?.map((s: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 px-2 py-1.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900 rounded-md text-xs transition-colors">
                                        <Network className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="truncate">{s.name}</span>
                                        <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500 h-3.5 px-1 uppercase">{s.type}</Badge>
                                    </div>
                                ))}
                            </div>

                            {/* Code Viewer */}
                            <div className="lg:col-span-4 p-0 bg-zinc-950/50 relative group">
                                {activeFile === 'dockerfile' ? (
                                    containerization.dockerfile ? (
                                        <>
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <CopyButton text={containerization.dockerfile} />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                    onClick={() => downloadFile(containerization.dockerfile!, "Dockerfile", "text/plain")}
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <ScrollArea className="h-[400px] w-full">
                                                <pre className="p-4 font-mono text-xs text-blue-300 leading-relaxed whitespace-pre-wrap">
                                                    {containerization.dockerfile.replace(/\\n/g, '\n')}
                                                </pre>
                                            </ScrollArea>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                                            No Dockerfile content available
                                        </div>
                                    )
                                ) : (
                                    containerization.docker_compose ? (
                                        <>
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <CopyButton text={containerization.docker_compose} />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                    onClick={() => downloadFile(containerization.docker_compose!, "docker-compose.yml", "text/plain")}
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <ScrollArea className="h-[400px] w-full">
                                                <pre className="p-4 font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
                                                    {containerization.docker_compose.replace(/\\n/g, '\n')}
                                                </pre>
                                            </ScrollArea>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                                            No Docker Compose content available
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {scaling && (
                    <Card className="p-4 border-dashed border-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <h4 className="text-sm font-semibold">Scaling Policies</h4>
                        </div>
                        {scaling.auto_scaling ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2 py-1 bg-blue-500/5 rounded border border-blue-500/10">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Status</span>
                                    <Badge variant="outline" className={cn(
                                        "text-[8px] h-4 px-1 uppercase",
                                        "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                                    )}>
                                        Enabled
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="p-2 bg-muted rounded border text-center">
                                        <div className="text-muted-foreground text-[10px] uppercase">Min Replicas</div>
                                        <div className="font-bold text-lg">{scaling.auto_scaling.min_replicas || 1}</div>
                                    </div>
                                    <div className="p-2 bg-muted rounded border text-center">
                                        <div className="text-muted-foreground text-[10px] uppercase">Max Replicas</div>
                                        <div className="font-bold text-lg">{scaling.auto_scaling.max_replicas || 5}</div>
                                    </div>
                                    <div className="col-span-1 p-2 bg-muted/30 rounded border flex flex-col justify-center items-center">
                                        <span className="text-muted-foreground text-[8px] uppercase">CPU Target</span>
                                        <span className="font-bold font-mono text-blue-600">{scaling.auto_scaling.target_cpu || 80}%</span>
                                    </div>
                                    <div className="col-span-1 p-2 bg-muted/30 rounded border flex flex-col justify-center items-center">
                                        <span className="text-muted-foreground text-[8px] uppercase">Mem Target</span>
                                        <span className="font-bold font-mono text-purple-600">{scaling.auto_scaling.target_memory || 75}%</span>
                                    </div>
                                    {scaling.auto_scaling.triggers && scaling.auto_scaling.triggers.length > 0 && (
                                        <div className="col-span-2 mt-2 pt-2 border-t border-border/40">
                                            <div className="text-[8px] uppercase font-bold text-muted-foreground mb-2">Scaling Triggers</div>
                                            <div className="grid gap-1.5">
                                                {scaling.auto_scaling.triggers.map((trigger: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between text-[10px] bg-yellow-500/5 border border-yellow-500/10 p-1.5 rounded">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn(
                                                                "w-1 h-1 rounded-full",
                                                                trigger.action === 'scale-up' ? 'bg-red-500' : 'bg-blue-500'
                                                            )} />
                                                            <span className="font-bold text-yellow-700 dark:text-yellow-500 uppercase text-[9px]">{trigger.metric}</span>
                                                            <span className="text-muted-foreground">{trigger.threshold}</span>
                                                        </div>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] h-3.5 px-1 uppercase border-0",
                                                            trigger.action === 'scale-up' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'
                                                        )}>
                                                            {trigger.action}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : scaling.manual_scaling ? (
                            <div className="p-3 bg-muted/30 rounded border text-center">
                                <div className="text-muted-foreground text-[10px] uppercase">Manual Replicas</div>
                                <div className="font-bold text-lg">{scaling.manual_scaling.replicas}</div>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No scaling policy configured.</p>
                        )}
                    </Card>
                )}
            </motion.div>
        </TabsContent>
    );
}
