'use client'

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Server,
  Box,
  Activity,
  GitBranch,
  Globe,
  ShieldCheck,
  RefreshCcw,
  Zap,
  ShieldAlert,
  Bell
} from "lucide-react"

import { DevOpsBackendArtifact } from "@/lib/metasop/artifacts/devops/types"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
} from "../shared-components"

import { InfrastructureSection } from "./sections/InfrastructureSection"
import { PipelineSection } from "./sections/PipelineSection"
import { OperationsSection } from "./sections/OperationsSection"
import { DeploymentSection } from "./sections/DeploymentSection"
import { MonitoringSection } from "./sections/MonitoringSection"
import { RecoverySection } from "./sections/RecoverySection"


export default function DevOpsInfrastructurePanel({
  artifact
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as DevOpsBackendArtifact

  const {
    infrastructure,
    cicd,
    deployment,
    monitoring,
    containerization,
    scaling,
    disaster_recovery,
    summary,
    description,
    infra_components
  } = data

  const services = infrastructure?.services || []
  const regions = infrastructure?.regions || []
  const pipelineStages = cicd?.pipeline_stages || []
  const tools = cicd?.tools || []
  const triggers = cicd?.triggers || []
  const environments = deployment?.environments || []

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Section */}
      <div className={styles.layout.header}>
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className={styles.typography.h2}>Infrastructure Specification</h2>
            {infrastructure?.cloud_provider && (
              <Badge variant="outline" className="font-mono text-sky-600 dark:text-sky-400 border-sky-500/30 uppercase text-[10px] px-1.5">
                {infrastructure.cloud_provider}
              </Badge>
            )}
          </div>

          <p className={cn(styles.typography.body, styles.colors.textMuted)}>
            {summary || "Infrastructure design and deployment strategy."}
          </p>

          {description && (
            <p className="text-[11px] text-muted-foreground italic leading-tight max-w-3xl border-l-2 border-primary/20 pl-3 py-1">
              {description}
            </p>
          )}

          <div className={styles.layout.statsGrid + " mt-2"}>
            <StatsCard icon={Box} label="Services" value={services.length} color="text-sky-500" bg="bg-sky-500/10" />
            <StatsCard icon={Zap} label="Components" value={infra_components || 0} color="text-yellow-500" bg="bg-yellow-500/10" />
            <StatsCard icon={GitBranch} label="Pipelines" value={pipelineStages.length} color="text-orange-500" bg="bg-orange-500/10" />
            <StatsCard icon={Globe} label="Envs" value={environments.length} color="text-emerald-500" bg="bg-emerald-500/10" />
            <StatsCard icon={Bell} label="Alerts" value={monitoring?.alerts?.length || 0} color="text-rose-500" bg="bg-rose-500/10" />
            <StatsCard icon={Activity} label="Scaling" value={scaling?.auto_scaling?.max_replicas || 1} color="text-amber-500" bg="bg-amber-500/10" />
            <StatsCard icon={ShieldAlert} label="Recovery" value={disaster_recovery?.rto ? 1 : 0} color="text-indigo-500" bg="bg-indigo-500/10" />
            <StatsCard icon={ShieldCheck} label="Strategy" value={deployment?.strategy} isText color="text-purple-500" bg="bg-purple-500/10" />
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="infra" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="infra" icon={Server} label="Services" count={services.length} />
                <TabTrigger value="cicd" icon={RefreshCcw} label="CI/CD" count={pipelineStages.length} />
                <TabTrigger value="deploy" icon={Globe} label="Deployment" count={environments.length} />
                <TabTrigger value="monitor" icon={Activity} label="Monitoring" count={monitoring?.alerts?.length || 0} />
                {(containerization || scaling) && (
                  <TabTrigger value="ops" icon={Zap} label="Operations" />
                )}
                {disaster_recovery && (
                  <TabTrigger value="recovery" icon={ShieldAlert} label="Recovery" />
                )}
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <InfrastructureSection infrastructure={infrastructure} regions={regions} services={services} />

                <PipelineSection tools={tools} pipelineStages={pipelineStages} triggers={triggers} />

                {(containerization || scaling) && (
                  <OperationsSection containerization={containerization} scaling={scaling} />
                )}

                <DeploymentSection environments={environments} deployment={deployment} />

                <MonitoringSection monitoring={monitoring} scaling={scaling} />

                {disaster_recovery && (
                  <RecoverySection disaster_recovery={disaster_recovery} />
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
