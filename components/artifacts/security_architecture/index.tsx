'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Lock,
  AlertTriangle,
  UserCheck,
  FileText,
  ShieldCheck,
  Activity,
  Network,
} from "lucide-react"

import { SecurityBackendArtifact } from "@/lib/metasop/artifacts/security/types"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
} from "../shared-components"

import { ThreatModelSection } from "./sections/ThreatModelSection"
import { SecurityControlsSection } from "./sections/SecurityControlsSection"
import { SecurityArchitectureSection } from "./sections/SecurityArchitectureSection"
import { DataSecuritySection } from "./sections/DataSecuritySection"
import { ManagementSection } from "./sections/ManagementSection"

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
                <ThreatModelSection threat_model={threat_model} getSeverityStyles={getSeverityStyles} />

                <SecurityControlsSection security_controls={security_controls} />

                <SecurityArchitectureSection security_architecture={security_architecture} auth={auth} authz={authz} />

                <DataSecuritySection
                  encryption={encryption}
                  compliance={compliance}
                  activeStandard={activeStandard}
                  setActiveStandard={setActiveStandard}
                />

                {(vulnerability_management || security_monitoring) && (
                  <ManagementSection
                    vulnerability_management={vulnerability_management}
                    security_monitoring={security_monitoring}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div >
    </div >
  )
}
