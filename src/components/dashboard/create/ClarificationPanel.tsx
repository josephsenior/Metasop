"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, SkipForward } from "lucide-react"
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

    const isComplete = questions.every(q => !!answers[q.id])
    const answeredCount = questions.filter(q => !!answers[q.id]).length
    const completionPercent = Math.round((answeredCount / questions.length) * 100)
    const isHalfComplete = answeredCount >= Math.ceil(questions.length * 0.5)

    const currentQuestion = questions[currentStep]
    const isLastStep = currentStep === questions.length - 1
    const isFirstStep = currentStep === 0

    const selectedValue = (() => {
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
        if (val === CUSTOM_OPTION_VALUE) {
            const existing = customByQuestionId[currentQuestion.id] ?? ""
            if (existing.trim().length > 0) onAnswerChange(currentQuestion.id, existing)
            return
        }

        onAnswerChange(currentQuestion.id, val)
        // Optional: auto-advance with a slight delay
        /*
        setTimeout(() => {
            if (!isLastStep) nextStep()
        }, 400)
        */
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    }

    return (
        <div className="fixed left-0 right-0 bottom-6 z-50 flex items-end justify-center p-4 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                className="w-full max-w-md pointer-events-auto"
            >
                <div className="border border-border/40 bg-background/85 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-sm font-semibold tracking-tight text-foreground">Refine details</h2>
                            <div className="text-xs text-muted-foreground">{currentStep + 1}/{questions.length}</div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Quick choices to improve the first draft.</p>

                        <div className="mt-3 h-1 bg-muted/20 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-foreground/60" initial={{ width: 0 }} animate={{ width: `${completionPercent}%` }} transition={{ duration: 0.25 }} />
                        </div>
                    </div>

                    <div className="px-4 pb-4">
                        <div className="min-h-[120px] relative">
                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.div
                                    key={currentStep}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 400, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-medium text-foreground leading-snug">
                                            {currentQuestion.label}
                                        </h3>

                                        <RadioGroup
                                            className="grid grid-cols-1 gap-2"
                                            value={selectedValue}
                                            onValueChange={handleAnswerChange}
                                        >
                                            {currentQuestion.options.map((option) => (
                                                <div key={option} className="relative">
                                                    <RadioGroupItem
                                                        value={option}
                                                        id={`${currentQuestion.id}-${option}`}
                                                        className="peer sr-only"
                                                    />
                                                    <Label
                                                        htmlFor={`${currentQuestion.id}-${option}`}
                                                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg border border-border/40 bg-background/30 hover:bg-muted/20 peer-data-[state=checked]:border-foreground/60 peer-data-[state=checked]:bg-muted/10 cursor-pointer transition-colors"
                                                    >
                                                        <span className="truncate">{option}</span>
                                                        <span className="text-xs text-muted-foreground">Select</span>
                                                    </Label>
                                                </div>
                                            ))}

                                            <div className="relative">
                                                <RadioGroupItem
                                                    value={CUSTOM_OPTION_VALUE}
                                                    id={`${currentQuestion.id}-${CUSTOM_OPTION_VALUE}`}
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor={`${currentQuestion.id}-${CUSTOM_OPTION_VALUE}`}
                                                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg border border-border/40 bg-background/30 hover:bg-muted/20 peer-data-[state=checked]:border-foreground/60 peer-data-[state=checked]:bg-muted/10 cursor-pointer transition-colors"
                                                >
                                                    <span className="truncate">Other (type your own)</span>
                                                    <span className="text-xs text-muted-foreground">Type</span>
                                                </Label>
                                            </div>
                                        </RadioGroup>

                                        {selectedValue === CUSTOM_OPTION_VALUE && (
                                            <div className="mt-2">
                                                <Textarea
                                                    value={customByQuestionId[currentQuestion.id] ?? (answers[currentQuestion.id] || "")}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setCustomByQuestionId((prev) => ({ ...prev, [currentQuestion.id]: value }))
                                                        onAnswerChange(currentQuestion.id, value)
                                                    }}
                                                    placeholder="Type a short answer…"
                                                    className="min-h-[70px] resize-none bg-background/30 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center gap-3 mt-3">
                            <Button variant="outline" className="h-9 px-3 rounded-lg text-sm" onClick={prevStep} disabled={isFirstStep || isGenerating}><ArrowLeft className="h-3.5 w-3.5" /></Button>
                            <div className="flex-1" />
                            {!isLastStep ? (
                                <Button className="h-9 px-3 rounded-lg text-sm" onClick={nextStep} disabled={!answers[currentQuestion.id]}>Next</Button>
                            ) : (
                                <Button className="h-9 px-3 rounded-lg text-sm" onClick={onConfirm} disabled={isGenerating || !isComplete}>Start</Button>
                            )}
                            <Button variant="ghost" className="h-9 px-3 text-xs" onClick={onSkip} disabled={isGenerating || !isHalfComplete} title={!isHalfComplete ? `Answer at least ${Math.ceil(questions.length * 0.5)} questions to skip` : undefined}>Skip</Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
