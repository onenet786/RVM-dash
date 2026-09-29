# Objective
Update the existing PecoDropDesktopApp hardware simulator/demo testing window so it accurately represents the enterprise PecoDrop dual-display kiosk materials: plastic bottles, metal/cans, and office paper. Remove the public-RVM UBC/Tetra Pak concept from this PecoDrop-only simulator.

# Target audience
PecoDrop kiosk installers, administrators, and enterprise demo operators testing the corporate kiosk without connected Arduino hardware.

# Existing implementation
- Main file: `D:/GIT-HUB/RVM-dash/PecoDropDesktopApp/DemoTestingWindow.cs`
- Simulator interface: `D:/GIT-HUB/RVM-dash/PecoDropDesktopApp/IKioskSimulatorTarget.cs`
- Implementations: `MainWindow.xaml.cs` and `LandscapeWindow.xaml.cs`
- Preserve the established dark navy, emerald/cyan/magenta diagnostic-panel styling and compact 751x599-ish operator-window layout.

# Functional requirements
1. Step 2 must show exactly the physical PecoDrop apertures:
   - Plastic bottle (circle / neon magenta identity is acceptable within existing visual system)
   - Metal beverage can (triangle / emerald)
   - Office paper (square / cyan)
2. Replace UBC labels, description, keyboard behavior, and material value with PAPER.
3. When PAPER is selected, Step 3 must become a paper weight entry rather than Small/Medium/Large cards. Provide a practical grams input with validation and a concise indication of the effective points-per-kg rule.
4. Accepting paper must drive the exact same production flow as Arduino paper input, including weight in kilograms, paper session counters, reward calculation, local transaction persistence, and central sync payload. Do not fake paper as a sized container.
5. Preserve plastic/can S/M/L selection and all existing session/start/accept/reject/finish hotkeys.
6. Add intuitive paper hotkeys while retaining `U/3` as a backwards-compatible alias if useful; visible instructions should say PAPER, not UBC.
7. Rejected paper should not award points but should still simulate a rejected material appropriately.
8. Keep the UI usable at its current fixed/minimum window dimensions without clipping.
9. Update comments and accessible/operator text so no PecoDrop simulator copy refers to UBC/Tetra Pak.
10. Build the WPF project and resolve any errors.

# Aesthetic direction
An industrial diagnostic console: compact, highly legible, purposeful, and consistent with the current screen. Paper weight controls should look like a calibrated scale module, using cyan/blue cues associated with PecoDrop's square paper aperture.

# Content structure
Retain the current five-step workflow and summary header. Only adapt material selection, conditional measurement controls, instructions, and simulation plumbing needed for weighted paper.

# Typography and colors
Reuse existing WPF typography, brushes, borders, and spacing. Avoid introducing a new visual system. Paper is cyan/blue; accepted is emerald; warnings/errors remain red/amber.

# Memorable element
The Step 3 panel visibly transforms into a compact digital paper scale readout when PAPER is selected.

# Image needs
No new raster imagery. Reuse existing assets where appropriate; do not use the Tetra Pak dance asset for office paper.

# Output path
Modify the real application files under `D:/GIT-HUB/RVM-dash/PecoDropDesktopApp` directly.
