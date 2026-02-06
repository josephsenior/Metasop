"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowRight, ArrowLeft, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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

    const isComplete = questions.every(q => !!answers[q.id])
    const answeredCount = questions.filter(q => !!answers[q.id]).length
    const completionPercent = Math.round((answeredCount / questions.length) * 100)
    const isHalfComplete = answeredCount >= Math.ceil(questions.length * 0.5)

    const currentQuestion = questions[currentStep]
    const isLastStep = currentStep === questions.length - 1
    const isFirstStep = currentStep === 0

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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-xl"
            >
                <Card className="border-border/50 shadow-2xl bg-card/95 backdrop-blur-2xl overflow-hidden rounded-4xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-purple-500 to-cyan-500" />

                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                            <Sparkles className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Refining Your Vision</CardTitle>
                        <CardDescription className="text-sm px-4">
                            Based on your request, we need clarification on {questions.length} key areas to generate the most accurate architecture. This typically takes 30 seconds.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                        {/* Progress Indicator */}
                        <div className="mb-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                    Question {currentStep + 1} of {questions.length}
                                </span>
                                <span className="text-[10px] font-bold text-blue-600/80">
                                    {completionPercent}% Complete
                                </span>
                            </div>
                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-linear-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercent}%` }}
                                    transition={{ duration: 0.5, ease: "circOut" }}
                                />
                            </div>
                        </div>

                        <div className="min-h-[220px] relative">
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
                                        <h3 className="text-lg font-semibold text-foreground leading-tight text-center">
                                            {currentQuestion.label}
                                        </h3>

                                        <RadioGroup
                                            className="grid grid-cols-1 gap-3 max-w-sm mx-auto"
                                            value={answers[currentQuestion.id]}
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
                                                        className="flex items-center justify-center p-4 text-sm font-medium rounded-2xl border border-border/50 bg-background/50 hover:bg-muted/50 peer-data-[state=checked]:border-blue-500/50 peer-data-[state=checked]:bg-blue-500/5 peer-data-[state=checked]:text-blue-600 cursor-pointer transition-all text-center shadow-sm"
                                                    >
                                                        {option}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex flex-col gap-4 mt-12">
                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 px-6 rounded-xl border-border/50 bg-background/50 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all flex items-center gap-2"
                                    onClick={prevStep}
                                    disabled={isFirstStep || isGenerating}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                                </Button>

                                {!isLastStep ? (
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 rounded-xl bg-foreground text-background hover:opacity-90 transition-all flex items-center gap-2 group"
                                        onClick={nextStep}
                                        disabled={!answers[currentQuestion.id]}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Next</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2 group disabled:opacity-50"
                                        onClick={onConfirm}
                                        disabled={isGenerating || !isComplete}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Start Generation</span>
                                        <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground/60 hover:text-foreground text-[10px] font-bold uppercase tracking-widest gap-2 py-0 h-auto opacity-70 hover:opacity-100 transition-opacity"
                                    onClick={onSkip}
                                    disabled={isGenerating || !isHalfComplete}
                                    title={!isHalfComplete ? `Answer at least ${Math.ceil(questions.length * 0.5)} questions to skip` : undefined}
                                >
                                    <SkipForward className="h-3 w-3" />
                                    Skip & Start with Defaults
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
