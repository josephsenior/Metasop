'use client'

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Sheet, SheetTrigger, SheetContent, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ExternalLink,
  Shield,
  Code,
  Cpu,
  Palette as PaletteIcon,
  Zap,
  Box,
  Layers,
  CheckCircle2
} from 'lucide-react';
import ArtifactHeader from './ArtifactHeader';
import JSONViewer from '@/components/ui/JSONViewer';
import * as ArtifactPanels from './index';

export default function ArtifactCard({ artifact, children }: { artifact: any; children?: React.ReactNode }) {
  const title = artifact?.role || artifact?.step_id || 'Artifact';
  const summary = artifact?.content?.summary || artifact?.content?.description || '';
  const timestamp = artifact?.timestamp || artifact?.created_at;
  const confidence = artifact?.confidence || artifact?.score || null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getIcon = () => {
    const r = (artifact?.role || '').toLowerCase();
    if (r.includes('pm')) return <Zap className="h-4 w-4 text-amber-500" />;
    if (r.includes('arch')) return <Layers className="h-4 w-4 text-blue-500" />;
    if (r.includes('security')) return <Shield className="h-4 w-4 text-red-500" />;
    if (r.includes('engineer')) return <Code className="h-4 w-4 text-emerald-500" />;
    if (r.includes('qa')) return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
    if (r.includes('devops')) return <Cpu className="h-4 w-4 text-sky-500" />;
    if (r.includes('ui')) return <PaletteIcon className="h-4 w-4 text-pink-500" />;
    return <Box className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="group"
        >
          <Card className="cursor-pointer overflow-hidden border-border/40 hover:border-border transition-all bg-card/50 backdrop-blur-sm relative group">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                  {getIcon()}
                </div>
                <CardTitle className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">{title}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2 text-sm leading-relaxed italic">{summary || "Agent specification and outputs."}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase font-semibold py-1 px-2 border-muted-foreground/20">
                  {artifact?.role?.replace(/_/g, ' ') || artifact?.step_id}
                </Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:translate-x-0.5 group-hover:text-muted-foreground transition-all" />
            </CardContent>
          </Card>
        </motion.div>
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-4xl w-[90vw] p-0 flex flex-col gap-0 overflow-y-auto">
        <ArtifactHeader
          role={title}
          timestamp={timestamp}
          confidence={confidence}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />

        <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
          {children}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Render artifact-specific panel if available, otherwise fallback to JSON */}
            {(() => {
              const stepId = artifact?.step_id || artifact?.stepId || artifact?.role;
              switch ((stepId || '').toString()) {
                case 'pm_spec':
                  return <ArtifactPanels.PMSpecPanel artifact={artifact} />;
                case 'devops_infrastructure':
                  return <ArtifactPanels.DevOpsInfrastructurePanel artifact={artifact} />;
                case 'security_architecture':
                  return <ArtifactPanels.SecurityArchitecturePanel artifact={artifact} />;
                case 'arch_design':
                  return <ArtifactPanels.ArchDesignPanel artifact={artifact} />;
                case 'engineer_impl':
                  return <ArtifactPanels.EngineerImplPanel artifact={artifact} />;
                case 'ui_design':
                  return <ArtifactPanels.UIDesignPanel artifact={artifact} />;
                case 'qa_verification':
                  return <ArtifactPanels.QAVerificationPanel artifact={artifact} />;
                default:
                  return (
                    <div className="p-6 rounded-2xl bg-muted/10 border border-border/40">
                      <JSONViewer data={artifact} collapsed={false} />
                    </div>
                  );
              }
            })()}
          </div>
        </div>

        <SheetFooter className="p-6 border-t bg-muted/10 flex sm:justify-center">
          <p className="text-sm text-muted-foreground/60 text-center uppercase tracking-wide font-mono">
            Generated by MetaSOP Multi-Agent System
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
