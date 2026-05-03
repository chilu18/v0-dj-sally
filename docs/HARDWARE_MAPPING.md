# DJ Sally HID Mapping

## Devices

The two macro pads are CH57x-style programmable HID devices.

- USB VID/PID: `1189:8890`
- Linux programming tool: `ch57x-keyboard-tool`
- Tool install path on Mac mini: `/home/hs-chilu/.cargo/bin/ch57x-keyboard-tool`

The pads are programmed onboard, so the profile persists after unplugging.

## USB Paths

Deck A is the pad on USB path `usb-0:2`.

- Keyboard interfaces: `event5`, `event6`
- Mouse/knob interface: `event13`
- Raw interfaces: `hidraw1`, `hidraw2`, `hidraw3`

Deck B is the pad on USB path `usb-0:3`.

- Keyboard interfaces: `event14`, `event15`
- Mouse/knob interface: `event16`
- Raw interfaces: `hidraw4`, `hidraw5`, `hidraw6`

## Confirmed Physical Layout

With the knob on the side, the three physical keys are mapped by distance from the knob.

### Deck A

| Physical control | Programmed key | Linux code | DJ Sally action |
| --- | --- | ---: | --- |
| Key farthest from knob | `F13` | `183` | CUE |
| Middle key | `F14` | `184` | PLAY |
| Key closest to knob | `F15` | `185` | SYNC |
| Knob rotate left / CCW | `F16` | `186` | Knob left |
| Knob click | `F17` | `187` | Knob click |
| Knob rotate right / CW | `F18` | `188` | Knob right |

### Deck B

| Physical control | Programmed key | Linux code | DJ Sally action |
| --- | --- | ---: | --- |
| Key farthest from knob | `F19` | `189` | CUE |
| Middle key | `F20` | `190` | PLAY |
| Key closest to knob | `F21` | `191` | SYNC |
| Knob rotate left / CCW | `F22` | `192` | Knob left |
| Knob click | `F23` | `193` | Knob click |
| Knob rotate right / CW | `F24` | `194` | Knob right |

Click-and-rotate was tested. The pad emits the click key, but no distinct held-rotation event was observed.

## Programming Profiles

The 3-key/1-knob model must be configured as `rows: 1`, `columns: 3`, `knobs: 1`.
All three onboard layers are programmed identically so the profile works regardless of layer state.

Deck A profile:

```yaml
orientation: normal
rows: 1
columns: 3
knobs: 1
layers:
  - buttons:
      - ["f13", "f14", "f15"]
    knobs:
      - ccw: "f16"
        press: "f17"
        cw: "f18"
  - buttons:
      - ["f13", "f14", "f15"]
    knobs:
      - ccw: "f16"
        press: "f17"
        cw: "f18"
  - buttons:
      - ["f13", "f14", "f15"]
    knobs:
      - ccw: "f16"
        press: "f17"
        cw: "f18"
```

Deck B profile:

```yaml
orientation: normal
rows: 1
columns: 3
knobs: 1
layers:
  - buttons:
      - ["f19", "f20", "f21"]
    knobs:
      - ccw: "f22"
        press: "f23"
        cw: "f24"
  - buttons:
      - ["f19", "f20", "f21"]
    knobs:
      - ccw: "f22"
        press: "f23"
        cw: "f24"
  - buttons:
      - ["f19", "f20", "f21"]
    knobs:
      - ccw: "f22"
        press: "f23"
        cw: "f24"
```

## Upload Commands

Confirm addresses first:

```bash
lsusb -d 1189:8890
```

Current addresses used during setup:

- Deck A: `3:18`
- Deck B: `3:19`

Upload:

```bash
sudo ch57x-keyboard-tool --vendor-id 0x1189 --product-id 0x8890 --address 3:18 upload < /home/hs-chilu/vms/keypad-windows/dj-sally-deck-a.yaml
sudo ch57x-keyboard-tool --vendor-id 0x1189 --product-id 0x8890 --address 3:19 upload < /home/hs-chilu/vms/keypad-windows/dj-sally-deck-b.yaml
```

If the pads are unplugged and replugged, the USB device numbers may change. Re-run `lsusb -d 1189:8890` before uploading again.
