'use client'

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardCheck, 
  LayoutDashboard, 
  ArrowRight, 
  FileText, 
  Server, 
  Shield, 
  Code, 
  Palette, 
  CheckCircle, 
  User 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "./shared-styles"

const agentIcons: Record<string, any> = {
  pm_spec: User,
  arch_design: FileText,
  devops_infrastructure: Server,
  security_architecture: Shield,
  engineer_impl: Code,
  ui_design: Palette,
  qa_verification: CheckCircle,
}

const agentColors: Record<string, string> = {
  pm_spec: "text-purple-600 bg-purple-500/10 border-purple-200 dark:border-purple-900",
  arch_design: "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-900",
  devops_infrastructure: "text-green-600 bg-green-500/10 border-green-200 dark:border-green-900",
  security_architecture: "text-red-600 bg-red-500/10 border-red-200 dark:border-red-900",
  engineer_impl: "text-orange-600 bg-orange-500/10 border-orange-200 dark:border-orange-900",
  ui_design: "text-pink-600 bg-pink-500/10 border-pink-200 dark:border-pink-900",
  qa_verification: "text-teal-600 bg-teal-500/10 border-teal-200 dark:border-teal-900",
}

const agentLabels: Record<string, string> = {
  pm_spec: "Product Manager",
  arch_design: "System Architect",
  devops_infrastructure: "DevOps Engineer",
  security_architecture: "Security Specialist",
  engineer_impl: "Software Engineer",
  ui_design: "UI/UX Designer",
  qa_verification: "QA Engineer",
}

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function ProjectSummary({ artifacts }: { artifacts: any }) {
  const availableArtifacts = Object.entries(artifacts).filter(([, data]) => !!data)

  return (
    <div className={cn("h-full flex flex-col p-4", styles.colors.bg)}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <LayoutDashboard className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h2 className={styles.typography.h2}>Project Execution Summary</h2>
          <p className={cn(styles.typography.bodySmall, styles.colors.textMuted)}>Overview of generated artifacts and agent outputs.</p>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {availableArtifacts.map(([key, artifact]: [string, any]) => {
          const Icon = agentIcons[key] || FileText
          const colorClass = agentColors[key] || "text-gray-600 bg-gray-500/10 border-gray-200"
          const data = artifact.content || artifact
          const summary = data.summary || data.description || "No summary provided."
          const title = data.title || agentLabels[key]

          return (
            <motion.div key={key} variants={item}>
              <Card className={cn(
                "group border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden h-full flex flex-col",
                styles.colors.bgCard, styles.colors.borderMuted
              )}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-md border", colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{agentLabels[key]}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-5 bg-background font-mono px-1.5">
                      ACTIVE
                    </Badge>
                  </div>
                  <h3 className={cn("font-bold truncate pr-2 group-hover:text-primary transition-colors", styles.typography.h3)}>
                    {title}
                  </h3>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-1 flex flex-col">
                  <p className={cn("flex-1 mb-4 line-clamp-3", styles.typography.bodySmall, styles.colors.textMuted)}>
                    {summary}
                  </p>
                  <div className="flex items-center text-[10px] font-medium text-primary/80 group-hover:text-primary transition-colors mt-auto pt-3 border-t border-border/30">
                    <span className="mr-1">View Details</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {availableArtifacts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-muted/10 rounded-xl border-2 border-dashed border-border/40 m-4"
        >
          <div className="p-4 bg-muted/30 rounded-full mb-4">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No execution reports available</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Start the agent orchestration to generate project artifacts and view them here.
          </p>
        </motion.div>
      )}
    </div>
  )
}
