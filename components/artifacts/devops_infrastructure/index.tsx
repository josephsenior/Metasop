'use client'

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
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
  ArtifactHeaderBlock,
  ArtifactTabBar,
  TabTrigger,
  EmptyStateCard,
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
  } = data

  const services = infrastructure?.services || []
  const regions = infrastructure?.regions || []
  const pipelineStages = cicd?.pipeline_stages || []
  const tools = cicd?.tools || []
  const triggers = cicd?.triggers || []
  const environments = deployment?.environments || []
  const summaryText = summary || "Infrastructure design and deployment strategy."
  const descriptionText = summary ? description : undefined
  const hasOps = Boolean(containerization || scaling)

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Section */}
      <ArtifactHeaderBlock
        title="Infrastructure Specification"
        summary={summaryText}
        description={descriptionText}
        summaryClassName={cn(styles.typography.body, styles.colors.textMuted)}
        badges={(
          infrastructure?.cloud_provider ? (
            <Badge variant="outline" className={cn(styles.badges.small, "font-mono text-sky-600 dark:text-sky-400 border-sky-500/30 uppercase")}>
              {infrastructure.cloud_provider}
            </Badge>
          ) : null
        )}
      >
        <div className={styles.layout.statsGrid + " mt-2"}>
            <StatsCard icon={Box} label="Services" value={services.length} color="text-sky-500" bg="bg-sky-500/10" />
            <StatsCard icon={Box} label="Components" value={services.length} color="text-yellow-500" bg="bg-yellow-500/10" />
            <StatsCard icon={GitBranch} label="Pipelines" value={pipelineStages.length} color="text-orange-500" bg="bg-orange-500/10" />
            <StatsCard icon={Globe} label="Envs" value={environments.length} color="text-emerald-500" bg="bg-emerald-500/10" />
            <StatsCard icon={Bell} label="Alerts" value={monitoring?.alerts?.length || 0} color="text-rose-500" bg="bg-rose-500/10" />
            <StatsCard icon={Activity} label="Scaling" value={scaling?.auto_scaling?.max_replicas || 1} color="text-amber-500" bg="bg-amber-500/10" />
            <StatsCard icon={ShieldAlert} label="Recovery" value={disaster_recovery?.rto ? 1 : 0} color="text-indigo-500" bg="bg-indigo-500/10" />
            <StatsCard icon={ShieldCheck} label="Strategy" value={deployment?.strategy} isText color="text-purple-500" bg="bg-purple-500/10" />
        </div>
      </ArtifactHeaderBlock>

      {/* Main Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="infra" className="h-full flex flex-col">
          <ArtifactTabBar>
            <TabTrigger value="infra" icon={Server} label="Services" count={services.length} />
            <TabTrigger value="cicd" icon={RefreshCcw} label="CI/CD" count={pipelineStages.length} />
            <TabTrigger value="deploy" icon={Globe} label="Deployment" count={environments.length} />
            <TabTrigger value="monitor" icon={Activity} label="Monitoring" count={monitoring?.alerts?.length || 0} />
            {hasOps && (
              <TabTrigger value="ops" icon={Zap} label="Operations" />
            )}
            {disaster_recovery && (
              <TabTrigger value="recovery" icon={ShieldAlert} label="Recovery" />
            )}
          </ArtifactTabBar>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                {services.length > 0 || regions.length > 0 ? (
                  <InfrastructureSection infrastructure={infrastructure} regions={regions} services={services} />
                ) : (
                  <EmptyStateCard title="Infrastructure" description="No infrastructure details were generated for this run." icon={Server} />
                )}

                {pipelineStages.length > 0 || tools.length > 0 || triggers.length > 0 ? (
                  <PipelineSection tools={tools} pipelineStages={pipelineStages} triggers={triggers} />
                ) : (
                  <EmptyStateCard title="CI/CD" description="No CI/CD pipeline was generated for this run." icon={RefreshCcw} />
                )}

                {hasOps ? (
                  <OperationsSection containerization={containerization} scaling={scaling} />
                ) : (
                  <EmptyStateCard title="Operations" description="No operations details were generated for this run." icon={Zap} />
                )}

                {environments.length > 0 || deployment ? (
                  <DeploymentSection environments={environments} deployment={deployment} />
                ) : (
                  <EmptyStateCard title="Deployment" description="No deployment plan was generated for this run." icon={Globe} />
                )}

                {monitoring || scaling ? (
                  <MonitoringSection monitoring={monitoring} scaling={scaling} />
                ) : (
                  <EmptyStateCard title="Monitoring" description="No monitoring plan was generated for this run." icon={Activity} />
                )}

                {disaster_recovery ? (
                  <RecoverySection disaster_recovery={disaster_recovery} />
                ) : (
                  <EmptyStateCard title="Recovery" description="No disaster recovery plan was generated for this run." icon={ShieldAlert} />
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
