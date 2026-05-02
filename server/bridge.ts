import { createReadStream, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { WebSocketServer, WebSocket } from "ws"

loadEnvFiles()

// Environment variables
const SALLY_REMOTE_CONTROL_URL = process.env.SALLY_REMOTE_CONTROL_URL || "http://127.0.0.1:8787"
const SALLY_DEVICE_ID = process.env.SALLY_DEVICE_ID || "sally-samsung"
const SALLY_ADMIN_TOKEN = process.env.SALLY_ADMIN_TOKEN
const DJ_SALLY_WS_PORT = parseInt(process.env.DJ_SALLY_WS_PORT || "8080", 10)
const SALLY_WAIT_MS = parseInt(process.env.SALLY_WAIT_MS || "10000", 10)
const HID_ENABLED = process.env.DJ_SALLY_HID_ENABLED !== "0"
const HID_DECK_A_KEYBOARD =
  process.env.DJ_SALLY_HID_DECK_A_KEYBOARD || "/dev/input/by-path/pci-0000:00:14.0-usb-0:2:1.2-event-kbd"
const HID_DECK_A_KEYBOARD_PRIMARY =
  process.env.DJ_SALLY_HID_DECK_A_KEYBOARD_PRIMARY || "/dev/input/by-path/pci-0000:00:14.0-usb-0:2:1.0-event-kbd"
const HID_DECK_A_ENCODER =
  process.env.DJ_SALLY_HID_DECK_A_ENCODER || "/dev/input/by-path/pci-0000:00:14.0-usb-0:2:1.3-event-mouse"
const HID_DECK_B_KEYBOARD =
  process.env.DJ_SALLY_HID_DECK_B_KEYBOARD || "/dev/input/by-path/pci-0000:00:14.0-usb-0:3:1.2-event-kbd"
const HID_DECK_B_KEYBOARD_PRIMARY =
  process.env.DJ_SALLY_HID_DECK_B_KEYBOARD_PRIMARY || "/dev/input/by-path/pci-0000:00:14.0-usb-0:3:1.0-event-kbd"
const HID_DECK_B_ENCODER =
  process.env.DJ_SALLY_HID_DECK_B_ENCODER || "/dev/input/by-path/pci-0000:00:14.0-usb-0:3:1.3-event-mouse"
const HID_DECK_A_RAW = process.env.DJ_SALLY_HID_DECK_A_RAW || "/dev/hidraw1"
const HID_DECK_B_RAW = process.env.DJ_SALLY_HID_DECK_B_RAW || "/dev/hidraw4"
const HID_DECK_A_RAWS = parsePathList(process.env.DJ_SALLY_HID_DECK_A_RAWS, [HID_DECK_A_RAW, "/dev/hidraw2", "/dev/hidraw3"])
const HID_DECK_B_RAWS = parsePathList(process.env.DJ_SALLY_HID_DECK_B_RAWS, [HID_DECK_B_RAW, "/dev/hidraw5", "/dev/hidraw6"])
const HID_DECK_A_KEYBOARDS = parsePathList(process.env.DJ_SALLY_HID_DECK_A_KEYBOARDS, [
  HID_DECK_A_KEYBOARD_PRIMARY,
  HID_DECK_A_KEYBOARD,
])
const HID_DECK_B_KEYBOARDS = parsePathList(process.env.DJ_SALLY_HID_DECK_B_KEYBOARDS, [
  HID_DECK_B_KEYBOARD_PRIMARY,
  HID_DECK_B_KEYBOARD,
])
const HID_BUTTON_MAP = parseButtonMap(process.env.DJ_SALLY_HID_BUTTON_MAP)
const INPUT_EVENT_SIZE = 24
const EV_KEY = 1
const EV_REL = 2
const KEY_RELEASE = 0
const KEY_PRESS = 1
const KEY_REPEAT = 2
const REL_X = 0
const REL_Y = 1
const REL_WHEEL = 8
const BTN_LEFT = 272
const BTN_MIDDLE = 274
const MODIFIER_KEY_CODES = new Set([29, 42, 54, 56, 97, 100, 125, 126])

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
  hidSetup?: {
    enabled: boolean
    decks: {
      pad: number
      label: string
      rawPath: string
      rawPaths?: string[]
      eventPath: string
      eventPaths?: string[]
      learnedCodes: number[]
      lastEvent: string | null
      lastHex: string | null
      lastSource?: string | null
      lastKnob?: string | null
      knobPressed?: boolean
    }[]
  }
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
  hidSetup: {
    enabled: HID_ENABLED,
    decks: [
      {
        pad: 1,
        label: "Deck A",
        rawPath: HID_DECK_A_RAWS[0] ?? HID_DECK_A_RAW,
        rawPaths: HID_DECK_A_RAWS,
        eventPath: HID_DECK_A_KEYBOARDS[0] ?? HID_DECK_A_KEYBOARD,
        eventPaths: [...HID_DECK_A_KEYBOARDS, HID_DECK_A_ENCODER],
        learnedCodes: [],
        lastEvent: null,
        lastHex: null,
        lastSource: null,
        lastKnob: null,
        knobPressed: false,
      },
      {
        pad: 2,
        label: "Deck B",
        rawPath: HID_DECK_B_RAWS[0] ?? HID_DECK_B_RAW,
        rawPaths: HID_DECK_B_RAWS,
        eventPath: HID_DECK_B_KEYBOARDS[0] ?? HID_DECK_B_KEYBOARD,
        eventPaths: [...HID_DECK_B_KEYBOARDS, HID_DECK_B_ENCODER],
        learnedCodes: [],
        lastEvent: null,
        lastHex: null,
        lastSource: null,
        lastKnob: null,
        knobPressed: false,
      },
    ],
  },
}

