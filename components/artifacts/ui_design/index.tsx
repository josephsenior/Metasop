'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Palette,
  Type,
  Layout,
  Eye,
  Monitor,
  Layers,
  Zap,
  Box,
  Component,
  Copy,
  Check,
  Grid,
  Accessibility
} from "lucide-react"

import { UIDesignerBackendArtifact } from "@/lib/metasop/artifacts/ui-designer/types"
import { artifactStyles as styles } from "../shared-styles"
import { 
  StatsCard, 
  TabTrigger, 
  containerVariants as container, 
  itemVariants as item 
} from "../shared-components"

function ColorTokenCard({ name, value }: { name: string, value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`var(--${name})`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div variants={item} className="group flex flex-col items-center">
      <div
        className="h-16 w-16 rounded-2xl border border-border shadow-soft group-hover:scale-110 transition-transform cursor-pointer relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: value }}
        onClick={handleCopy}
      >
        <div className="absolute inset-0 bg-black/10 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {copied ? <Check className="h-4 w-4 text-white drop-shadow-md" /> : <Copy className="h-4 w-4 text-white drop-shadow-md" />}
        </div>
      </div>
      <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter text-foreground/80 truncate max-w-full px-1">{name}</span>
      <span className="text-[9px] text-muted-foreground font-mono">{value}</span>
    </motion.div>
  )
}

