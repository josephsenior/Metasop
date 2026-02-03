'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Palette,
  Layers,
  Box,
  Layout,
  Grid,
  Accessibility,
  Smartphone,
  Monitor
} from "lucide-react"

import { UIDesignerBackendArtifact } from "@/lib/metasop/artifacts/ui-designer/types"
import { artifactStyles as styles } from "../shared-styles"
import {
  StatsCard,
  TabTrigger
} from "../shared-components"

import { StrategySection } from "./sections/StrategySection"
import { SitemapSection } from "./sections/SitemapSection"
import { TokensSection } from "./sections/TokensSection"
import { ComponentLibrarySection } from "./sections/ComponentLibrarySection"
import { AtomicSection } from "./sections/AtomicSection"
import { BlueprintSection } from "./sections/BlueprintSection"
import { AccessibilitySection } from "./sections/AccessibilitySection"

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

  return (
    <div className={cn("h-full flex flex-col", styles.colors.bg)}>
      {/* Design Header */}
      <div className={styles.layout.header}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className={styles.typography.h2}>UI/UX Design Specification</h2>
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 text-[10px] px-1.5 h-5">
                Design System
              </Badge>
            </div>
            <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>
              {data.summary || "Visual language, component specification, and design patterns."}
            </p>
            {data.description && (
              <p className="text-[11px] text-muted-foreground italic leading-tight max-w-3xl border-l-2 border-primary/20 pl-3 py-1 mt-1">
                {data.description}
              </p>
            )}
          </div>
        </div>

        <div className={styles.layout.statsGrid}>
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
                <TabTrigger value="strategy" icon={Layout} label="Strategy" />
                <TabTrigger value="sitemap" icon={Monitor} label="Sitemap" count={websiteLayout?.pages?.length || 0} />
                <TabTrigger value="library" icon={Layers} label="Components" count={hierarchyNodes.length} />
                <TabTrigger value="atomic" icon={Box} label="Atomic" count={atomicStructure ? (atomicStructure.atoms?.length ?? 0) + (atomicStructure.molecules?.length ?? 0) + (atomicStructure.organisms?.length ?? 0) : 0} />
                <TabTrigger value="arch" icon={Grid} label="Blueprint" count={componentSpecs.length} />
                <TabTrigger value="accessibility" icon={Accessibility} label="Accessibility" />
              </TabsList>
            </ScrollArea>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/5">
            <ScrollArea className="h-full">
              <div className="p-4">
                <TokensSection designTokens={designTokens} />
                <StrategySection
                  visualPhilosophy={visualPhilosophy}
                  layoutStrategy={layoutStrategy}
                  informationArchitecture={informationArchitecture}
                  responsiveStrategy={responsiveStrategy}
                />
                <SitemapSection websiteLayout={websiteLayout} />
                <ComponentLibrarySection
                  rootNode={rootNode}
                  hierarchyNodes={hierarchyNodes}
                  uiPatterns={uiPatterns}
                />
                <AtomicSection atomicStructure={atomicStructure} />
                <BlueprintSection
                  layoutBreakpoints={layoutBreakpoints}
                  componentSpecs={componentSpecs}
                />
                <AccessibilitySection accessibility={accessibility} />
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
