'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { artifactStyles as styles } from "./shared-styles"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import { TabsTrigger as TabsTriggerPrimitive } from "@/components/ui/tabs"

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export const itemVariantsX = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
}

export function StatsCard({ icon: Icon, label, value, subValue, color, bg, isText = false }: any) {
  return (
    <div className={cn("border rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm min-w-0 h-full", styles.colors.bgCard, styles.colors.borderMuted)}>
      <div className={cn("p-2 rounded-full mb-1.5 flex-shrink-0", bg, color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className={cn("font-bold flex-shrink-0", isText ? "text-xs uppercase" : "text-xl", isText ? "text-muted-foreground" : styles.colors.text)}>
        {value || 0}
      </div>
      {subValue && (
        <div className="text-[9px] text-muted-foreground/60 font-mono mt-0.5 truncate w-full px-1">{subValue}</div>
      )}
      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1 line-clamp-2 w-full px-1 leading-tight">{label}</div>
    </div>
  )
}

export function CopyButton({ text, className }: { text: string, className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6 transition-all", className)}
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </Button>
  )
}

export function TabTrigger({ value, icon: Icon, label, count, className, ...props }: any) {
  return (
    <TabsTriggerPrimitive
      value={value}
      className={cn(
        "data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg text-xs py-2 px-3 gap-2 transition-all flex items-center",
        className
      )}
      {...props}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-1 bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-md text-[10px] font-mono">
          {count}
        </span>
      )}
    </TabsTriggerPrimitive>
  )
}
