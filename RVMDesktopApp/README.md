# Reverse Vending Machine

This solution uses Arduino Uno sensors for item detection, material detection,
size measurement, entrance-servo control, and drop-gate movement.

## Hardware and serial protocol

- Arduino Uno: `COM16`, 9600 baud

The Uno reports item size and metal-sensor state to the desktop application,
then operates the existing drop gate after the measurement cycle.

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
