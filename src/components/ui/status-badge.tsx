import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusType = 'completed' | 'processing' | 'failed' | 'pending'

interface StatusBadgeProps extends React.ComponentProps<typeof Badge> {
  status: StatusType
}

const statusStyles: Record<StatusType, string> = {
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-600/20',
  processing: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-600/20',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-600/20',
  pending: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-600/20',
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'px-2 py-1 rounded text-xs font-medium',
        statusStyles[status],
        className
      )}
      {...props}
    >
      {status}
    </Badge>
  )
}