// Previous volume for mute/unmute restore
let previousVolume = 65

// Connected clients
const clients = new Set<WebSocket>()
const learnedButtonCodes = new Map<number, number[]>()
const knobPressed = new Map<number, boolean>()

interface InputEvent {
  type: number
  code: number
  value: number
}

function startHidReaders() {
  if (!HID_ENABLED) {
    console.log("[HID] Disabled")
    return
  }

  for (const path of HID_DECK_A_KEYBOARDS) startKeyboardReader(1, path)
  startEncoderReader(1, HID_DECK_A_ENCODER)
  for (const path of HID_DECK_A_RAWS) startRawHidReader(1, path)
  for (const path of HID_DECK_B_KEYBOARDS) startKeyboardReader(2, path)
  startEncoderReader(2, HID_DECK_B_ENCODER)
  for (const path of HID_DECK_B_RAWS) startRawHidReader(2, path)
}

function startRawHidReader(pad: number, path: string) {
  if (!existsSync(path)) {
    updateHidSetup(pad, `raw missing: ${path}`, null, path)
    console.log(`[HID] Deck ${pad} raw missing: ${path}`)
    return
  }

  const stream = createReadStream(path, { highWaterMark: 64 })
  stream.on("data", (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    const hex = buffer.toString("hex")
    const codes = [...buffer.subarray(3)].filter((code) => code > 0)
    updateHidSetup(pad, codes.length ? `raw codes ${codes.join(", ")}` : "raw release", hex, path)

    for (const code of codes) {
      pulseButton(pad, code, path)
    }

    broadcastState()
  })

  stream.on("open", () => {
    updateHidSetup(pad, `raw listening: ${path}`, null, path)
    console.log(`[HID] Deck ${pad} raw listening on ${path}`)
    broadcastState()
  })

  stream.on("error", (error: NodeJS.ErrnoException) => {
    const message =
      error.code === "EACCES"
        ? `raw permission denied: ${path}`
        : `raw failed: ${path} ${error.message}`
    updateHidSetup(pad, message, null, path)
    console.error(`[HID] Deck ${pad} ${message}`)
    broadcastState()
  })
}

