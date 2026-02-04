"use client"

import { motion } from "framer-motion"
import { Sparkles, ArrowRight, SkipForward } from "lucide-react"
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
    const isComplete = questions.every(q => !!answers[q.id])

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <Card className="border-border/50 shadow-2xl bg-card/95 backdrop-blur-2xl overflow-hidden rounded-4xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-purple-500 to-cyan-500" />

                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                            <Sparkles className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Refining Your Vision</CardTitle>
                        <CardDescription className="text-sm">
                            Our AI architect needs a few more details to create a perfectly tailored architecture.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                        <div className="space-y-8 max-h-[60vh] overflow-y-auto px-1 py-1 custom-scrollbar">
                            {questions.map((question, qIdx) => (
                                <div key={question.id} className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-bold shrink-0 mt-0.5">
                                            {qIdx + 1}
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground leading-tight">
                                            {question.label}
                                        </h3>
                                    </div>

                                    <RadioGroup
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9"
                                        value={answers[question.id]}
                                        onValueChange={(val) => onAnswerChange(question.id, val)}
                                    >
                                        {question.options.map((option) => (
                                            <div key={option} className="relative">
                                                <RadioGroupItem
                                                    value={option}
                                                    id={`${question.id}-${option}`}
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor={`${question.id}-${option}`}
                                                    className="flex items-center justify-center p-3 text-xs font-medium rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 peer-data-[state=checked]:border-blue-500/50 peer-data-[state=checked]:bg-blue-500/5 peer-data-[state=checked]:text-blue-600 cursor-pointer transition-all"
                                                >
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between gap-4 mt-10">
                            <Button
                                variant="ghost"
                                size="lg"
                                className="h-12 px-6 rounded-xl text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group"
                                onClick={onSkip}
                                disabled={isGenerating}
                            >
                                <SkipForward className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Skip & Build</span>
                            </Button>

                            <Button
                                size="lg"
                                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2 group disabled:opacity-50"
                                onClick={onConfirm}
                                disabled={isGenerating || !isComplete}
                            >
                                <span className="text-[11px] font-bold uppercase tracking-widest">Start Generation</span>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
