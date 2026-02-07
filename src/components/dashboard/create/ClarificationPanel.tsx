"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ClarificationQuestion } from "@/hooks/use-diagram-generation"

interface ClarificationPanelProps {
    questions: ClarificationQuestion[]
    answers: Record<string, string>
    onAnswerChange: (questionId: string, answer: string) => void
    onConfirm: () => void
    onSkip: () => void
    isGenerating: boolean
}

export function ClarificationPanel({
    questions,
    answers,
    onAnswerChange,
    onConfirm,
    onSkip,
    isGenerating
}: ClarificationPanelProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(0)
    const [customByQuestionId, setCustomByQuestionId] = useState<Record<string, string>>({})

    const CUSTOM_OPTION_VALUE = "__custom__"

    const isComplete = questions.length > 0 && questions.every(q => !!answers[q.id])
    const answeredCount = questions.filter(q => !!answers[q.id]).length
    const completionPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0
    const isHalfComplete = answeredCount >= Math.ceil(questions.length * 0.5)

    const currentQuestion = questions[currentStep]
    const isLastStep = currentStep === questions.length - 1
    const isFirstStep = currentStep === 0

    const selectedValue = (() => {
        if (!currentQuestion) return ""
        const currentAnswer = answers[currentQuestion.id]
        if (!currentAnswer) return ""
        if (currentQuestion.options.includes(currentAnswer)) return currentAnswer
        return CUSTOM_OPTION_VALUE
    })()

    const nextStep = () => {
        if (currentStep < questions.length - 1) {
            setDirection(1)
            setCurrentStep(prev => prev + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setDirection(-1)
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleAnswerChange = (val: string) => {
        if (!currentQuestion) return
        if (val === CUSTOM_OPTION_VALUE) {
            const existing = customByQuestionId[currentQuestion.id] ?? ""
            if (existing.trim().length > 0) onAnswerChange(currentQuestion.id, existing)
            return
        }

        onAnswerChange(currentQuestion.id, val)
    }

    const handleCustomChange = (questionId: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { target: { value } } = e
        setCustomByQuestionId(prev => ({ ...prev, [questionId]: value }))
        onAnswerChange(questionId, value)
    }

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 50 : -50, opacity: 0 })
    }

    if (!currentQuestion) return null

    return (
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[92px] z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        className="w-full max-w-[380px] pointer-events-auto"
      >
        <div className="border border-border/10 bg-card/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-sm">
          <div className="px-3 pt-2 pb-0.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Refine</h2>
              <div className="text-xs text-muted-foreground">{currentStep + 1}/{questions.length}</div>
            </div>

            <div className="mt-1 h-1 bg-muted/12 rounded-full overflow-hidden">
              <motion.div className="h-full bg-foreground/60" initial={{ width: 0 }} animate={{ width: `${completionPercent}%` }} transition={{ duration: 0.12 }} />
            </div>
          </div>

          <div className="px-3 pb-2.5">
            <div className="min-h-12 relative mt-2">
                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.div
                                    key={currentStep}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                  transition={{ x: { type: "spring", stiffness: 400, damping: 30 }, opacity: { duration: 0.18 } }}
                  className="space-y-2"
                >
                  <div>
                    <h3 className="text-sm font-medium text-foreground leading-snug">{currentQuestion.label}</h3>
                  </div>

                  <RadioGroup className="grid grid-cols-1 gap-1.5" value={selectedValue} onValueChange={handleAnswerChange}>
                    {currentQuestion.options.map(option => (
                      <div key={option} className="relative">
                        <RadioGroupItem value={option} id={`${currentQuestion.id}-${option}`} className="peer sr-only" />
                        <Label htmlFor={`${currentQuestion.id}-${option}`} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm rounded-lg border border-border/20 bg-background/10 hover:bg-muted/10 peer-data-[state=checked]:border-foreground/60 peer-data-[state=checked]:bg-muted/10 cursor-pointer transition-colors">
                          <span className="truncate">{option}</span>
                        </Label>
                      </div>
                    ))}

                    <div className="relative">
                      <RadioGroupItem value={CUSTOM_OPTION_VALUE} id={`${currentQuestion.id}-${CUSTOM_OPTION_VALUE}`} className="peer sr-only" />
                      <Label htmlFor={`${currentQuestion.id}-${CUSTOM_OPTION_VALUE}`} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm rounded-lg border border-border/20 bg-background/10 hover:bg-muted/10 peer-data-[state=checked]:border-foreground/60 peer-data-[state=checked]:bg-muted/10 cursor-pointer transition-colors">
                        <span className="truncate">Other (type)</span>
                      </Label>

                      {selectedValue === CUSTOM_OPTION_VALUE && (
                        <Textarea
                          value={customByQuestionId[currentQuestion.id] ?? (answers[currentQuestion.id] || "")}
                          onChange={(e) => handleCustomChange(currentQuestion.id, e)}
                          placeholder="Type a short answer…"
                          className="mt-1.5 min-h-10 py-1.5 resize-none bg-background/20 text-sm"
                        />
                      )}
                    </div>
                  </RadioGroup>
                                </motion.div>
                            </AnimatePresence>
                        </div>

            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" className="h-8 px-2 rounded-lg text-sm border-border/40" onClick={prevStep} disabled={isFirstStep || isGenerating}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={onSkip} disabled={isGenerating || !isHalfComplete} title={isHalfComplete ? undefined : `Answer at least ${Math.ceil(questions.length * 0.5)} questions to skip`}>
                Skip
              </Button>
              <div className="flex-1" />
              {!isLastStep ? (
                <Button className="h-8 px-4 rounded-lg text-sm font-semibold" onClick={nextStep} disabled={!answers[currentQuestion.id]}>
                  Next
                </Button>
              ) : (
                <Button className="h-8 px-4 rounded-lg text-sm font-semibold" onClick={onConfirm} disabled={isGenerating || !isComplete}>
                  Start
                </Button>
              )}
            </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
