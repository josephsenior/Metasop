'use client'

import * as React from "react"
import { motion } from "framer-motion"
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
  FileText,
  Check,
  X,
  AlertTriangle,
  GanttChartSquare,
  Info,
  Map,
  Layers
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
  const isObject = typeof story === 'object' && story !== null;
  const storyId = isObject ? (story.id || `US-${index + 1}`) : `US-${index + 1}`;
  const storyTitle = isObject ? story.title : undefined;
  const storyText = isObject ? story.story : story;
  const storyDesc = isObject ? story.description : undefined;
  const priority = isObject ? story.priority : undefined;
  const points = isObject ? story.story_points : undefined;
  const acceptance = isObject ? story.acceptance_criteria : [];

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
        <CopyButton text={storyText || storyTitle || ""} />

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
              <span className="text-[10px] font-bold text-primary">{points} pts</span>
            </div>
          )}
          {isObject && story.estimated_complexity && (
            <Badge variant="secondary" className="text-[9px] h-5 uppercase">
              {story.estimated_complexity}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {storyTitle && <h4 className={styles.typography.h4}>{storyTitle}</h4>}
          {storyText && (
            <div className={cn("p-3 rounded-lg bg-muted/30 border border-border/20 italic", styles.typography.body)}>
              {storyText}
            </div>
          )}
          {storyDesc && storyDesc !== storyText && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {storyDesc}
            </p>
          )}

          {isObject && story.dependencies && story.dependencies.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Depends on:</span>
              <div className="flex gap-1">
                {story.dependencies.map((dep: string) => (
                  <span key={dep} className="px-1.5 py-0.5 bg-destructive/5 text-destructive border border-destructive/10 rounded font-mono">{dep}</span>
                ))}
              </div>
            </div>
          )}

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
  const isObject = typeof criteria === 'object' && criteria !== null;
  const criteriaText = isObject ? criteria.criteria : criteria;
  const criteriaDesc = isObject ? criteria.description : undefined;
  const criteriaTitle = isObject ? criteria.title : undefined;
  const criteriaId = isObject ? criteria.id : undefined;

  return (
    <motion.div variants={item} className={cn(
      "group flex items-start gap-3 p-3 rounded-lg border transition-all hover:border-emerald-500/30",
      styles.colors.bgCard, styles.colors.borderMuted
    )}>
      <div className="mt-0.5 h-6 w-6 flex-none flex items-center justify-center rounded bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0 pt-0.5 relative">
        <div className="flex justify-between items-start mb-1">
          <div className="flex flex-col gap-0.5">
            {criteriaId && (
              <div className="text-[10px] font-mono text-muted-foreground/60 font-bold uppercase tracking-tighter">{criteriaId}</div>
            )}
            {criteriaTitle && (
              <h5 className="text-xs font-bold text-foreground">{criteriaTitle}</h5>
            )}
          </div>
          {isObject && criteria.priority && (
            <Badge variant="outline" className={cn(
              "text-[8px] h-4 uppercase px-1",
              criteria.priority === 'must' ? "text-red-600 border-red-200 bg-red-50" :
                criteria.priority === 'should' ? "text-amber-600 border-amber-200 bg-amber-50" :
                  "text-blue-600 border-blue-200 bg-blue-50"
            )}>
              {criteria.priority}
            </Badge>
          )}
        </div>
        <CopyButton text={criteriaText || criteriaTitle || ""} />
        <span className={cn("pr-6 block mt-1", styles.typography.body)}>{criteriaText}</span>
        {criteriaDesc && criteriaDesc !== criteriaText && (
          <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
            {criteriaDesc}
          </p>
        )}
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
  artifact,
  className
}: {
  artifact: any,
  className?: string
}) {
  const data = (artifact?.content || artifact || {}) as ProductManagerBackendArtifact
  const userStories = data.user_stories || []
  const acceptance = data.acceptance_criteria || []
  const assumptions = data.assumptions || []
  const out_of_scope = data.out_of_scope || []
  const swot = data.swot
  const stakeholders = data.stakeholders
  const investAnalysis = data.invest_analysis || []
  const gaps = data.gaps || []
  const opportunities = data.opportunities || []
  const summary = data.summary || ""
  const description = data.description || ""

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg, className)}>
      {/* Header Summary */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>Product Specification</h2>
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 text-[10px] px-1.5 h-5">
                Specification
              </Badge>
              <Badge variant="outline" className={cn(
                "text-[10px] font-mono uppercase px-1.5 h-5",
                data.ui_multi_section ? "border-indigo-500/30 text-indigo-600 bg-indigo-500/5" : "border-amber-500/30 text-amber-600 bg-amber-500/5"
              )}>
                {data.ui_multi_section ? "Nav: Multi-Section" : "Nav: Single-View"}
              </Badge>
            </div>
            <p className={cn(styles.typography.bodySmall, "text-indigo-600 dark:text-indigo-400 font-medium")}>
              {summary || "Detailed product requirements and specifications."}
            </p>
            {description && (
              <p className="text-[11px] text-muted-foreground/80 leading-tight mt-1 max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
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
          <StatsCard
            icon={Ban}
            label="Out of Scope"
            value={out_of_scope.length}
            color="text-red-600 dark:text-red-400"
            bg="bg-red-500/10"
          />
          <StatsCard
            icon={Zap} // Changed icon since SWOT usually implies a mix, but Zap fits strengths
            label="SWOT"
            value={swot ? 4 : 0}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatsCard
            icon={GanttChartSquare}
            label="INVEST"
            value={investAnalysis.length}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Gaps"
            value={gaps.length}
            color="text-red-600 dark:text-red-400"
            bg="bg-red-500/10"
          />
          <StatsCard
            icon={TrendingUp}
            label="Opportunities"
            value={opportunities.length}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full flex-wrap">
                <TabTrigger value="overview" icon={Info} label="Overview" />
                <TabTrigger value="stories" icon={ListTodo} label="User Stories" count={userStories.length} />
                <TabTrigger value="acceptance" icon={CheckCircle2} label="Acceptance" count={acceptance.length} />
                <TabTrigger value="invest" icon={GanttChartSquare} label="INVEST" count={investAnalysis.length} />
                <TabTrigger value="assumptions" icon={Lightbulb} label="Assumptions" count={assumptions.length} />
                <TabTrigger value="outofscope" icon={Ban} label="Out of Scope" count={out_of_scope.length} />
                <TabTrigger value="swot" icon={TrendingUp} label="SWOT" />
                <TabTrigger value="gaps" icon={AlertTriangle} label="Gaps" count={gaps.length} />
                <TabTrigger value="opportunities" icon={TrendingUp} label="Opportunities" count={opportunities.length} />
                <TabTrigger value="stakeholders" icon={Users} label="Stakeholders" count={stakeholders?.length || 0} />
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <TabsContent key="overview" value="overview" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                    {summary && (
                      <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Strategic Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className={cn("leading-relaxed text-muted-foreground text-xs")}>
                            {summary}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Map className="h-4 w-4 text-orange-500" />
                          Product Vision
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={cn("leading-relaxed", styles.typography.body)}>
                          {data.description || "The product vision and high-level strategy for this implementation."}
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className={cn("border-none shadow-sm h-full", styles.colors.bgCard)}>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Layers className="h-4 w-4 text-indigo-500" />
                            UI Architecture Strategy
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                            <div className="space-y-0.5">
                              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Navigation Pattern</div>
                              <div className="text-sm font-bold text-foreground">{data.ui_multi_section ? "Multi-Section (Sidebar/Tabs)" : "Single-View Experience"}</div>
                            </div>
                            <Badge variant="outline" className={cn(
                              "font-mono text-[10px] h-6",
                              data.ui_multi_section ? "border-indigo-500/30 text-indigo-600" : "border-amber-500/30 text-amber-600"
                            )}>
                              {data.ui_multi_section ? "COMPLEX" : "LITE"}
                            </Badge>
                          </div>

                          {swot && (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                                <div className="text-[9px] font-bold text-emerald-600 uppercase">Strengths</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{swot.strengths?.length || 0} items</div>
                              </div>
                              <div className="p-2 rounded bg-red-500/5 border border-red-500/10">
                                <div className="text-[9px] font-bold text-red-600 uppercase">Weaknesses</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{swot.weaknesses?.length || 0} items</div>
                              </div>
                            </div>
                          )}

                          <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                            This strategy was determined by the PM to best serve the identified core workflows and user experience requirements.
                          </p>
                        </CardContent>
                      </Card>

                    </div>
                  </motion.div>
                </TabsContent>

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

                <TabsContent key="invest" value="invest" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    {investAnalysis.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-2xl border-muted">
                        <GanttChartSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">No INVEST analysis available.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {investAnalysis.map((item: any, i: number) => (
                          <motion.div key={i} variants={item}>
                            <Card className="overflow-hidden border border-border/50 shadow-sm relative group hover:border-blue-500/30 transition-all">
                              <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-colors",
                                item.score >= 9 ? "bg-emerald-500" :
                                  item.score >= 7 ? "bg-blue-500" :
                                    item.score >= 5 ? "bg-amber-500" : "bg-red-500"
                              )} />
                              <CardHeader className="pb-3 px-5 pt-4 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-muted-foreground/60">{item.user_story_id}</span>
                                    <div className="h-5 w-px bg-border/60 mx-1" />
                                    <CardTitle className="text-sm font-semibold">Quality Analysis</CardTitle>
                                  </div>
                                </div>
                                <Badge variant="outline" className={cn("font-mono font-bold",
                                  item.score >= 9 ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" :
                                    item.score >= 7 ? "text-blue-600 bg-blue-500/10 border-blue-500/20" :
                                      item.score >= 5 ? "text-amber-600 bg-amber-500/10 border-amber-500/20" :
                                        "text-red-600 bg-red-500/10 border-red-500/20"
                                )}>
                                  SCORE: {item.score}/10
                                </Badge>
                              </CardHeader>
                              <CardContent className="px-5 pb-5">
                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                                  {[
                                    { k: 'Independent', v: item.independent },
                                    { k: 'Negotiable', v: item.negotiable },
                                    { k: 'Valuable', v: item.valuable },
                                    { k: 'Estimatable', v: item.estimatable },
                                    { k: 'Small', v: item.small },
                                    { k: 'Testable', v: item.testable },
                                  ].map((prop, j) => (
                                    <div key={j} className="flex items-center gap-2 text-xs">
                                      {prop.v ?
                                        <Check className="h-3.5 w-3.5 text-emerald-500" /> :
                                        <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                                      }
                                      <span className={cn(prop.v ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/30")}>
                                        {prop.k}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {item.comments && (
                                  <div className="text-xs text-muted-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-border/30 italic leading-relaxed flex gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500/60 mt-0.5 shrink-0" />
                                    {item.comments}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
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

                {gaps && gaps.length > 0 && (
                  <TabsContent key="gaps" value="gaps" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                      {gaps.map((gap: any, i: number) => (
                        <motion.div key={i} variants={item} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-red-700 dark:text-red-400">{gap.gap}</h4>
                            <Badge variant="outline" className={cn(
                              "text-[10px] uppercase",
                              gap.priority === 'high' ? "text-red-600 border-red-500/30 bg-red-500/10" :
                                gap.priority === 'low' ? "text-blue-600 border-blue-500/30 bg-blue-500/10" :
                                  "text-amber-600 border-amber-500/30 bg-amber-500/10"
                            )}>
                              {gap.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{gap.impact}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  </TabsContent>
                )}

                {opportunities && opportunities.length > 0 && (
                  <TabsContent key="opportunities" value="opportunities" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                      {opportunities.map((opp: any, i: number) => (
                        <motion.div key={i} variants={item} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{opp.opportunity}</h4>
                            <Badge variant="outline" className={cn(
                              "text-[10px] uppercase",
                              opp.feasibility === 'high' ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" :
                                opp.feasibility === 'low' ? "text-red-600 border-red-500/30 bg-red-500/10" :
                                  "text-blue-600 border-blue-500/30 bg-blue-500/10"
                            )}>
                              {opp.feasibility} Feasibility
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{opp.value}</p>
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
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div >
    </div >
  )
}
