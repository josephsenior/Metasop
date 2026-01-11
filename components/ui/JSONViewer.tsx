'use client'

import * as React from 'react';
import { Button } from '@/components/ui/button';

export default function JSONViewer({ data, collapsed = true }: { data: any; collapsed?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(!collapsed);

  const json = React.useMemo(() => JSON.stringify(data, null, 2), [data]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Raw JSON</div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(json)}>
            Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={() => {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'artifact.json';
            a.click();
            URL.revokeObjectURL(url);
          }}>
            Download
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsOpen((v) => !v)}>
            {isOpen ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>

      {isOpen && (
        <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-white" style={{ maxHeight: 420 }}>
          {json}
        </pre>
      )}
    </div>
  );
}
