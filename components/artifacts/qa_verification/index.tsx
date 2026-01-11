'use client'

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ListTodo,
  TestTube,
  Zap,
  Clock,
  Bug,
  ShieldAlert,
  Gauge,
  ClipboardCheck,
  Activity,
  Search,
  Target
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

function getTestStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'pass':
    case 'passed':
      return <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /></div>
    case 'fail':
    case 'failed':
      return <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><XCircle className="h-3.5 w-3.5 text-red-500" /></div>
    case 'skipped':
      return <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><Clock className="h-3.5 w-3.5 text-amber-500" /></div>
    default:
      return <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center border border-border"><AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" /></div>
  }
}

function AuditLogEntry({ item: logItem, index }: { item: any, index: number }) {
  return (
    <motion.div variants={item} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4 border-b border-border/20 last:border-0">
      {getTestStatusIcon(logItem.status)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold text-foreground truncate">{logItem.title || logItem.category || `Entry ${index + 1}`}</h4>
          {logItem.status && (
            <Badge
              variant={logItem.status === 'pass' || logItem.status === 'passed' ? 'default' : logItem.status === 'fail' || logItem.status === 'failed' ? 'destructive' : 'secondary'}
              className="text-[8px] h-4 px-1.5 uppercase"
            >
              {logItem.status}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{logItem.details}</p>
        
        {logItem.recommendations && logItem.recommendations.length > 0 && (
          <div className="mt-2 space-y-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2">
            <div className="text-[9px] font-bold text-amber-600 uppercase flex items-center gap-1 mb-1">
              <Zap className="h-3 w-3" /> Recommendations
            </div>
            {logItem.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-[10px] text-amber-700 dark:text-amber-500">
                <div className="h-1 w-1 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

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
  return (
    <motion.div 
      variants={item}
      className="p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-foreground">{risk.risk}</span>
        <Badge className={cn(
          "text-[8px] h-4 px-1.5 uppercase",
          risk.impact === 'high' ? 'bg-red-500' : risk.impact === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
        )}>
          {risk.impact} IMPACT
        </Badge>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-amber-500/20 pl-3">
        Mitigation: {risk.mitigation}
      </p>
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
  const report = data.report || []
  const coverage = data.coverage || {}
  const securityFindings = data.security_findings || []
  const performanceMetrics = data.performance_metrics || {}
  const testStrategy = data.test_strategy || {}
  const riskAnalysis = data.risk_analysis || []
  const coveragePercent =
    (coverage as any).total ??
    (coverage as any).overall ??
    (coverage as any).percentage ??
    (coverage as any).lines ??
    (coverage as any).statements ??
    (coverage as any).functions ??
    (coverage as any).branches

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>QA Verification</h2>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 text-[10px] px-1.5 h-5">
                Quality Assurance
              </Badge>
              {Object.keys(coverage).length > 0 && (
                <Badge variant="outline" className="text-[10px] font-mono text-green-600 border-green-500/30 uppercase px-1.5 h-5">
                  Coverage: {coveragePercent ?? 'N/A'}%
                </Badge>
              )}
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).summary || "Quality assurance strategy, test plans, and risk analysis."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            icon={Bug} 
            label="Issues" 
            value={securityFindings.length} 
            color="text-red-600 dark:text-red-400" 
            bg="bg-red-500/10" 
          />
          <StatsCard 
            icon={Activity} 
            label="Coverage" 
            value={coveragePercent !== undefined ? `${coveragePercent}%` : "N/A"} 
            color="text-emerald-600 dark:text-emerald-400" 
            bg="bg-emerald-500/10" 
            isText={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="strategy" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="strategy" icon={Target} label="Strategy" />
                <TabTrigger value="cases" icon={ListTodo} label="Test Cases" count={testCases.length} />
                <TabTrigger value="risks" icon={AlertTriangle} label="Risk Analysis" count={riskAnalysis.length} />
                <TabTrigger value="report" icon={ClipboardCheck} label="Audit Report" count={report.length} />
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4 max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
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
                            {Object.entries(performanceMetrics).map(([key, value]: [string, any], i) => (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                  <span className="font-mono font-medium">{value}</span>
                                </div>
                                <Progress value={75} className="h-1.5 bg-muted" />
                              </div>
                            ))}
                            {Object.keys(performanceMetrics).length === 0 && (
                              <div className="text-center py-8 text-muted-foreground text-xs italic">
                                No performance metrics defined.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

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

                  <TabsContent key="report" value="report" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show">
                      <Card className={cn("border-none shadow-sm overflow-hidden", styles.colors.bgCard)}>
                        <CardHeader className="border-b border-border/10 bg-muted/30 pb-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-blue-500" />
                            Audit Log
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-border/10">
                            {report.map((item: any, i: number) => (
                              <AuditLogEntry key={i} item={item} index={i} />
                            ))}
                          </div>
                          {report.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                              <p className="text-sm">No audit report available.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
