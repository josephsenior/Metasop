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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/55 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="border border-border/50 bg-background/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <div className="px-6 pt-6 pb-4">
                        <div className="flex items-baseline justify-between gap-4">
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">Refine details</h2>
                            <div className="text-xs text-muted-foreground">
                                {currentStep + 1}/{questions.length}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Quick choices help generate a better first draft.
                        </p>

                        <div className="mt-4 h-1 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-foreground/70"
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercent}%` }}
                                transition={{ duration: 0.35, ease: "circOut" }}
                            />
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="min-h-[190px] relative">
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
                                        <h3 className="text-base font-semibold text-foreground leading-snug">
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
                                                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium rounded-xl border border-border/50 bg-background/40 hover:bg-muted/30 peer-data-[state=checked]:border-foreground/60 peer-data-[state=checked]:bg-muted/20 cursor-pointer transition-colors"
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
                                                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium rounded-xl border border-border/50 bg-background/40 hover:bg-muted/30 peer-data-[state=checked]:border-foreground/60 peer-data-[state=checked]:bg-muted/20 cursor-pointer transition-colors"
                                                >
                                                    <span className="truncate">Other (type your own)</span>
                                                    <span className="text-xs text-muted-foreground">Type</span>
                                                </Label>
                                            </div>
                                        </RadioGroup>

                                        {selectedValue === CUSTOM_OPTION_VALUE && (
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Your answer
                                                </Label>
                                                <Textarea
                                                    value={customByQuestionId[currentQuestion.id] ?? (answers[currentQuestion.id] || "")}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setCustomByQuestionId((prev) => ({ ...prev, [currentQuestion.id]: value }))
                                                        onAnswerChange(currentQuestion.id, value)
                                                    }}
                                                    placeholder="Type a short answer…"
                                                    className="min-h-[90px] resize-none bg-background/40"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex flex-col gap-3 mt-6">
                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    variant="outline"
                                    className="h-10 px-4 rounded-xl border-border/50 bg-background/40 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors flex items-center gap-2"
                                    onClick={prevStep}
                                    disabled={isFirstStep || isGenerating}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="text-xs font-semibold">Back</span>
                                </Button>

                                {!isLastStep ? (
                                    <Button
                                        className="h-10 px-5 rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-2 group"
                                        onClick={nextStep}
                                        disabled={!answers[currentQuestion.id]}
                                    >
                                        <span className="text-xs font-semibold">Next</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                ) : (
                                    <Button
                                        className="h-10 px-5 rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-2 group disabled:opacity-50"
                                        onClick={onConfirm}
                                        disabled={isGenerating || !isComplete}
                                    >
                                        <span className="text-xs font-semibold">Start</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex justify-center pt-1">
                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground/70 hover:text-foreground text-xs font-semibold gap-2 py-0 h-auto opacity-80 hover:opacity-100 transition-opacity"
                                    onClick={onSkip}
                                    disabled={isGenerating || !isHalfComplete}
                                    title={!isHalfComplete ? `Answer at least ${Math.ceil(questions.length * 0.5)} questions to skip` : undefined}
                                >
                                    <SkipForward className="h-3 w-3" />
                                    Skip & Start with Defaults
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
