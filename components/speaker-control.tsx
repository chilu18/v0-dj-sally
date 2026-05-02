"use client"

import { DeviceCard } from "@/components/device-card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Speaker, Volume2, VolumeX, Volume1 } from "lucide-react"

interface SpeakerControlProps {
  connected: boolean
  volume: number
  muted: boolean
  onVolumeChange?: (value: number) => void
  onMuteToggle?: () => void
  className?: string
}

export function SpeakerControl({
  connected,
  volume,
  muted,
  onVolumeChange,
  onMuteToggle,
  className,
}: SpeakerControlProps) {
  const VolumeIcon = muted ? VolumeX : volume > 50 ? Volume2 : Volume1

  return (
    <DeviceCard
      title="Speaker"
      icon={<Speaker className="h-5 w-5" />}
      connected={connected}
      className={className}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant={muted ? "destructive" : "secondary"}
            size="icon"
            className="h-12 w-12 shrink-0"
            disabled={!connected}
            onClick={onMuteToggle}
          >
            <VolumeIcon className="h-5 w-5" />
          </Button>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volume</span>
              <span className="font-mono text-sm text-primary">{muted ? "Muted" : `${volume}%`}</span>
            </div>
            <Slider
              value={[muted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              disabled={!connected || muted}
              onValueChange={(v) => onVolumeChange?.(v[0])}
            />
          </div>
        </div>

        {/* Audio visualization bars */}
        <div className="flex h-8 items-end justify-center gap-1">
          {Array.from({ length: 16 }).map((_, i) => {
            const height = connected && !muted ? Math.random() * 100 : 10
            return (
              <div
                key={i}
                className="w-2 rounded-t bg-primary/80 transition-all duration-75"
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
      </div>
    </DeviceCard>
  )
}
