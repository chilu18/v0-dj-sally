"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusIndicator } from "@/components/status-indicator"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface DeviceCardProps {
  title: string
  icon: ReactNode
  connected: boolean
  children: ReactNode
  className?: string
}

export function DeviceCard({ title, icon, connected, children, className }: DeviceCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            {icon}
          </div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </div>
        <StatusIndicator status={connected ? "online" : "offline"} label={connected ? "Online" : "Offline"} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
