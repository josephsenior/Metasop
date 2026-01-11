"use client"

import { motion } from "framer-motion"
import { User, Layers, Server, Shield, Code, Palette, CheckCircle2 } from "lucide-react"

/**
 * ABSOLUTE COORDINATE ENGINE
 * Unit: pixels
 */
const W = 320
const H = 340
const GRID_X = [50, 160, 270] // col 0, 1, 2
const GRID_Y = [50, 170, 290] // row 0, 1, 2

const agents = [
    { id: "PM", col: 0, row: 0, icon: User, color: "text-purple-400", bg: "bg-purple-500/10" },
    { id: "ARCH", col: 1, row: 0, icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10" },
    { id: "DEVOPS", col: 2, row: 0, icon: Server, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: "SECURITY", col: 2, row: 1, icon: Shield, color: "text-red-400", bg: "bg-red-500/10" },
    { id: "ENGINEER", col: 1, row: 1, icon: Code, color: "text-orange-400", bg: "bg-orange-500/10" },
    { id: "UI", col: 0, row: 1, icon: Palette, color: "text-pink-400", bg: "bg-pink-500/10" },
    { id: "QA", col: 0, row: 2, icon: CheckCircle2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
].map(a => ({
    ...a,
    x: GRID_X[a.col],
    y: GRID_Y[a.row]
}))

export function HeroAgentDiagram() {
    // Generate the path programmatically
    const p = agents
    const bend = 60
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
        <div className="relative w-full h-[360px] flex items-center justify-center py-4 select-none">
            {/* Container with fixed size */}
            <div className="relative overflow-visible" style={{ width: W, height: H }}>

                {/* Alignment Grid Overlay (For Debugging & Aesthetic) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    {GRID_Y.map(y => (
                        GRID_X.map(x => (
                            <div
                                key={`${x}-${y}`}
                                className="absolute w-1 h-1 bg-white rounded-full"
                                style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                            />
                        ))
                    ))}
                </div>

                {/* Connection Layer */}
                <svg
                    width={W}
                    height={H}
                    viewBox={`0 0 ${W} ${H}`}
                    className="absolute inset-0 pointer-events-none overflow-visible z-10"
                >
                    <defs>
                        <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#22d3ee" />
                        </linearGradient>
                        <filter id="neon-blur">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Trace Path */}
                    <path d={path} fill="none" stroke="white" strokeWidth="2.5" strokeOpacity="0.05" strokeLinecap="round" />

                    {/* Animated Main Line */}
                    <motion.path
                        d={path}
                        fill="none"
                        stroke="url(#flow-grad)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="4, 16"
                        animate={{ strokeDashoffset: [-40, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        filter="url(#neon-blur)"
                    />

                    {/* Travelling Pulse */}
                    <motion.path
                        d={path}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                        strokeLinecap="round"
                        initial={{ pathOffset: 0, pathLength: 0.1 }}
                        animate={{ pathOffset: 1 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                </svg>

                {/* Nodes Layer */}
                {agents.map((node, i) => {
                    const Icon = node.icon

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
                                {/* Node Box */}
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className={`w-14 h-14 rounded-2xl ${node.bg} border-2 border-white/10 backdrop-blur-2xl flex items-center justify-center shadow-2xl cursor-pointer relative overflow-hidden`}
                                >
                                    <Icon className={`h-7 w-7 ${node.color}`} />
                                    <motion.div
                                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                                        className={`absolute inset-0 bg-linear-to-br from-${node.color.split('-')[1]}-500/20 to-transparent`}
                                    />
                                </motion.div>

                                {/* Label */}
                                <div className="absolute -bottom-8 w-24 text-center">
                                    <span className="text-[10px] font-black tracking-tight text-foreground uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                                        {node.id}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
