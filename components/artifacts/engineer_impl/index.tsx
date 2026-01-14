'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn, downloadFile } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Code,
  Terminal,
  Settings,
  FileCode,
  Package,
  ChevronRight,
  Braces,
  Layers,
  Map,
  Files,
  Folder,
  File,
  CheckCircle2,
  Database,
  ListTodo,
  Puzzle,
  Download
} from "lucide-react"
import JSZip from "jszip"

import { EngineerBackendArtifact } from "@/lib/metasop/artifacts/engineer/types"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger,
  CopyButton,
  containerVariants as container,
  itemVariants as item
} from "../shared-components"

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

  const name = node.name || "unnamed"
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

  const name = node.name || "unnamed";
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
  const phases = data.phases || []

  // Count phases in markdown if array is empty
  const roadmapCount = phases.length > 0
    ? phases.length
    : (data.implementation_plan?.match(/## Phase /g)?.length || (data.implementation_plan ? 1 : 0))

  const technicalPatterns = data.technical_patterns || []
  const stateManagement = data.state_management
  const artifactPath = data.artifact_path

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>Engineering Specification</h2>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 text-[10px] px-1.5 h-5">
                Implementation
              </Badge>
              {runResults.test_commands && runResults.test_commands.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-mono text-green-600 border-green-500/30 uppercase px-1.5 h-5">
                  Tests Included
                </Badge>
              )}
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).summary || (data as any).description || (artifactPath ? `PATH: ${artifactPath}` : "Implementation details and technical specifications.")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            value={(runResults.setup_commands?.length || 0) + (runResults.test_commands?.length || 0) + (runResults.dev_commands?.length || 0)}
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
                <TabTrigger value="scripts" icon={Terminal} label="CLI Scripts" count={(runResults.setup_commands?.length || 0) + (runResults.test_commands?.length || 0) + (runResults.dev_commands?.length || 0)} />
                <TabTrigger value="deps" icon={Package} label="Registry" count={dependencies.length} />
                <TabTrigger value="struct" icon={Files} label="FS Tree" />
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <TabsContent key="plan" value="plan" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                    {/* Implementation Plan Text (if available and different) - optional, but let's strictly use phases if requested */}
                    {/* Using Phases cards as the primary Roadmap view */}
                    {phases.length > 0 ? (
                      <div className="space-y-4">
                        {phases.map((phase, i) => (
                          <Card key={i} className="border-border/50 shadow-sm overflow-hidden">
                            <div className="bg-muted/30 p-3 border-b border-border/50 flex items-center gap-3">
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono border border-emerald-500/20">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-foreground">{phase.name}</h3>
                                <p className="text-[11px] text-muted-foreground">{phase.description}</p>
                              </div>
                              <Badge variant="outline" className="bg-background/50 text-[10px] font-mono opacity-70">
                                {phase.tasks.length} TASKS
                              </Badge>
                            </div>
                            <div className="p-3 bg-card">
                              <ul className="space-y-1.5">
                                {phase.tasks.map((task, j) => (
                                  <li key={j} className="flex items-start gap-2.5 text-xs text-muted-foreground/90 leading-relaxed group">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/40 mt-0.5 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                    <span className="group-hover:text-foreground transition-colors">{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (data.implementation_plan ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-emerald bg-card border border-border/50 p-6 rounded-xl">
                        <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{
                          __html: data.implementation_plan
                            .replace(/\\n/g, '\n')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
                        }} />
                      </div>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No roadmap defined.</p>
                      </div>
                    ))}
                  </motion.div>
                </TabsContent>

                <TabsContent key="scripts" value="scripts" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6">
                    <ScriptCard
                      label="Environment Setup"
                      cmds={runResults.setup_commands}
                      icon={Settings}
                      color="text-blue-500"
                      bg="bg-blue-500/10"
                    />
                    <ScriptCard
                      label="Development Scripts"
                      cmds={runResults.dev_commands}
                      icon={Code}
                      color="text-emerald-500"
                      bg="bg-emerald-500/10"
                    />
                    <ScriptCard
                      label="Verification Suite"
                      cmds={runResults.test_commands}
                      icon={Terminal}
                      color="text-amber-500"
                      bg="bg-amber-500/10"
                    />
                    {(!runResults.setup_commands?.length && !runResults.dev_commands?.length && !runResults.test_commands?.length) && (
                      <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                        <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No scripts defined.</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>



                <TabsContent key="deps" value="deps" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show">
                    <Card className={cn("border-none shadow-none bg-transparent")}>
                      <CardHeader className="px-0 pt-0 pb-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <Package className="h-4 w-4 text-emerald-500" />
                          Package Manifest
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-0 pb-0">
                        {dependencies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {dependencies.map((dep: string, i: number) => (
                              <motion.div
                                key={i}
                                variants={item}
                                className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-lg border border-border/50 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-xs font-mono shadow-sm"
                              >
                                <Package className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500" />
                                <span>{dep}</span>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/10">
                            <p className="text-sm">No dependencies listed.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent key="struct" value="struct" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <Card className="h-full border-border/50 shadow-sm overflow-hidden">
                        <div className="p-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">File System Tree</span>
                          <div className="flex items-center gap-3">
                            {fileStructure && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                onClick={async () => {
                                  const zip = new JSZip();
                                  generateProjectZip(fileStructure, zip);
                                  const content = await zip.generateAsync({ type: "blob" });
                                  downloadFile(content as any, `project-structure.zip`, "application/zip");
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                                Export Project ZIP
                              </Button>
                            )}
                            <div className="flex gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-border" />
                              <div className="h-2 w-2 rounded-full bg-border" />
                              <div className="h-2 w-2 rounded-full bg-border" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-0">
                          {fileStructure ? (
                            <ScrollArea className="h-[500px] w-full p-4">
                              <FileSystemNode node={fileStructure} />
                            </ScrollArea>
                          ) : (
                            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground italic">
                              No structure metadata available.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      {envVars.length > 0 && (
                        <Card className="border-border/50 shadow-sm">
                          <CardHeader className="pb-2 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                              <Braces className="h-4 w-4 text-blue-500" />
                              Environment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 px-4 pb-4">
                            {envVars.map((env: any, i: number) => (
                              <motion.div
                                key={i}
                                variants={item}
                                className="group bg-muted/20 border border-border/50 p-2.5 rounded-lg hover:border-blue-500/30 transition-all"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{env.name}</span>
                                  <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase bg-background">System</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground line-clamp-2">{env.description}</p>
                              </motion.div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {technicalDecisions.length > 0 && (
                        <Card className="border-border/50 shadow-sm">
                          <CardHeader className="pb-2 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                              <Layers className="h-4 w-4" />
                              Tech Decisions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 px-4 pb-4">
                            {technicalDecisions.map((decision: any, i: number) => (
                              <motion.div
                                key={i}
                                variants={item}
                                className="p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 flex gap-2"
                              >
                                <ChevronRight className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-none" />
                                <div>
                                  <div className="font-semibold text-xs text-foreground mb-0.5">{decision.decision}</div>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed">{decision.rationale}</p>
                                  {decision.alternatives && (
                                    <div className="mt-1.5 pt-1.5 border-t border-amber-500/10">
                                      <span className="text-[9px] font-bold text-amber-600/70 uppercase tracking-wider mr-1.5">Alternatives:</span>
                                      <span className="text-[9px] text-amber-700/60 italic">{decision.alternatives}</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {(technicalPatterns.length > 0 || stateManagement) && (
                        <Card className="border-border/50 shadow-sm">
                          <CardHeader className="pb-2 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                              <Puzzle className="h-4 w-4" />
                              Architecture
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 px-4 pb-4">
                            {stateManagement && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                  <Database className="h-3 w-3" />
                                  State Management
                                </div>
                                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{stateManagement.tool}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground/80">{stateManagement.strategy}</p>
                                </div>
                              </div>
                            )}

                            {technicalPatterns.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Patterns
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {technicalPatterns.map((pattern, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-5 bg-indigo-500/5 text-indigo-700 hover:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-800/50">
                                      {pattern}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
