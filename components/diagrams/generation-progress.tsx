"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Loader2, Circle, AlertCircle, Clock } from "lucide-react"
import { useState, useEffect, useMemo, useRef } from "react"
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
  "security_architecture",
  "devops_infrastructure",
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
  const [startTime, setStartTime] = useState(Date.now())
  const prevStepsLengthRef = useRef(0)

  // Memoize step mapping to ensure re-renders when steps change
  const { orderedSteps, progress } = useMemo(() => {
    // Create a map of steps by step_id
    const stepsMap = new Map(steps.map((step) => [step.step_id, step]))

    // Get ordered steps - ensure all steps from agentOrder are included
    const ordered = agentOrder.map((stepId) => {
      const step = stepsMap.get(stepId)
      return {
        stepId,
        label: agentLabels[stepId] || stepId,
        status: step?.status || "pending",
      }
    })

    // Calculate overall progress
    // Include running steps as partial progress (50% of their weight)
    const completedSteps = ordered.filter((s) => s.status === "success").length
    const runningSteps = ordered.filter((s) => s.status === "running").length
    const totalSteps = ordered.length
    // Progress = completed steps (100%) + running steps (50%) / total steps
    const calculatedProgress = totalSteps > 0
      ? ((completedSteps + (runningSteps * 0.5)) / totalSteps) * 100
      : 0

    return { orderedSteps: ordered, progress: calculatedProgress }
  }, [steps])

  // Debug logging - only log when steps actually change
  useEffect(() => {
    if (steps.length > 0) {
      console.log("[GenerationProgress] Steps updated:", {
        stepsCount: steps.length,
        steps: steps.map(s => `${s.step_id}:${s.status}`),
        orderedSteps: orderedSteps.map(s => `${s.stepId}:${s.status}`),
        completed: orderedSteps.filter(s => s.status === "success").length,
        running: orderedSteps.filter(s => s.status === "running").length,
        progress: Math.round(progress)
      })
    }
  }, [steps, orderedSteps, progress])

  // Find current step
  const currentStep = orderedSteps.find((s) => s.status === "running")

  // Reset timer when a new generation starts (steps go from 0 to >0)
  useEffect(() => {
    if (prevStepsLengthRef.current === 0 && steps.length > 0) {
      setStartTime(Date.now())
      setElapsedTime(0)
    }
    prevStepsLengthRef.current = steps.length
  }, [steps.length])

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

  // Always show progress bar if steps exist, even if all are pending
  if (steps.length === 0) return null

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
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full absolute top-0 left-0"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground w-8 tabular-nums min-w-8 text-right">
          {Math.round(Math.max(0, Math.min(progress, 100)))}%
        </span>
      </div>
    </motion.div>
  )
}
