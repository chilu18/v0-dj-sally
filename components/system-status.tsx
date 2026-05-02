"use client"

import { DeviceCard } from "@/components/device-card"
import { Progress } from "@/components/ui/progress"
import { Cpu, Thermometer, HardDrive, Activity } from "lucide-react"

interface SystemStatusProps {
  connected: boolean
  cpuTemp: number
  cpuUsage: number
  memoryUsage: number
  className?: string
}

export function SystemStatus({
  connected,
  cpuTemp,
  cpuUsage,
  memoryUsage,
  className,
}: SystemStatusProps) {
  const getTempColor = (temp: number) => {
    if (temp < 50) return "text-primary"
    if (temp < 70) return "text-chart-3"
    return "text-destructive"
  }

  return (
    <DeviceCard
      title="Raspberry Pi"
      icon={<Cpu className="h-5 w-5" />}
      connected={connected}
      className={className}
    >
      <div className="space-y-4">
        {/* Temperature */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Thermometer className={`h-5 w-5 ${getTempColor(cpuTemp)}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CPU Temp</span>
              <span className={`font-mono text-sm ${getTempColor(cpuTemp)}`}>
                {connected ? `${cpuTemp.toFixed(1)}°C` : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">CPU Usage</span>
            </div>
            <span className="font-mono text-sm text-foreground">
              {connected ? `${cpuUsage}%` : "--"}
            </span>
          </div>
          <Progress value={connected ? cpuUsage : 0} className="h-2" />
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Memory</span>
            </div>
            <span className="font-mono text-sm text-foreground">
              {connected ? `${memoryUsage}%` : "--"}
            </span>
          </div>
          <Progress value={connected ? memoryUsage : 0} className="h-2" />
        </div>
      </div>
    </DeviceCard>
  )
}
