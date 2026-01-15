'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Cpu,
  Database,
  Network,
  Binary,
  Layers,
  Terminal,
  ShieldCheck,
  Key,
  Settings,
  Share2,
  Lock,
  ArrowRight,
  BookOpen,
  ScrollText,
  ListTodo,
  Zap
} from "lucide-react"

import { ArchitectBackendArtifact } from "@/lib/metasop/artifacts/architect/types"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
  CopyButton,
  containerVariants as container,
  itemVariants as item
} from "../shared-components"

function ApiEndpointCard({ api }: { api: any }) {
  const methodColors = {
    GET: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
    POST: "text-blue-500 border-blue-500/20 bg-blue-500/5",
    PUT: "text-amber-500 border-amber-500/20 bg-amber-500/5",
    DELETE: "text-red-500 border-red-500/20 bg-red-500/5",
    PATCH: "text-purple-500 border-purple-500/20 bg-purple-500/5",
  }

  return (
    <motion.div variants={item} className={cn(
      "group relative flex flex-col p-4 rounded-xl border transition-all hover:shadow-md h-full",
      styles.colors.bgCard, styles.colors.borderMuted
    )}>
      <CopyButton text={`${api.method} ${api.path}`} />

      <div className="flex items-center justify-between mb-3 pr-8">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn(
            "font-mono text-[10px] uppercase font-bold px-1.5 py-0.5",
            (methodColors as any)[api.method] || "text-gray-500 border-gray-500/20 bg-gray-500/5"
          )}>
            {api.method}
          </Badge>
          <code className="text-[11px] font-mono font-bold text-foreground/80 break-all">{api.path}</code>
        </div>
        {api.auth_required && (
          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium px-1.5 py-0.5 rounded bg-amber-500/10">
            <Lock className="h-2.5 w-2.5" /> Auth
          </div>
        )}
      </div>

      <p className={cn("flex-1 mb-4", styles.typography.bodySmall, styles.colors.textMuted)}>
        {api.description}
      </p>

      <div className="space-y-2 pt-3 border-t border-border/20">
        {api.endpoint && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Endpoint:</span>
            <span className="font-mono text-blue-500 break-all">{api.endpoint}</span>
          </div>
        )}
        {api.rate_limit && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Rate Limit:</span>
            <span className="font-medium text-foreground">{api.rate_limit}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/20">
        {['request_schema', 'response_schema'].map((schemaKey) => {
          const raw = api[schemaKey]
          if (!raw) return null

          let content = raw
          if (typeof raw === 'string') {
            try {
              content = JSON.parse(raw)
            } catch {
              content = raw // Fallback to raw string
            }
          }

          const isObj = typeof content === 'object' && content !== null

          return (
            <div key={schemaKey} className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                {schemaKey.replace('_schema', '')} Body
              </span>
              <div className="bg-muted/40 rounded p-2 text-[10px] font-mono overflow-hidden">
                {isObj ? (
                  <div className="space-y-0.5">
                    {Object.entries(content).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex gap-1">
                        <span className="text-blue-600 dark:text-blue-400">{k}:</span>
                        <span className="text-muted-foreground truncate">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="break-all text-muted-foreground">{String(content)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function DatabaseTableCard({ table }: { table: any }) {
  return (
    <motion.div variants={item} className={cn(
      "overflow-hidden rounded-xl border shadow-sm h-full",
      styles.colors.bgCard, styles.colors.borderMuted
    )}>
      <div className="bg-purple-500/5 px-4 py-3 border-b border-purple-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-xs font-bold font-mono text-foreground">{table.name}</span>
        </div>
        <Badge variant="outline" className="text-[9px] font-mono opacity-60">{table.columns?.length || 0} COLS</Badge>
      </div>

      <div className="p-3 space-y-3">
        {table.description && (
          <p className={cn("italic", styles.typography.bodyTiny, styles.colors.textMuted)}>{table.description}</p>
        )}

        <div className="space-y-1">
          {(table.columns || []).map((col: any, j: number) => (
            <div key={j} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/30 text-[10px] font-mono group hover:bg-muted/50 transition-colors">
              <span className={cn("text-foreground/80 flex items-center gap-1.5", col.constraints?.includes('PRIMARY KEY') ? "font-bold text-purple-600" : "")}>
                {col.constraints?.includes('PRIMARY KEY') && <Key className="h-2.5 w-2.5" />}
                {col.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/40 italic">{col.description && `// ${col.description}`}</span>
                <span className="text-muted-foreground/60">{col.type}</span>
              </div>
            </div>
          ))}
        </div>

        {table.indexes && table.indexes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Indexes</span>
            <div className="flex flex-wrap gap-1.5">
              {table.indexes.map((idx: any, i: number) => (
                <Badge key={i} variant="outline" className="text-[8px] font-mono opacity-70 bg-purple-500/5" title={idx.reason}>
                  {idx.type?.toUpperCase() || 'BTREE'}: {idx.columns.join(', ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {table.relationships && table.relationships.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Relationships</span>
            <div className="space-y-1.5 text-[10px]">
              {table.relationships.map((rel: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-2.5 w-2.5 text-purple-500" />
                  <span className="font-mono">{rel.from}</span>
                  <span className="text-[8px] opacity-40">➔</span>
                  <span className="font-mono text-purple-500">{rel.to}</span>
                  <span className="text-[8px] italic opacity-60">
                    ({rel.type}{rel.through ? ` via ${rel.through}` : ''})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DecisionCard({ decision, index }: { decision: any, index: number }) {
  return (
    <motion.div variants={item} className={cn(
      "group relative p-4 rounded-xl border transition-all hover:border-green-500/30",
      styles.colors.bgCard, styles.colors.borderMuted
    )}>
      <div className="flex items-start gap-4">
        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-none group-hover:bg-green-500/20 transition-colors">
          <Binary className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-green-600/70 border border-green-500/20 px-1.5 rounded-sm whitespace-nowrap">
              ADR-{index + 1}
            </span>
            {decision.status && (
              <Badge variant="outline" className={cn(
                "text-[9px] px-1.5 py-0 uppercase border-0",
                decision.status === 'accepted' ? "bg-green-500/10 text-green-700" :
                  decision.status === 'superseded' ? "bg-red-500/10 text-red-700 decoration-line-through" :
                    "bg-amber-500/10 text-amber-700"
              )}>
                {decision.status}
              </Badge>
            )}
            <h4 className={cn("truncate group-hover:text-green-600 transition-colors flex-1", styles.typography.h4)}>
              {decision.decision || `Decision ${index + 1}`}
            </h4>
          </div>
          <p className={cn("mb-3", styles.typography.bodySmall, styles.colors.textMuted)}>
            {decision.reason || decision.rationale}
          </p>

          <div className="space-y-3">
            {decision.tradeoffs && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                <div className="text-[9px] font-bold text-amber-600 uppercase mb-1">Tradeoffs</div>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed italic">{decision.tradeoffs}</p>
              </div>
            )}

            {decision.consequences && (
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5">
                <div className="text-[9px] font-bold text-blue-600 uppercase mb-1">Consequences</div>
                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">{decision.consequences}</p>
              </div>
            )}

            {decision.alternatives && Array.isArray(decision.alternatives) && decision.alternatives.length > 0 && (
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground/60 bg-muted/20 p-2 rounded">
                <Layers className="h-3 w-3 mt-0.5 flex-none" />
                <div className="flex flex-wrap gap-1.5">
                  <span className="mr-1">Alternatives:</span>
                  {decision.alternatives.map((alt: string, i: number) => (
                    <span key={i} className="underline decoration-muted-foreground/20">{alt}{i < decision.alternatives.length - 1 ? ',' : ''}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PhilosophySection({ title, content, icon: Icon, color }: { title: string, content: string, icon: any, color: string }) {
  return (
    <motion.div variants={item} className="mb-4">
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className={cn("px-4 py-3 border-b flex items-center gap-2 bg-muted/20", styles.colors.borderMuted)}>
          <Icon className={cn("h-4 w-4", color)} />
          <h4 className={cn("font-bold text-sm", color)}>
            {title}
          </h4>
        </div>
        <div className="p-4 bg-card">
          <p className={cn("whitespace-pre-wrap leading-relaxed", styles.typography.bodySmall, styles.colors.textMuted)}>
            {content.trim()}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}

function BlueprintHeader({ summary }: { summary?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 mb-8 group">
      {/* Blueprint Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-size-[20px_20px]" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Cpu className="h-4 w-4 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">Architectural Manifesto</h3>
            <p className="text-[10px] text-blue-500/60 font-mono">CONFIDENTIAL // SYSTEM-LEVEL-SPECS</p>
          </div>
        </div>
        <p className={cn("italic", styles.typography.body, styles.colors.textMuted)}>
          {summary || "The foundational engineering principles and systemic patterns governing the project's technical evolution."}
        </p>
      </div>

      {/* Decorative Blueprint Corner */}
      <div className="absolute top-0 right-0 p-2 opacity-20">
        <div className="w-12 h-12 border-t border-r border-blue-600 rounded-tr-md" />
      </div>
    </div>
  )
}

export default function ArchDesignPanel({
  artifact,
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as ArchitectBackendArtifact
  const apis = data.apis || []
  const decisions = data.decisions || []
  const databaseSchema = data.database_schema
  const technologyStack = data.technology_stack
  const integrationPoints = data.integration_points || []
  const securityConsiderations = data.security_considerations || []
  const scalabilityApproach = data.scalability_approach
  const nextTasks = data.next_tasks || []

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>System Architecture</h2>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 text-[10px] px-1.5 h-5">
                Specification
              </Badge>
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).summary || (data as any).description || "Architectural design and technical specifications."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatsCard
            icon={Network}
            label="Endpoints"
            value={apis.length}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatsCard
            icon={Database}
            label="Tables"
            value={databaseSchema?.tables?.length || 0}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatsCard
            icon={ScrollText}
            label="Decisions"
            value={decisions.length}
            color="text-green-600 dark:text-green-400"
            bg="bg-green-500/10"
          />
          <StatsCard
            icon={Cpu}
            label="Integrations"
            value={integrationPoints.length}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-indigo-500/10"
          />
          <StatsCard
            icon={ShieldCheck}
            label="Security"
            value={securityConsiderations.length}
            color="text-rose-600 dark:text-rose-400"
            bg="bg-rose-500/10"
          />
          <StatsCard
            icon={Layers}
            label="Stack"
            value={technologyStack ? Object.keys(technologyStack).length : 0}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatsCard
            icon={ListTodo}
            label="Tasks"
            value={nextTasks.length}
            color="text-orange-600 dark:text-orange-400"
            bg="bg-orange-500/10"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="design" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="design" icon={BookOpen} label="Philosophy" />
                <TabTrigger value="api" icon={Terminal} label="API Contract" count={apis.length} />
                <TabTrigger value="db" icon={Database} label="Schema" count={databaseSchema?.tables?.length || 0} />
                <TabTrigger value="decisions" icon={ScrollText} label="ADRs" count={decisions.length} />
                {technologyStack && <TabTrigger value="stack" icon={Layers} label="Stack" count={Object.keys(technologyStack).length} />}
                {nextTasks.length > 0 && <TabTrigger value="tasks" icon={ListTodo} label="Next Tasks" count={nextTasks.length} />}
                {(integrationPoints.length > 0 || securityConsiderations.length > 0 || scalabilityApproach) && (
                  <TabTrigger value="advanced" icon={Settings} label="Advanced" count={integrationPoints.length + securityConsiderations.length + (scalabilityApproach ? 1 : 0)} />
                )}
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <TabsContent key="design" value="design" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show">
                    <div className="w-full py-2">
                      <BlueprintHeader summary={data.summary || data.description} />

                      {data.design_doc ? (
                        <div className="space-y-4">
                          {(() => {
                            // Normalize literal \n or \\n sequences if they exist
                            const normalizedDoc = data.design_doc
                              .replace(/\\n/g, '\n')
                              .trim();

                            // Split by any level of markdown header (#, ##, ###, etc.)
                            // Regex looks for headers at the start of original or normalized lines
                            const sections = normalizedDoc
                              .split(/\n(?=#+ )|^#+ /m)
                              .filter(s => s.trim().length > 0);

                            if (sections.length <= 1 && !normalizedDoc.includes('# ')) {
                              return (
                                <PhilosophySection
                                  title="System Vision"
                                  content={normalizedDoc}
                                  icon={BookOpen}
                                  color="text-blue-600"
                                />
                              );
                            }

                            return sections.map((section, idx) => {
                              const lines = section.trim().split('\n');
                              const title = lines[0].replace(/^#+ /, '').trim();
                              const content = lines.slice(1).join('\n').trim();

                              // Map icons based on title keywords
                              let icon = Layers;
                              let color = "text-blue-600";

                              const lowerTitle = title.toLowerCase();
                              if (lowerTitle.includes('pattern') || lowerTitle.includes('style')) {
                                icon = Share2;
                                color = "text-purple-600";
                              } else if (lowerTitle.includes('data') || lowerTitle.includes('state')) {
                                icon = Database;
                                color = "text-amber-600";
                              } else if (lowerTitle.includes('flow') || lowerTitle.includes('process')) {
                                icon = Network;
                                color = "text-emerald-600";
                              } else if (lowerTitle.includes('security') || lowerTitle.includes('risk')) {
                                icon = ShieldCheck;
                                color = "text-red-600";
                              } else if (lowerTitle.includes('overview') || lowerTitle.includes('summary')) {
                                icon = BookOpen;
                                color = "text-blue-600";
                              } else if (lowerTitle.includes('scale') || lowerTitle.includes('performance')) {
                                icon = Zap;
                                color = "text-amber-500";
                              }

                              return (
                                <PhilosophySection
                                  key={idx}
                                  title={title}
                                  content={content || "Refer to sub-sections for details."}
                                  icon={icon}
                                  color={color}
                                />
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-2xl bg-muted/5">
                          <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-10" />
                          <p className="text-sm font-medium">System Manifesto Pending</p>
                          <p className="text-[10px] opacity-60 mt-1">Foundational principles are being drafted by the architect.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent key="api" value="api" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    {apis.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground italic bg-muted/10 rounded-xl border-2 border-dashed border-border/30">
                        <p className="text-sm">No endpoints documented for this service.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {apis.map((api: any, i: number) => (
                          <ApiEndpointCard key={i} api={api} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

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

                <TabsContent key="decisions" value="decisions" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    {decisions.length > 0 ? (
                      <div className="grid gap-3">
                        {decisions.map((decision: any, i: number) => (
                          <DecisionCard key={i} decision={decision} index={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                        No Architectural Decision Records (ADRs) found.
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent key="stack" value="stack" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {technologyStack && Object.entries(technologyStack).map(([category, items]: [string, any]) => (
                      <motion.div
                        key={category}
                        variants={item}
                        className="bg-card border border-border/50 p-4 rounded-xl shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                            <Cpu className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{category}</h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(items) ? items.map((t: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] font-mono bg-blue-500/5 text-blue-600 border-blue-500/10">
                              {t}
                            </Badge>
                          )) : <span className="text-xs text-muted-foreground">{String(items)}</span>}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </TabsContent>

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
                            {task.role && (
                              <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground uppercase">
                                {task.role}
                              </Badge>
                            )}
                            <h4 className="text-sm font-bold text-foreground">{task.title || "Pending Task"}</h4>
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

                <TabsContent key="advanced" value="advanced" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                    {integrationPoints.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-purple-500" /> Integration Points
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {integrationPoints.map((point: any, i: number) => (
                            <Card key={i} className="bg-card border-border/50">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-bold text-xs">{point.name || point.service || point.system}</div>
                                  {point.system && point.system !== point.name && (
                                    <Badge variant="outline" className="text-[8px] uppercase">{point.system}</Badge>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground">{point.purpose || point.description}</div>
                                {point.api_docs && (
                                  <div className="mt-1 text-[9px] text-blue-500 font-mono italic truncate hover:underline cursor-pointer">
                                    {point.api_docs}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {securityConsiderations.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-red-500" /> Security Considerations
                        </h3>
                        <div className="grid gap-2">
                          {securityConsiderations.map((sec: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                              <Lock className="h-3 w-3 mt-0.5 text-red-500" />
                              <span>{sec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scalabilityApproach && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" /> Scalability Approach
                        </h3>
                        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 space-y-4">
                          {typeof scalabilityApproach === "string" ? (
                            <p className="text-xs text-muted-foreground leading-relaxed">{scalabilityApproach}</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(scalabilityApproach || {}).map(([key, val]) => (
                                <div key={key} className="space-y-1">
                                  <div className="text-[10px] uppercase font-bold text-amber-600/60 tracking-wider">
                                    {key.replace(/_/g, ' ')}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {String(val)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
