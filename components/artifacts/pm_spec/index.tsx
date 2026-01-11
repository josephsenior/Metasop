'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Target,
  Users,
  ShieldAlert,
  Zap,
  Ban,
  ListTodo,
  FileText
} from "lucide-react"

import { ProductManagerBackendArtifact } from "@/lib/metasop/artifacts/product-manager/types"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../shared-styles"
import { 
  StatsCard, 
  TabTrigger, 
  CopyButton, 
  containerVariants as container, 
  itemVariants as item 
} from "../shared-components"

function UserStoryCard({ story, index }: { story: any, index: number }) {
  const storyText = typeof story === 'string'
    ? story
    : story.story || story.description || story.title
  const storyTitle = typeof story === 'object' ? story.title : undefined
  const storyId = typeof story === 'object' ? (story.id || `US-${index + 1}`) : `US-${index + 1}`
  const priority = typeof story === 'object' ? story.priority : undefined
  const points = typeof story === 'object' ? story.story_points : undefined
  const acceptance = typeof story === 'object' ? story.acceptance_criteria : []

  return (
    <motion.div variants={item} className="group relative">
      <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-colors", 
        priority === 'critical' || priority === 'high' ? "bg-red-500/50" :
        priority === 'low' ? "bg-blue-500/50" : "bg-amber-500/50"
      )} />
      
      <div className={cn(
        "ml-1 p-4 rounded-r-xl border hover:shadow-md transition-all",
        styles.colors.bgCard, styles.colors.borderMuted
      )}>
        <CopyButton text={storyText} />
        
        <div className="flex justify-between items-start mb-3 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-muted-foreground/60">{storyId}</span>
            <Badge variant="outline" className={cn(
              styles.badges.small,
              priority === 'critical' || priority === 'high' ? "text-red-500 border-red-500/20 bg-red-500/5" :
              priority === 'low' ? "text-blue-500 border-blue-500/20 bg-blue-500/5" :
              "text-amber-500 border-amber-500/20 bg-amber-500/5"
            )}>
              {priority?.toUpperCase() || 'NORMAL'}
            </Badge>
          </div>
          {points && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold text-primary">{points} PTS</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {storyTitle && <h4 className={styles.typography.h4}>{storyTitle}</h4>}
          <div className={cn("p-3 rounded-lg bg-muted/30 border border-border/20 italic", styles.typography.body)}>
            {storyText}
          </div>

          {acceptance && acceptance.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <span className={cn("uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2", styles.typography.labelSmall)}>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Validation Logic
              </span>
              <div className="space-y-1.5">
                {acceptance.map((ac: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{ac}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {typeof story === 'object' && story.user_value && (
            <div className="mt-3 flex items-start gap-3 bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10">
              <Target className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Business Value</span>
                <p className="text-xs text-muted-foreground">{story.user_value}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function CriteriaCard({ criteria, index }: { criteria: any, index: number }) {
  const criteriaText = typeof criteria === 'string'
    ? criteria
    : criteria.criteria || criteria.description || criteria.title
  const criteriaId = typeof criteria === 'object' ? criteria.id : undefined

  return (
    <motion.div variants={item} className={cn(
      "group flex items-start gap-3 p-3 rounded-lg border transition-all hover:border-emerald-500/30",
      styles.colors.bgCard, styles.colors.borderMuted
    )}>
      <div className="mt-0.5 h-6 w-6 flex-none flex items-center justify-center rounded bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0 pt-0.5 relative">
        <CopyButton text={criteriaText} />
        {criteriaId && (
          <div className="text-[10px] font-mono text-muted-foreground/60 mb-1 font-bold uppercase tracking-tighter">{criteriaId}</div>
        )}
        <span className={cn("pr-6 block", styles.typography.body)}>{criteriaText}</span>
      </div>
    </motion.div>
  )
}

function AssumptionCard({ text, type }: { text: string, type: 'assumption' | 'outofscope' }) {
  const isAssumption = type === 'assumption'
  const colorClass = isAssumption ? "text-amber-500" : "text-red-500"
  const borderClass = isAssumption ? "border-amber-500/20" : "border-red-500/20"

  return (
    <motion.div variants={item} className={cn(
      "p-3 rounded-lg border flex gap-3 items-start group",
      styles.colors.bgMuted, borderClass
    )}>
      <div className={cn("mt-1.5 flex-none h-1.5 w-1.5 rounded-full shrink-0", colorClass.replace('text-', 'bg-'))} />
      <span className={cn("italic font-medium", styles.typography.body)}>{text}</span>
    </motion.div>
  )
}

export default function PMSpecPanel({
  artifact
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as ProductManagerBackendArtifact
  const userStories = data.user_stories || []
  const acceptance = data.acceptance_criteria || []
  const assumptions = data.assumptions || []
  const out_of_scope = data.out_of_scope || []
  const swot = data.swot
  const stakeholders = data.stakeholders

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>Product Specification</h2>
              {data.ui_multi_section && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 text-[10px] px-1.5 h-5">
                  Multi-Section UI
                </Badge>
              )}
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).summary || (data as any).description || "Detailed product requirements and specifications."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard 
            icon={TrendingUp} 
            label="Stories" 
            value={userStories.length} 
            color="text-orange-600 dark:text-orange-400" 
            bg="bg-orange-500/10" 
          />
          <StatsCard 
            icon={CheckCircle2} 
            label="Acceptance" 
            value={acceptance.length} 
            color="text-emerald-600 dark:text-emerald-400" 
            bg="bg-emerald-500/10" 
          />
          <StatsCard 
            icon={Lightbulb} 
            label="Assumptions" 
            value={assumptions.length} 
            color="text-blue-600 dark:text-blue-400" 
            bg="bg-blue-500/10" 
          />
          <StatsCard 
            icon={Users} 
            label="Stakeholders" 
            value={stakeholders?.length || 0} 
            color="text-purple-600 dark:text-purple-400" 
            bg="bg-purple-500/10" 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="stories" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="stories" icon={ListTodo} label="User Stories" count={userStories.length} />
                <TabTrigger value="acceptance" icon={CheckCircle2} label="Acceptance" count={acceptance.length} />
                <TabTrigger value="assumptions" icon={Lightbulb} label="Assumptions" count={assumptions.length} />
                {out_of_scope.length > 0 && (
                  <TabTrigger value="outofscope" icon={Ban} label="Out of Scope" count={out_of_scope.length} />
                )}
                {swot && <TabTrigger value="swot" icon={TrendingUp} label="SWOT" />}
                {stakeholders && stakeholders.length > 0 && (
                  <TabTrigger value="stakeholders" icon={Users} label="Stakeholders" count={stakeholders.length} />
                )}
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4 max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                  <TabsContent key="stories" value="stories" className="m-0 outline-none">
                    <motion.div 
                      variants={container} 
                      initial="hidden" 
                      animate="show"
                      className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                    >
                      {userStories.length === 0 ? (
                        <div className="col-span-full text-center py-12 border-2 border-dashed rounded-2xl border-muted">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-muted-foreground">No user stories defined yet.</p>
                        </div>
                      ) : (
                        userStories.map((item: any, i: number) => (
                          <UserStoryCard key={i} story={item} index={i} />
                        ))
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="acceptance" value="acceptance" className="m-0 outline-none">
                    <motion.div 
                      variants={container}
                      initial="hidden" 
                      animate="show"
                      className="space-y-4"
                    >
                      <Card className={cn("overflow-hidden border-none shadow-none bg-transparent")}>
                        <CardHeader className="px-0 pt-0 pb-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Global Definition of Done
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                          {acceptance.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-xs text-muted-foreground">Generic acceptance criteria not specified.</p>
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {acceptance.map((criteria: any, i: number) => (
                                <CriteriaCard key={i} criteria={criteria} index={i} />
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="assumptions" value="assumptions" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                      <div className="grid gap-3">
                        {assumptions.map((item: any, i: number) => {
                          const text = typeof item === 'string' ? item : item.description || item.title
                          return <AssumptionCard key={i} text={text} type="assumption" />
                        })}
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="outofscope" value="outofscope" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                      <div className="grid gap-3">
                        {out_of_scope.map((item: any, i: number) => {
                          const text = typeof item === 'string' ? item : item.description || item.title
                          return <AssumptionCard key={i} text={text} type="outofscope" />
                        })}
                      </div>
                    </motion.div>
                  </TabsContent>

                  {swot && (
                    <TabsContent key="swot" value="swot" className="m-0 outline-none">
                      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "Strengths", items: swot.strengths, color: "emerald", icon: Zap },
                          { label: "Weaknesses", items: swot.weaknesses, color: "red", icon: ShieldAlert },
                          { label: "Opportunities", items: swot.opportunities, color: "blue", icon: TrendingUp },
                          { label: "Threats", items: swot.threats, color: "amber", icon: Ban },
                        ].map((section) => (
                          <motion.div key={section.label} variants={item}>
                            <Card className="h-full border border-border/40 bg-card overflow-hidden">
                              <div className={cn("h-1 w-full", `bg-${section.color}-500/40`)} />
                              <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between">
                                <CardTitle className={cn("text-xs font-black uppercase tracking-widest", `text-${section.color}-600 dark:text-${section.color}-400`)}>
                                  {section.label}
                                </CardTitle>
                                <section.icon className={cn("h-4 w-4", `text-${section.color}-500/50`)} />
                              </CardHeader>
                              <CardContent className="px-5 pb-5 pt-0">
                                <ul className="space-y-3">
                                  {section.items.map((item: string, i: number) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-3 group">
                                      <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-150", `bg-${section.color}-500/50`)} />
                                      <span className="leading-relaxed">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    </TabsContent>
                  )}

                  {stakeholders && stakeholders.length > 0 && (
                    <TabsContent key="stakeholders" value="stakeholders" className="m-0 outline-none">
                      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 md:grid-cols-2">
                        {stakeholders.map((s: any, i: number) => (
                          <motion.div key={i} variants={item} className="p-4 rounded-xl border border-border/50 bg-card hover:border-blue-500/30 transition-all flex flex-col gap-4 group">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-center shrink-0">
                                  <Users className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-foreground">{s.role}</div>
                                  <div className="text-xs text-muted-foreground">Stakeholder</div>
                                </div>
                              </div>
                              <Badge variant="outline" className={cn(
                                "capitalize",
                                s.influence === 'high' ? "text-purple-500 border-purple-500/20" :
                                s.influence === 'low' ? "text-slate-500 border-slate-500/20" :
                                "text-blue-500 border-blue-500/20"
                              )}>
                                {s.influence} Influence
                              </Badge>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground italic border border-border/20">
                              "{s.interest}"
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </TabsContent>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
