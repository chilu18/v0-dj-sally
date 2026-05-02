"use client"

import { useState, useEffect, useCallback } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import {
  Disc3,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Camera,
  Mic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Zap,
  Radio,
  Music,
  Settings,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

export function Dashboard() {
  const { status, deviceState, sendCommand, connect, disconnect } = useWebSocket()
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(128)
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(32).fill(0))

  // Animate waveform
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === "connected" && isPlaying) {
        setWaveformBars(Array(32).fill(0).map(() => Math.random() * 100))
      }
    }, 50)
    return () => clearInterval(interval)
  }, [status, isPlaying])

  const handlePTZControl = (action: string) => {
    sendCommand("ptz_control", { action })
  }

  const handleZoomChange = (value: number) => {
    sendCommand("ptz_zoom", { zoom: value })
  }

  const handleButtonPress = (padId: string, buttonId: number) => {
    sendCommand("macro_button", { padId, buttonId })
  }

  const handleEncoderChange = (padId: string, value: number) => {
    sendCommand("encoder_value", { padId, value })
  }

  const handleVolumeChange = (value: number) => {
    sendCommand("speaker_volume", { volume: value })
  }

  const handleMuteToggle = () => {
    sendCommand("speaker_mute", { muted: !deviceState.speaker.muted })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Disc3 className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                DJ Sally
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Control Interface</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
              <span className="text-xs text-muted-foreground">BPM</span>
              <span className="text-sm font-mono font-bold text-primary">{bpm}</span>
            </div>

            <Button
              variant={status === "connected" ? "default" : "outline"}
              size="sm"
              onClick={status === "connected" ? disconnect : connect}
              className={cn(
                "gap-2 transition-all",
                status === "connected" && "bg-primary/20 text-primary border-primary/50 hover:bg-primary/30"
              )}
            >
              {status === "connected" ? (
                <>
                  <Wifi className="h-4 w-4" />
                  <span className="hidden sm:inline">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Connect</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] p-4 space-y-4">
        {/* Waveform Display */}
        <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
          <div className="relative flex items-end justify-center h-24 gap-[2px]">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className="w-2 rounded-t transition-all duration-75"
                style={{
                  height: `${Math.max(4, height)}%`,
                  background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))`,
                  opacity: 0.6 + (height / 200),
                }}
              />
            ))}
          </div>
          <div className="relative flex items-center justify-center gap-4 mt-4">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left Deck - Macro Pad 1 */}
          <div className="lg:col-span-4 space-y-4">
            <DeckCard
              title="Deck A"
              subtitle="Macro Pad 1"
              connected={deviceState.macroPads[0]?.connected}
              encoderValue={deviceState.macroPads[0]?.encoder.value ?? 50}
              onEncoderChange={(v) => handleEncoderChange("pad1", v)}
              buttons={deviceState.macroPads[0]?.buttons ?? []}
              onButtonPress={(id) => handleButtonPress("pad1", id)}
              accentColor="primary"
            />
          </div>

          {/* Center - Mixer & Cameras */}
          <div className="lg:col-span-4 space-y-4">
            {/* Master Volume */}
            <Card className="border-border/50 bg-card/50 backdrop-blur p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Master Output</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMuteToggle}
                >
                  {deviceState.speaker.muted ? (
                    <VolumeX className="h-4 w-4 text-destructive" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </div>

              <div className="flex gap-3">
                {/* Volume Slider */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${deviceState.speaker.volume}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-10 text-right text-muted-foreground">
                    {deviceState.speaker.volume}%
                  </span>
                </div>
              </div>

              <Slider
                value={[deviceState.speaker.volume]}
                onValueChange={([v]) => handleVolumeChange(v)}
                max={100}
                step={1}
                className="mt-3"
              />

              {/* VU Meter */}
              <div className="flex gap-1 mt-4">
                {Array(20).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-2 rounded-sm transition-all",
                      i < (deviceState.speaker.volume / 5)
                        ? i > 15
                          ? "bg-destructive"
                          : i > 12
                            ? "bg-yellow-500"
                            : "bg-primary"
                        : "bg-secondary"
                    )}
                  />
                ))}
              </div>
            </Card>

            {/* Camera Feeds */}
            <Card className="border-border/50 bg-card/50 backdrop-blur p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Live Feeds</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    deviceState.cameras.ptз.connected ? "bg-primary animate-pulse" : "bg-muted"
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {deviceState.cameras.ptз.connected ? "LIVE" : "OFF"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* PTZ Camera */}
                <div className="relative aspect-video rounded-lg bg-secondary/50 border border-border/50 overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  {deviceState.cameras.ptз.connected && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-destructive/80 text-[10px] font-medium">
                      REC
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground">
                    PTZ Cam
                  </div>
                </div>

                {/* Webcam */}
                <div className="relative aspect-video rounded-lg bg-secondary/50 border border-border/50 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground">
                    Webcam
                  </div>
                </div>
              </div>

              {/* PTZ Controls */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePTZControl("up")}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <div />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePTZControl("left")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-8 w-8 rounded bg-secondary/50 border border-border/50" />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePTZControl("right")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePTZControl("down")}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <div />
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoomChange(deviceState.cameras.ptз.zoom + 10)}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoomChange(deviceState.cameras.ptз.zoom - 10)}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* System Status */}
            <Card className="border-border/50 bg-card/50 backdrop-blur p-4">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">System</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatusItem
                  label="CPU"
                  value={`${deviceState.raspberryPi.cpuUsage}%`}
                  color={deviceState.raspberryPi.cpuUsage > 80 ? "destructive" : "primary"}
                />
                <StatusItem
                  label="Temp"
                  value={`${deviceState.raspberryPi.cpuTemp}°`}
                  color={deviceState.raspberryPi.cpuTemp > 70 ? "destructive" : "primary"}
                />
                <StatusItem
                  label="RAM"
                  value={`${deviceState.raspberryPi.memoryUsage}%`}
                  color={deviceState.raspberryPi.memoryUsage > 80 ? "destructive" : "primary"}
                />
              </div>
            </Card>
          </div>

          {/* Right Deck - Macro Pad 2 */}
          <div className="lg:col-span-4 space-y-4">
            <DeckCard
              title="Deck B"
              subtitle="Macro Pad 2"
              connected={deviceState.macroPads[1]?.connected}
              encoderValue={deviceState.macroPads[1]?.encoder.value ?? 50}
              onEncoderChange={(v) => handleEncoderChange("pad2", v)}
              buttons={deviceState.macroPads[1]?.buttons ?? []}
              onButtonPress={(id) => handleButtonPress("pad2", id)}
              accentColor="accent"
            />
          </div>
        </div>

        {/* Effects Row */}
        <Card className="border-border/50 bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Quick Effects</span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {["Filter", "Echo", "Reverb", "Flanger", "Phaser", "Delay", "Loop", "Roll"].map((effect) => (
              <Button
                key={effect}
                variant="outline"
                className="h-12 border-border/50 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all"
              >
                <span className="text-xs">{effect}</span>
              </Button>
            ))}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur mt-4">
        <div className="mx-auto max-w-[1800px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Raspberry Pi: {deviceState.raspberryPi.connected ? "Online" : "Offline"}</span>
            <span>Latency: 12ms</span>
          </div>
          <div className="flex items-center gap-2">
            <Music className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Deck Card Component
function DeckCard({
  title,
  subtitle,
  connected,
  encoderValue,
  onEncoderChange,
  buttons,
  onButtonPress,
  accentColor,
}: {
  title: string
  subtitle: string
  connected?: boolean
  encoderValue: number
  onEncoderChange: (value: number) => void
  buttons: { id: number; active: boolean; label: string }[]
  onButtonPress: (id: number) => void
  accentColor: "primary" | "accent"
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={cn(
            "text-lg font-bold",
            accentColor === "primary" ? "text-primary" : "text-accent"
          )}>{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={cn(
          "h-2 w-2 rounded-full",
          connected ? (accentColor === "primary" ? "bg-primary" : "bg-accent") : "bg-muted"
        )} />
      </div>

      {/* Turntable Visual */}
      <div className="relative mx-auto w-40 h-40 mb-4">
        <div className="absolute inset-0 rounded-full bg-secondary/50 border border-border/50" />
        <div
          className={cn(
            "absolute inset-2 rounded-full border-2",
            accentColor === "primary" ? "border-primary/30" : "border-accent/30"
          )}
          style={{
            background: `conic-gradient(from ${encoderValue * 3.6}deg, transparent, ${accentColor === "primary" ? "hsl(var(--primary))" : "hsl(var(--accent))"} 10%, transparent 20%)`,
          }}
        />
        <div className="absolute inset-8 rounded-full bg-card border border-border/50 flex items-center justify-center">
          <Disc3 className={cn(
            "h-12 w-12",
            accentColor === "primary" ? "text-primary/50" : "text-accent/50"
          )} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground" />
      </div>

      {/* Encoder Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Jog</span>
          <span className="font-mono">{encoderValue}</span>
        </div>
        <Slider
          value={[encoderValue]}
          onValueChange={([v]) => onEncoderChange(v)}
          max={100}
          step={1}
          className={accentColor === "primary" ? "[&_[role=slider]]:bg-primary" : "[&_[role=slider]]:bg-accent"}
        />
      </div>

      {/* Pad Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {(buttons.length > 0 ? buttons : Array(4).fill({ id: 0, active: false, label: "" })).map((btn, i) => (
          <Button
            key={i}
            variant={btn.active ? "default" : "outline"}
            className={cn(
              "h-12 p-0 border-border/50 transition-all",
              btn.active && (accentColor === "primary"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-accent text-accent-foreground shadow-lg shadow-accent/25"),
              !btn.active && "hover:bg-secondary"
            )}
            onClick={() => onButtonPress(btn.id || i)}
          >
            <span className="text-xs font-mono">{i + 1}</span>
          </Button>
        ))}
      </div>
    </Card>
  )
}

// Status Item Component
function StatusItem({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: "primary" | "destructive"
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn(
        "text-lg font-mono font-bold",
        color === "primary" ? "text-primary" : "text-destructive"
      )}>{value}</p>
    </div>
  )
}
