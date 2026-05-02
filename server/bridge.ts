import { WebSocketServer, WebSocket } from "ws"

// Environment variables
const SALLY_REMOTE_CONTROL_URL = process.env.SALLY_REMOTE_CONTROL_URL || "http://127.0.0.1:8787"
const SALLY_DEVICE_ID = process.env.SALLY_DEVICE_ID || "sally-samsung"
const SALLY_ADMIN_TOKEN = process.env.SALLY_ADMIN_TOKEN
const DJ_SALLY_WS_PORT = parseInt(process.env.DJ_SALLY_WS_PORT || "8080", 10)

// Device state
interface DeviceState {
  raspberryPi: { connected: boolean; cpuTemp: number; cpuUsage: number; memoryUsage: number }
  cameras: {
    ptz: { connected: boolean; streamUrl: string; pan: number; tilt: number; zoom: number }
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

let deviceState: DeviceState = {
  raspberryPi: { connected: true, cpuTemp: 0, cpuUsage: 0, memoryUsage: 0 },
  cameras: {
    ptz: { connected: false, streamUrl: "", pan: 0, tilt: 0, zoom: 1 },
    webcam: { connected: false, streamUrl: "" },
  },
  macroPads: [
    {
      id: "pad-1",
      connected: false,
      buttons: [
        { id: 0, pressed: false, label: "CUE" },
        { id: 1, pressed: false, label: "PLAY" },
        { id: 2, pressed: false, label: "SYNC" },
      ],
      encoder: { value: 50, min: 0, max: 100 },
    },
    {
      id: "pad-2",
      connected: false,
      buttons: [
        { id: 0, pressed: false, label: "CUE" },
        { id: 1, pressed: false, label: "PLAY" },
        { id: 2, pressed: false, label: "SYNC" },
      ],
      encoder: { value: 50, min: 0, max: 100 },
    },
  ],
  speaker: { connected: false, volume: 65, muted: false },
}

// Previous volume for mute/unmute restore
let previousVolume = 65

// Connected clients
const clients = new Set<WebSocket>()

// Broadcast state to all clients
function broadcastState() {
  const message = JSON.stringify({
    type: "state_update",
    payload: deviceState,
  })

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

// Send command to Sally remote control API
async function sendToSally(command: Record<string, unknown>): Promise<boolean> {
  if (!SALLY_ADMIN_TOKEN) {
    console.log("[Bridge] SALLY_ADMIN_TOKEN not set, skipping Sally command:", command)
    return false
  }

  try {
    const response = await fetch(`${SALLY_REMOTE_CONTROL_URL}/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SALLY_ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        device_id: SALLY_DEVICE_ID,
        ...command,
      }),
    })

    if (!response.ok) {
      console.error("[Bridge] Sally command failed:", response.status, await response.text())
      return false
    }

    console.log("[Bridge] Sally command sent:", command)
    return true
  } catch (error) {
    console.error("[Bridge] Failed to send Sally command:", error)
    return false
  }
}

// Handle incoming commands from dashboard
async function handleCommand(data: Record<string, unknown>) {
  const { type } = data

  switch (type) {
    case "volume": {
      const value = data.value as number
      deviceState.speaker.volume = value
      deviceState.speaker.muted = false
      previousVolume = value
      await sendToSally({ type: "set_volume", percent: value })
      break
    }

    case "mute": {
      const muted = data.muted as boolean
      deviceState.speaker.muted = muted
      if (muted) {
        previousVolume = deviceState.speaker.volume
        await sendToSally({ type: "set_volume", percent: 0 })
      } else {
        deviceState.speaker.volume = previousVolume
        await sendToSally({ type: "set_volume", percent: previousVolume })
      }
      break
    }

    case "transport": {
      const action = data.action as string
      switch (action) {
        case "play":
          await sendToSally({ type: "spotify_play" })
          break
        case "pause":
          await sendToSally({ type: "spotify_pause" })
          break
        case "skipForward":
          await sendToSally({ type: "spotify_next" })
          break
        case "skipBack":
          await sendToSally({ type: "spotify_previous" })
          break
      }
      break
    }

    case "encoder": {
      const pad = data.pad as number
      const value = data.value as number
      if (deviceState.macroPads[pad - 1]) {
        deviceState.macroPads[pad - 1].encoder.value = value
      }
      console.log("[Bridge] Encoder update - Pad:", pad, "Value:", value)
      break
    }

    case "macroButton": {
      const pad = data.pad as number
      const button = data.button as number
      const pressed = data.pressed as boolean
      if (deviceState.macroPads[pad - 1]?.buttons[button]) {
        deviceState.macroPads[pad - 1].buttons[button].pressed = pressed
      }
      console.log("[Bridge] Macro button - Pad:", pad, "Button:", button, "Pressed:", pressed)
      break
    }

    case "ptz": {
      const action = data.action as string
      const camera = deviceState.cameras.ptz
      switch (action) {
        case "up":
          camera.tilt = Math.min(90, camera.tilt + 5)
          break
        case "down":
          camera.tilt = Math.max(-90, camera.tilt - 5)
          break
        case "left":
          camera.pan = Math.max(-180, camera.pan - 5)
          break
        case "right":
          camera.pan = Math.min(180, camera.pan + 5)
          break
        case "zoomIn":
          camera.zoom = Math.min(10, camera.zoom + 0.5)
          break
        case "zoomOut":
          camera.zoom = Math.max(1, camera.zoom - 0.5)
          break
      }
      console.log("[Bridge] PTZ control:", action, "Pan:", camera.pan, "Tilt:", camera.tilt, "Zoom:", camera.zoom)
      break
    }

    case "effect": {
      const name = data.name as string
      console.log("[Bridge] Effect triggered:", name)
      break
    }

    default:
      console.log("[Bridge] Unknown command type:", type, data)
  }

  // Broadcast updated state to all clients
  broadcastState()
}

// Create WebSocket server
const wss = new WebSocketServer({ port: DJ_SALLY_WS_PORT })

console.log(`[Bridge] WebSocket server starting on port ${DJ_SALLY_WS_PORT}`)
console.log(`[Bridge] Sally API URL: ${SALLY_REMOTE_CONTROL_URL}`)
console.log(`[Bridge] Sally Device ID: ${SALLY_DEVICE_ID}`)
console.log(`[Bridge] Sally Admin Token: ${SALLY_ADMIN_TOKEN ? "Set" : "Not set"}`)

wss.on("connection", (ws) => {
  console.log("[Bridge] Client connected")
  clients.add(ws)

  // Mark speaker as connected when client connects
  deviceState.speaker.connected = true
  deviceState.raspberryPi.connected = true

  // Send initial state
  ws.send(
    JSON.stringify({
      type: "state_update",
      payload: deviceState,
    })
  )

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log("[Bridge] Received:", data)
      await handleCommand(data)
    } catch (error) {
      console.error("[Bridge] Failed to parse message:", error)
    }
  })

  ws.on("close", () => {
    console.log("[Bridge] Client disconnected")
    clients.delete(ws)

    if (clients.size === 0) {
      deviceState.speaker.connected = false
    }
  })

  ws.on("error", (error) => {
    console.error("[Bridge] WebSocket error:", error)
  })
})

wss.on("listening", () => {
  console.log(`[Bridge] WebSocket server listening on ws://localhost:${DJ_SALLY_WS_PORT}`)
})

// Export state for API routes
export { deviceState, handleCommand }
