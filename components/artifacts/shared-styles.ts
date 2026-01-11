/**
 * Shared typography and spacing constants for artifact panels
 * Ensures consistent, readable UI across all artifact displays
 */

export const artifactStyles = {
  // Typography - Compact, readable sizes
  typography: {
    // Headers - Reduced sizes
    h1: "text-lg font-bold tracking-tight", // Main title (18px)
    h2: "text-base font-semibold tracking-tight", // Section title (16px)
    h3: "text-sm font-semibold", // Subsection (14px)
    h4: "text-sm font-medium", // Card title (14px)
    
    // Body text - Compact but readable
    body: "text-sm leading-relaxed", // Main content (14px)
    bodySmall: "text-xs leading-relaxed", // Secondary content (12px)
    bodyTiny: "text-[11px] leading-relaxed", // Tertiary content (11px)
    
    // Labels and badges
    label: "text-xs font-medium", // Labels (12px)
    labelSmall: "text-[11px] font-medium", // Small labels (11px)
    badge: "text-[11px] font-semibold", // Badge text (11px)
    badgeSmall: "text-[10px] font-semibold", // Small badges (10px)
    
    // Code and technical
    code: "text-xs font-mono", // Code blocks (12px)
    codeSmall: "text-[11px] font-mono", // Inline code (11px)
  },
  
  // Spacing - Reduced padding and margins
  spacing: {
    section: "space-y-3", // Between major sections
    card: "p-3", // Card padding
    cardSmall: "p-2", // Smaller cards
    cardTight: "p-1.5", // Very small cards
    gap: "gap-2", // Default gap
    gapSmall: "gap-1.5", // Small gap
    gapLarge: "gap-3", // Large gap
  },
  
  // Colors - Better contrast
  colors: {
    text: "text-foreground",
    textMuted: "text-muted-foreground dark:text-muted-foreground/90", // Improved dark mode contrast
    textSubtle: "text-muted-foreground/70 dark:text-muted-foreground/80",
    bg: "bg-background",
    bgMuted: "bg-muted/40 dark:bg-muted/30",
    bgCard: "bg-card",
    border: "border-border",
    borderMuted: "border-border/50 dark:border-border/60", // Better contrast
  },
  
  // Badge sizes - Compact
  badges: {
    default: "px-2 py-0.5 text-[11px] font-semibold", // Standard badge
    small: "px-1.5 py-0.5 text-[10px] font-semibold", // Small badge
    large: "px-2.5 py-1 text-xs font-semibold", // Large badge
  },
  
  // Card styles
  cards: {
    default: "rounded-lg border border-border/50 dark:border-border/60 bg-card",
    elevated: "rounded-lg border border-border/50 dark:border-border/60 bg-card shadow-sm",
    muted: "rounded-lg border border-border/40 dark:border-border/50 bg-muted/20 dark:bg-muted/10",
  },
}
