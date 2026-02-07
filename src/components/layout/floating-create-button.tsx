"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface FloatingCreateButtonProps {
  className?: string
}

export function FloatingCreateButton({ className }: FloatingCreateButtonProps) {
  const { } = useAuth()

  return (
    <Link
      href="/dashboard/create"
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "md:bottom-8 md:right-8",
        className
      )}
    >
      <Button
        size="lg"
        variant="gradient"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg",
          "hover:scale-110 transition-transform duration-200",
          "flex items-center justify-center p-0"
        )}
        aria-label="Create new diagram"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  )
}

