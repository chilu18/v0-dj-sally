import { NextRequest, NextResponse } from "next/server"

// This is a fallback HTTP endpoint for commands
// The primary method is WebSocket via the bridge server
// This can be used for testing or when WebSocket isn't available

const SALLY_REMOTE_CONTROL_URL = process.env.SALLY_REMOTE_CONTROL_URL || "http://127.0.0.1:8787"
const SALLY_DEVICE_ID = process.env.SALLY_DEVICE_ID || "sally-samsung"
const SALLY_ADMIN_TOKEN = process.env.SALLY_ADMIN_TOKEN
const SALLY_WAIT_MS = process.env.SALLY_WAIT_MS || "10000"

interface CommandPayload {
  type: string
  [key: string]: unknown
}

// Map dashboard commands to Sally API commands
function mapCommand(command: CommandPayload): Record<string, unknown> | null {
  switch (command.type) {
    case "volume":
      return { type: "set_volume", percent: command.value }

    case "mute":
      // For mute, we set volume to 0. Unmute should restore previous volume
      // This is handled better in the bridge server which tracks state
      return { type: "set_volume", percent: command.muted ? 0 : 65 }

    case "transport":
      switch (command.action) {
        case "play":
          return { type: "spotify_play" }
        case "pause":
          return { type: "spotify_pause" }
        case "skipForward":
          return { type: "spotify_next" }
        case "skipBack":
          return { type: "spotify_previous" }
        default:
          return null
      }

    // These commands only update local state, not forwarded to Sally
    case "encoder":
    case "macroButton":
    case "ptz":
    case "effect":
      console.log(`[API] Local-only command: ${command.type}`, command)
      return null

    default:
      console.log(`[API] Unknown command type: ${command.type}`)
      return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CommandPayload

    if (!body.type) {
      return NextResponse.json(
        { error: "Missing command type" },
        { status: 400 }
      )
    }

    const sallyCommand = mapCommand(body)

    if (!sallyCommand) {
      // Command was handled locally or is unknown
      return NextResponse.json({
        success: true,
        local: true,
        message: `Command ${body.type} processed locally`,
      })
    }

    if (!SALLY_ADMIN_TOKEN) {
      return NextResponse.json(
        { 
          error: "SALLY_ADMIN_TOKEN not configured",
          hint: "Set SALLY_ADMIN_TOKEN in your .env.local file"
        },
        { status: 500 }
      )
    }

    // Forward to Sally API
    const response = await fetch(sallyCommandUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SALLY_ADMIN_TOKEN}`,
      },
      body: JSON.stringify(sallyCommand),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Sally command failed:", response.status, errorText)
      return NextResponse.json(
        { 
          error: "Sally command failed",
          status: response.status,
          details: errorText
        },
        { status: response.status }
      )
    }

    const result = await response.json().catch(() => ({}))

    return NextResponse.json({
      success: true,
      forwarded: true,
      sallyCommand,
      result,
    })
  } catch (error) {
    console.error("[API] Command error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}

function sallyCommandUrl() {
  const base = SALLY_REMOTE_CONTROL_URL.replace(/\/$/, "")
  return `${base}/devices/${encodeURIComponent(SALLY_DEVICE_ID)}/command?wait_ms=${SALLY_WAIT_MS}`
}
