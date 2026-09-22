# Reverse Vending Machine

The current hardware milestone implements plastic-bottle, metal-can, and paper
compartments on one Arduino Mega. Plastic and metal each use three ultrasonic
sizing sensors.
Metal also uses an inductive proximity sensor. Paper uses an HX711 load cell
instead of photoelectric sizing sensors.

In `Arduino/RVM_Arduino/RVM_Arduino.ino`, set `PLASTIC_DISABLED`,
`METAL_DISABLED`, and `PAPER_DISABLED` independently: `true` skips that
compartment, and `false` enables it. The default enables only plastic. When
all three compartments are connected, set all three flags to `false` and upload
the sketch again. Disabled compartments skip hardware setup, calibration,
detection, and recovery checks. At least one compartment must be enabled.

## Hardware and serial protocol

- Arduino Mega: configure `ArduinoPort` and use 115200 baud

Sizing logic is `bottom = SMALL`, `bottom + middle = MEDIUM`, and
`bottom + middle + top = LARGE`. The Mega reports
`SIZE:<size>;MATERIAL:PLASTIC` for the plastic opening or
`SIZE:<size>;MATERIAL:CAN` for the metal opening, followed by
`BOTTLE:CLEARED;COMPARTMENT:<PLASTIC|METAL|PAPER>`
after the item drops into its bin.

At calibration, every sizing ultrasonic records its empty-pipe distance. During
idle operation the iris and drop gates stay closed and only each compartment's
entrance ultrasonic is checked. After an entrance object is detected, the iris
opens and the controller waits for repeated distance changes at the bottom
sizing ultrasonic. It then lets the item settle and samples all three sizing
levels. Two changed readings out of three are required at each level. A changed
bottom level alone is small; changed bottom and middle levels are medium; all
three changed levels are large. Any non-continuous pattern is rejected as a
sensor error.

An invalid sizing pattern, arrival timeout, clear timeout, failed load-cell
reading, or three consecutive missing entrance echoes disables only the affected
compartment, closes its iris, and opens its bottom gate for 1 second to release
the item without credit. The bottom gate then closes automatically. A blocked
bin prevents this release, including before bin-full debounce completes.
No unconfirmed drop receives points. Other
healthy compartments remain in service. Working faults automatically retry
recalibration 1 second after the purge gate closes, one sensor reading per
main-loop pass, while healthy compartments continue normal intake. Each
ultrasonic must produce three stable readings near its last known empty
baseline; paper also requires three
stable, near-zero HX711 readings before its tare is updated. Successful recovery
updates only that compartment's baselines, clears its fault, and restores its
counting card automatically. No recovery event awards points.

Remove any retained object and repair disconnected sensors: a trapped item or
missing echo must not become the new empty baseline. Failed attempts retry after
another 1 second. Full bins pause recovery. `STOP`/`RESET` cancel pending
attempts; recovery resumes only after `START`. A compartment that has never
completed an empty calibration still needs an explicit `CALIBRATE` with the
chambers empty, because there is no trusted baseline for automatic empty checks.
Calibration succeeds when at least one enabled compartment calibrates correctly;
the others report their own failure. Explicit calibration temporarily pauses
intake. `START` and `CALIBRATE` are rejected during an active item cycle.

Power-on operation is automatic: irises close and enabled bottom gates first
open together for 1 second to clear the chambers, unless their bin is blocked.
Bottom gates then close and settle for 700 ms before calibration. Every
ultrasonic uses three stable readings, with 60 ms between triggers and no extra
per-sample delay; the paper scale uses five tare readings. Empty-pipe distances
are calibrated, the paper scale is tared,
and the controller enters active idle mode. No `START` command is required after
a successful power-on calibration. `STOP` disables object detection and `START`
resumes it. The desktop app relies on the DTR-triggered startup calibration and
requests status on connect, avoiding a second RESET/CALIBRATE cycle. Manual
calibration remains available. STOP/RESET also cancel a purge or calibration.

Paper reports `SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:<kg>` before its bottom gate
opens and the paper drops into the green bin. Its top ultrasonic opens the iris;
The load cell is read immediately without waiting for the bottom ultrasonic.
The bottom ultrasonic and load cell together confirm the scale has cleared.
On a paper weight timeout, `PAPER:WEIGHT_TIMEOUT_RAW` reports the raw reading,
tare, and signed grams to help diagnose scale calibration or wiring.
Send `SCALE` in the Serial Monitor (115200 baud, newline) to compare raw readings
with the platform empty and with a known weight. It also works after calibration
fails; `TARE_VALID:NO` means the raw reading has no valid tare yet.
`ERROR:HX711_NOT_READY_DOUT_HIGH` means no conversion became ready within one
second. `ERROR:HX711_DOUT_NOT_HIGH_AFTER_READ` means DOUT did not return HIGH
after the 25 clock pulses; check the DT/SCK connections, module power, and ground.
Failed HX711 reads are not substituted with the tare value or accepted as zero
weight. Calibration requires all tare samples to be read successfully.

### Arduino Mega pins

| Compartment | Entrance ultrasonic | Iris servo | Bottom servo | Sizing ultrasonics (bottom, middle, top) |
|---|---:|---:|---:|---:|
| Plastic | 9 / 10 | 11 | 12 | 22/23, 24/41, 42/43 |
| Metal can | 25 / 26 | 27 | 28 | 29/30, 31/44, 45/46 |
| Paper | top 33 / 34, bottom 39 / 40 | 35 | 36 | HX711 instead |

