"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Logo } from "@/components/ui/Logo"

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-semibold text-foreground gradient-primary-text">Blueprinta</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/diagrams"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              My Diagrams
            </Link>
            <Link
              href="/dashboard/create"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Create
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