function startKeyboardReader(pad: number, path: string) {
  startInputReader(`Deck ${pad} keyboard`, path, (event) => {
    if (event.type !== EV_KEY || event.value === KEY_REPEAT || MODIFIER_KEY_CODES.has(event.code)) {
      return
    }

    const button = resolveButtonIndex(pad, event.code)
    if (button === null) {
      console.log(`[HID] Deck ${pad} unmapped key code ${event.code}`)
      return
    }

    if (event.value !== KEY_PRESS && event.value !== KEY_RELEASE) {
      return
    }

    const deck = deviceState.macroPads[pad - 1]
    if (!deck?.buttons[button]) return

    deck.connected = true
    deck.buttons[button].pressed = event.value === KEY_PRESS
    updateHidSetup(pad, `event code ${event.code} ${deck.buttons[button].pressed ? "down" : "up"}`, null, path)
    console.log(
      `[HID] Deck ${pad} ${deck.buttons[button].label} ${deck.buttons[button].pressed ? "down" : "up"} code=${event.code}`
    )
    broadcastState()
  })
}

function startEncoderReader(pad: number, path: string) {
  startInputReader(`Deck ${pad} encoder`, path, (event) => {
    if (event.type === EV_KEY && [BTN_LEFT, BTN_MIDDLE].includes(event.code)) {
      const pressed = event.value === KEY_PRESS
      knobPressed.set(pad, pressed)
      const deck = deviceState.macroPads[pad - 1]
      if (deck) deck.connected = true
      updateHidKnob(pad, `${pressed ? "knob click down" : "knob click up"} code=${event.code}`, pressed, path)
      console.log(`[HID] Deck ${pad} ${pressed ? "knob click down" : "knob click up"} code=${event.code}`)
      broadcastState()
      return
    }

    if (event.type !== EV_REL || ![REL_X, REL_Y, REL_WHEEL].includes(event.code) || event.value === 0) {
      return
    }

    const deck = deviceState.macroPads[pad - 1]
    if (!deck) return

    const held = knobPressed.get(pad) === true
    const direction = event.value > 0 ? "right" : "left"
    deck.connected = true
    deck.encoder.value = clamp(deck.encoder.value + event.value, deck.encoder.min, deck.encoder.max)
    updateHidKnob(pad, `${held ? "click+" : ""}rotate ${direction} code=${event.code} delta=${event.value}`, held, path)
    console.log(
      `[HID] Deck ${pad} ${held ? "click+" : ""}rotate ${direction} value=${deck.encoder.value} code=${event.code} delta=${event.value}`
    )
    broadcastState()
  })
}

function startInputReader(label: string, path: string, onEvent: (event: InputEvent) => void) {
  if (!existsSync(path)) {
    console.log(`[HID] ${label} missing: ${path}`)
    return
  }

  const stream = createReadStream(path, { highWaterMark: INPUT_EVENT_SIZE * 16 })
  let pending = Buffer.alloc(0)

  stream.on("data", (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    pending = Buffer.concat([pending, buffer])
    while (pending.length >= INPUT_EVENT_SIZE) {
      const packet = pending.subarray(0, INPUT_EVENT_SIZE)
      pending = pending.subarray(INPUT_EVENT_SIZE)
      onEvent(parseInputEvent(packet))
    }
  })

  stream.on("open", () => {
    console.log(`[HID] ${label} listening on ${path}`)
  })

  stream.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EACCES") {
      console.error(
        `[HID] ${label} permission denied for ${path}. Add hs-chilu to the input group or install a udev rule for 1189:8890.`
      )
      return
    }
    console.error(`[HID] ${label} failed for ${path}:`, error.message)
  })
}

function parseInputEvent(packet: Buffer): InputEvent {
  return {
    type: packet.readUInt16LE(16),
    code: packet.readUInt16LE(18),
    value: packet.readInt32LE(20),
  }
}

