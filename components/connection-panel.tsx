"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusIndicator } from "@/components/status-indicator"
import type { ConnectionStatus } from "@/hooks/use-websocket"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"

interface ConnectionPanelProps {
  status: ConnectionStatus
  onConnect: (url: string) => void
  onDisconnect: () => void
}

export function ConnectionPanel({ status, onConnect, onDisconnect }: ConnectionPanelProps) {
  const [url, setUrl] = useState("ws://raspberrypi.local:8080")

  const handleConnect = () => {
    if (status === "connected") {
      onDisconnect()
    } else {
      onConnect(url)
    }
  }

  const statusLabel = {
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Connection Error",
  }[status]

  const statusIndicator = {
    connecting: "connecting",
    connected: "online",
    disconnected: "offline",
    error: "warning",
  }[status] as "connecting" | "online" | "offline" | "warning"

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          {status === "connected" ? (
            <Wifi className="h-5 w-5 text-primary" />
          ) : (
            <WifiOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">Raspberry Pi Connection</p>
          <StatusIndicator status={statusIndicator} label={statusLabel} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ws://raspberrypi.local:8080"
          className="min-w-64"
          disabled={status === "connected" || status === "connecting"}
        />
        <Button
          onClick={handleConnect}
          disabled={status === "connecting"}
          variant={status === "connected" ? "destructive" : "default"}
          className="min-w-28"
        >
          {status === "connecting" && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          {status === "connected" ? "Disconnect" : status === "connecting" ? "Connecting" : "Connect"}
        </Button>
      </div>
    </div>
  )
}