export default function UIDesignPanel({
  artifact,
}: {
  artifact: any
}) {
  const data = (artifact?.content || artifact || {}) as UIDesignerBackendArtifact
  const designTokens = data.design_tokens || {}
  const componentHierarchy = data.component_hierarchy
  const componentSpecs = data.component_specs || []
  const accessibility = data.accessibility
  const a2uiManifest = data.a2ui_manifest
  const atomicStructure = data.atomic_structure

  const hierarchyNodes: any[] = Array.isArray(componentHierarchy)
    ? componentHierarchy
    : (componentHierarchy && typeof componentHierarchy === "object" && Array.isArray((componentHierarchy as any).children))
      ? (componentHierarchy as any).children
      : []

  const countA2UINodes = (node: any): number => {
    if (!node) return 0
    const children = Array.isArray(node.children) ? node.children : []
    return 1 + children.reduce((acc: number, child: any) => acc + countA2UINodes(child), 0)
  }

  const renderA2UINode = (node: any, depth = 0, keyPath = "root"): React.ReactNode => {
    if (!node) return null
    const children = Array.isArray(node.children) ? node.children : []
    const nodeLabel = node.type || node.component || node.name || "node"
    const hasProps = node.props && typeof node.props === "object" && Object.keys(node.props).length > 0

    return (
      <div key={keyPath} className="space-y-1">
        <div
          className="flex items-center gap-2 py-1.5 px-2 rounded-md border border-border/40 bg-card hover:bg-muted/50 transition-colors"
          style={{ marginLeft: `${depth * 12}px` }}
        >
          <Zap className="h-3 w-3 text-indigo-500 shrink-0" />
          <span className="text-[11px] font-mono font-bold text-foreground truncate">{nodeLabel}</span>
          {hasProps && (
            <Badge variant="outline" className="text-[9px] h-4 px-1 ml-auto font-mono text-muted-foreground">
              {Object.keys(node.props).length} props
            </Badge>
          )}
        </div>
        {children.length > 0 && (
          <div className="space-y-1">
            {children.map((child: any, i: number) => renderA2UINode(child, depth + 1, `${keyPath}.${i}`))}
          </div>
        )}
      </div>
    )
  }

  const renderHierarchyNodes = (nodes: any[], depth = 0, keyPath = "h"): React.ReactNode => {
    if (!Array.isArray(nodes) || nodes.length === 0) return null
    return nodes.map((child: any, i: number) => {
      const nextKey = `${keyPath}.${i}`
      return (
        <div key={nextKey} className="relative space-y-2" style={{ marginLeft: `${depth * 12}px` }}>
          <div className={cn("bg-card border border-border/40 p-3 rounded-lg shadow-sm hover:border-primary/20 transition-colors", styles.colors.bgCard)}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-2">
                <Component className="h-3 w-3 text-primary/60" />
                {child?.name}
              </span>
              <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 h-4">Component</Badge>
            </div>
            {child?.description && (
              <p className={cn("mb-2 italic leading-tight", styles.typography.bodySmall, styles.colors.textMuted)}>
                {child.description}
              </p>
            )}
            {Array.isArray(child?.props) && child.props.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {child.props.map((p: any, j: number) => (
                  <span key={j} className="text-[9px] font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">{p}</span>
                ))}
              </div>
            )}
          </div>
          {Array.isArray(child?.children) && child.children.length > 0 && (
            <div className="pl-3 border-l-2 border-dashed border-border/60 space-y-2">
              {renderHierarchyNodes(child.children, depth + 1, nextKey)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Header Summary */}
      <div className="p-4 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>UI/UX Design Specification</h2>
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 text-[10px] px-1.5 h-5">
                Visual Design
              </Badge>
              {a2uiManifest && data.schema_version && (
                <Badge variant="outline" className="text-[10px] font-mono text-indigo-600 border-indigo-500/30 uppercase px-1.5 py-0.5">
                  A2UI_V{data.schema_version}
                </Badge>
              )}
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {(data as any).summary || (data as any).description || "Visual design specifications and component library."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard 
            icon={Palette} 
            label="Tokens" 
            value={designTokens.colors ? Object.keys(designTokens.colors).length + Object.keys(designTokens.spacing || {}).length : 0}
            color="text-indigo-600 dark:text-indigo-400" 
            bg="bg-indigo-500/10" 
          />
          <StatsCard 
            icon={Layers} 
            label="Specs" 
            value={componentSpecs.length} 
            color="text-purple-600 dark:text-purple-400" 
            bg="bg-purple-500/10" 
          />
          <StatsCard 
            icon={Box} 
            label="Atoms" 
            value={atomicStructure ? atomicStructure.atoms.length + atomicStructure.molecules.length + atomicStructure.organisms.length : 0}
            color="text-amber-600 dark:text-amber-400" 
            bg="bg-amber-500/10" 
          />
          <StatsCard 
            icon={Monitor} 
            label="Screens" 
            value={countA2UINodes(a2uiManifest?.root)} 
            color="text-emerald-600 dark:text-emerald-400" 
            bg="bg-emerald-500/10" 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue={a2uiManifest ? "preview" : "tokens"} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="preview" icon={Eye} label="Stage" disabled={!a2uiManifest} />
                <TabTrigger value="tokens" icon={Palette} label="Tokens" />
                <TabTrigger value="library" icon={Layers} label="Components" />
                <TabTrigger value="arch" icon={Layout} label="Blueprint" />
                <TabTrigger value="accessibility" icon={Accessibility} label="Accessibility" />
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4 max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                  <TabsContent key="preview" value="preview" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show">
                      <Card className="border-border/50 overflow-hidden shadow-sm bg-zinc-50 dark:bg-zinc-900/10">
                        <div className="bg-muted/40 p-2 border-b border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-1 mr-1.5">
                              <div className="h-2 w-2 rounded-full bg-red-400" />
                              <div className="h-2 w-2 rounded-full bg-amber-400" />
                              <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground font-bold">
                              A2UI_SANDBOX{data.schema_version ? `_V${data.schema_version}` : ""}
                            </span>
                          </div>
                          {a2uiManifest && (
                            <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 font-mono">
                              {countA2UINodes(a2uiManifest.root)} nodes
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-0 min-h-[300px] flex flex-col items-center justify-center bg-card">
                          {a2uiManifest ? (
                            <div className="w-full h-full p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-muted/10 border border-border/50 rounded-xl overflow-hidden">
                                  <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
                                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Manifest Tree</div>
                                  </div>
                                  <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {renderA2UINode(a2uiManifest.root)}
                                  </div>
                                </div>
                                <div className="bg-muted/10 border border-border/50 rounded-xl overflow-hidden flex flex-col">
                                  <div className="px-3 py-2 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Root Props</div>
                                    <Badge variant="outline" className="text-[9px] font-mono px-1 h-4">
                                      {(a2uiManifest?.root?.type || "").toString()}
                                    </Badge>
                                  </div>
                                  <div className="p-3 flex-1 overflow-auto custom-scrollbar">
                                    <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap break-words">
                                      {JSON.stringify(a2uiManifest.root?.props ?? {}, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-2 opacity-30">
                              <Monitor className="h-12 w-12 mx-auto" />
                              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">UI Preview Mode Disabled</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="tokens" value="tokens" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Colors */}
                        <Card className={cn("border-border/50", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                              <Palette className="h-4 w-4 text-indigo-500" />
                              Color Palette
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 px-4 pb-4">
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {designTokens.colors && Object.entries(designTokens.colors).map(([name, value]: [string, any]) => (
                                 <ColorTokenCard key={name} name={name} value={value} />
                               ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Typography */}
                        <Card className={cn("border-border/50", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                              <Type className="h-4 w-4 text-purple-500" />
                              Typography Specimen
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 px-4 pb-4 space-y-4">
                            <div className="space-y-2 p-4 bg-muted/10 rounded-lg border border-border/40">
                              <div className="text-2xl font-bold tracking-tighter text-foreground">Aα Bβ Cγ</div>
                              <p className="text-sm text-muted-foreground leading-relaxed">The quick brown fox jumps over the lazy dog.</p>
                              {data.design_tokens?.typography?.fontFamily && (
                                <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block border border-border/40">
                                  {data.design_tokens.typography.fontFamily}
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scales</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {designTokens.typography?.fontSize && Object.entries(designTokens.typography.fontSize).map(([k, v]: [string, any]) => (
                                    <Badge key={k} variant="secondary" className="text-[9px] font-mono">{k}:{v}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Weights</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {designTokens.typography?.fontWeight && Object.entries(designTokens.typography.fontWeight).map(([k, v]: [string, any]) => (
                                    <Badge key={k} variant="outline" className="text-[9px] font-mono">{k}:{v}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Spacing & Effects */}
                      {(designTokens.spacing || designTokens.borderRadius || designTokens.shadows) && (
                        <Card className={cn("border-border/50", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                              <Box className="h-4 w-4 text-amber-500" />
                              Effects & Geometry
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {designTokens.spacing && (
                                <div className="space-y-3">
                                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Spacing Scale</span>
                                   <div className="flex items-end gap-2 justify-start h-16">
                                    {Object.entries(designTokens.spacing).slice(0, 8).map(([k, v]: [string, any], i: number) => {
                                      const size = parseInt(v) * 2 || (i + 1) * 8
                                      return (
                                        <div key={k} className="flex flex-col items-center gap-1.5 group">
                                          <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: Math.min(size, 48) }}
                                            className="w-4 bg-indigo-500/40 rounded-t-sm group-hover:bg-indigo-500 transition-colors"
                                          />
                                          <div className="text-[8px] font-mono text-muted-foreground">{k}</div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {designTokens.borderRadius && (
                                <div className="space-y-3">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Border Radius</span>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(designTokens.borderRadius).map(([k, v]: [string, any]) => (
                                      <div key={k} className="flex flex-col items-center gap-1">
                                        <div className="w-8 h-8 border border-foreground/20 bg-muted/20" style={{ borderRadius: v }} />
                                        <span className="text-[8px] font-mono text-muted-foreground">{k}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="library" value="library" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-4">
                         {hierarchyNodes.length > 0 ? (
                           renderHierarchyNodes(hierarchyNodes)
                         ) : (
                           <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                             <Layers className="h-8 w-8 mx-auto mb-3 opacity-20" />
                             <p className="text-sm">No component hierarchy defined.</p>
                           </div>
                         )}
                      </div>
                      <div className="space-y-4">
                         {atomicStructure && (
                           <Card className={cn("border-border/50", styles.colors.bgCard)}>
                             <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                               <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Atomic Structure</CardTitle>
                             </CardHeader>
                             <CardContent className="p-4 space-y-4">
                               <div>
                                 <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Box className="h-3 w-3 text-blue-500"/> Atoms</h4>
                                 <div className="flex flex-wrap gap-1">
                                   {atomicStructure.atoms.map((a: string, i: number) => (
                                     <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-500/5 text-blue-600 border-blue-500/10">{a}</Badge>
                                   ))}
                                 </div>
                               </div>
                               <div>
                                 <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Grid className="h-3 w-3 text-purple-500"/> Molecules</h4>
                                 <div className="flex flex-wrap gap-1">
                                   {atomicStructure.molecules.map((a: string, i: number) => (
                                     <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 bg-purple-500/5 text-purple-600 border-purple-500/10">{a}</Badge>
                                   ))}
                                 </div>
                               </div>
                               <div>
                                 <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Layout className="h-3 w-3 text-orange-500"/> Organisms</h4>
                                 <div className="flex flex-wrap gap-1">
                                   {atomicStructure.organisms.map((a: string, i: number) => (
                                     <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 bg-orange-500/5 text-orange-600 border-orange-500/10">{a}</Badge>
                                   ))}
                                 </div>
                               </div>
                             </CardContent>
                           </Card>
                         )}
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent key="arch" value="arch" className="m-0 outline-none">
                     <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {componentSpecs.map((spec: any, i: number) => (
                         <motion.div
                           key={i}
                           variants={item}
                           className={cn("bg-card border border-border/50 p-4 rounded-xl shadow-sm hover:border-primary/20 transition-all", styles.colors.bgCard)}
                         >
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="text-sm font-semibold">{spec.name}</h4>
                             <Badge variant="outline" className="text-[9px]">{spec.type || 'Component'}</Badge>
                           </div>
                           <p className="text-xs text-muted-foreground mb-3">{spec.description}</p>
                           <div className="space-y-2 pt-2 border-t border-border/40">
                             {spec.props && (
                               <div className="grid grid-cols-2 gap-2 text-[10px]">
                                 {Object.entries(spec.props).map(([k, v]: [string, any], idx: number) => (
                                   <div key={idx} className="flex justify-between bg-muted/30 px-2 py-1 rounded">
                                     <span className="font-mono text-muted-foreground">{k}</span>
                                     <span className="font-mono text-foreground/80">{String(v)}</span>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         </motion.div>
                       ))}
                     </motion.div>
                  </TabsContent>

                  <TabsContent key="accessibility" value="accessibility" className="m-0 outline-none">
                    <motion.div variants={container} initial="hidden" animate="show">
                      <Card className={cn("border-border/50", styles.colors.bgCard)}>
                        <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                            <Accessibility className="h-4 w-4 text-emerald-500" />
                            Accessibility Guidelines
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          {accessibility ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/40">
                                  <span className="text-xs font-medium">Compliance Standard</span>
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{(accessibility as any).standard || `WCAG ${accessibility.wcag_level || "AA"}`}</Badge>
                                </div>
                                
                                {Array.isArray((accessibility as any).guidelines) && (
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Key Guidelines</span>
                                    {(accessibility as any).guidelines.map((guide: string, i: number) => (
                                      <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-card border border-border/40">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground leading-relaxed">{guide}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3">
                                {Array.isArray((accessibility as any).checklist) && (
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Checklist</span>
                                    {(accessibility as any).checklist.map((item: any, i: number) => (
                                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                             <div className="py-8 text-center text-muted-foreground italic">
                               No accessibility guidelines defined.
                             </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
