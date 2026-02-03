'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck, Clock, Key, Globe, Shield, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container
} from "../../shared-components"

interface SecurityArchitectureSectionProps {
    security_architecture: any
    auth: any
    authz: any
}

export function SecurityArchitectureSection({ security_architecture, auth, authz }: SecurityArchitectureSectionProps) {
    return (
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
    )
}
