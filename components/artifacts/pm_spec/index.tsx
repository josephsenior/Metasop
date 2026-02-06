'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Target,
  Users,
  Zap,
  Ban,
  ListTodo,
  // AlertTriangle removed (unused)
  GanttChartSquare,
  Info
} from "lucide-react"

import { ProductManagerBackendArtifact } from "@/lib/metasop/artifacts/product-manager/types"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  ArtifactHeaderBlock,
  ArtifactTabBar,
  TabTrigger,
  CopyButton,
  EmptyStateCard,
  itemVariants as item
} from "../shared-components"

import { OverviewSection } from "./sections/OverviewSection"
import { UserStoriesSection } from "./sections/UserStoriesSection"
import { AcceptanceCriteriaSection } from "./sections/AcceptanceCriteriaSection"
import { InvestAnalysisSection } from "./sections/InvestAnalysisSection"
import { AssumptionsSection } from "./sections/AssumptionsSection"
import { SWOTSection } from "./sections/SWOTSection"
import { StakeholdersSection } from "./sections/StakeholdersSection"

// --- Helper Components (Internal to this module) ---

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
              {priority?.toUpperCase() || 'MEDIUM'}
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
            <div className="mt-3 flex items-start gap-3 bg-muted/20 p-2.5 rounded-lg border border-blue-500/10">
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

// --- Main Component ---

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
  const summary = data.summary || ""
  const description = data.description || ""
  const summaryText = summary || description || "Detailed product requirements and specifications."
  const descriptionText = summary ? description : undefined

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg, className)}>
      {/* Header Summary */}
      <ArtifactHeaderBlock
        title="Product Specification"
        summary={summaryText}
        summaryClassName="text-indigo-600 dark:text-indigo-400 font-medium"
        description={descriptionText}
        badges={(
          <>
            <Badge variant="secondary" className={cn(styles.badges.small, "bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20")}>
              Specification
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                styles.badges.small,
                "font-mono uppercase",
                data.ui_multi_section ? "border-indigo-500/30 text-indigo-600 bg-indigo-500/5" : "border-amber-500/30 text-amber-600 bg-amber-500/5"
              )}
            >
              {data.ui_multi_section ? "Nav: Multi-Section" : "Nav: Single-View"}
            </Badge>
          </>
        )}
      >
        <div className={styles.layout.statsGrid}>
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
            icon={Zap}
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
        </div>
      </ArtifactHeaderBlock>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <ArtifactTabBar>
            <TabTrigger value="overview" icon={Info} label="Overview" />
            <TabTrigger value="stories" icon={ListTodo} label="User Stories" count={userStories.length} />
            <TabTrigger value="acceptance" icon={CheckCircle2} label="Acceptance" count={acceptance.length} />
            <TabTrigger value="invest" icon={GanttChartSquare} label="INVEST" count={investAnalysis.length} />
            <TabTrigger value="assumptions" icon={Lightbulb} label="Assumptions" count={assumptions.length} />
            <TabTrigger value="outofscope" icon={Ban} label="Out of Scope" count={out_of_scope.length} />
            <TabTrigger value="swot" icon={TrendingUp} label="SWOT" />
            <TabTrigger value="stakeholders" icon={Users} label="Stakeholders" count={stakeholders?.length || 0} />
          </ArtifactTabBar>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <OverviewSection
                  summary={summary}
                  description={description}
                  ui_multi_section={data.ui_multi_section}
                  swot={swot}
                />
                {userStories.length > 0 ? (
                  <UserStoriesSection
                    userStories={userStories}
                    UserStoryCard={UserStoryCard}
                  />
                ) : (
                  <EmptyStateCard title="User Stories" description="No user stories were generated for this run." icon={ListTodo} />
                )}
                {acceptance.length > 0 ? (
                  <AcceptanceCriteriaSection
                    acceptance={acceptance}
                    CriteriaCard={CriteriaCard}
                  />
                ) : (
                  <EmptyStateCard title="Acceptance Criteria" description="No acceptance criteria were generated for this run." icon={CheckCircle2} />
                )}
                {investAnalysis.length > 0 ? (
                  <InvestAnalysisSection investAnalysis={investAnalysis} />
                ) : (
                  <EmptyStateCard title="INVEST Analysis" description="No INVEST analysis was generated for this run." icon={GanttChartSquare} />
                )}
                {assumptions.length > 0 || out_of_scope.length > 0 ? (
                  <AssumptionsSection
                    assumptions={assumptions}
                    out_of_scope={out_of_scope}
                    AssumptionCard={AssumptionCard}
                  />
                ) : (
                  <EmptyStateCard title="Assumptions" description="No assumptions or out-of-scope items were generated for this run." icon={Lightbulb} />
                )}
                {swot ? (
                  <SWOTSection swot={swot} />
                ) : (
                  <EmptyStateCard title="SWOT" description="No SWOT analysis was generated for this run." icon={TrendingUp} />
                )}
                {stakeholders && stakeholders.length > 0 ? (
                  <StakeholdersSection stakeholders={stakeholders} />
                ) : (
                  <EmptyStateCard title="Stakeholders" description="No stakeholders were identified for this run." icon={Users} />
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
