# RVM-dash Workspace Rules & Permanent Memory

## Kiosk Desktop Application Roles
- **`PecoDropDesktopApp`** -> **ENTERPRISE / CORPORATE CLIENTS**
  - Path: `d:\GIT-HUB\RVM-dash\PecoDropDesktopApp`
  - Purpose: Dedicated for corporate campuses, private offices, factories, and university workplaces (e.g., Engro, Unilever, PepsiCo, Banks).
  - Materials: Multi-material recycling — Plastic (PET), Aluminum Cans (Metal), and Document/Office Paper (by weight in Kg via HX711 load cell).
  - Features: Corporate employee greeting, department tracking, cafeteria discounts, internal corporate perks, and CSR/ESG environmental metrics.

- **`RVMDesktopApp`** -> **GENERAL PUBLIC**
  - Path: `d:\GIT-HUB\RVM-dash\RVMDesktopApp`
  - Purpose: Dedicated for the general public at public shopping malls, metro/transit stations, commercial hubs, and municipal parks.
  - Materials: Standard public container intake (primarily PET bottles & beverage cans).
  - Features: Citizen gamification, instant mobile wallet payouts (EasyPaisa, JazzCash, mobile load), public consumer merchant coupons, and national leaderboards.

## Core Development Guidelines
1. **Never Mix Logic**: Keep code, database configs, serial ports, UI views, and ad playlists strictly separated between `PecoDropDesktopApp` and `RVMDesktopApp`.
2. **Context Awareness**: Whenever the user asks to modify, run, build, or debug a desktop app, verify whether the task targets the Enterprise client (`PecoDropDesktopApp`) or the Public system (`RVMDesktopApp`).
