'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Database, Network, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    containerVariants as container
} from "../../shared-components"

interface DataSecuritySectionProps {
    encryption: any
    compliance: any[]
    activeStandard: string | null
    setActiveStandard: (standard: string | null) => void
}

export function DataSecuritySection({ encryption, compliance, activeStandard, setActiveStandard }: DataSecuritySectionProps) {
    return (
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
    )
}
