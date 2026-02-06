import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Copy, 
  Download, 
  User, 
  Server, 
  Shield, 
  Code, 
  CheckCircle, 
  Palette, 
  Bot,
  Clock
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ArtifactHeader({
  role,
  timestamp,
  confidence,
  className,
  onCopy,
  onDownload,
}: {
  role: string;
  timestamp?: string;
  confidence?: number | null;
  className?: string;
  onCopy?: () => void;
  onDownload?: () => void;
}) {
  const getAgentInfo = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('pm')) return { name: 'Sarah Chen', title: 'Product Strategist', icon: User, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (r.includes('arch')) return { name: 'Marcus Volkov', title: 'System Architect', icon: Server, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (r.includes('security')) return { name: 'Elena Rodriguez', title: 'Security Lead', icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (r.includes('engineer')) return { name: 'David Kim', title: 'Core Engineer', icon: Code, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (r.includes('qa')) return { name: 'Aisha Patel', title: 'Quality Assurance', icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    if (r.includes('devops')) return { name: 'Sven Lindholm', title: 'Cloud Architect', icon: Server, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
    if (r.includes('ui')) return { name: 'Mika Tanaka', title: 'Design Lead', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' };
    return { name: 'Agent', title: 'Specialist', icon: Bot, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' };
  };

  const agent = getAgentInfo(role);
  const Icon = agent.icon;

  return (
    <div className={cn('flex items-center justify-between gap-4 p-4 border-b bg-card/80 backdrop-blur-md sticky top-0 z-50', className)}>
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border", agent.bg, agent.border)}>
          <Icon className={cn("h-5 w-5", agent.color)} />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-foreground">{agent.name}</span>
            <Badge variant="outline" className={cn("text-[10px] uppercase px-1.5 py-0 font-semibold h-4", agent.color, agent.border)}>
              {agent.title}
            </Badge>
          </div>
          {timestamp && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono">
              <Clock className="h-3 w-3" />
              <span>PUBLISHED {formatDistanceToNow(new Date(timestamp))} AGO</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {typeof confidence === 'number' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:flex flex-col items-end cursor-help">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider flex items-center gap-1">
                    Confidence
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className={cn("h-full rounded-full", 
                          confidence > 0.8 ? "bg-emerald-500" : confidence > 0.5 ? "bg-amber-500" : "bg-red-500"
                        )} 
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">{Math.round(confidence * 100)}%</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                AI Confidence Score
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
          {onCopy && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={onCopy} className="h-7 w-7 hover:bg-background hover:text-foreground text-muted-foreground transition-all">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Copy Raw Data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onDownload && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={onDownload} className="h-7 w-7 hover:bg-background hover:text-foreground text-muted-foreground transition-all">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Download Specification</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
