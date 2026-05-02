"use client"

import { useState, useEffect } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { ConnectionPanel } from "@/components/connection-panel"
import { CameraFeed } from "@/components/camera-feed"
import { MacroPadControl } from "@/components/macro-pad-control"
import { SpeakerControl } from "@/components/speaker-control"
import { SystemStatus } from "@/components/system-status"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Keyboard, Monitor, Settings } from "lucide-react"

export function Dashboard() {
  const { status, deviceState, sendCommand, connect, disconnect } = useWebSocket()
  const [activeTab, setActiveTab] = useState("overview")

  // Simulate random updates for demo visualization
  const [speakerVisualization, setSpeakerVisualization] = useState(0)
  useEffect(() => {
    if (status === "connected" && !deviceState.speaker.muted) {
      const interval = setInterval(() => {
        setSpeakerVisualization((prev) => prev + 1)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [status, deviceState.speaker.muted])

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">HeySalad Control Hub</h1>
              <p className="text-xs text-muted-foreground">Hardware Control Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {/* Connection Panel */}
        <div className="mb-6">
          <ConnectionPanel status={status} onConnect={connect} onDisconnect={disconnect} />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="cameras" className="gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Cameras</span>
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2">
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">Controls</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* System Status */}
              <SystemStatus
                connected={deviceState.raspberryPi.connected}
                cpuTemp={deviceState.raspberryPi.cpuTemp}
                cpuUsage={deviceState.raspberryPi.cpuUsage}
                memoryUsage={deviceState.raspberryPi.memoryUsage}
              />

              {/* Speaker */}
              <SpeakerControl
                key={speakerVisualization}
                connected={deviceState.speaker.connected}
                volume={deviceState.speaker.volume}
                muted={deviceState.speaker.muted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
              />

              {/* Quick Camera Preview */}
              <CameraFeed
                name="PTZ Camera"
                connected={deviceState.cameras.ptз.connected}
                streamUrl={deviceState.cameras.ptз.streamUrl}
                className="md:col-span-2 lg:col-span-1"
              />
            </div>

            {/* Macro Pads */}
            <div className="grid gap-4 md:grid-cols-2">
              {deviceState.macroPads.map((pad, index) => (
                <MacroPadControl
                  key={pad.id}
                  id={pad.id}
                  name={`Macro Pad ${index + 1}`}
                  connected={pad.connected}
                  buttons={pad.buttons}
                  encoderValue={pad.encoder.value}
                  encoderMin={pad.encoder.min}
                  encoderMax={pad.encoder.max}
                  onButtonPress={(buttonId) => handleButtonPress(pad.id, buttonId)}
                  onEncoderChange={(value) => handleEncoderChange(pad.id, value)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Cameras Tab */}
          <TabsContent value="cameras" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <CameraFeed
                name="PTZ Camera"
                connected={deviceState.cameras.ptз.connected}
                streamUrl={deviceState.cameras.ptз.streamUrl}
                isPTZ
                pan={deviceState.cameras.ptз.pan}
                tilt={deviceState.cameras.ptз.tilt}
                zoom={deviceState.cameras.ptз.zoom}
                onPTZControl={handlePTZControl}
                onZoomChange={handleZoomChange}
              />
              <CameraFeed
                name="Webcam"
                connected={deviceState.cameras.webcam.connected}
                streamUrl={deviceState.cameras.webcam.streamUrl}
              />
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {deviceState.macroPads.map((pad, index) => (
                <MacroPadControl
                  key={pad.id}
                  id={pad.id}
                  name={`Macro Pad ${index + 1}`}
                  connected={pad.connected}
                  buttons={pad.buttons}
                  encoderValue={pad.encoder.value}
                  encoderMin={pad.encoder.min}
                  encoderMax={pad.encoder.max}
                  onButtonPress={(buttonId) => handleButtonPress(pad.id, buttonId)}
                  onEncoderChange={(value) => handleEncoderChange(pad.id, value)}
                />
              ))}
            </div>

            <SpeakerControl
              key={`speaker-${speakerVisualization}`}
              connected={deviceState.speaker.connected}
              volume={deviceState.speaker.volume}
              muted={deviceState.speaker.muted}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-medium">Connection Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">WebSocket URL</label>
                  <p className="font-mono text-sm">ws://raspberrypi.local:8080</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Connection Status</label>
                  <p className="text-sm capitalize">{status}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-medium">Device Configuration</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground">Macro Pads Connected</label>
                  <p className="text-sm">{deviceState.macroPads.filter((p) => p.connected).length} / {deviceState.macroPads.length}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cameras Connected</label>
                  <p className="text-sm">
                    {[deviceState.cameras.ptз.connected, deviceState.cameras.webcam.connected].filter(Boolean).length} / 2
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
