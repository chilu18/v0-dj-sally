"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusIndicator } from "@/components/status-indicator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import {
  Video,
  VideoOff,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react"

interface CameraFeedProps {
  name: string
  connected: boolean
  streamUrl?: string
  isPTZ?: boolean
  pan?: number
  tilt?: number
  zoom?: number
  onPTZControl?: (action: string) => void
  onZoomChange?: (value: number) => void
  className?: string
}

export function CameraFeed({
  name,
  connected,
  isPTZ = false,
  pan = 0,
  tilt = 0,
  zoom = 1,
  onPTZControl,
  onZoomChange,
  className,
}: CameraFeedProps) {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <Card className={cn("overflow-hidden", fullscreen && "fixed inset-4 z-50", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            {connected ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </div>
          <CardTitle className="text-base font-medium">{name}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <StatusIndicator status={connected ? "online" : "offline"} />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullscreen(!fullscreen)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-secondary/50">
          {connected ? (
            <>
              {/* Simulated camera feed with gradient */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary">
                <div className="text-center">
                  <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">Live Feed - {name}</p>
                  {isPTZ && (
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Pan: {pan}° | Tilt: {tilt}° | Zoom: {zoom}x
                    </p>
                  )}
                </div>
              </div>
              {/* Recording indicator */}
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-destructive/90 px-2 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <span className="text-xs font-medium text-white">REC</span>
              </div>
              {/* Timestamp */}
              <div className="absolute bottom-3 right-3 rounded bg-background/80 px-2 py-1">
                <span className="font-mono text-xs text-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <VideoOff className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">Camera Offline</p>
              </div>
            </div>
          )}
        </div>

        {/* PTZ Controls */}
        {isPTZ && connected && (
          <div className="border-t border-border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Direction pad */}
              <div className="grid grid-cols-3 gap-1">
                <div />
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => onPTZControl?.("tilt_up")}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <div />
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => onPTZControl?.("pan_left")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => onPTZControl?.("home")}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => onPTZControl?.("pan_right")}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <div />
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => onPTZControl?.("tilt_down")}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <div />
              </div>

              {/* Zoom control */}
              <div className="flex flex-1 items-center gap-3 sm:max-w-48">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={10}
                  step={0.5}
                  onValueChange={(v) => onZoomChange?.(v[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