The metal inductive sensor signal is pin `32`. The paper HX711 uses `DOUT = 37`
and `SCK = 38`.

### Compartment faults, bin sensors, and MQ6

Set `PLASTIC_BIN_SENSOR_ENABLED`, `METAL_BIN_SENSOR_ENABLED`, and
`PAPER_BIN_SENSOR_ENABLED` independently in the firmware. Plastic bin monitoring
is currently **disabled** because its sensor is not connected; metal and paper
monitoring remain enabled. Set any other uninstalled sensor's flag to `false`.
A disabled sensor reports bin clear and does not block intake, gate purge, or
automatic recovery. Set its flag back to `true` and upload when the sensor is
installed. This setting is separate from disabling the whole compartment.

The new sensors use digital outputs, with a common ground and a signal compatible
with the Mega input. The default assumes **LOW = blocked/alarm** and uses
`INPUT_PULLUP`; adjust `BIN_BLOCKED_STATE` or `MQ6_ALARM_STATE` for modules with
the opposite polarity. These are proposed pins; verify them against the actual
wiring before uploading.

| Sensor digital output | Mega pin |
|---|---:|
| Plastic bin sensor | D47 |
| Metal bin sensor | D48 |
| Paper bin sensor | D49 |
| MQ6 module DO | D50 |

A bin must remain blocked for 500 ms to register full and clear for 2 seconds
to recover. A full bin closes only its own compartment's gates and disables its
counting card. If it interrupts an intake, that intake is cancelled without
credit; remove any retained item when emptying the bin. An independent working
failure clears only after successful automatic recalibration, not merely because
the bin clears. Previously earned counts and
points remain visible and unchanged.

MQ6 is **warning-only**, as configured for this machine. Its digital alarm is
debounced for 1 second on both edges and displays `MQ6: Smoke / gas detected`
without stopping intake or counting. Set the module's digital threshold for the
installation; this implementation does not read its analog output or estimate
gas concentration. Sensor polarity, threshold, and physical response need a
hardware check.

Firmware sends these complete snapshots on changes, every 2 seconds, and on
`STATUS`, so both portrait and landscape screens can restore warnings on connect:

```text
COMPARTMENT:PLASTIC;WORKING:FAILED;BIN:CLEAR
COMPARTMENT:METAL;WORKING:OK;BIN:FULL
COMPARTMENT:PAPER;WORKING:OK;BIN:CLEAR
MQ6:WARNING
MQ6:CLEAR
```

Each screen shows `<name> working failed` and/or `<name> bin is full` in a
persistent banner and blacks out/disables that material's counting card, showing
only the compartment name and unavailable reason in white. Cards start unavailable
until their hardware status is confirmed, and return to unavailable on connection
loss. The PAPER card shows the latest accepted weight and cumulative session
weight in kg instead of S/M/L and pieces; session reset clears both weights.
Compile-time
disabled compartments also report working failed; the existing default still
enables only plastic. Set all three `*_DISABLED` flags to `false` when all three
compartments are connected. Fault detection uses sensor readings and intake/drop
timeouts; there is no separate servo-position or motor-stall feedback.

Run the availability and disabled-card regression checks with:

```powershell
dotnet run --project Tests/CompartmentChecks.csproj
```

Do not connect a 6-36V industrial inductive-sensor output directly to the
Arduino. Use a correctly sized divider, level shifter, or optocoupler so pin 32
never exceeds the Mega input-voltage limit. All low-voltage supplies must share
a common ground.

Paper weight calibration is controlled by `PAPER_COUNTS_PER_GRAM` in
the sketch. Start with an empty platform for `CALIBRATE`, place a known weight on
the scale, then adjust that value until the reported `WEIGHT_KG` is correct.

## Database

Run `Database.sql` against SQL Server before starting the application. It is
idempotent for both new and existing `RVMDB` databases. Each item row stores its
session, item type, size, points, acceptance state, and date. The mobile number
is attached to every item in the session when the user
finishes the session and credits the wallet.

Copy `config.example.txt` to `config.txt`, then set `ConnectionString` and any
optional Arduino serial settings.
`config.txt` is local-only and is copied next to the executable.

## Videos

- Put advertisement videos in `Ads\Advertisements`. All supported videos are
  played in filename order and the playlist loops continuously.
- Put the instruction video in `Ads\Instructions`. The first supported video
  in filename order is used and loops continuously.
- Supported formats: `.mp4`, `.avi`, `.wmv`, `.mkv`, `.mov`, and `.m4v`.

The folders can be changed with `AdvertisementVideoFolder` and
`InstructionVideoFolder` in `config.txt`.

## Build

```powershell
dotnet restore RVMDesktopApp.sln
dotnet build RVMDesktopApp.sln
```

Flash `Arduino/RVM_Arduino/RVM_Arduino.ino` with Arduino IDE or `arduino-cli`.

Iris timing: entrance detection requires 3 confirming readings and a 200 ms
hold. Normal intake keeps the iris open for at least 3000 ms; STOP can interrupt
this hold. Paper weighing starts after this insertion window. Adjust
`ENTRANCE_HOLD_MS` and `IRIS_MIN_OPEN_MS` in the sketch to tune these timings.
Servos receive their target angle directly; these settings change response and
hold times, not the motor's physical travel speed.
