# DJ Sally - Local Mac Testing Guide

This guide explains how to run DJ Sally locally on your Mac for hardware testing with your Raspberry Pi setup.

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐      HTTP       ┌─────────────────┐
│                 │ ◄────────────────► │                 │ ◄─────────────► │                 │
│  Browser        │   ws://localhost   │  Bridge Server  │   POST /command │  Sally API      │
│  Dashboard      │      :8080         │  (Node.js)      │                 │  (8787)         │
│                 │                    │                 │                 │                 │
└─────────────────┘                    └─────────────────┘                 └─────────────────┘
                                              │
                                              │ Updates local state for:
                                              │ - PTZ camera (mock)
                                              │ - Macro pads (mock)
                                              │ - Effects (log only)
                                              ▼
                                       Forwards to Sally:
                                       - Volume control
                                       - Transport (play/pause/skip)
```

## Prerequisites

1. **Sally Remote Control API** running at `http://127.0.0.1:8787`
2. **Node.js 18+** installed on your Mac
3. **pnpm** package manager

## Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd dj-sally
pnpm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Sally API Configuration
SALLY_REMOTE_CONTROL_URL=http://127.0.0.1:8787
SALLY_DEVICE_ID=sally-samsung
SALLY_ADMIN_TOKEN=your-actual-token-here

# WebSocket Bridge
DJ_SALLY_WS_PORT=8080
NEXT_PUBLIC_DJ_SALLY_WS_URL=ws://localhost:8080
```

**Important:** Never expose `SALLY_ADMIN_TOKEN` as a `NEXT_PUBLIC_` variable!

### 3. Start Everything

Run both the Next.js app and the WebSocket bridge:

```bash
pnpm dev:all
```

Or run them separately in two terminals:

```bash
# Terminal 1 - Next.js
pnpm dev

# Terminal 2 - Bridge Server
pnpm bridge
```

### 4. Open Dashboard

1. Open http://localhost:3000 in your browser
2. Click the **Connect** button in the header
3. The status indicator should turn green when connected

## Testing Commands

### Volume Control

Move the volume slider or click the mute button. These commands are forwarded to Sally:

- `{ type: "set_volume", percent: 0-100 }` - Set volume
- Volume is set to 0 when muted, restored when unmuted

### Transport Controls

Click play/pause/skip buttons. These are forwarded to Sally:

- `{ type: "spotify_play" }` - Play
- `{ type: "spotify_pause" }` - Pause  
- `{ type: "spotify_next" }` - Skip forward
- `{ type: "spotify_previous" }` - Skip back

### Local-Only Controls

These update state locally but don't forward to Sally (yet):

- **Macro Pad Buttons** - Button press states
- **Encoder/Jog** - Rotary encoder values
- **PTZ Camera** - Pan/tilt/zoom controls
- **Effects** - Effect button triggers

## API Endpoints

### Health Check

```bash
curl http://localhost:3000/api/local/health
```

### Status

```bash
curl http://localhost:3000/api/local/status
```

### Send Command (HTTP fallback)

```bash
curl -X POST http://localhost:3000/api/local/command \
  -H "Content-Type: application/json" \
  -d '{"type": "volume", "value": 50}'
```

## Troubleshooting

### WebSocket Won't Connect

1. Make sure the bridge server is running: `pnpm bridge`
2. Check the port isn't in use: `lsof -i :8080`
3. Verify the WebSocket URL in browser console

### Sally Commands Failing

1. Verify Sally API is running at the configured URL
2. Check `SALLY_ADMIN_TOKEN` is set correctly in `.env.local`
3. Look at bridge server console output for errors

### No State Updates

1. Check browser console for WebSocket errors
2. Verify the bridge server console shows "Client connected"
3. Ensure no firewall blocking localhost connections

## Development

### Bridge Server Logs

The bridge server logs all received commands and Sally API interactions:

```
[Bridge] Client connected
[Bridge] Received: { type: 'volume', value: 75 }
[Bridge] Sally command sent: { type: 'set_volume', percent: 75 }
```

### Adding New Commands

To add a new command type:

1. Add the handler in `server/bridge.ts` in the `handleCommand` function
2. Add the Sally API mapping if it should be forwarded
3. Update the dashboard to send the new command type
