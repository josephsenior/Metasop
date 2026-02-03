'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Cpu,
  Database,
  Network,
  Layers,
  Terminal,
  ShieldCheck,
  Settings,
  Share2,
  BookOpen,
  ScrollText,
  ListTodo,
} from "lucide-react"

import { ArchitectBackendArtifact } from "@/lib/metasop/artifacts/architect/types"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
} from "../shared-components"

import { StrategySection } from "./sections/StrategySection"
import { EndpointsSection } from "./sections/EndpointsSection"
import { DatabaseSection } from "./sections/DatabaseSection"
import { DecisionsSection } from "./sections/DecisionsSection"
import { TechStackSection } from "./sections/TechStackSection"
import { TasksSection } from "./sections/TasksSection"
import { IntegrationsSection } from "./sections/IntegrationsSection"
import { AdvancedSection } from "./sections/AdvancedSection"







export default function ArchDesignPanel({
  artifact,
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as ArchitectBackendArtifact
  const apis = data.apis || []
  const decisions = data.decisions || []
  const databaseSchema = data.database_schema
  const technologyStack = data.technology_stack
  const integrationPoints = data.integration_points || []
  const securityConsiderations = data.security_considerations || []
  const scalabilityApproach = data.scalability_approach
  const nextTasks = data.next_tasks || []

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className={styles.layout.header}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>System Architecture</h2>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 text-[10px] px-1.5 h-5">
                Specification
              </Badge>
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).summary || (data as any).description || "Architectural design and technical specifications."}
            </p>
          </div>
        </div>

        <div className={styles.layout.statsGrid}>
          <StatsCard
            icon={Network}
            label="Endpoints"
            value={apis.length}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatsCard
            icon={Database}
            label="Tables"
            value={databaseSchema?.tables?.length || 0}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatsCard
            icon={ScrollText}
            label="Decisions"
            value={decisions.length}
            color="text-green-600 dark:text-green-400"
            bg="bg-green-500/10"
          />
          <StatsCard
            icon={Cpu}
            label="Integrations"
            value={integrationPoints.length}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-indigo-500/10"
          />
          <StatsCard
            icon={ShieldCheck}
            label="Security"
            value={securityConsiderations.length}
            color="text-rose-600 dark:text-rose-400"
            bg="bg-rose-500/10"
          />
          <StatsCard
            icon={Layers}
            label="Stack"
            value={technologyStack ? Object.keys(technologyStack).length : 0}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatsCard
            icon={ListTodo}
            label="Tasks"
            value={nextTasks.length}
            color="text-orange-600 dark:text-orange-400"
            bg="bg-orange-500/10"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="design" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="design" icon={BookOpen} label="Philosophy" />
                <TabTrigger value="api" icon={Terminal} label="API Contract" count={apis.length} />
                <TabTrigger value="db" icon={Database} label="Schema" count={databaseSchema?.tables?.length || 0} />
                <TabTrigger value="decisions" icon={ScrollText} label="ADRs" count={decisions.length} />
                <TabTrigger value="integrations" icon={Share2} label="Integrations" count={integrationPoints.length} />
                {technologyStack && <TabTrigger value="stack" icon={Layers} label="Stack" count={Object.keys(technologyStack).length} />}
                {nextTasks.length > 0 && <TabTrigger value="tasks" icon={ListTodo} label="Next Tasks" count={nextTasks.length} />}
                {(securityConsiderations.length > 0 || scalabilityApproach) && (
                  <TabTrigger value="advanced" icon={Settings} label="Advanced" count={securityConsiderations.length + (scalabilityApproach ? 1 : 0)} />
                )}
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <StrategySection
                  summary={data.summary || data.description}
                  title={(data as any).title || artifact?.title}
                  design_doc={data.design_doc}
                />

                <EndpointsSection apiEndpoints={apis} />

                <DatabaseSection databaseSchema={databaseSchema} />

                <DecisionsSection decisions={decisions} />

                <IntegrationsSection integrationPoints={integrationPoints} />

                <TechStackSection technologyStack={technologyStack} />

                <TasksSection nextTasks={nextTasks} />

                <AdvancedSection
                  securityConsiderations={securityConsiderations}
                  scalabilityApproach={scalabilityApproach}
                />
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
