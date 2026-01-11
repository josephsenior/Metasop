import React, { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    FileCode, Folder, Database, ShieldAlert,
    CheckCircle2, ListTodo, Server, Network, Layers, Box, Terminal,
    Cloud, Palette, Component, Shield,
    Maximize2, Minimize2, Globe, Cpu, Zap, Layout, Activity, Code2, ScrollText,
    ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// Types
// ============================================================================

interface ArtifactNodeData {
    title: string
    label: string
    description?: string
    // Determines the visual mode
    artifactType?: string
    type?: string // Consolidated type field
    defaultExpanded?: boolean
    // Data payloads for various artifact types
    items?: any[]
    content?: any
    // Fallback for legacy data/direct assignment
    nodeCategory?: string
    // Specific artifact fields
    user_stories?: any[]
    database_schema?: any
    database_tables?: any[]
    apis?: any[]
    file_structure?: any
    threat_model?: any[]
    infrastructure?: any[]
    test_results?: any[]
    design_system?: any[]
    components?: any[]
}

// ============================================================================
// Premium Components (Rich Views)
// ============================================================================

/**
 * 1. User Stories (Product Manager)
 * Visual: Jira/Linear-style Ticket List
 */
export const StoryList = ({ items }: { items: any[] }) => (
    <div className="space-y-2">
        {items.map((item, i) => {
            const title = typeof item === 'string' ? item : item.title || item.story;
            const priority = typeof item === 'object' ? item.priority : null;
            const id = typeof item === 'object' ? item.id : null;
            const complex = typeof item === 'object' ? (item.story_points || item.complexity) : null;

            return (
                <div key={i} className="group relative bg-white border border-slate-100 p-2.5 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 hover:border-amber-200">
                    <div className="flex items-start gap-2.5">
                        {priority && (
                            <div className={cn(
                                "w-1 h-8 rounded-full",
                                priority.toLowerCase() === 'high' || priority.toLowerCase() === 'critical' ? "bg-red-400" :
                                    priority.toLowerCase() === 'low' ? "bg-slate-300" : "bg-amber-400"
                            )} />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                {id && <span className="text-[9px] font-black text-slate-400 tracking-tighter">{id}</span>}
                                {complex && <span className="text-[8px] font-mono text-slate-500 font-bold uppercase">Points: {complex}</span>}
                            </div>
                            <div className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-slate-900">
                                {title}
                            </div>
                        </div>
                    </div>
                </div>
            )
        })}
    </div>
)

export const PMSpecView = ({ data }: { data: any }) => {
    const stories = data.user_stories || data.items || [];
    const swot = data.swot;
    const stakeholders = data.stakeholders;

    return (
        <div className="space-y-6 min-w-[280px]">
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <ListTodo className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Stories</span>
                </div>
                <StoryList items={stories} />
            </div>

            {swot && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Activity className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SWOT Analysis</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(swot).map(([key, items]: [string, any]) => (
                            <div key={key} className="bg-white/50 p-2 rounded-xl border border-slate-100">
                                <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">{key}</span>
                                <ul className="space-y-1">
                                    {(items || []).map((item: string, i: number) => (
                                        <li key={i} className="text-[9px] text-slate-600 leading-tight flex gap-1">
                                            <span className="text-amber-400">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {stakeholders && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                        <Globe className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholders</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                        {stakeholders.map((sh: any, i: number) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-100 rounded-xl">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-700">{sh.role}</span>
                                    <span className="text-[8px] text-slate-400 italic">{sh.interest}</span>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "text-[7px] font-black uppercase px-1.5 py-0",
                                    sh.influence === 'high' ? "border-red-200 text-red-500" :
                                        sh.influence === 'medium' ? "border-amber-200 text-amber-500" : "border-slate-200 text-slate-400"
                                )}>
                                    {sh.influence}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * 2. Database Schema (Architect)
 * Visual: Mini-ERD (Entity Cards)
 */
export const SchemaView = ({ data }: { data: any }) => {
    const tables = data.tables || data.database_schema?.tables || data.items || [];

    if (tables.length === 0) return (
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            <Database className="w-8 h-8 text-slate-300 mb-2 opacity-50" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Schema Defined</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 gap-4 min-w-[280px]">
            {tables.map((table: any, i: number) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm hover:border-purple-200 hover:shadow-md transition-all group">
                    {/* Table Header */}
                    <div className="bg-purple-50/50 px-4 py-2.5 border-b border-purple-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-purple-500" />
                            <span className="text-[11px] font-black text-slate-800 font-mono tracking-tighter uppercase">{table.name}</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
                        </div>
                    </div>
                    {/* Columns */}
                    <div className="p-2 space-y-0.5">
                        {(table.columns || []).slice(0, 8).map((col: any, j: number) => {
                            const colName = typeof col === 'string' ? col : col.name;
                            const colType = typeof col === 'object' ? col.type : '';
                            const isPK = colName === 'id' || colName.endsWith('_id');
                            return (
                                <div key={j} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-[10px] font-mono group/col">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", isPK ? "bg-amber-400" : "bg-slate-200")} />
                                        <span className={cn("font-bold", isPK ? "text-slate-900" : "text-slate-600")}>{colName}</span>
                                    </div>
                                    {colType && <span className="text-slate-400 font-black uppercase text-[8px] tracking-tighter">{colType}</span>}
                                </div>
                            )
                        })}
                        {(table.columns || []).length > 8 && (
                            <div className="px-3 py-1 text-[9px] text-slate-400 font-bold italic border-t border-slate-50 mt-1">
                                + {(table.columns?.length || 0) - 8} more attributes...
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * 3. File Structure (Engineer)
 * Visual: VS Code-style File Tree
 */
export const FileTree = ({ data }: { data: any }) => {
    const renderNode = (node: any, depth = 0) => {
        if (!node) return null;
        if (typeof node === 'string') {
            return (
                <div key={node} className="flex items-center gap-2 py-0.5 hover:bg-white/5 rounded px-2 text-zinc-400" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
                    {node.endsWith('/') ? <Folder className="w-3 h-3 text-blue-400" /> : <FileCode className="w-3 h-3 text-zinc-500" />}
                    <span className="text-[10px] font-mono truncate">{node.replace(/\/$/, '')}</span>
                </div>
            )
        }

        const isDir = node.type === 'directory' || (node.children && node.children.length > 0);
        return (
            <div key={node.name} className="space-y-0.5">
                <div className="flex items-center gap-2 py-0.5 hover:bg-white/5 rounded px-2 text-zinc-300 group cursor-default" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
                    {isDir ?
                        <Folder className="w-3 h-3 text-emerald-400 fill-emerald-400/10" /> :
                        <FileCode className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400" />
                    }
                    <span className="text-[10px] font-mono font-medium truncate group-hover:text-white">{node.name}</span>
                </div>
                {node.children && node.children.map((child: any) => renderNode(child, depth + 1))}
            </div>
        );
    };

    const root = data.file_structure || data;
    const items = Array.isArray(root) ? root : (root.children || (root.name ? [root] : []));

    return (
        <div className="bg-zinc-950/50 rounded-lg p-2 min-h-[140px] max-h-[300px] overflow-y-auto custom-scrollbar border border-zinc-800 shadow-inner">
            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 px-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                Workspace
            </div>
            <div className="space-y-0.5">
                {items.length > 0 ? items.map((item: any) => renderNode(item)) : <span className="text-[10px] text-zinc-700 italic p-2">No files structure defined</span>}
            </div>
        </div>
    )
}

/**
 * 4. Threat Radar (Security)
 * Visual: Security Cards with Severity
 */
export const ThreatRadar = ({ items }: { items: any[] }) => (
    <div className="space-y-2 min-w-[280px]">
        {items.map((item, i) => {
            const threatName = typeof item === 'string' ? item : item.threat || item.vulnerability;
            const severity = typeof item === 'object' ? item.severity : null;
            const mitigation = typeof item === 'object' ? (item.mitigation || item.remediation) : null;

            const colorClass =
                severity === 'Critical' || severity === 'critical' ? 'bg-red-500 text-white' :
                    severity === 'High' || severity === 'high' ? 'bg-orange-500 text-white' :
                        severity === 'Medium' || severity === 'medium' ? 'bg-yellow-400 text-black' :
                            'bg-slate-200 text-slate-600';

            return (
                <div key={i} className="bg-white border-2 border-slate-100 rounded-xl overflow-hidden shadow-sm hover:border-red-200 transition-all group">
                    <div className="flex">
                        <div className={cn("w-1.5 self-stretch", colorClass.split(' ')[0])} />
                        <div className="p-3 flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-800 truncate pr-2">{threatName}</span>
                                {severity && (
                                    <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase", colorClass)}>
                                        {severity}
                                    </span>
                                )}
                            </div>
                            {mitigation && (
                                <p className="text-[9px] text-slate-500 leading-tight italic">
                                    <span className="font-black text-slate-400 not-italic mr-1">FIX:</span>
                                    {mitigation}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}
    </div>
)

/**
 * 5. Infrastructure Grid (DevOps)
 * Visual: Grid of Cloud Resources
 */
export const InfraGrid = ({ items }: { items: any[] }) => (
    <div className="grid grid-cols-2 gap-2 min-w-[260px]">
        {items.map((item, i) => {
            const name = typeof item === 'string' ? item : item.name;
            const type = typeof item === 'object' ? item.type : null;
            return (
                <div key={i} className="bg-white border border-sky-100 p-2 rounded-xl flex items-center gap-2.5 shadow-sm hover:shadow-md transition-all hover:border-sky-300 group">
                    <div className="p-1.5 bg-sky-50 rounded-lg group-hover:bg-sky-100 transition-colors">
                        <Cloud className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-slate-700 truncate">
                            {name}
                        </span>
                        {type && <span className="text-[8px] text-sky-500 font-mono font-bold uppercase -mt-0.5 tracking-tighter">{type}</span>}
                    </div>
                </div>
            )
        })}
    </div>
)

/**
 * 6. Test Report (QA)
 * Visual: Pass/Fail Checklist
 */
export const TestReport = ({ data }: { data: any }) => {
    // Priority: 1. report (detailed), 2. test_cases (definitions), 3. legacy fields
    const items = data.report || data.test_cases || data.items || data.test_results || [];
    const summary = data.summary;

    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] min-w-[260px]">
            <div className="bg-indigo-50/50 px-4 py-2.5 border-b border-indigo-100/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Test Suite</span>
                </div>
                {summary && <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">{summary}</span>}
            </div>
            <div className="p-1 space-y-0.5">
                {items.map((item: any, i: number) => {
                    const name = typeof item === 'string' ? item : (item.title || item.name || item.test);
                    // Handle both test cases (priority/type) and results (status)
                    const status = typeof item === 'object' ? (item.status || item.priority || item.type) : null;

                    return (
                        <div key={i} className="px-3 py-2 flex items-center justify-between rounded-lg hover:bg-slate-50 transition-colors group">
                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900">{name}</span>
                            {status && (
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                                    status === 'pass' || status === 'passed' ? "bg-emerald-100 text-emerald-600" :
                                    status === 'warning' ? "bg-amber-100 text-amber-600" :
                                    status === 'fail' || status === 'failed' ? "bg-red-100 text-red-600" :
                                    "bg-indigo-100 text-indigo-600"
                                )}>
                                    {status}
                                </div>
                            )}
                        </div>
                    )
                })}
                {items.length === 0 && (
                    <div className="p-4 text-center">
                        <span className="text-[10px] text-slate-400 italic">No test cases defined</span>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * 7. Design Specs (UI)
 * Visual: Color Palette & Components
 */
export const DesignSpecs = ({ data }: { data: any }) => {
    const tokens = data.design_tokens || {};
    const colors = tokens.colors || {};
    const items = data.items || data.components || [];

    const palette = [
        colors.primary,
        colors.secondary,
        colors.accent,
        colors.background,
    ].filter(Boolean);

    const borderRadius = tokens.borderRadius || {};
    const shadows = tokens.shadows || {};

    return (
        <div className="space-y-4 min-w-[260px]">
            {palette.length > 0 && (
                <div className="bg-white/50 p-3 rounded-2xl border border-pink-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Palette</span>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-200" />
                        </div>
                    </div>
                    <div className="flex gap-2 px-1">
                        {palette.map((color, i) => (
                            <div key={i} className="group relative">
                                <div className="w-8 h-8 rounded-full border-2 border-white shadow-md ring-1 ring-slate-100 transition-transform group-hover:scale-110" style={{ backgroundColor: color }} />
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{color}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(Object.keys(borderRadius).length > 0 || Object.keys(shadows).length > 0) && (
                <div className="bg-pink-50/30 p-2.5 rounded-xl border border-pink-100/50 space-y-2">
                    {Object.keys(borderRadius).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(borderRadius).map(([, v]: [string, any], i) => (
                                <Badge key={i} variant="outline" className="text-[7px] font-mono bg-white/80 border-pink-200/50 text-pink-600">R:{v}</Badge>
                            ))}
                        </div>
                    )}
                    {Object.keys(shadows).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {Object.keys(shadows).map((k, i) => (
                                <Badge key={i} variant="outline" className="text-[7px] font-mono bg-white/80 border-pink-200/50 text-pink-600">S:{k}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-1.5">
                {items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-100 rounded-xl hover:border-pink-200 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-2">
                            <Component className="w-3.5 h-3.5 text-pink-400" />
                            <span className="text-[10px] font-bold text-slate-700">{typeof item === 'string' ? item : item.name || item.component}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-pink-400 transition-colors" />
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * 8. API Grid (Architect/Engineer)
 */
export const APIGrid = ({ items }: { items: any[] }) => (
    <div className="space-y-2 min-w-[280px]">
        {items.map((api, i) => {
            const method = (api.method || api.verb || '').toUpperCase();
            const path = api.path || api.endpoint;
            const desc = api.description || api.summary;

            const methodColor =
                method === 'GET' ? 'bg-blue-500 text-white' :
                    method === 'POST' ? 'bg-emerald-500 text-white' :
                        method === 'PUT' ? 'bg-amber-500 text-white' :
                            method === 'DELETE' ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white';

            return (
                <div key={i} className="bg-white border-2 border-slate-50 rounded-xl overflow-hidden shadow-sm hover:border-cyan-200 hover:shadow-md transition-all group">
                    <div className="p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase", methodColor)}>{method}</span>
                                {path && <code className="text-[10px] font-mono font-black text-slate-800 tracking-tighter truncate">{path}</code>}
                            </div>
                            {api.auth_required && <Shield className="w-3 h-3 text-amber-500" />}
                        </div>
                        {desc && <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">{desc}</p>}
                    </div>
                </div>
            )
        })}
    </div>
)

// ============================================================================
// Shell Styling Helper
// ============================================================================

const getShellStyle = (type: string) => {
    switch (type) {
        case 'engineer_impl':
        case 'file_structure':
        case 'file':
            return "bg-zinc-900 border-zinc-700 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)] ring-1 ring-zinc-800"
        case 'pm_spec':
        case 'user_stories':
        case 'user_story':
            return "bg-amber-50/20 border-amber-200 shadow-[0_4px_15px_-3px_rgba(251,191,36,0.1)] ring-1 ring-amber-100"
        case 'security_architecture':
        case 'threat_model':
        case 'threats':
            return "bg-red-50/10 border-red-200 shadow-[0_4px_15px_-3px_rgba(239,68,68,0.1)] ring-1 ring-red-100"
        case 'devops_infrastructure':
        case 'infrastructure':
            return "bg-sky-50/20 border-sky-200 shadow-[0_4px_15px_-3px_rgba(14,165,233,0.1)] ring-1 ring-sky-100"
        case 'arch_design':
        case 'system_design':
        case 'apis':
        case 'service':
        case 'api':
        case 'component':
            return "bg-blue-50/10 border-blue-200 shadow-[0_4px_15px_-3px_rgba(59,130,246,0.1)] ring-1 ring-blue-100"
        case 'ui_design':
        case 'design_system':
        case 'frontend':
        case 'browser':
            return "bg-pink-50/10 border-pink-200 shadow-[0_4px_15px_-3px_rgba(236,72,153,0.1)] ring-1 ring-pink-100"
        case 'qa_verification':
        case 'test_results':
        case 'tests':
            return "bg-indigo-50/10 border-indigo-200 shadow-[0_4px_15px_-3px_rgba(99,102,241,0.1)] ring-1 ring-indigo-100"
        case 'database':
        case 'database_schema':
        case 'cache':
            return "bg-purple-50/10 border-purple-200 shadow-[0_4px_15px_-3px_rgba(168,85,247,0.1)] ring-1 ring-purple-100"
        case 'gateway':
        case 'load_balancer':
            return "bg-cyan-50/10 border-cyan-200 shadow-[0_4px_15px_-3px_rgba(6,182,212,0.1)] ring-1 ring-cyan-100"
        case 'system':
        case 'environment':
            return "bg-emerald-50/10 border-emerald-200 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.1)] ring-1 ring-emerald-100"
        default:
            return "bg-white/90 border-slate-200 shadow-lg ring-1 ring-slate-100"
    }
}

// ============================================================================
// Main Layout
// ============================================================================

export default function ArtifactNode({ data, selected }: { data: any, selected?: boolean }) {
    const [isExpanded, setIsExpanded] = useState(data.defaultExpanded || false)
    const d = data as ArtifactNodeData
    const type = d.artifactType || d.label || d.type || 'generic'

    // Config for Container Style
    const config = {
        pm_spec: { icon: ListTodo, color: "text-amber-600", accent: "amber", title: "Product Spec" },
        user_stories: { icon: ListTodo, color: "text-amber-600", accent: "amber", title: "User Stories" },
        user_story: { icon: ScrollText, color: "text-amber-600", accent: "amber", title: "User Story" },

        arch_design: { icon: Layers, color: "text-blue-600", accent: "blue", title: "System Design" },
        system_design: { icon: Layers, color: "text-blue-600", accent: "blue", title: "Architecture" },

        database_schema: { icon: Database, color: "text-purple-600", accent: "purple", title: "Data Model" },
        schema: { icon: Database, color: "text-purple-600", accent: "purple", title: "Schema" },
        database: { icon: Database, color: "text-purple-600", accent: "purple", title: "Database" },
        cache: { icon: Zap, color: "text-purple-600", accent: "purple", title: "Cache Layer" },

        security_architecture: { icon: Shield, color: "text-red-600", accent: "red", title: "Security Blueprint" },
        threat_model: { icon: Shield, color: "text-red-600", accent: "red", title: "Threat Model" },
        threats: { icon: ShieldAlert, color: "text-red-600", accent: "red", title: "Threats" },

        devops_infrastructure: { icon: Server, color: "text-sky-600", accent: "sky", title: "Infra Blueprint" },
        infrastructure: { icon: Cloud, color: "text-sky-600", accent: "sky", title: "Infrastructure" },

        engineer_impl: { icon: Terminal, color: "text-emerald-500", accent: "emerald", title: "Implementation" },
        file_structure: { icon: Folder, color: "text-slate-600", accent: "slate", title: "Source Tree" },
        file: { icon: Code2, color: "text-emerald-500", accent: "emerald", title: "Source File" },

        ui_design: { icon: Palette, color: "text-pink-600", accent: "pink", title: "UI Components" },
        design_system: { icon: Palette, color: "text-pink-600", accent: "pink", title: "Design System" },
        frontend: { icon: Layout, color: "text-pink-600", accent: "pink", title: "Frontend" },
        browser: { icon: Globe, color: "text-pink-600", accent: "pink", title: "Browser Client" },

        qa_verification: { icon: CheckCircle2, color: "text-indigo-600", accent: "indigo", title: "Test Suite" },
        test_results: { icon: CheckCircle2, color: "text-indigo-600", accent: "indigo", title: "Test Results" },

        apis: { icon: Network, color: "text-cyan-600", accent: "cyan", title: "API Contract" },
        api: { icon: Network, color: "text-blue-600", accent: "blue", title: "API Service" },
        service: { icon: Server, color: "text-blue-600", accent: "blue", title: "Microservice" },
        component: { icon: Cpu, color: "text-blue-600", accent: "blue", title: "System Component" },
        gateway: { icon: Activity, color: "text-cyan-600", accent: "cyan", title: "Gateway" },
        load_balancer: { icon: Activity, color: "text-cyan-600", accent: "cyan", title: "Load Balancer" },

        system: { icon: Globe, color: "text-emerald-600", accent: "emerald", title: "System Node" },
        environment: { icon: Cloud, color: "text-emerald-600", accent: "emerald", title: "Cloud Env" },

        generic: { icon: Box, color: "text-slate-500", accent: "slate", title: d.label?.replace(/_/g, ' ') || d.title || 'Report' }
    }

    const mode = (config as any)[type] || config.generic
    const Icon = mode.icon
    const shellClass = getShellStyle(type)

    const infraItems =
        Array.isArray((d as any).infrastructure?.services) ? (d as any).infrastructure.services :
            Array.isArray((d as any).infrastructure) ? (d as any).infrastructure :
                []

    const items =
        Array.isArray((d as any).items) ? (d as any).items :
            Array.isArray((d as any).user_stories) ? (d as any).user_stories :
                Array.isArray((d as any).apis) ? (d as any).apis :
                    Array.isArray((d as any).threat_model) ? (d as any).threat_model :
                        (infraItems.length > 0 ? infraItems :
                            Array.isArray((d as any).test_cases) ? (d as any).test_cases :
                                Array.isArray((d as any).test_results) ? (d as any).test_results :
                                    Array.isArray((d as any).database_tables) ? (d as any).database_tables :
                                        Array.isArray((d as any).components) ? (d as any).components :
                                            (Array.isArray((d as any).content) ? (d as any).content : []))

    const hasContent = Boolean(
        (items && items.length > 0) ||
        d.description ||
        (d as any).file_structure ||
        (d as any).infrastructure ||
        (d as any).design_system ||
        (d as any).component_specs ||
        (d as any).a2ui_manifest ||
        (d as any).database_schema
    )

    const isDark = type === 'engineer_impl' || type === 'file_structure' || type === 'file'

    return (
        <div className={cn(
            "relative group rounded-2xl border-2 backdrop-blur-xl transition-all duration-300 overflow-hidden",
            shellClass,
            selected
                ? `border-${mode.accent}-500 scale-[1.02] z-10 shadow-2xl`
                : "hover:scale-[1.01]",
            isExpanded ? "w-[400px]" : "w-[280px]"
        )}>
            {/* Header */}
            <div
                className={cn(
                    "px-4 py-3 flex items-center justify-between border-b border-dashed cursor-pointer",
                    isDark ? "border-zinc-700 bg-zinc-800/50" : `border-${mode.accent}-200 bg-${mode.accent}-50/30`
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "p-1.5 rounded-lg shadow-sm ring-1 ring-inset",
                        isDark ? "bg-zinc-900 ring-zinc-700" : `bg-white ring-${mode.accent}-100`
                    )}>
                        <Icon className={cn("w-4 h-4", mode.color)} />
                    </div>
                    <div className="flex flex-col">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isDark ? "text-zinc-200" : mode.color
                        )}>
                            {mode.title}
                        </span>
                        <span className={cn(
                            "text-[11px] font-bold truncate max-w-[180px]",
                            isDark ? "text-white" : "text-slate-800"
                        )}>
                            {d.label || d.title}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasContent && (
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isDark ? "bg-emerald-500" : `bg-${mode.accent}-400`)} />
                    )}
                    <div className={cn("p-1 rounded-md transition-colors", isDark ? "hover:bg-zinc-700" : `hover:bg-${mode.accent}-100/50`)}>
                        {isExpanded ? <Minimize2 className="w-3 h-3 text-slate-400" /> : <Maximize2 className="w-3 h-3 text-slate-400" />}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <AnimatePresence mode="wait">
                <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 max-h-[500px] overflow-y-auto custom-scrollbar"
                >
                    {/* Specific Renderers */}
                    {type === 'pm_spec' && <PMSpecView data={d} />}
                    {(type === 'user_stories' || type === 'user_story') && <StoryList items={items} />}
                    {(type.includes('schema') || type.includes('database')) && <SchemaView data={d} />}
                    {(type === 'file_structure' || type === 'engineer_impl' || type === 'file') && <FileTree data={d} />}
                    {(type === 'threat_model' || type === 'threats' || type === 'security_architecture') && <ThreatRadar items={items} />}
                    {(type === 'infrastructure' || type === 'devops_infrastructure') && <InfraGrid items={items} />}
                    {(type === 'test_results' || type === 'qa_verification') && <TestReport data={d} />}
                    {(type === 'design_system' || type === 'ui_design' || type === 'frontend' || type === 'browser') && <DesignSpecs data={d} />}
                    {(type === 'apis' || type === 'arch_design' || type === 'service' || type === 'api' || type === 'component' || type === 'gateway' || type === 'load_balancer') && <APIGrid items={items} />}

                    {/* Fallback Generic List */}
                    {!['user_stories', 'pm_spec', 'user_story', 'database_schema', 'schema', 'database', 'cache', 'file_structure', 'engineer_impl', 'file', 'threat_model', 'threats', 'security_architecture', 'infrastructure', 'devops_infrastructure', 'test_results', 'qa_verification', 'design_system', 'ui_design', 'frontend', 'browser', 'apis', 'arch_design', 'service', 'api', 'component', 'gateway', 'load_balancer'].includes(type) && (
                        <div className="space-y-2">
                            {d.description && <p className={cn("text-[10px] italic leading-relaxed", isDark ? "text-zinc-400" : "text-slate-500")}>{d.description}</p>}
                            {items.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {items.map((item: any, k: number) => (
                                        <Badge key={k} variant="secondary" className={cn(
                                            "text-[10px] font-normal px-2",
                                            isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "text-slate-600 bg-slate-100/80"
                                        )}>
                                            {typeof item === 'string' ? item : (item.name || item.title || item.endpoint || JSON.stringify(item))}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Standard Handles */}
            <Handle type="target" position={Position.Left} className={cn("w-2.5 h-2.5 border-2", isDark ? "bg-zinc-900 border-zinc-500" : "bg-white border-slate-400")} style={{ left: '-6px' }} />
            <Handle type="source" position={Position.Right} className={cn("w-2.5 h-2.5 border-2", isDark ? "bg-zinc-900 border-zinc-500" : "bg-white border-slate-400")} style={{ right: '-6px' }} />
            <Handle type="source" position={Position.Bottom} className={cn("w-2.5 h-2.5 border-2", isDark ? "bg-zinc-900 border-zinc-500" : "bg-white border-slate-400")} style={{ bottom: '-6px' }} />
            <Handle type="target" position={Position.Top} className={cn("w-2.5 h-2.5 border-2", isDark ? "bg-zinc-900 border-zinc-500" : "bg-white border-slate-400")} style={{ top: '-6px' }} />
        </div>
    )
}
