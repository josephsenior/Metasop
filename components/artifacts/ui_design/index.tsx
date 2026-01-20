'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Palette,
  Type,
  Layout,
  Layers,
  Box,
  Component,
  Copy,
  Check,
  Grid,
  Accessibility,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Zap,
  FileJson,
  Target,
  Search
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
  const atomicStructure = data.atomic_structure
  const layoutBreakpoints = data.layout_breakpoints
  const uiPatterns = data.ui_patterns || []
  const websiteLayout = data.website_layout
  const layoutStrategy = data.layout_strategy
  const visualPhilosophy = data.visual_philosophy
  const informationArchitecture = data.information_architecture
  const responsiveStrategy = data.responsive_strategy

  const hierarchyNodes: any[] = Array.isArray(componentHierarchy)
    ? componentHierarchy
    : (componentHierarchy && typeof componentHierarchy === "object" && Array.isArray((componentHierarchy as any).children))
      ? (componentHierarchy as any).children
      : []

  const rootNode = (!Array.isArray(componentHierarchy) && componentHierarchy?.root) ? componentHierarchy.root : null

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
            </div>
            <p className={cn(styles.typography.bodySmall, "text-indigo-600 dark:text-indigo-400 font-medium")}>
              {(data as any).summary || "Visual design specifications and component library."}
            </p>
            {data.description && (
              <p className={cn("text-[11px] text-muted-foreground/80 leading-tight mt-1 max-w-3xl")}>
                {data.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <StatsCard
            icon={Palette}
            label="Tokens"
            value={(designTokens.colors ? Object.keys(designTokens.colors).length : 0) + (designTokens.spacing ? Object.keys(designTokens.spacing).length : 0)}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-indigo-500/10"
          />
          <StatsCard
            icon={Layers}
            label="Registry"
            value={hierarchyNodes.length}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatsCard
            icon={Box}
            label="Atoms"
            value={atomicStructure ? (atomicStructure.atoms?.length ?? 0) + (atomicStructure.molecules?.length ?? 0) + (atomicStructure.organisms?.length ?? 0) : 0}
            color="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatsCard
            icon={Layout}
            label="Specs"
            value={componentSpecs.length}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatsCard
            icon={Grid}
            label="Patterns"
            value={uiPatterns.length}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatsCard
            icon={Smartphone}
            label="Breakpoints"
            value={layoutBreakpoints ? Object.keys(layoutBreakpoints).length : 0}
            color="text-rose-600 dark:text-rose-400"
            bg="bg-rose-500/10"
          />
          <StatsCard
            icon={Monitor}
            label="Pages"
            value={websiteLayout?.pages?.length || 0}
            color="text-cyan-600 dark:text-cyan-400"
            bg="bg-cyan-500/10"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="tokens" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <TabsList className="bg-transparent p-0 gap-2 justify-start h-auto w-full">
                <TabTrigger value="tokens" icon={Palette} label="Tokens" count={(designTokens.colors ? Object.keys(designTokens.colors).length : 0) + (designTokens.spacing ? Object.keys(designTokens.spacing).length : 0)} />
                <TabTrigger value="strategy" icon={Zap} label="Strategy" />
                <TabTrigger value="sitemap" icon={Monitor} label="Sitemap" count={websiteLayout?.pages?.length || 0} />
                <TabTrigger value="library" icon={Layers} label="Components" count={hierarchyNodes.length} />
                <TabTrigger value="atomic" icon={Box} label="Atomic" count={atomicStructure ? (atomicStructure.atoms?.length ?? 0) + (atomicStructure.molecules?.length ?? 0) + (atomicStructure.organisms?.length ?? 0) : 0} />
                <TabTrigger value="arch" icon={Layout} label="Blueprint" count={componentSpecs.length} />
                <TabTrigger value="accessibility" icon={Accessibility} label="Accessibility" />
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">


                <TabsContent key="strategy" value="strategy" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visualPhilosophy && (
                        <Card className={cn("border-indigo-500/20 bg-indigo-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-indigo-500/10 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Target className="h-4 w-4 text-indigo-500" />
                              Visual Philosophy
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-xs text-foreground/80 leading-relaxed italic">
                              "{visualPhilosophy}"
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {layoutStrategy && (
                        <Card className={cn("border-blue-500/20 bg-blue-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-blue-500/10 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Layout className="h-4 w-4 text-blue-500" />
                              Layout Strategy
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {layoutStrategy}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {informationArchitecture && (
                        <Card className={cn("border-emerald-500/20 bg-emerald-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-emerald-500/10 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Search className="h-4 w-4 text-emerald-500" />
                              Information Architecture
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {informationArchitecture}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {responsiveStrategy && (
                        <Card className={cn("border-purple-500/20 bg-purple-500/5 shadow-sm overflow-hidden", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-purple-500/10 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-purple-500" />
                              Responsive Strategy
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {responsiveStrategy}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent key="sitemap" value="sitemap" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {websiteLayout?.pages?.map((page: any, idx: number) => (
                        <Card key={idx} className={cn("border-border/50 overflow-hidden", styles.colors.bgCard)}>
                          <div className="h-1 bg-primary/20 w-full" />
                          <CardHeader className="pb-2 px-4 pt-3 flex flex-row items-center justify-between">
                            <div>
                              <CardTitle className="text-sm font-bold text-foreground">{page.name}</CardTitle>
                              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{page.route}</div>
                            </div>
                            <Badge variant="outline" className="text-[8px] uppercase h-5">Page</Badge>
                          </CardHeader>
                          <CardContent className="px-4 pb-4 pt-2">
                            <div className="flex flex-col gap-3">
                              {page.sections?.map((section: any, sIdx: number) => {
                                const sectionName = typeof section === 'string' ? section : section.name;
                                const components = typeof section === 'object' ? section.components : [];
                                
                                return (
                                  <div key={sIdx} className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded border border-border/40 group hover:border-primary/30 transition-colors">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary" />
                                      <span className="text-[10px] font-medium text-foreground/80">{sectionName}</span>
                                    </div>
                                    {components && components.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pl-3">
                                        {components.map((comp: string, cIdx: number) => (
                                          <span key={cIdx} className="text-[8px] font-mono text-muted-foreground/70 bg-muted/10 px-1 py-0.5 rounded border border-border/10">
                                            {comp}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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
                            <div className="flex gap-2">
                              {data.design_tokens?.typography?.fontFamily && (
                                <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block border border-border/40">
                                  Body: {data.design_tokens.typography.fontFamily}
                                </div>
                              )}
                              {data.design_tokens?.typography?.headingFont && (
                                <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block border border-border/40">
                                  Headings: {data.design_tokens.typography.headingFont}
                                </div>
                              )}
                            </div>
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
                            {designTokens.shadows && (
                              <div className="space-y-3">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shadows & Elevation</span>
                                <div className="flex flex-wrap gap-4">
                                  {Object.entries(designTokens.shadows).map(([k, v]: [string, any]) => (
                                    <div key={k} className="flex flex-col items-center gap-2 group">
                                      <div
                                        className="w-10 h-10 border border-border bg-card rounded-lg transition-transform group-hover:scale-110"
                                        style={{ boxShadow: v }}
                                      />
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
                      {rootNode && (
                        <div className="mb-4">
                          <div className={cn("bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl shadow-sm", styles.colors.bgCard)}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Root: {rootNode}
                              </span>
                              <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px] uppercase">Entry Point</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground italic">Primary application entry point and container component.</p>
                          </div>
                          {hierarchyNodes.length > 0 && (
                            <div className="mt-4 ml-4 pl-4 border-l-2 border-dashed border-indigo-500/20">
                              {renderHierarchyNodes(hierarchyNodes)}
                            </div>
                          )}
                        </div>
                      )}
                      {!rootNode && hierarchyNodes.length > 0 ? (
                        renderHierarchyNodes(hierarchyNodes)
                      ) : !rootNode && hierarchyNodes.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                          <Layers className="h-8 w-8 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No component hierarchy defined.</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-4">
                      {uiPatterns.length > 0 && (
                        <Card className={cn("border-border/50", styles.colors.bgCard)}>
                          <CardHeader className="pb-2 border-b border-border/50 px-4 pt-4">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <Layout className="h-3 w-3" />
                              UI Patterns
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-1">
                              {uiPatterns.map((pattern: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border/40 last:border-0 hover:bg-muted/30 px-1 rounded transition-colors">
                                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                  <span className="text-muted-foreground">{pattern}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent key="atomic" value="atomic" className="m-0 outline-none">
                  <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Atoms */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                          <Box className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Atoms</h3>
                        <Badge variant="outline" className="ml-auto text-[10px] font-mono">{atomicStructure?.atoms?.length || 0}</Badge>
                      </div>
                      <div className="grid gap-2">
                        {atomicStructure?.atoms?.map((atom: string, i: number) => (
                          <motion.div key={i} variants={item} className="p-3 bg-card border border-border/50 rounded-xl hover:border-blue-500/30 transition-all shadow-sm">
                            <span className="text-xs font-medium text-foreground/80">{atom}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Molecules */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                          <Grid className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Molecules</h3>
                        <Badge variant="outline" className="ml-auto text-[10px] font-mono">{atomicStructure?.molecules?.length || 0}</Badge>
                      </div>
                      <div className="grid gap-2">
                        {atomicStructure?.molecules?.map((mol: string, i: number) => (
                          <motion.div key={i} variants={item} className="p-3 bg-card border border-border/50 rounded-xl hover:border-purple-500/30 transition-all shadow-sm">
                            <span className="text-xs font-medium text-foreground/80">{mol}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Organisms */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                          <Layout className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Organisms</h3>
                        <Badge variant="outline" className="ml-auto text-[10px] font-mono">{atomicStructure?.organisms?.length || 0}</Badge>
                      </div>
                      <div className="grid gap-2">
                        {atomicStructure?.organisms?.map((org: string, i: number) => (
                          <motion.div key={i} variants={item} className="p-3 bg-card border border-border/50 rounded-xl hover:border-orange-500/30 transition-all shadow-sm">
                            <span className="text-xs font-medium text-foreground/80">{org}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent key="arch" value="arch" className="m-0 outline-none">
                  {layoutBreakpoints && (
                    <Card className="mb-4 bg-muted/20 border-border/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-px h-full bg-linear-to-b from-transparent via-blue-500/20 to-transparent" />
                      <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between relative z-10">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Laptop className="h-4 w-4 text-primary" />
                            Responsive Breakpoints
                          </h4>
                          <p className="text-[10px] text-muted-foreground">Layout adaptation strategy</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 justify-center md:justify-end">
                          {[
                            { k: 'sm', icon: Smartphone, w: 'w-6' },
                            { k: 'md', icon: Tablet, w: 'w-8' },
                            { k: 'lg', icon: Laptop, w: 'w-10' },
                            { k: 'xl', icon: Monitor, w: 'w-12' },
                            { k: '2xl', icon: Monitor, w: 'w-16' }
                          ].map((bp) => {
                            const val = (layoutBreakpoints as any)[bp.k]
                            if (!val) return null
                            return (
                              <div key={bp.k} className="flex flex-col items-center gap-1.5 p-2 bg-background/50 rounded-lg border border-border/50 min-w-[70px]">
                                <bp.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-bold font-mono">{val}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">{bp.k}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Card>
                  )}
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
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {spec.variants?.map((v: string) => (
                              <Badge key={v} variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary/60 border-primary/10">Variant: {v}</Badge>
                            ))}
                            {spec.states?.map((s: string) => (
                              <Badge key={s} variant="outline" className="text-[8px] h-4 bg-amber-500/5 text-amber-600/70 border-amber-500/10">State: {s}</Badge>
                            ))}
                          </div>
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
                              <div className="flex flex-wrap gap-2 mb-4">
                                {[
                                  { k: 'aria_labels', l: 'ARIA Labels' },
                                  { k: 'keyboard_navigation', l: 'Keyboard Nav' },
                                  { k: 'screen_reader_support', l: 'Screen Reader' },
                                  { k: 'focus_indicators', l: 'Focus Ring' }
                                ].map((feat, idx) => {
                                  const enabled = (accessibility as any)[feat.k]
                                  if (!enabled) return null
                                  return (
                                    <Badge key={idx} variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[9px] gap-1 px-1.5 h-5">
                                      <Check className="h-2.5 w-2.5" /> {feat.l}
                                    </Badge>
                                  )
                                })}
                              </div>
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
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
