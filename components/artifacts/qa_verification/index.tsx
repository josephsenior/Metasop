'use client'

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  ListTodo,
  TestTube,
  Zap,
  ShieldAlert,
  Gauge,
  Activity,
  Target,
  FileText,
  Code2,
  GitBranch,
  FunctionSquare,
  Shield,
  UserCheck,
  ScanSearch,
  CheckCircle2,
  MousePointerClick,
  Info,
  Map,
  Layers,
  ChevronRight,
  Globe,
  Database
} from "lucide-react"

import { QABackendArtifact } from "@/lib/metasop/artifacts/qa/types"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
  containerVariants as container,
  itemVariants as item
} from "../shared-components"


function TestPlanCard({ tc }: { tc: any }) {
  return (
    <motion.div
      variants={item}
      className={cn("group border overflow-hidden shadow-sm hover:border-blue-500/30 transition-all relative rounded-xl", styles.colors.bgCard, styles.colors.borderMuted)}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500/50 transition-colors" />
      <div className="p-4 pl-5">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xs font-bold text-foreground">{tc.name}</h4>
          <Badge variant="outline" className={cn(
            "text-[8px] px-1.5 h-4 uppercase",
            tc.priority === 'critical' ? 'border-red-500 text-red-500 bg-red-500/5' :
              tc.priority === 'high' ? 'border-orange-500 text-orange-500 bg-orange-500/5' :
                'border-blue-500 text-blue-500 bg-blue-500/5'
          )}>
            {tc.priority}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{tc.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-border/10">
          <Badge variant="secondary" className="text-[8px] h-4 px-1.5 uppercase font-mono">{tc.type}</Badge>
          {tc.expected_result && (
            <span className="text-[9px] text-muted-foreground italic truncate max-w-[150px]" title={tc.expected_result}>
              Exp: {tc.expected_result}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function RiskCard({ risk }: { risk: any }) {
  const impactConfig = {
    high: { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
  }[risk.impact as 'high' | 'medium' | 'low'] || { icon: Info, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };

  const Icon = impactConfig.icon;

  return (
    <motion.div
      variants={item}
      className="group relative p-4 rounded-xl border border-border/40 bg-muted/5 hover:bg-muted/10 transition-all duration-300"
    >
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full rounded-l-xl opacity-20 group-hover:opacity-100 transition-opacity",
        risk.impact === 'high' ? 'bg-red-500' : risk.impact === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
      )} />
      
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-2.5">
            <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", impactConfig.color)} />
            <span className="text-xs font-bold text-foreground leading-tight tracking-tight">{risk.risk}</span>
          </div>
          <Badge variant="outline" className={cn(
            "text-[9px] h-5 px-2 uppercase font-black tracking-wider shrink-0",
            impactConfig.bg, impactConfig.color, impactConfig.border
          )}>
            {risk.impact}
          </Badge>
        </div>

        <div className="relative pl-7 py-2.5 rounded-lg bg-background/40 border border-border/20">
          <div className="absolute left-2.5 top-3">
            <Zap className="h-3 w-3 text-amber-500/70" />
          </div>
          <div className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-[0.1em] mb-1">Mitigation Strategy</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium italic">
            {risk.mitigation}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

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

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>QA Verification</h2>
              {ok !== undefined && (
                <Badge variant="outline" className={cn(
                  "text-[10px] px-1.5 h-5 uppercase font-bold",
                  ok ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" : "text-rose-600 border-rose-500/30 bg-rose-500/5"
                )}>
                  {ok ? "Ready for Release" : "Verification Pending"}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 text-[10px] px-1.5 h-5">
                Quality Assurance
              </Badge>
              {Object.keys(coverage).length > 0 && (
                <Badge variant="outline" className="text-[10px] font-mono text-green-600 border-green-500/30 uppercase px-1.5 h-5">
                  Coverage: {coveragePercent ?? 'N/A'}% {coverageThreshold && `(Goal: ${coverageThreshold}%)`}
                </Badge>
              )}
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).summary || "Quality assurance strategy, test plans, and risk analysis."}
            </p>
            {data.description && (
              <p className={cn("text-[11px] text-muted-foreground/80 leading-tight mt-1 max-w-3xl")}>
                {data.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            value={coveragePercent !== undefined ? `${coveragePercent}%` : "N/A"}
            subValue={coverageThreshold ? `Target: ${coverageThreshold}%` : undefined}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
            isText={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="overview" icon={Info} label="Overview" />
                <TabTrigger value="strategy" icon={Target} label="Strategy" />
                <TabTrigger value="cases" icon={ListTodo} label="Test Cases" count={testCases.length} />
                <TabTrigger value="risks" icon={AlertTriangle} label="Risk Analysis" count={riskAnalysis.length} />
                {securityPlan && <TabTrigger value="security" icon={Shield} label="Security Plan" />}
                {manualVerification.length > 0 && <TabTrigger value="manual" icon={UserCheck} label="Manual Audit" count={manualVerification.length} />}
                {accessibilityPlan && <TabTrigger value="accessibility" icon={Globe} label="Accessibility" />}
                {manualUatPlan && <TabTrigger value="uat" icon={UserCheck} label="UAT Plan" />}
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <TabsContent key="overview" value="overview" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                    <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Map className="h-4 w-4 text-purple-500" />
                          QA Philosophy & Approach
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={cn("leading-relaxed", styles.typography.body)}>
                          {data.description || "Comprehensive quality assurance strategy designed to ensure maximum system reliability and performance."}
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Layers className="h-4 w-4 text-blue-500" />
                            Testing Methodology
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-3">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-blue-500" />
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Core Approach</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed">
                              {testStrategy.approach || "Layered verification strategy covering unit, integration, and E2E flows."}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                              { label: 'Unit', val: testStrategy.unit },
                              { label: 'Integration', val: testStrategy.integration },
                              { label: 'E2E', val: testStrategy.e2e }
                            ].map((item) => (
                              <div key={item.label} className="bg-muted/30 p-3 rounded-lg border border-border/40 flex flex-col gap-2">
                                <div className="text-[9px] uppercase font-bold text-muted-foreground">{item.label}</div>
                                <p className="text-[10px] leading-snug text-foreground/90 font-medium">
                                  {item.val || "Standard Compliance"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader>
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Tooling Ecosystem
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The following tools have been selected to provide maximum coverage and precise feedback loops during the development lifecycle.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {testStrategy.tools?.map((tool: string, i: number) => (
                              <Badge key={i} variant="outline" className="bg-amber-500/5 text-amber-700 border-amber-500/20 px-2 py-1">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent key="strategy" value="strategy" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className={cn("border-none shadow-sm h-full", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            Testing Strategy
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {(testStrategy as any).approach || "No strategy defined."}
                          </p>
                          {Array.isArray((testStrategy as any).types) && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {(testStrategy as any).types.map((type: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] bg-purple-500/5 text-purple-600 border-purple-500/20">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className={cn("border-none shadow-sm h-full", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-emerald-500" />
                            Performance Goals
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'API Response (P95)', val: performanceMetrics.api_response_time_p95, icon: Activity },
                              { label: 'Page Load', val: performanceMetrics.page_load_time, icon: Gauge },
                              { label: 'DB Query', val: performanceMetrics.database_query_time, icon: Database },
                              { label: 'FCP', val: performanceMetrics.first_contentful_paint, icon: Zap },
                              { label: 'TTI', val: performanceMetrics.time_to_interactive, icon: Activity },
                              { label: 'LCP', val: performanceMetrics.largest_contentful_paint, icon: Gauge },
                            ].filter(m => m.val).map((m, i) => (
                              <div key={i} className="bg-muted/30 p-2.5 rounded-lg border border-border/40 flex items-center justify-between group hover:bg-emerald-500/5 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-md bg-background border border-border/50">
                                    <m.icon className="h-3 w-3 text-emerald-500" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">{m.label}</span>
                                    <span className="text-xs font-semibold text-foreground">{m.val}</span>
                                  </div>
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 animate-pulse" />
                              </div>
                            ))}
                            {Object.keys(performanceMetrics).length === 0 && (
                              <div className="text-center py-8 text-muted-foreground text-xs italic">
                                No performance metrics defined.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {coverage && (Object.keys(coverage).length > 1 || coverage.percentage !== undefined) && (
                      <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            Code Coverage Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-2">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Lines</span>
                                </div>
                                <span className="font-mono font-bold">{(coverage as any).lines ?? 'N/A'}%</span>
                              </div>
                              <Progress value={(coverage as any).lines ?? 0} className="h-1.5" />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Code2 className="h-3.5 w-3.5" />
                                  <span>Statements</span>
                                </div>
                                <span className="font-mono font-bold">{(coverage as any).statements ?? 'N/A'}%</span>
                              </div>
                              <Progress value={(coverage as any).statements ?? 0} className="h-1.5" />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <FunctionSquare className="h-3.5 w-3.5" />
                                  <span>Functions</span>
                                </div>
                                <span className="font-mono font-bold">{(coverage as any).functions ?? 'N/A'}%</span>
                              </div>
                              <Progress value={(coverage as any).functions ?? 0} className="h-1.5" />
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <GitBranch className="h-3.5 w-3.5" />
                                  <span>Branches</span>
                                </div>
                                <span className="font-mono font-bold">{(coverage as any).branches ?? 'N/A'}%</span>
                              </div>
                              <Progress value={(coverage as any).branches ?? 0} className="h-1.5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {Array.isArray((testStrategy as any).tools) && (testStrategy as any).tools.length > 0 && (
                      <Card className={cn("border-none shadow-sm", styles.colors.bgCard)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Toolchain
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(testStrategy as any).tools.map((tool: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                <span className="text-xs font-medium">{tool}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent key="cases" value="cases" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testCases.map((tc: any, i: number) => (
                      <TestPlanCard key={i} tc={tc} />
                    ))}
                    {testCases.length === 0 && (
                      <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No test cases defined.</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent key="risks" value="risks" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {riskAnalysis.map((risk: any, i: number) => (
                        <RiskCard key={i} risk={risk} />
                      ))}
                    </div>
                    {riskAnalysis.length === 0 && (
                      <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No risk analysis provided.</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent key="security" value="security" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    {securityPlan ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className={cn("border-purple-500/20 shadow-sm", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-border/40 px-4 pt-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-purple-500" />
                                Auth Verification
                              </CardTitle>
                              <Badge variant="secondary" className="text-[9px] bg-purple-500/10 text-purple-600 border-purple-200">
                                {securityPlan.auth_verification_steps?.length || 0} STEPS
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            {securityPlan.auth_verification_steps && securityPlan.auth_verification_steps.length > 0 ? (
                              <ul className="space-y-2 mt-2">
                                {securityPlan.auth_verification_steps.map((step: string, i: number) => (
                                  <motion.li variants={item} key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/30">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    <span>{step}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground italic py-4 text-center">No authentication verification steps defined.</p>
                            )}
                          </CardContent>
                        </Card>

                        <Card className={cn("border-red-500/20 shadow-sm", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-border/40 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <ScanSearch className="h-4 w-4 text-red-500" />
                              Vulnerability Strategy
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                              <p className="text-xs text-foreground/80 leading-relaxed font-mono">
                                {securityPlan.vulnerability_scan_strategy || "No strategy defined."}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              <ShieldAlert className="h-3 w-3" />
                              Security Audit Protocol
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No security plan defined.</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent key="manual" value="manual" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show">
                    <Card className={cn("border-border/50 shadow-sm", styles.colors.bgCard)}>
                      <CardHeader className="pb-2 border-b border-border/40 px-4 pt-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4 text-blue-500" />
                          Manual Verification Checklist
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid gap-2">
                          {manualVerification.map((step: string, i: number) => (
                            <motion.div
                              variants={item}
                              key={i}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/40 transition-colors group"
                            >
                              <div className="flex-none h-5 w-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all" />
                              <span className="text-xs text-foreground/90 font-medium">{step}</span>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent key="accessibility" value="accessibility" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    {accessibilityPlan && typeof accessibilityPlan === 'object' ? (
                      <>
                        <Card className={cn("border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-emerald-500/10 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Globe className="h-4 w-4 text-emerald-500" />
                              WCAG Compliance & Accessibility Plan
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-6">
                            {(accessibilityPlan as any).standard && (
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                  {(accessibilityPlan as any).standard}
                                </Badge>
                              </div>
                            )}
                            
                            {(accessibilityPlan as any).automated_tools && Array.isArray((accessibilityPlan as any).automated_tools) && (accessibilityPlan as any).automated_tools.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Automated Tools</div>
                                <div className="flex flex-wrap gap-2">
                                  {(accessibilityPlan as any).automated_tools.map((tool: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                      {tool}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(accessibilityPlan as any).manual_checks && Array.isArray((accessibilityPlan as any).manual_checks) && (accessibilityPlan as any).manual_checks.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manual Checks</div>
                                <ul className="space-y-2">
                                  {(accessibilityPlan as any).manual_checks.map((check: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                      <span>{check}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {(accessibilityPlan as any).screen_readers && Array.isArray((accessibilityPlan as any).screen_readers) && (accessibilityPlan as any).screen_readers.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Screen Readers</div>
                                <div className="flex flex-wrap gap-2">
                                  {(accessibilityPlan as any).screen_readers.map((reader: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                      {reader}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card className={cn("border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                        <CardHeader className="pb-2 border-b border-emerald-500/10 px-4 pt-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-emerald-500" />
                            WCAG Compliance & Accessibility Plan
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {typeof accessibilityPlan === 'string' ? accessibilityPlan : "No specific accessibility plan defined."}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>

                {manualUatPlan && (
                  <TabsContent key="uat" value="uat" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show">
                      <Card className={cn("border-blue-500/20 bg-blue-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                        <CardHeader className="pb-2 border-b border-blue-500/10 px-4 pt-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            User Acceptance Testing (UAT) Plan
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          {typeof manualUatPlan === 'object' ? (
                            <>
                              {(manualUatPlan as any).scenarios && Array.isArray((manualUatPlan as any).scenarios) && (manualUatPlan as any).scenarios.length > 0 && (
                                <div className="space-y-3">
                                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Target className="h-3.5 w-3.5" />
                                    UAT Scenarios
                                  </div>
                                  <ul className="space-y-2">
                                    {(manualUatPlan as any).scenarios.map((scenario: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/30">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                        <span>{scenario}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {(manualUatPlan as any).acceptance_criteria && Array.isArray((manualUatPlan as any).acceptance_criteria) && (manualUatPlan as any).acceptance_criteria.length > 0 && (
                                <div className="space-y-3">
                                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Acceptance Criteria
                                  </div>
                                  <ul className="space-y-2">
                                    {(manualUatPlan as any).acceptance_criteria.map((criterion: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/30">
                                        <ChevronRight className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                        <span>{criterion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {(manualUatPlan as any).stakeholders && Array.isArray((manualUatPlan as any).stakeholders) && (manualUatPlan as any).stakeholders.length > 0 && (
                                <div className="space-y-3">
                                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <UserCheck className="h-3.5 w-3.5" />
                                    Stakeholders
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(manualUatPlan as any).stakeholders.map((stakeholder: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-[9px] border-blue-500/30 text-blue-600 bg-blue-500/5">
                                        {stakeholder}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {typeof manualUatPlan === 'string' ? manualUatPlan : "No UAT plan defined."}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
