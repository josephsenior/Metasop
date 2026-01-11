'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Shield,
  Lock,
  AlertTriangle,
  Key,
  UserCheck,
  ShieldAlert,
  FileText,
  CheckCircle,
  ShieldCheck,
  Activity,
  Globe,
  Database,
  Network,
  Eye,
} from "lucide-react"

import { SecurityBackendArtifact } from "@/lib/metasop/artifacts/security/types"
import { artifactStyles as styles } from "../shared-styles"
import { 
  StatsCard, 
  TabTrigger, 
  containerVariants as container, 
  itemVariants as item 
} from "../shared-components"

export default function SecurityArchitecturePanel({
  artifact
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as SecurityBackendArtifact

  const {
    security_architecture,
    threat_model = [],
    security_controls = [],
    encryption,
    compliance = [],
    vulnerability_management,
    security_monitoring
  } = data

  const auth = security_architecture?.authentication
  const authz = security_architecture?.authorization

  const getSeverityStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-900 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse'
      case 'high': return 'bg-orange-500/10 text-orange-700 border-orange-200 shadow-[0_0_8px_rgba(249,115,22,0.1)]'
      case 'medium': return 'bg-amber-500/10 text-amber-700 border-amber-200'
      case 'low': return 'bg-blue-500/10 text-blue-700 border-blue-200'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Security Hub Header */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>Security Architecture</h2>
              <Badge variant="secondary" className="bg-red-500/10 text-red-700 hover:bg-red-500/20 text-[10px] px-1.5 h-5">
                Blueprint
              </Badge>
              <Badge variant="outline" className={cn(
                "text-[10px] font-mono border-red-500/30 uppercase px-1.5 py-0.5",
                threat_model.length > 3 ? "text-red-600 border-red-500/40" : "text-emerald-600 border-emerald-500/30"
              )}>
                THREAT_LEVEL: {threat_model.length > 3 ? 'ELEVATED' : 'NORMAL'}
              </Badge>
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).security_architecture?.description || (data as any).summary || (data as any).description || "Security controls and threat model."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard 
            icon={AlertTriangle} 
            label="Vectors" 
            value={threat_model.length} 
            color="text-red-600 dark:text-red-400" 
            bg="bg-red-500/10" 
          />
          <StatsCard 
            icon={ShieldCheck} 
            label="Controls" 
            value={security_controls.length} 
            color="text-emerald-600 dark:text-emerald-400" 
            bg="bg-emerald-500/10" 
          />
          <StatsCard 
            icon={UserCheck} 
            label="Auth" 
            value={auth?.method || "N/A"} 
            color="text-blue-600 dark:text-blue-400" 
            bg="bg-blue-500/10" 
            isText={true}
          />
          <StatsCard 
            icon={FileText} 
            label="Audits" 
            value={compliance.length} 
            color="text-amber-600 dark:text-amber-400" 
            bg="bg-amber-500/10" 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="threats" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="threats" icon={AlertTriangle} label="Threat Matrix" count={threat_model.length} />
                <TabTrigger value="controls" icon={ShieldCheck} label="Defense Grid" count={security_controls.length} />
                <TabTrigger value="arch" icon={Network} label="Architecture" />
                <TabTrigger value="data" icon={Lock} label="Encryption" />
                {(vulnerability_management || security_monitoring) && (
                  <TabTrigger value="management" icon={Activity} label="Management" />
                )}
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4 max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                  <TabsContent key="threats" value="threats" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {threat_model.map((threat: any, i: number) => (
                        <motion.div 
                          key={i} 
                          variants={item}
                          className={cn(
                            "group border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md",
                            styles.colors.bgCard, styles.colors.borderMuted
                          )}
                        >
                          <div className={cn("p-3 border-b flex justify-between items-center bg-muted/30", styles.colors.borderMuted)}>
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4 text-red-500" />
                              <span className="font-semibold text-sm">{threat.threat || "Unknown Threat"}</span>
                            </div>
                            <Badge variant="outline" className={cn("text-[9px] uppercase font-mono px-1.5", getSeverityStyles(threat.severity))}>
                              {threat.severity}
                            </Badge>
                          </div>
                          <div className="p-4 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">{threat.description}</p>
                            {threat.mitigation && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5">
                                <div className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1 mb-1">
                                  <ShieldCheck className="h-3 w-3" /> Mitigation
                                </div>
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed">{threat.mitigation}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {threat_model.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                          <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No threats identified.</p>
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="controls" value="controls" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                      {security_controls.map((control: any, i: number) => (
                        <motion.div 
                          key={i} 
                          variants={item}
                          className="flex items-start gap-4 p-4 border rounded-xl bg-card hover:bg-muted/10 transition-colors shadow-sm"
                        >
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Shield className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-sm font-bold">{control.control || control.name}</h4>
                              <Badge variant="secondary" className="text-[9px] uppercase">{control.type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{control.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {control.id || `CTRL-${i+1}`}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="arch" value="arch" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Authentication */}
                      <Card className="border-none shadow-sm bg-card h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            Authentication
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                            <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Method</div>
                            <div className="text-sm font-medium">{auth?.method || "Not specified"}</div>
                          </div>
                          {auth?.mfa_enabled && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Multi-Factor Authentication Enabled
                            </div>
                          )}
                          {auth?.providers && (
                            <div className="space-y-1">
                              <div className="text-[10px] uppercase text-muted-foreground font-bold">Providers</div>
                              <div className="flex flex-wrap gap-1.5">
                                {auth.providers.map((p: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[10px]">{p}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Authorization */}
                      <Card className="border-none shadow-sm bg-card h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Key className="h-4 w-4 text-purple-500" />
                            Authorization
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                            <div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Model</div>
                            <div className="text-sm font-medium">{authz?.model || "RBAC"}</div>
                          </div>
                          {Array.isArray((authz as any)?.roles) && (
                            <div className="space-y-2">
                              <div className="text-[10px] uppercase text-muted-foreground font-bold">Roles</div>
                              <div className="grid grid-cols-2 gap-2">
                                {(authz as any).roles.map((role: any, i: number) => (
                                  <div key={i} className="text-xs bg-muted/20 p-1.5 rounded border border-border/20 truncate">
                                    {typeof role === 'string' ? role : role.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Network Security */}
                      <Card className="col-span-full border-none shadow-sm bg-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-cyan-500" />
                            Network Boundaries
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {['Public', 'DMZ', 'Private'].map((zone) => (
                              <div key={zone} className="flex flex-col items-center p-3 rounded-lg border border-dashed border-border/60 bg-muted/5">
                                <span className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">{zone} Zone</span>
                                <Shield className="h-5 w-5 text-muted-foreground/30" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="data" value="data" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                      <Card className="border-none shadow-sm bg-card">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Lock className="h-4 w-4 text-amber-500" />
                            Data Encryption
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              At Rest
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
                              <div className="text-xs font-mono">{encryption?.data_at_rest?.method || "AES-256"}</div>
                              {encryption?.data_at_rest?.key_management && (
                                <div className="mt-1 text-[10px] text-muted-foreground">
                                  KMS: {encryption.data_at_rest.key_management}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                              <Network className="h-4 w-4 text-muted-foreground" />
                              In Transit
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border border-border/40">
                              <div className="text-xs font-mono">{encryption?.data_in_transit?.method || "TLS 1.3"}</div>
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                Force HTTPS: Yes
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {compliance.length > 0 && (
                        <Card className="border-none shadow-sm bg-card">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-indigo-500" />
                              Compliance Standards
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {compliance.map((std: any, i: number) => (
                                <Badge key={i} variant="outline" className="py-1 px-3 border-indigo-500/20 text-indigo-600 bg-indigo-500/5">
                                  {typeof std === "string" ? std : (std.standard || "standard")}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  </TabsContent>

                  {(vulnerability_management || security_monitoring) && (
                    <TabsContent key="management" value="management" className="m-0 outline-none">
                      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vulnerability_management && (
                          <Card className="border-none shadow-sm bg-card h-full">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Eye className="h-4 w-4 text-pink-500" />
                                Vulnerability Mgmt
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                <span className="text-muted-foreground">Scan Frequency</span>
                                <span className="font-medium">{vulnerability_management.scanning_frequency || "Weekly"}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                <span className="text-muted-foreground">Patch Management</span>
                                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5">
                                  {vulnerability_management.patch_management || "Manual"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {security_monitoring && (
                          <Card className="border-none shadow-sm bg-card h-full">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-orange-500" />
                                Monitoring
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {security_monitoring.log_retention && (
                                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                  <span className="text-muted-foreground">Log Retention</span>
                                  <span className="font-medium">{security_monitoring.log_retention}</span>
                                </div>
                              )}
                              {Array.isArray(security_monitoring.tools) && security_monitoring.tools.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Tools</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {security_monitoring.tools.map((t: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {security_monitoring.incident_response_plan && (
                                <div className="text-xs text-muted-foreground leading-relaxed bg-muted/20 border border-border/30 rounded-lg p-3">
                                  {security_monitoring.incident_response_plan}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
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
