'use client'

import * as React from "react"
import { motion } from "framer-motion"
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
  Clock,
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
  const [activeStandard, setActiveStandard] = React.useState<string | null>(null)
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
      <div className={styles.layout.header}>
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

        <div className={styles.layout.statsGrid}>
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
            value={auth?.method || "—"}
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
              <div className="p-4">
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
                            <span className="font-semibold text-sm">{threat.threat}</span>
                          </div>
                          <Badge variant="outline" className={cn("text-[9px] uppercase font-mono px-1.5", getSeverityStyles(threat.severity))}>
                            {threat.severity}
                          </Badge>
                        </div>
                        <div className="p-4 space-y-4">
                          <p className="text-xs text-muted-foreground leading-relaxed">{threat.description}</p>

                          <div className="grid grid-cols-2 gap-2">
                            {threat.impact && (
                              <div className="bg-muted/30 p-2 rounded-lg border border-border/40">
                                <div className="text-[9px] uppercase font-bold text-muted-foreground/60 mb-0.5">Impact</div>
                                <div className="text-[10px] font-medium text-foreground capitalize">{threat.impact}</div>
                              </div>
                            )}
                            {threat.likelihood && (
                              <div className="bg-muted/30 p-2 rounded-lg border border-border/40">
                                <div className="text-[9px] uppercase font-bold text-muted-foreground/60 mb-0.5">Likelihood</div>
                                <div className="text-[10px] font-medium text-foreground capitalize">{threat.likelihood}</div>
                              </div>
                            )}
                          </div>

                          {threat.affected_components && threat.affected_components.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[9px] uppercase font-bold text-muted-foreground/60">Affected Components</div>
                              <div className="flex flex-wrap gap-1.5">
                                {threat.affected_components.map((comp: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-[9px] font-mono px-1.5 py-0 h-4 bg-red-500/5 text-red-600 border-red-500/10 dark:bg-red-500/10 dark:text-red-400">
                                    {comp}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {(threat.owasp_ref || threat.cwe_ref) && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/20">
                              {threat.owasp_ref && (
                                <Badge variant="outline" className="text-[8px] bg-amber-500/5 text-amber-600 border-amber-500/20 font-mono">
                                  {threat.owasp_ref}
                                </Badge>
                              )}
                              {threat.cwe_ref && (
                                <Badge variant="outline" className="text-[8px] bg-indigo-500/5 text-indigo-600 border-indigo-500/20 font-mono">
                                  {threat.cwe_ref}
                                </Badge>
                              )}
                            </div>
                          )}

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
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold">{control.control || control.name}</h4>
                              <div className="flex gap-1">
                                {control.category && (
                                  <Badge variant="outline" className="text-[8px] font-mono opacity-60 uppercase">{control.category}</Badge>
                                )}
                                {control.priority && (
                                  <Badge variant="outline" className={cn(
                                    "text-[8px] font-mono uppercase",
                                    control.priority === 'high' ? "text-red-500 border-red-500/20" : "text-blue-500 border-blue-500/20"
                                  )}>P: {control.priority}</Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-[9px] uppercase">{control.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{control.description}</p>

                          {control.implementation && (
                            <div className="mt-2 p-2 rounded bg-blue-500/5 border border-blue-500/10">
                              <div className="text-[9px] font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                                <CheckCircle className="h-2.5 w-2.5" /> Implementation Detail
                              </div>
                              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                {control.implementation}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {control.id || `CTRL-${i + 1}`}
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
                          {auth?.description && (
                            <p className="text-[10px] text-muted-foreground mt-2 italic">
                              {auth.description}
                            </p>
                          )}
                        </div>
                        {(auth?.mfa_enabled || auth?.multi_factor_auth) && (
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
                        {(auth?.token_expiry || auth?.refresh_tokens) && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                            {auth.token_expiry && (
                              <div>
                                <div className="text-[9px] uppercase text-muted-foreground font-bold">Expiry</div>
                                <div className="text-xs font-mono">{auth.token_expiry}</div>
                              </div>
                            )}
                            {auth.refresh_tokens && (
                              <div className="flex items-center gap-1.5 mt-auto">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] text-muted-foreground">Refresh Tokens</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Session Management */}
                    {(security_architecture?.session_management) && (
                      <Card className="border-none shadow-sm bg-card h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-500" />
                            Session Policy
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Strategy</span>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {security_architecture.session_management?.strategy || "Not specified"}
                            </Badge>
                          </div>
                          {security_architecture.session_management.session_timeout && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Timeout</span>
                              <span className="font-mono">{security_architecture.session_management.session_timeout}</span>
                            </div>
                          )}
                          {security_architecture.audit_logging && (
                            <div className="space-y-2 pt-2 border-t border-border/40">
                              <div className="text-[10px] uppercase text-muted-foreground font-bold flex justify-between">
                                <span>Audit Logging</span>
                                {security_architecture.audit_logging.enabled === false && (
                                  <span className="text-red-500">DISABLED</span>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-muted-foreground">Retention</span>
                                <span className="font-mono">{security_architecture.audit_logging.retention || "90 days"}</span>
                              </div>
                              {security_architecture.audit_logging.storage_location && (
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-muted-foreground">Storage</span>
                                  <span className="font-mono text-[9px] truncate ml-2">{security_architecture.audit_logging.storage_location}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {security_architecture.audit_logging.events?.map((event: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[8px] h-4 bg-muted/50">
                                    {event}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            {security_architecture.session_management.secure_cookies && (
                              <Badge variant="secondary" className="text-[8px] bg-emerald-500/5 text-emerald-600 border-emerald-500/10">SECURE_COOKIE</Badge>
                            )}
                            {security_architecture.session_management.http_only_cookies && (
                              <Badge variant="secondary" className="text-[8px] bg-blue-500/5 text-blue-600 border-blue-500/10">HTTP_ONLY</Badge>
                            )}
                            {security_architecture.session_management.same_site_policy && (
                              <Badge variant="outline" className="text-[8px] uppercase">SameSite: {security_architecture.session_management.same_site_policy}</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

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
                          <div className="text-sm font-medium">{authz?.model || "Not specified"}</div>
                        </div>
                        {Array.isArray((authz as any)?.roles) && (
                          <div className="space-y-2 pb-2">
                            <div className="text-[10px] uppercase text-muted-foreground font-bold">Roles</div>
                            <div className="flex flex-wrap gap-1.5">
                              {(authz as any).roles.map((role: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] bg-purple-500/5 text-purple-600 border-purple-500/20">
                                  {typeof role === 'string' ? role : role.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {Array.isArray(authz?.policies) && authz.policies.length > 0 && (
                          <div className="space-y-3 pt-3 border-t border-border/40">
                            <div className="text-[10px] uppercase text-muted-foreground font-bold">Access Policies</div>
                            <div className="space-y-2">
                              {authz.policies.map((policy: any, i: number) => (
                                <div key={i} className="bg-muted/30 rounded-lg p-2.5 border border-border/40 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-foreground">{policy.resource}</span>
                                    <div className="flex gap-1">
                                      {policy.permissions?.map((p: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[8px] uppercase font-mono px-1 h-3.5 border-purple-500/30 text-purple-600">{p}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-tight">{policy.description}</p>
                                  {policy.roles && (
                                    <div className="flex flex-wrap gap-1 pt-1 opacity-70">
                                      {policy.roles.map((r: string, idx: number) => (
                                        <span key={idx} className="text-[8px] font-mono text-purple-600/60 ring-1 ring-purple-500/20 px-1 rounded">{r}</span>
                                      ))}
                                    </div>
                                  )}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Array.isArray(security_architecture.network_boundaries) && security_architecture.network_boundaries.length > 0 ? (
                            security_architecture.network_boundaries.map((boundary: any, idx: number) => (
                              <div key={idx} className="flex flex-col p-3 rounded-lg border border-border/60 bg-muted/5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">{boundary.zone}</span>
                                  {boundary.level && (
                                    <Badge variant="outline" className={cn(
                                      "text-[8px] uppercase",
                                      boundary.level === 'Private' ? "text-red-500 border-red-500/20 bg-red-500/5" :
                                        boundary.level === 'DMZ' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                          "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                                    )}>
                                      {boundary.level}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-tight italic">{boundary.description}</p>
                              </div>
                            ))
                          ) : (
                            ['Public', 'DMZ', 'Private'].map((zone) => (
                              <div key={zone} className="flex flex-col items-center p-3 rounded-lg border border-dashed border-border/60 bg-muted/5 opacity-40">
                                <span className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">{zone} Zone</span>
                                <Shield className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            ))
                          )}
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
                            <div className="text-xs font-mono">{encryption?.data_at_rest?.method || "Not specified"}</div>
                            {encryption?.data_at_rest?.key_management && (
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                KMS: {encryption.data_at_rest.key_management}
                              </div>
                            )}
                            {encryption?.data_at_rest?.description && (
                              <div className="mt-2 text-[10px] text-muted-foreground/70 leading-relaxed border-t border-border/20 pt-1">
                                {encryption.data_at_rest.description}
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
                            <div className="text-xs font-mono">{encryption?.data_in_transit?.method || "Not specified"}</div>
                            {encryption?.data_in_transit?.certificate_management && (
                              <div className="mt-1 text-[10px] text-muted-foreground truncate">
                                Certs: {encryption.data_in_transit.certificate_management}
                              </div>
                            )}
                            {encryption?.data_in_transit?.description && (
                              <div className="mt-2 text-[10px] text-muted-foreground/70 leading-relaxed border-t border-border/20 pt-1">
                                {encryption.data_in_transit.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Secrets & KMS */}
                        {(encryption?.key_management || encryption?.secrets_management || encryption?.envelope_encryption) && (
                          <div className="col-span-full border-t border-border/40 pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {encryption.key_management && (
                                <div className="space-y-2">
                                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Key Management</div>
                                  <div className="text-xs bg-muted/20 p-2 rounded border border-border/20">
                                    <div className="font-medium text-foreground">{encryption.key_management.strategy}</div>
                                    {encryption.key_management.rotation_policy && (
                                      <div className="text-[9px] text-muted-foreground mt-1">Rotation: {encryption.key_management.rotation_policy}</div>
                                    )}
                                    {encryption.key_management.description && (
                                      <div className="text-[9px] text-muted-foreground/80 mt-1 italic border-t border-border/10 pt-1">
                                        {encryption.key_management.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {(encryption.secrets_management || encryption.envelope_encryption !== undefined) && (
                                <div className="space-y-2">
                                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Security Features</div>
                                  <div className="flex flex-wrap gap-2">
                                    {encryption.secrets_management && (
                                      <Badge variant="outline" className="text-[10px] bg-amber-500/5 text-amber-600 border-amber-500/20">
                                        Vault: {encryption.secrets_management}
                                      </Badge>
                                    )}
                                    {encryption.envelope_encryption && (
                                      <Badge variant="outline" className="text-[10px] bg-purple-500/5 text-purple-600 border-purple-500/20">
                                        Envelope Encryption
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
                          <div className="flex flex-col gap-3">
                            {compliance.map((std: any, i: number) => {
                              const stdName = typeof std === "string" ? std : std.standard
                              const isExpanded = activeStandard === stdName

                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex flex-col rounded-lg border transition-all cursor-pointer",
                                    isExpanded ? "bg-indigo-500/5 border-indigo-500/30 shadow-sm" : "bg-muted/10 border-border/50 hover:bg-muted/20"
                                  )}
                                  onClick={() => setActiveStandard(isExpanded ? null : stdName)}
                                >
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-foreground">{stdName}</span>
                                      {std.implementation_status && (
                                        <span className="text-[9px] text-muted-foreground uppercase font-mono mt-0.5">{std.implementation_status}</span>
                                      )}
                                    </div>
                                    <Badge variant="outline" className={cn(
                                      "text-[9px] uppercase font-mono px-1.5",
                                      std.implementation_status === 'compliant' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                                        std.implementation_status === 'in-progress' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                          "text-blue-500 border-blue-500/20 bg-blue-500/5"
                                    )}>
                                      {std.implementation_status || 'planned'}
                                    </Badge>
                                  </div>

                                  {isExpanded && (std.description || std.requirements) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      className="px-3 pb-3 space-y-3 overflow-hidden border-t border-indigo-500/10 pt-3"
                                    >
                                      {std.description && (
                                        <p className="text-[11px] text-foreground/80 leading-relaxed italic border-l-2 border-indigo-500/20 pl-3">
                                          {std.description}
                                        </p>
                                      )}
                                      {Array.isArray(std.requirements) && (
                                        <div className="space-y-1.5">
                                          <div className="text-[9px] font-bold text-indigo-600 uppercase">Requirements</div>
                                          <div className="flex flex-wrap gap-1.5">
                                            {std.requirements.map((req: string, idx: number) => (
                                              <Badge key={idx} variant="secondary" className="text-[9px] bg-background border border-border/50 text-indigo-700/80">
                                                {req}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                              )
                            })}
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
                              <span className="font-medium">{vulnerability_management.scanning_frequency || "Not specified"}</span>
                            </div>
                            {vulnerability_management.remediation_sla && (
                              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                <span className="text-muted-foreground">Remediation SLA</span>
                                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5">
                                  {vulnerability_management.remediation_sla}
                                </Badge>
                              </div>
                            )}
                            {vulnerability_management.tools && vulnerability_management.tools.length > 0 && (
                              <div className="space-y-1 pt-2">
                                <div className="text-[10px] uppercase text-muted-foreground font-bold">Tools</div>
                                <div className="flex flex-wrap gap-1">
                                  {vulnerability_management.tools.map((t: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[9px] font-mono px-1">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
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
                            {security_monitoring.siem_solution && (
                              <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                <span className="text-muted-foreground">SIEM Solution</span>
                                <span className="font-medium">{security_monitoring.siem_solution}</span>
                              </div>
                            )}
                            {security_monitoring.logging_strategy && (
                              <div className="space-y-1">
                                <div className="text-[10px] uppercase text-muted-foreground font-bold">Logging Strategy</div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/20 border border-border/30 rounded-lg p-2 italic">
                                  {security_monitoring.logging_strategy}
                                </p>
                              </div>
                            )}
                            {security_monitoring.alerting_thresholds && (
                              <div className="space-y-1 pt-2 border-t border-border/40">
                                <div className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  Alert Thresholds
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {security_monitoring.alerting_thresholds}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
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