function resolveButtonIndex(pad: number, code: number): number | null {
  const configured = HID_BUTTON_MAP.get(`${pad}:${code}`)
  if (configured !== undefined) return configured

  const learned = learnedButtonCodes.get(pad) ?? []
  const existing = learned.indexOf(code)
  if (existing >= 0) return existing
  if (learned.length >= 3) return null

  learned.push(code)
  learnedButtonCodes.set(pad, learned)
  syncLearnedCodes(pad)
  console.log(`[HID] Deck ${pad} learned key code ${code} as button ${learned.length - 1}`)
  return learned.length - 1
}

function pulseButton(pad: number, code: number, source?: string) {
  const button = resolveButtonIndex(pad, code)
  if (button === null) {
    updateHidSetup(pad, `raw unmapped code ${code}`, null, source)
    console.log(`[HID] Deck ${pad} raw unmapped code ${code}`)
    return
  }

  const deck = deviceState.macroPads[pad - 1]
  if (!deck?.buttons[button]) return

  deck.connected = true
  deck.buttons[button].pressed = true
  updateHidSetup(pad, `raw code ${code} -> ${deck.buttons[button].label}`, null, source)
  console.log(`[HID] Deck ${pad} ${deck.buttons[button].label} pulse code=${code}`)
  setTimeout(() => {
    deck.buttons[button].pressed = false
    broadcastState()
  }, 180).unref()
}

function updateHidSetup(pad: number, lastEvent: string, lastHex: string | null, source?: string) {
  const deck = deviceState.hidSetup?.decks.find((value) => value.pad === pad)
  if (!deck) return
  deck.lastEvent = lastEvent
  if (lastHex !== null) deck.lastHex = lastHex
  if (source) deck.lastSource = source
  deck.learnedCodes = [...(learnedButtonCodes.get(pad) ?? [])]
}

function syncLearnedCodes(pad: number) {
  const deck = deviceState.hidSetup?.decks.find((value) => value.pad === pad)
  if (!deck) return
  deck.learnedCodes = [...(learnedButtonCodes.get(pad) ?? [])]
}

function updateHidKnob(pad: number, lastKnob: string, pressed: boolean, source?: string) {
  const deck = deviceState.hidSetup?.decks.find((value) => value.pad === pad)
  if (!deck) return
  deck.lastEvent = lastKnob
  deck.lastKnob = lastKnob
  deck.knobPressed = pressed
  if (source) deck.lastSource = source
}

function parseButtonMap(value: string | undefined): Map<string, number> {
  const result = new Map<string, number>()
  if (!value?.trim()) return result

  for (const deckPart of value.split(";")) {
    const [deckName, codesText] = deckPart.split(":")
    const pad = deckName?.trim().toUpperCase() === "B" ? 2 : 1
    const codes = codesText
      ?.split(",")
      .map((code) => parseInt(code.trim(), 10))
      .filter(Number.isFinite) ?? []
    codes.slice(0, 3).forEach((code, index) => result.set(`${pad}:${code}`, index))
  }
  return result
}

function parsePathList(value: string | undefined, fallback: string[]) {
  const paths = value
    ?.split(",")
    .map((path) => path.trim())
    .filter(Boolean)

  return paths?.length ? paths : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

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
    const response = await fetch(sallyCommandUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SALLY_ADMIN_TOKEN}`,
      },
      body: JSON.stringify(command),
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

function sallyCommandUrl() {
  const base = SALLY_REMOTE_CONTROL_URL.replace(/\/$/, "")
  return `${base}/devices/${encodeURIComponent(SALLY_DEVICE_ID)}/command?wait_ms=${SALLY_WAIT_MS}`
}

function loadEnvFiles() {
  const shellEnv = new Set(Object.keys(process.env))

  for (const fileName of [".env", ".env.local"]) {
    const filePath = join(process.cwd(), fileName)
    if (!existsSync(filePath)) continue

    const text = readFileSync(filePath, "utf8")
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue

      const index = trimmed.indexOf("=")
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")
      if (/^[A-Z0-9_]+$/.test(key) && !shellEnv.has(key)) {
        process.env[key] = value
      }
    }
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
startHidReaders()

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
