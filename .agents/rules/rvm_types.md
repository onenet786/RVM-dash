# RVM Application Roles & Target Audience Guidelines

This repository supports **two distinct types of Reverse Vending Machine (RVM) kiosk applications**:

1. **`PecoDropDesktopApp`** -> **ENTERPRISE / CORPORATE CLIENTS**
   - **Target Audience**: Corporate clients, private enterprises, business campuses, factories, and university offices (e.g., Engro, Unilever, PepsiCo, Banks).
   - **Location**: `d:\GIT-HUB\RVM-dash\PecoDropDesktopApp`
   - **Materials**: Multi-material recycling — Plastic (PET Bottles), Aluminum Cans (Metal), and Document/Office Paper (by weight in Kg with HX711 load cell).
   - **Workflow**: Tailored for enterprise employees with corporate employee greetings, department tracking, cafeteria discounts, internal corporate perks, and CSR/ESG environmental sustainability reporting.

2. **`RVMDesktopApp`** -> **GENERAL PUBLIC**
   - **Target Audience**: General public, shoppers, commuters, and citizens at public shopping malls, metro/transit stations, commercial centers, and public parks.
   - **Location**: `d:\GIT-HUB\RVM-dash\RVMDesktopApp`
   - **Materials**: Standard public container intake (primarily PET bottles & beverage cans).
   - **Workflow**: Public citizen gamification, instant digital wallet rewards (EasyPaisa, JazzCash, mobile load), national eco-leaderboards, and public consumer merchant coupons.

## Critical Rules for Development:
- **Permanent Role Assignment**:
  - **`PecoDropDesktopApp` = Enterprise / Corporate Client**
  - **`RVMDesktopApp` = General Public**
- **Strict Separation**: Never mix, cross-contaminate, or accidentally overwrite files, UI designs, or logic between `RVMDesktopApp` and `PecoDropDesktopApp`.
- **Target Verification**: When making updates, building, deploying, running kiosk scripts, or modifying configuration (`config.txt`), always ensure the changes apply specifically to the intended RVM type requested by the user.
- **Independent Hardware & Configs**: Keep separate database configurations, serial port assignments, ad playlists, and calibration parameters for each application.
