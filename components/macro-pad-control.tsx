"use client"

import { DeviceCard } from "@/components/device-card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Keyboard, RotateCw } from "lucide-react"

interface MacroPadButton {
  id: number
  pressed: boolean
  label: string
}

interface MacroPadControlProps {
  id: string
  name: string
  connected: boolean
  buttons: MacroPadButton[]
  encoderValue: number
  encoderMin?: number
  encoderMax?: number
  onButtonPress?: (buttonId: number) => void
  onEncoderChange?: (value: number) => void
  className?: string
}

export function MacroPadControl({
  name,
  connected,
  buttons,
  encoderValue,
  encoderMin = 0,
  encoderMax = 100,
  onButtonPress,
  onEncoderChange,
  className,
}: MacroPadControlProps) {
  return (
    <DeviceCard
      title={name}
      icon={<Keyboard className="h-5 w-5" />}
      connected={connected}
      className={className}
    >
      <div className="space-y-4">
        {/* Macro Buttons */}
        <div className="flex flex-wrap gap-2">
          {buttons.map((button) => (
            <Button
              key={button.id}
              variant={button.pressed ? "default" : "secondary"}
              className={cn(
                "min-h-12 flex-1 min-w-20 transition-all",
                button.pressed && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              disabled={!connected}
              onClick={() => onButtonPress?.(button.id)}
            >
              <span className="text-sm">{button.label}</span>
            </Button>
          ))}
        </div>

        {/* Rotary Encoder */}
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Encoder</span>
            </div>
            <span className="font-mono text-sm text-primary">{encoderValue}</span>
          </div>
          <Slider
            value={[encoderValue]}
            min={encoderMin}
            max={encoderMax}
            step={1}
            disabled={!connected}
            onValueChange={(v) => onEncoderChange?.(v[0])}
          />
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-muted-foreground">{encoderMin}</span>
            <span className="text-xs text-muted-foreground">{encoderMax}</span>
          </div>
        </div>
      </div>
    </DeviceCard>
  )
}
