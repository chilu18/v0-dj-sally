"use client"

import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "connecting"
  label?: string
  className?: string
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative flex h-2.5 w-2.5 rounded-full",
          status === "online" && "bg-primary",
          status === "offline" && "bg-muted-foreground",
          status === "warning" && "bg-chart-3",
          status === "connecting" && "bg-accent"
        )}
      >
        {(status === "online" || status === "connecting") && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              status === "online" && "bg-primary",
              status === "connecting" && "bg-accent"
            )}
          />
        )}
      </span>
      {label && (
        <span className="text-sm text-muted-foreground capitalize">{label}</span>
      )}
    </div>
  )
}
