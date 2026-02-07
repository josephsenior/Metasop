'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indicatorRef = React.useRef<HTMLDivElement>(null)
  const clampedValue = Math.max(0, Math.min(100, value ?? 0))

  React.useEffect(() => {
    if (!indicatorRef.current) {
      return
    }

    indicatorRef.current.style.setProperty(
      '--progress-transform',
      `translateX(-${100 - clampedValue}%)`,
    )
  }, [clampedValue])

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        ref={indicatorRef}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
