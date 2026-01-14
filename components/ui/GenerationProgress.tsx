"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Loader2, Circle, AlertCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface GenerationProgressProps {
  steps: Array<{
    step_id: string
    role: string
    status: "pending" | "running" | "success" | "failed"
  }>
}

const agentOrder = [
  "pm_spec",
  "arch_design",
  "devops_infrastructure",
  "security_architecture",
  "ui_design",
  "engineer_impl",
  "qa_verification"
]
const agentLabels: Record<string, string> = {
  pm_spec: "PM",
  arch_design: "Architect",
  devops_infrastructure: "DevOps",
  security_architecture: "Security",
  engineer_impl: "Engineer",
  ui_design: "UI",
  qa_verification: "QA",
}

export function GenerationProgress({ steps }: GenerationProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(Date.now())

  // Create a map of steps by step_id
  const stepsMap = new Map(steps.map((step) => [step.step_id, step]))

  // Get ordered steps
  const orderedSteps = agentOrder
    .filter((stepId) => stepsMap.has(stepId))
    .map((stepId) => ({
      stepId,
      label: agentLabels[stepId] || stepId,
      status: stepsMap.get(stepId)?.status || "pending",
    }))

  // Calculate overall progress
  const completedSteps = orderedSteps.filter((s) => s.status === "success").length
  const totalSteps = orderedSteps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  // Find current step
  const currentStep = orderedSteps.find((s) => s.status === "running")

  // Update elapsed time - continue updating even when no step is running
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  if (orderedSteps.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center gap-3 py-2 px-4 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50"
    >
      {/* Left: Title + Time */}
      <div className="flex items-center gap-2 shrink-0">
        {currentStep ? (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium text-foreground">
          {currentStep ? "Generating" : "Completed"}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(elapsedTime)}
        </span>
      </div>

      {/* Center: Step indicators */}
      <div className="flex items-center gap-2 flex-1 justify-center">
        {orderedSteps.map((step, index) => {
          const isActive = step.status === "running"
          const isCompleted = step.status === "success"
          const isFailed = step.status === "failed"

          return (
            <div key={step.stepId} className="flex items-center gap-1">
              {/* Connector line (except first) */}
              {index > 0 && (
                <div
                  className={cn(
                    "w-6 h-0.5 transition-colors",
                    isCompleted || isActive ? "bg-blue-500" : "bg-muted"
                  )}
                />
              )}
              {/* Step indicator */}
              <div className="flex items-center gap-1">
                {isCompleted ? (
                  <motion.div
                    key={`check-${step.stepId}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  </motion.div>
                ) : isActive ? (
                  <Loader2
                    key={`loader-${step.stepId}-${step.status}`}
                    className="h-4 w-4 text-blue-500 animate-spin shrink-0"
                  />
                ) : isFailed ? (
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors whitespace-nowrap",
                    isActive ? "text-blue-600 dark:text-blue-400" :
                      isCompleted ? "text-green-600 dark:text-green-400" :
                        isFailed ? "text-red-600 dark:text-red-400" :
                          "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right: Progress percentage */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground w-8">
          {Math.round(progress)}%
        </span>
      </div>
    </motion.div>
  )
}
