'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ShieldAlert,
  ListTodo,
  AlertTriangle,
  Info,
  Target,
  Shield,
  UserCheck,
  Globe,
  Activity,
  TestTube,
  CheckCircle2,
  Copy,
  ExternalLink,
  ClipboardCheck,
  Clock,
  Code
} from "lucide-react"

import { QABackendArtifact } from "@/lib/metasop/artifacts/qa/types"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  ArtifactHeaderBlock,
  ArtifactTabBar,
  TabTrigger,
  EmptyStateCard,
  itemVariants as item
} from "../shared-components"

import { OverviewSection } from "./sections/OverviewSection"
import { StrategySection } from "./sections/StrategySection"
import { TestCasesSection } from "./sections/TestCasesSection"
import { RiskAnalysisSection } from "./sections/RiskAnalysisSection"
import { SecurityPlanSection } from "./sections/SecurityPlanSection"
import { ManualVerificationSection } from "./sections/ManualVerificationSection"
import { AccessibilityPlanSection } from "./sections/AccessibilityPlanSection"
import { UatPlanSection } from "./sections/UatPlanSection"

// --- Helper Components (Internal) ---

function TestPlanCard({ tc }: { tc: any }) {
  const isObject = typeof tc === 'object' && tc !== null;
  const tcTitle = isObject ? tc.title : undefined;
  const tcDesc = isObject ? tc.description : tc;
  const tcMethod = isObject ? tc.method : undefined;
  const tcPriority = isObject ? tc.priority : undefined;
  const tcType = isObject ? tc.type : undefined;

  return (
    <motion.div variants={item} className="h-full">
      <Card className={cn(
        "h-full border border-border/40 hover:border-blue-500/30 transition-all group relative overflow-hidden",
        styles.colors.bgCard
      )}>
        <div className={cn(
          "absolute top-0 left-0 w-full h-1",
          tcPriority === 'high' ? "bg-red-500/40" :
            tcPriority === 'low' ? "bg-blue-500/40" : "bg-emerald-500/40"
        )} />

        <CardHeader className="pb-3 px-5 pt-5">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                  "text-[9px] uppercase font-bold px-1.5 h-5",
                  tcType === 'automated' ? "text-emerald-600 border-emerald-500/20 bg-emerald-500/5" : "text-amber-600 border-amber-500/20 bg-amber-500/5"
                )}>
                  {tcType || 'manual'}
                </Badge>
                {tcPriority && (
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-tighter px-1 rounded",
                    tcPriority === 'high' ? "text-red-500 bg-red-500/5" : "text-blue-500 bg-blue-500/5"
                  )}>
                    {tcPriority}
                  </span>
                )}
              </div>
              {tcTitle && <CardTitle className="text-sm font-bold mt-1 text-foreground leading-tight">{tcTitle}</CardTitle>}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                title="Copy test case"
                aria-label="Copy test case"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button 
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                title="Open external link"
                aria-label="Open external link"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "{tcDesc}"
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                <ClipboardCheck className="h-3 w-3" /> Method
              </div>
              <div className="text-[11px] font-medium text-foreground truncate h-4">
                {tcMethod || "Standard Verification"}
              </div>
            </div>
            {isObject && tc.expected_result && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  <CheckCircle2 className="h-3 w-3" /> Expected
                </div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate h-4">
                  {tc.expected_result}
                </div>
              </div>
            )}
            {isObject && tc.estimated_time && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  <Clock className="h-3 w-3" /> Duration
                </div>
                <div className="text-[11px] font-medium text-foreground h-4">
                  {tc.estimated_time}
                </div>
              </div>
            )}
            {isObject && tc.component_ref && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  <Code className="h-3 w-3" /> Source
                </div>
                <div className="text-[11px] font-mono font-medium text-blue-600 h-4 truncate">
                  {tc.component_ref}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RiskCard({ risk }: { risk: any }) {
  const severity = risk.severity?.toLowerCase() || 'medium'
  const severityColor =
    severity === 'critical' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' :
      severity === 'high' ? 'text-orange-600 bg-orange-500/10 border-orange-500/20' :
        severity === 'medium' ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' :
          'text-blue-600 bg-blue-500/10 border-blue-500/20'

  return (
    <motion.div variants={item}>
      <Card className={cn("border border-border/40 overflow-hidden group", styles.colors.bgCard)}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className={cn("text-[10px] uppercase font-black tracking-tighter h-5 px-1.5", severityColor)}>
              {severity}
            </Badge>
            <div className="text-[10px] font-bold text-muted-foreground/40 font-mono">RISK_ID: {Math.random().toString(36).substr(2, 4).toUpperCase()}</div>
          </div>
          <CardTitle className="text-sm font-bold text-foreground group-hover:text-rose-600 transition-colors">
            {risk.risk || risk.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
              <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1 tracking-widest">Impact Analysis</div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">{risk.impact}</p>
            </div>
            <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
              <div className="text-[9px] font-bold text-emerald-600 uppercase mb-1 tracking-widest flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Mitigation Strategy
              </div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400 leading-relaxed font-semibold italic">
                {risk.mitigation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Main Component ---

export default function QAVerificationPanel({
  artifact
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as QABackendArtifact
  const testCases = data.test_cases || []
  const coverage = data.coverage || {}
  const performanceMetrics = data.performance_metrics || {}
  const testStrategy = data.test_strategy || {}
  const riskAnalysis = data.risk_analysis || []
  const securityPlan = data.security_plan
  const manualVerification = data.manual_verification_steps || []
  const accessibilityPlan = data.accessibility_plan || (data as any).accessibilityPlan
  const manualUatPlan = data.manual_uat_plan || (data as any).manualUatPlan
  const ok = data.ok
  const coveragePercent =
    (coverage as any).total ??
    (coverage as any).overall ??
    (coverage as any).percentage ??
    (coverage as any).lines ??
    (coverage as any).statements ??
    (coverage as any).functions ??
    (coverage as any).branches
  const coverageThreshold = coverage?.threshold
  const summaryText = (data as any).summary || "Quality assurance strategy, test plans, and risk analysis."
  const descriptionText = (data as any).summary ? data.description : undefined

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <ArtifactHeaderBlock
        title="QA Verification"
        summary={summaryText}
        description={descriptionText}
        badges={(
          <>
            {ok !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  styles.badges.small,
                  "uppercase font-bold",
                  ok ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" : "text-rose-600 border-rose-500/30 bg-rose-500/5"
                )}
              >
                {ok ? "Ready for Release" : "Verification Pending"}
              </Badge>
            )}
            <Badge variant="secondary" className={cn(styles.badges.small, "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20")}>
              Quality Assurance
            </Badge>
            {Object.keys(coverage).length > 0 && (
              <Badge variant="outline" className={cn(styles.badges.small, "font-mono text-green-600 border-green-500/30 uppercase")}>
                Coverage: {coveragePercent !== undefined ? `${coveragePercent}%` : '—'} {coverageThreshold && `(Goal: ${coverageThreshold}%)`}
              </Badge>
            )}
          </>
        )}
      >
        <div className={styles.layout.statsGrid}>
          <StatsCard
            icon={TestTube}
            label="Test Cases"
            value={testCases.length}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatsCard
            icon={ShieldAlert}
            label="Risks"
            value={riskAnalysis.length}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatsCard
            icon={Activity}
            label="Coverage"
            value={coveragePercent !== undefined ? `${coveragePercent}%` : "—"}
            subValue={coverageThreshold ? `Target: ${coverageThreshold}%` : undefined}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
            isText={true}
          />
        </div>
      </ArtifactHeaderBlock>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <ArtifactTabBar>
            <TabTrigger value="overview" icon={Info} label="Overview" />
            <TabTrigger value="strategy" icon={Target} label="Strategy" />
            <TabTrigger value="cases" icon={ListTodo} label="Test Cases" count={testCases.length} />
            <TabTrigger value="risks" icon={AlertTriangle} label="Risk Analysis" count={riskAnalysis.length} />
            {securityPlan && <TabTrigger value="security" icon={Shield} label="Security Plan" />}
            {manualVerification.length > 0 && <TabTrigger value="manual" icon={UserCheck} label="Manual Audit" count={manualVerification.length} />}
            {accessibilityPlan && <TabTrigger value="accessibility" icon={Globe} label="Accessibility" />}
            {manualUatPlan && <TabTrigger value="uat" icon={UserCheck} label="UAT Plan" />}
          </ArtifactTabBar>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <OverviewSection
                  description={data.description}
                  testStrategy={testStrategy}
                />
                {Object.keys(testStrategy).length > 0 || Object.keys(performanceMetrics).length > 0 || Object.keys(coverage).length > 0 ? (
                  <StrategySection
                    testStrategy={testStrategy}
                    performanceMetrics={performanceMetrics}
                    coverage={coverage}
                  />
                ) : (
                  <EmptyStateCard title="Strategy" description="No QA strategy details were generated for this run." icon={Target} />
                )}
                {testCases.length > 0 ? (
                  <TestCasesSection
                    testCases={testCases}
                    TestPlanCard={TestPlanCard}
                  />
                ) : (
                  <EmptyStateCard title="Test Cases" description="No test cases were generated for this run." icon={ListTodo} />
                )}
                {riskAnalysis.length > 0 ? (
                  <RiskAnalysisSection
                    riskAnalysis={riskAnalysis}
                    RiskCard={RiskCard}
                  />
                ) : (
                  <EmptyStateCard title="Risk Analysis" description="No risk analysis was generated for this run." icon={AlertTriangle} />
                )}
                {securityPlan ? (
                  <SecurityPlanSection securityPlan={securityPlan} />
                ) : (
                  <EmptyStateCard title="Security Plan" description="No security plan was generated for this run." icon={Shield} />
                )}
                {manualVerification.length > 0 ? (
                  <ManualVerificationSection manualVerification={manualVerification} />
                ) : (
                  <EmptyStateCard title="Manual Audit" description="No manual verification steps were generated for this run." icon={UserCheck} />
                )}
                {accessibilityPlan ? (
                  <AccessibilityPlanSection accessibilityPlan={accessibilityPlan} />
                ) : (
                  <EmptyStateCard title="Accessibility" description="No accessibility plan was generated for this run." icon={Globe} />
                )}
                {manualUatPlan ? (
                  <UatPlanSection manualUatPlan={manualUatPlan} />
                ) : (
                  <EmptyStateCard title="UAT Plan" description="No UAT plan was generated for this run." icon={UserCheck} />
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
