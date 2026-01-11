import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ScrollText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface UserStoryNodeData extends Record<string, unknown> {
    storyKey?: string;
    label: string;
    description?: string;
    priority?: string;
    criteriaCount?: number;
}

const UserStoryNode = ({ data, selected }: NodeProps) => {
    const nodeData = data as UserStoryNodeData;
    return (
        <div
            className={cn(
                "relative group w-[220px] rounded-2xl border-2 bg-white/80 backdrop-blur-xl transition-all duration-500 overflow-hidden",
                selected
                    ? "border-amber-500 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] scale-105"
                    : "border-slate-200 hover:border-amber-500/50 hover:shadow-[0_8px_15px_-5px_rgba(0,0,0,0.05)]"
            )}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(#000_1px,transparent_1px)] bg-size-[100%_10px]" />

            {/* Header */}
            <div className="relative p-3 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white shadow-sm border border-amber-100 text-amber-600">
                        <ScrollText className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-[9px] font-black text-amber-600/70 uppercase tracking-widest">
                        {nodeData.storyKey}
                    </span>
                </div>
                {nodeData.priority && (
                    <Badge variant="outline" className={cn(
                        "text-[8px] h-4 px-1.5 font-black uppercase tracking-tighter border-0 shadow-sm",
                        nodeData.priority === 'critical' || nodeData.priority === 'high'
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                    )}>
                        {nodeData.priority}
                    </Badge>
                )}
            </div>

            {/* Body */}
            <div className="relative p-3 space-y-2">
                <div className="font-bold text-[11px] text-slate-800 leading-tight group-hover:text-amber-600 transition-colors">
                    {nodeData.label}
                </div>
                {nodeData.description && (
                    <div className="text-[10px] text-slate-500 leading-relaxed line-clamp-3 italic pl-2 border-l-2 border-amber-100 font-medium">
                        {nodeData.description}
                    </div>
                )}
            </div>

            {/* Acceptance Criteria Indicator */}
            <div className="px-3 pb-3 flex items-center justify-between">
                <div />
                {nodeData.criteriaCount && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600/50 uppercase tracking-tighter">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{nodeData.criteriaCount} AC</span>
                    </div>
                )}
            </div>

            {/* Status Dot */}
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500" />

            {/* Handles */}
            <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-white border-2 border-amber-500 -left-1.25! shadow-sm" />
            <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-white border-2 border-amber-500 -right-1.25! shadow-sm" />
        </div>
    );
};

export default memo(UserStoryNode);
