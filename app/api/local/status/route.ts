import { NextResponse } from "next/server"

// This returns mock status when running on Vercel
// The actual state is managed by the local bridge server
export async function GET() {
  const wsPort = process.env.DJ_SALLY_WS_PORT || "8080"
  const wsUrl = process.env.NEXT_PUBLIC_DJ_SALLY_WS_URL || `ws://localhost:${wsPort}`

  return NextResponse.json({
    bridge: {
      wsUrl,
      wsPort,
    },
    sally: {
      url: process.env.SALLY_REMOTE_CONTROL_URL || "http://127.0.0.1:8787",
      deviceId: process.env.SALLY_DEVICE_ID || "sally-samsung",
      tokenConfigured: !!process.env.SALLY_ADMIN_TOKEN,
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}
