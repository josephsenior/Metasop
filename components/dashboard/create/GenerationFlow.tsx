"use client"

import { motion } from "framer-motion"
import {
    User,
    Layers,
    Server,
    Shield,
    Code,
    Palette,
    CheckCircle2,
    Loader2,
    CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { GenerationStep } from "@/hooks/use-diagram-generation"

interface GenerationFlowProps {
    steps: GenerationStep[]
    summaries: Record<string, string>
}

const W = 320
const H = 340
const GRID_X = [50, 160, 270]
const GRID_Y = [50, 170, 290]

const AGENTS_CONFIG = [
    { id: "pm_spec", col: 0, row: 0, icon: User, color: "text-purple-400", bg: "bg-purple-500/10" },
    { id: "arch_design", col: 1, row: 0, icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10" },
    { id: "devops_infrastructure", col: 2, row: 0, icon: Server, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: "security_architecture", col: 2, row: 1, icon: Shield, color: "text-red-400", bg: "bg-red-500/10" },
    { id: "engineer_impl", col: 1, row: 1, icon: Code, color: "text-orange-400", bg: "bg-orange-500/10" },
    { id: "ui_design", col: 0, row: 1, icon: Palette, color: "text-pink-400", bg: "bg-pink-500/10" },
    { id: "qa_verification", col: 0, row: 2, icon: CheckCircle2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
].map(a => ({
    ...a,
    x: GRID_X[a.col],
    y: GRID_Y[a.row]
}))

export function GenerationFlow({ steps, summaries }: GenerationFlowProps) {
    const bend = 60
    const p = AGENTS_CONFIG
    const path = `
        M ${p[0].x} ${p[0].y}
        L ${p[1].x} ${p[1].y}
        L ${p[2].x} ${p[2].y}
        C ${p[2].x + bend} ${p[2].y}, ${p[3].x + bend} ${p[3].y}, ${p[3].x} ${p[3].y}
        L ${p[4].x} ${p[4].y}
        L ${p[5].x} ${p[5].y}
        C ${p[5].x - bend} ${p[5].y}, ${p[6].x - bend} ${p[6].y}, ${p[6].x} ${p[6].y}
    `

    return (
        <div className="relative w-full max-w-sm mx-auto aspect-square py-12 select-none h-full flex items-center justify-center">
            <div className="relative overflow-visible" style={{ width: W, height: H }}>

                {/* Connection Layer */}
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 pointer-events-none overflow-visible z-10">
                    <defs>
                        <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                    </defs>
                    <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-border/30" strokeLinecap="round" />

                    {steps.some(s => s.status === 'running') && (
                        <motion.path
                            d={path}
                            fill="none"
                            stroke="url(#flow-grad)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="4, 16"
                            animate={{ strokeDashoffset: [-40, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </svg>

                {/* Nodes Layer */}
                {AGENTS_CONFIG.map((node, i) => {
                    const Icon = node.icon
                    const stepStatus = steps.find(s => s.step_id === node.id)?.status || 'pending'
                    const summary = summaries[node.id]

                    return (
                        <div
                            key={node.id}
                            className="absolute z-20"
                            style={{
                                left: node.x,
                                top: node.y,
                                width: 0,
                                height: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative flex flex-col items-center"
                            >
                                <div className={cn(
                                    "relative w-14 h-14 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all duration-500",
                                    stepStatus === 'running' ? "ring-2 ring-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]" :
                                        stepStatus === 'success' ? "bg-green-500/10 shadow-sm" :
                                            "bg-muted/30 border border-white/5"
                                )}>
                                    <Icon className={cn(
                                        "h-7 w-7 transition-colors duration-500",
                                        stepStatus === 'running' ? "text-blue-500" :
                                            stepStatus === 'success' ? "text-green-500" :
                                                "text-muted-foreground/40"
                                    )} />

                                    {/* Status Indicators */}
                                    <div className="absolute -top-1 -right-1">
                                        {stepStatus === 'running' ? (
                                            <div className="bg-blue-600 rounded-full p-1 shadow-lg">
                                                <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
                                            </div>
                                        ) : stepStatus === 'success' ? (
                                            <div className="bg-green-500 rounded-full p-1 shadow-lg">
                                                <CheckCircle className="h-2.5 w-2.5 text-white" />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Label & Summary */}
                                <div className="absolute -bottom-10 w-40 text-center pointer-events-none">
                                    <span className={cn(
                                        "text-[9px] font-black tracking-tighter uppercase block",
                                        stepStatus === 'running' ? "text-blue-500" :
                                            stepStatus === 'success' ? "text-green-500" :
                                                "text-muted-foreground/40"
                                    )}>
                                        {node.id.split('_').join(' ')}
                                    </span>
                                    {summary && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[8px] font-medium text-muted-foreground/60 leading-tight block mt-0.5 line-clamp-2 italic"
                                        >
                                            {summary}
                                        </motion.span>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
