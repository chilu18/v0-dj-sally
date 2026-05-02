"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export interface DeviceState {
  raspberryPi: { connected: boolean; cpuTemp: number; cpuUsage: number; memoryUsage: number }
  cameras: {
    ptз: { connected: boolean; streamUrl: string; pan: number; tilt: number; zoom: number }
    webcam: { connected: boolean; streamUrl: string }
  }
  macroPads: {
    id: string
    connected: boolean
    buttons: { id: number; pressed: boolean; label: string }[]
    encoder: { value: number; min: number; max: number }
  }[]
  speaker: { connected: boolean; volume: number; muted: boolean }
}

const initialState: DeviceState = {
  raspberryPi: { connected: false, cpuTemp: 0, cpuUsage: 0, memoryUsage: 0 },
  cameras: {
    ptз: { connected: false, streamUrl: "", pan: 0, tilt: 0, zoom: 1 },
    webcam: { connected: false, streamUrl: "" },
  },
  macroPads: [
    {
      id: "pad-1",
      connected: false,
      buttons: [
        { id: 0, pressed: false, label: "Action 1" },
        { id: 1, pressed: false, label: "Action 2" },
        { id: 2, pressed: false, label: "Action 3" },
      ],
      encoder: { value: 50, min: 0, max: 100 },
    },
    {
      id: "pad-2",
      connected: false,
      buttons: [
        { id: 0, pressed: false, label: "Mode A" },
        { id: 1, pressed: false, label: "Mode B" },
        { id: 2, pressed: false, label: "Mode C" },
      ],
      encoder: { value: 75, min: 0, max: 100 },
    },
  ],
  speaker: { connected: false, volume: 50, muted: false },
}

interface UseWebSocketReturn {
  status: ConnectionStatus
  deviceState: DeviceState
  sendCommand: (command: string, payload?: Record<string, unknown>) => void
  connect: (url: string) => void
  disconnect: () => void
}

export function useWebSocket(defaultUrl?: string): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [deviceState, setDeviceState] = useState<DeviceState>(initialState)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback((url: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }

    setStatus("connecting")

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus("connected")
        // Simulate connected devices for demo
        setDeviceState((prev) => ({
          ...prev,
          raspberryPi: { connected: true, cpuTemp: 45.2, cpuUsage: 23, memoryUsage: 42 },
          cameras: {
            ptз: { connected: true, streamUrl: "/api/stream/ptz", pan: 0, tilt: 0, zoom: 1 },
            webcam: { connected: true, streamUrl: "/api/stream/webcam" },
          },
          macroPads: prev.macroPads.map((pad) => ({ ...pad, connected: true })),
          speaker: { connected: true, volume: 65, muted: false },
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "state_update") {
            setDeviceState((prev) => ({ ...prev, ...data.payload }))
          }
        } catch {
          console.error("Failed to parse WebSocket message")
        }
      }

      ws.onclose = () => {
        setStatus("disconnected")
        setDeviceState(initialState)
      }

      ws.onerror = () => {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
    setStatus("disconnected")
  }, [])

  const sendCommand = useCallback((command: string, payload?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command, payload }))
    }
  }, [])

  useEffect(() => {
    if (defaultUrl) {
      connect(defaultUrl)
    }
    return () => {
      disconnect()
    }
  }, [defaultUrl, connect, disconnect])

  return { status, deviceState, sendCommand, connect, disconnect }
}
