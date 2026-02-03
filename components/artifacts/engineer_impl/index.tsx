'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn, downloadFile } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Terminal,
  Package,
  Braces,
  Layers,
  Files,
  Folder,
  File,
  Database,
  ListTodo,
  Puzzle,
  Settings,
  FileCode
} from "lucide-react"
import JSZip from "jszip"

import { EngineerBackendArtifact } from "@/lib/metasop/artifacts/engineer/types"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
  CopyButton,
  itemVariants as item
} from "../shared-components"

import { RoadmapSection } from "./sections/RoadmapSection"
import { TechnicalSection } from "./sections/TechnicalSection"
import { ScriptsSection } from "./sections/ScriptsSection"
import { RegistrySection } from "./sections/RegistrySection"
import { FsTreeSection } from "./sections/FsTreeSection"

// --- Helper Components & Utils ---

function ScriptCard({ label, cmds, icon: Icon, color }: any) {
  if (!cmds || cmds.length === 0) return null

  return (
    <motion.div
      variants={item}
      className={cn("group border rounded-xl overflow-hidden shadow-sm", styles.colors.bgCard, styles.colors.borderMuted)}
    >
      <div className="bg-muted/30 p-4 px-6 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3 font-semibold text-base">
          <Icon className={cn("h-5 w-5", color)} />
          <span>{label}</span>
        </div>
        <Badge variant="outline" className="text-sm font-mono px-3 py-1">{cmds.length} OPS</Badge>
      </div>
      <div className="p-4 space-y-3">
        {cmds.map((cmd: string, i: number) => (
          <div key={i} className="flex items-center gap-3 group/cmd relative">
            <div className="flex-1 bg-muted/40 px-5 py-3 rounded-lg border border-border/40 text-sm font-mono flex items-center gap-3 text-foreground/80 group-hover/cmd:border-emerald-500/30 transition-all">
              <span className="text-muted-foreground select-none">❯</span>
              <span className="truncate">{cmd}</span>
            </div>
            <CopyButton text={cmd} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function FileSystemNode({ node, depth = 0 }: { node: any, depth?: number }) {
  if (!node) return null

  if (typeof node === 'string') {
    return (
      <div className="flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded px-2 text-muted-foreground/80 transition-colors" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
        {node.endsWith('/') ? <Folder className="w-3.5 h-3.5 text-blue-500" /> : <FileCode className="w-3.5 h-3.5 text-muted-foreground/60" />}
        <span className="text-[11px] font-mono truncate">{node.replace(/\/$/, '')}</span>
      </div>
    )
  }

  if (!node.name) return null

  const name = node.name
  const isDir = node.type === 'directory' || node.type === 'folder' || (node.children && Array.isArray(node.children) && node.children.length > 0)

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded px-2 text-foreground/80 group cursor-default transition-colors" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
        {isDir ?
          <Folder className="w-3.5 h-3.5 text-blue-500/80 fill-blue-500/10" /> :
          <File className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-emerald-500" />
        }
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-mono font-medium truncate group-hover:text-primary">{name}</span>
        </div>
      </div>
      {isDir && node.children && Array.isArray(node.children) && (
        <div className="ml-0 border-l border-border/20">
          {node.children.map((child: any, i: number) => (
            <FileSystemNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

const generateProjectZip = (node: any, zip: JSZip, path: string = "") => {
  if (!node) return;

  if (typeof node === 'string') {
    const name = node.replace(/\/$/, '');
    if (node.endsWith('/')) {
      zip.folder(path + name);
    } else {
      zip.file(path + name, "");
    }
    return;
  }

  if (!node.name) return;

  const name = node.name;
  const currentPath = path + name;
  const isDir = node.type === 'directory' || node.type === 'folder' || (node.children && Array.isArray(node.children));

  if (isDir) {
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach((child: any) => {
        generateProjectZip(child, zip, currentPath + "/");
      });
    } else {
      zip.folder(currentPath);
    }
  } else {
    zip.file(currentPath, "");
  }
};

// --- Main Component ---

export default function EngineerImplPanel({
  artifact
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as EngineerBackendArtifact
  const dependencies = data.dependencies || []
  const runResults = (data as any).run_results || {}
  const fileStructure = data.file_structure || data.files || data.file_changes || data.components
  const technicalDecisions = data.technical_decisions || []
  const envVars = data.environment_variables || []
  const phases = data.implementation_plan_phases || data.phases || []
  const implementationPlan = data.implementation_plan || data.plan

  // Count phases in markdown if array is empty
  const roadmapCount = phases.length > 0
    ? phases.length
    : (implementationPlan?.match(/## Phase /g)?.length || (implementationPlan ? 1 : 0))

  const technicalPatterns = data.technical_patterns || []
  const stateManagement = data.state_management
  const artifactPath = data.artifact_path

  const technicalCount = (envVars?.length || 0) + (technicalDecisions?.length || 0) + (technicalPatterns?.length || 0) + (stateManagement ? 1 : 0)

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className={styles.layout.header}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>Engineering Specification</h2>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 text-[10px] px-1.5 h-5">
                Implementation
              </Badge>
              {artifactPath && (
                <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-mono text-muted-foreground">
                  {artifactPath}
                </Badge>
              )}
              {runResults.test_commands && runResults.test_commands.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-mono text-green-600 border-green-500/30 uppercase px-1.5 h-5">
                  Tests Included
                </Badge>
              )}
            </div>
            {data.summary && (
              <p className={cn("text-xs font-semibold text-foreground leading-tight")}>
                {data.summary}
              </p>
            )}
            {data.description && (
              <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
                {data.description}
              </p>
            )}
            {!data.summary && !data.description && (
              <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
                Implementation details and technical specifications.
              </p>
            )}
          </div>
        </div>

        <div className={styles.layout.statsGrid}>
          <StatsCard
            icon={Package}
            label="Registry"
            value={dependencies.length}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatsCard
            icon={Terminal}
            label="Scripts"
            value={(runResults.setup_commands?.length || 0) + (runResults.test_commands?.length || 0) + (runResults.dev_commands?.length || 0) + (runResults.build_commands?.length || 0)}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatsCard
            icon={Braces}
            label="Env Vars"
            value={envVars.length}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatsCard
            icon={Puzzle}
            label="Patterns"
            value={technicalPatterns.length}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-indigo-500/10"
          />
          <StatsCard
            icon={Database}
            label="State"
            value={stateManagement?.tool || "—"}
            color="text-pink-600 dark:text-pink-400"
            bg="bg-pink-500/10"
          />
          <StatsCard
            icon={Settings}
            label="Decisions"
            value={technicalDecisions.length}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="plan" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="plan" icon={ListTodo} label="Roadmap" count={roadmapCount} />
                <TabTrigger value="tech" icon={Layers} label="Technical" count={technicalCount} />
                <TabTrigger
                  value="scripts"
                  icon={Terminal}
                  label="CLI Scripts"
                  count={
                    (data.run_results?.setup_commands?.length || 0) +
                    (data.run_results?.dev_commands?.length || 0) +
                    (data.run_results?.test_commands?.length || 0) +
                    (data.run_results?.build_commands?.length || 0)
                  }
                />
                <TabTrigger value="deps" icon={Package} label="Registry" count={dependencies.length} />
                <TabTrigger value="struct" icon={Files} label="FS Tree" />
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <RoadmapSection phases={phases} implementationPlan={implementationPlan} />
                <TechnicalSection
                  envVars={envVars}
                  technicalDecisions={technicalDecisions}
                  technicalPatterns={technicalPatterns}
                  stateManagement={stateManagement}
                />
                <ScriptsSection
                  runResults={runResults}
                  ScriptCard={ScriptCard}
                />
                <RegistrySection dependencies={dependencies} />
                <FsTreeSection
                  fileStructure={fileStructure}
                  FileSystemNode={FileSystemNode}
                  generateProjectZip={generateProjectZip}
                  JSZip={JSZip}
                  downloadFile={downloadFile}
                />
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
