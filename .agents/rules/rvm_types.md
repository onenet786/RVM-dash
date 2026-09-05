# RVM Application Types Guidelines

This repository supports **two distinct types of Reverse Vending Machines (RVMs)**:

1. **`RVMDesktopApp`** (Standard RVM Type):
   - Located at: `d:\GIT-HUB\RVM-dash\RVMDesktopApp`
   - Handles standard RVM machine kiosk workflows, advertisements, and hardware integrations.

2. **`PecoDropDesktopApp`** (PecoDrop RVM Type):
   - Located at: `d:\GIT-HUB\RVM-dash\PecoDropDesktopApp`
   - Handles PecoDrop-specific kiosk workflows, configurations, and operations.

## Critical Rules for Development:
- **Strict Separation**: Never mix, cross-contaminate, or accidentally overwrite files between `RVMDesktopApp` and `PecoDropDesktopApp`.
- **Target Verification**: When making updates, building, deploying, running kiosk scripts, or modifying configuration (`config.txt`), always ensure the changes apply specifically to the intended RVM type requested by the user.
- **Independent Hardware & Configs**: Keep separate database configurations, serial port assignments, ad playlists, and calibration parameters for each application.
