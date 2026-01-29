'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Server,
  Box,
  Activity,
  GitBranch,
  Globe,
  Cpu,
  ShieldCheck,
  Database,
  Network,
  Terminal,
  RefreshCcw,
  Zap,
  Download,
  Clock,
  HardDrive,
  ShieldAlert,
  Bell
} from "lucide-react"

import { DevOpsBackendArtifact } from "@/lib/metasop/artifacts/devops/types"
import { cn, downloadFile } from "@/lib/utils"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
  CopyButton,
  containerVariants as container,
  itemVariants as item
} from "../shared-components"

function ServiceCard({ service }: { service: any }) {
  const isCompute = service.type === 'compute'
  const isDatabase = service.type === 'database'
  const isNetworking = service.type === 'networking'

  return (
    <motion.div variants={item} className={cn(
      "group relative border p-4 rounded-xl shadow-sm transition-all flex flex-col h-full hover:shadow-md",
      styles.colors.bgCard, styles.colors.borderMuted
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl border shadow-sm transition-all group-hover:scale-105",
            isCompute ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" :
              isDatabase ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" :
                isNetworking ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                  "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400"
          )}>
            {isCompute ? <Cpu className="h-5 w-5" /> :
              isDatabase ? <Database className="h-5 w-5" /> :
                isNetworking ? <Network className="h-5 w-5" /> :
                  <Server className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
              {service.name}
            </h4>
            <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 mt-1 uppercase bg-muted/50 text-muted-foreground border-border/50">
              {service.type}
            </Badge>
          </div>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
      </div>

      <p className={cn("flex-1 mb-4", styles.typography.bodySmall, styles.colors.textMuted)}>
        {service.description}
      </p>

      {service.configuration && Object.keys(service.configuration).length > 0 && (
        <div className="bg-muted/30 rounded-lg p-2.5 grid grid-cols-2 gap-2 border border-border/40">
          {Object.entries(service.configuration).slice(0, 4).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 overflow-hidden">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-tight truncate">
                {k.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] font-mono text-foreground truncate" title={String(v)}>
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function DevOpsInfrastructurePanel({
  artifact
}: {
  artifact: any
}) {
  const [activeFile, setActiveFile] = React.useState<'dockerfile' | 'compose'>('dockerfile')
  const data = (artifact?.content || artifact || {}) as DevOpsBackendArtifact

  const {
    infrastructure,
    cicd,
    deployment,
    monitoring,
    containerization,
    scaling,
    disaster_recovery,
    summary,
    description,
    infra_components
  } = data

  const services = infrastructure?.services || []
  const regions = infrastructure?.regions || []
  const pipelineStages = cicd?.pipeline_stages || []
  const tools = cicd?.tools || []
  const triggers = cicd?.triggers || []
  const environments = deployment?.environments || []

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Section */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className={styles.typography.h2}>Infrastructure Specification</h2>
            {infrastructure?.cloud_provider && (
              <Badge variant="outline" className="font-mono text-sky-600 dark:text-sky-400 border-sky-500/30 uppercase text-[10px] px-1.5">
                {infrastructure.cloud_provider}
              </Badge>
            )}
          </div>

          <p className={cn(styles.typography.body, styles.colors.textMuted)}>
            {summary || "Infrastructure design and deployment strategy."}
          </p>

          {description && (
            <p className="text-[11px] text-muted-foreground italic leading-tight max-w-3xl border-l-2 border-primary/20 pl-3 py-1">
              {description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-2">
            <StatsCard icon={Box} label="Services" value={services.length} color="text-sky-500" bg="bg-sky-500/10" />
            <StatsCard icon={Zap} label="Components" value={infra_components || 0} color="text-yellow-500" bg="bg-yellow-500/10" />
            <StatsCard icon={GitBranch} label="Pipelines" value={pipelineStages.length} color="text-orange-500" bg="bg-orange-500/10" />
            <StatsCard icon={Globe} label="Envs" value={environments.length} color="text-emerald-500" bg="bg-emerald-500/10" />
            <StatsCard icon={Bell} label="Alerts" value={monitoring?.alerts?.length || 0} color="text-rose-500" bg="bg-rose-500/10" />
            <StatsCard icon={Activity} label="Scaling" value={scaling?.auto_scaling?.max_replicas || 1} color="text-amber-500" bg="bg-amber-500/10" />
            <StatsCard icon={ShieldAlert} label="Recovery" value={disaster_recovery?.rto ? 1 : 0} color="text-indigo-500" bg="bg-indigo-500/10" />
            <StatsCard icon={ShieldCheck} label="Strategy" value={deployment?.strategy} isText color="text-purple-500" bg="bg-purple-500/10" />
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="infra" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="infra" icon={Server} label="Services" count={services.length} />
                <TabTrigger value="cicd" icon={RefreshCcw} label="CI/CD" count={pipelineStages.length} />
                <TabTrigger value="deploy" icon={Globe} label="Deployment" count={environments.length} />
                <TabTrigger value="monitor" icon={Activity} label="Monitoring" count={monitoring?.alerts?.length || 0} />
                {(containerization || scaling) && (
                  <TabTrigger value="ops" icon={Zap} label="Operations" />
                )}
                {disaster_recovery && (
                  <TabTrigger value="recovery" icon={ShieldAlert} label="Recovery" />
                )}
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
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

                <TabsContent key="cicd" value="cicd" className="m-0 outline-none space-y-4">
                  <motion.div variants={container} initial="hidden" animate="show">
                    <Card className={cn("border-border/60 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                      <div className="bg-muted/30 border-b border-border/40 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCcw className="h-4 w-4 text-orange-500" />
                          <h3 className={styles.typography.h3}>Pipeline Architecture</h3>
                        </div>
                        <div className="flex gap-1">
                          {tools.map((tool: string) => (
                            <Badge key={tool} variant="outline" className="text-[10px] font-mono bg-background text-muted-foreground">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-muted/10">
                        <div className="relative">
                          {/* Connecting Line */}
                          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-linear-to-b from-orange-500/20 via-blue-500/20 to-emerald-500/20 hidden md:block" />

                          <div className="space-y-4">
                            {pipelineStages.map((stage: any, i: number) => (
                              <motion.div
                                key={i}
                                variants={item}
                                className="relative md:pl-10 group"
                              >
                                {/* Timeline Dot */}
                                <div className="absolute left-[13px] top-3.5 h-3.5 w-3.5 rounded-full bg-background border-2 border-orange-500 z-10 hidden md:block group-hover:scale-110 transition-transform shadow-[0_0_0_2px_rgba(249,115,22,0.1)]" />

                                <div className={cn(
                                  "border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all",
                                  styles.colors.bgCard, styles.colors.borderMuted
                                )}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold flex items-center gap-2">
                                        <span className="text-muted-foreground font-mono text-xs opacity-50">0{i + 1}</span>
                                        {stage.name}
                                      </h4>
                                      {stage.status && (
                                        <Badge variant="outline" className={cn(
                                          "text-[8px] h-4 px-1 uppercase",
                                          stage.status === 'active' ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"
                                        )}>
                                          {stage.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      {i === 0 && <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200 text-[10px] h-5">START</Badge>}
                                      {i === pipelineStages.length - 1 && <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200 text-[10px] h-5">DEPLOY</Badge>}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-3">{stage.description}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {stage.steps?.map((step: string, idx: number) => (
                                      <div key={idx} className="bg-muted/50 px-2 py-1 rounded-md text-[10px] font-mono text-muted-foreground border border-border/40 flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-orange-400" />
                                        {step}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {triggers.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {triggers.map((trigger: any, i: number) => (
                          <motion.div variants={item} key={i} className="flex items-center gap-3 p-3 bg-muted/20 border border-border/50 rounded-lg">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trigger</div>
                              <div className="text-sm font-semibold">{trigger.type}</div>
                            </div>
                            {trigger.branch && (
                              <Badge variant="outline" className="ml-auto font-mono text-xs">
                                <GitBranch className="h-3 w-3 mr-1" />
                                {trigger.branch}
                              </Badge>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

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
                                scaling.auto_scaling.enabled !== false ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : "text-muted-foreground border-border bg-muted/20"
                              )}>
                                {scaling.auto_scaling.enabled !== false ? 'Enabled' : 'Disabled'}
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

                <TabsContent key="monitor" value="monitor" className="m-0 outline-none space-y-4">
                  <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="h-full">
                      <div className="p-3 border-b border-border/40 bg-muted/20 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        <h3 className="text-sm font-semibold">Alerting Rules</h3>
                      </div>
                      <div className="p-0">
                        {monitoring?.alerts?.map((alert: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                alert.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                  alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                              )} />
                              <div>
                                <div className="text-sm font-medium leading-none mb-1">{alert.name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">{alert.condition}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-[9px] uppercase font-bold",
                              alert.severity === 'critical' ? 'text-red-600 border-red-200 bg-red-50' :
                                alert.severity === 'warning' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                  'text-blue-600 border-blue-200 bg-blue-50'
                            )}>
                              {alert.severity || 'info'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <div className="space-y-4 h-full">
                      <Card className="h-full border-border/60 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-border/40 bg-zinc-950 flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-emerald-500" />
                          <h3 className="text-sm font-semibold text-zinc-100 font-mono">Observability Stack</h3>
                        </div>
                        <div className="p-4 bg-zinc-950 min-h-[300px] font-mono text-xs space-y-6">
                          {monitoring?.metrics && monitoring.metrics.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                <Activity className="h-3 w-3" />
                                SLOs & Metrics
                              </div>
                              <div className="grid gap-2">
                                {monitoring.metrics.map((m: any, i: number) => (
                                  <div key={i} className="group flex items-center justify-between bg-zinc-900/50 p-2.5 rounded border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-emerald-400 font-bold uppercase text-[9px]">{m.name}</span>
                                      <span className="text-zinc-400 text-[10px]">{m.threshold}</span>
                                    </div>
                                    <div className="text-zinc-500 text-[9px] italic text-right">
                                      {m.action}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {monitoring?.tools && monitoring.tools.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                <Server className="h-3 w-3" />
                                Monitoring Stack
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {monitoring.tools.map((tool: string, i: number) => (
                                  <Badge key={i} variant="outline" className="bg-zinc-900/50 border-zinc-800 text-zinc-400 font-mono text-[10px]">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-4 pt-2">
                            <div className="space-y-2">
                              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Logging Pipeline</div>
                              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-500 text-[9px] uppercase font-bold">Retention</span>
                                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-300 font-mono">
                                    {monitoring?.logging?.retention || '30 days'}
                                  </Badge>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="text-zinc-500 text-[9px] uppercase font-bold block">Log Stack</span>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {monitoring?.logging?.tools?.map((t: string, i: number) => (
                                      <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {scaling?.auto_scaling && (
                          <div className="lg:col-span-5 border-t border-zinc-800 p-4 bg-zinc-900/20">
                            <div className="flex items-center gap-2 mb-4">
                              <Zap className="h-4 w-4 text-amber-500" />
                              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Auto-Scaling Configuration</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Replicas</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-400">Min/Max</span>
                                  <span className="text-sm font-mono text-zinc-100">{scaling.auto_scaling.min_replicas} - {scaling.auto_scaling.max_replicas}</span>
                                </div>
                              </div>
                              {scaling.auto_scaling.metrics && (
                                <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Metrics</div>
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(scaling.auto_scaling.metrics).map(([k, v]: [string, any]) => (
                                      <Badge key={k} variant="outline" className="text-[9px] border-zinc-700 text-zinc-400 font-mono">
                                        {k}: {v}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {scaling.auto_scaling.triggers && scaling.auto_scaling.triggers.length > 0 && (
                                <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2 md:col-span-1">
                                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Triggers</div>
                                  <div className="space-y-1.5">
                                    {scaling.auto_scaling.triggers.map((t: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                                        <span className="font-bold text-amber-500/70">{t.type}</span>
                                        <span>{t.threshold}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent key="recovery" value="recovery" className="m-0 outline-none space-y-4">
                  <motion.div variants={container} initial="hidden" animate="show">
                    <Card className="border-red-500/20 bg-red-500/5 overflow-hidden">
                      <div className="p-4 border-b border-red-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <ShieldAlert className="h-5 w-5" />
                          <h3 className="text-lg font-bold">Disaster Recovery Plan</h3>
                        </div>
                        <Badge variant="outline" className="border-red-500/30 text-red-600 bg-red-500/10 uppercase font-mono tracking-wider">
                          Business Continuity
                        </Badge>
                      </div>
                      <div className="p-6 grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-background/80 p-4 rounded-xl border border-border/50 shadow-sm flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                                <Clock className="h-4 w-4 text-blue-500" />
                                RTO
                              </div>
                              <div className="text-2xl font-black text-foreground">{disaster_recovery?.rto || "—"}</div>
                              <div className="text-[10px] text-muted-foreground">Recovery Time Objective</div>
                            </div>
                            <div className="bg-background/80 p-4 rounded-xl border border-border/50 shadow-sm flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                                <HardDrive className="h-4 w-4 text-emerald-500" />
                                RPO
                              </div>
                              <div className="text-2xl font-black text-foreground">{disaster_recovery?.rpo || "—"}</div>
                              <div className="text-[10px] text-muted-foreground">Recovery Point Objective</div>
                            </div>
                          </div>

                          <div className="bg-background/80 p-4 rounded-xl border border-border/50 shadow-sm space-y-2">
                            <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
                              <RefreshCcw className="h-4 w-4" />
                              Backup Strategy
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {disaster_recovery?.backup_strategy || "No backup strategy defined."}
                            </p>
                          </div>
                        </div>

                        <div className="bg-background/80 p-4 rounded-xl border border-border/50 shadow-sm space-y-2">
                          <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                            <Activity className="h-4 w-4" />
                            Failover Plan
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {disaster_recovery?.failover_plan || "No failover plan defined."}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
