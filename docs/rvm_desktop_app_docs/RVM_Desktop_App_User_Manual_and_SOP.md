# RVM MACHINE USER MANUAL & STANDARD OPERATING PROCEDURES (SOP)
## RVMDesktopApp — Next-Generation Reverse Vending Machine Kiosk Platform
**Environmental Solutions Pvt. Ltd | In Collaboration with World Bank Group**  
*Document Ref: ES-RVM-SOP-2026-V2.5 | System Version: .NET 8.0 WPF / Arduino Uno / Central Master Cloud*

---

```
========================================================================================
||                                                                                    ||
||   8888888b.  888     888 888b     d888                                             ||
||   888   Y88b 888     888 8888b   d8888                                             ||
||   888    888 888     888 88888b.d88888                                             ||
||   888   d88P Y88b   d88P 888Y88888P888    REVERSE VENDING MACHINE (RVM)            ||
||   8888888P"   Y88b d88P  888 Y888P 888    INTELLIGENT KIOSK PLATFORM               ||
||   888 T88b     Y88o88P   888  Y8P  888    USER MANUAL & OPERATIONAL SOP            ||
||   888  T88b     Y888P    888   "   888                                             ||
||   888   T88b     Y8P     888       888    Environmental Solutions Pvt. Ltd         ||
||                                                                                    ||
========================================================================================
```

---

## Document Control & Metadata

| Attribute | Specification |
| :--- | :--- |
| **System Name** | RVMDesktopApp (EcoDrop Reverse Vending Kiosk) |
| **Document Classification** | Official Standard Operating Procedure (SOP) & Citizen Manual |
| **Authoring Body** | Technical Operations & Engineering Division, Environmental Solutions Pvt. Ltd |
| **Partner Organization** | World Bank Group — Sustainable Plastics & Green Circular Economy Initiative |
| **Target Hardware** | Industrial Multi-Material RVM Kiosk (Dual Screen / Portrait 1080×1920 & Landscape 1920×1080) |
| **Controller Architecture** | Arduino Uno R3 (COM Serial @ 9600 Baud) + Windows 10/11 IoT Enterprise (.NET 8.0 WPF) |
| **Local Storage** | Microsoft SQL Server LocalDB (`RVMDB`) |
| **Central Cloud** | Central Master Cloud Platform (`https://isprvm.binishaqsoft.com`) |
| **Effective Date** | September 2026 |
| **Revision Status** | Version 2.5 (Standardized against Kiosk Physical Fascia & Multi-Screen Layouts) |

---

# Table of Contents
1. [Executive System Overview](#1-executive-system-overview)
2. [Physical Kiosk Anatomy & Interface Layouts](#2-physical-kiosk-anatomy--interface-layouts)
   - 2.1 Physical Fascia Architecture (Demo Reference)
   - 2.2 Portrait Layout (62% Kiosk / 38% Signage)
   - 2.3 Landscape Layout (56% Kiosk / 44% Signage)
3. [Section 1: Citizen Screen-by-Screen User Manual](#section-1-citizen-screen-by-screen-user-manual)
   - Screen 01: System Boot, Calibration & Hardware Diagnostics
   - Screen 02: Welcome / Home Screen (Bilingual Interface & Live Counters)
   - Screen 03: Step 01 — Ready to Recycle (Press 0 / Touch Aperture)
   - Screen 04: Step 02 — Container Insertion & Real-Time Sensor Classification
   - Screen 05: Step 02 (Cont.) — Anti-Fraud, Jam Detection & Rejection Alert
   - Screen 06: Step 03 — Item Acceptance & Live Metric Accumulation
   - Screen 07: Step 04 — Mobile Wallet Claim & QR Code Identification
   - Screen 08: Step 04 (Cont.) — Transaction Commit & Central Cloud Sync
   - Screen 09: Citizen Experience Feedback Rating
   - Screen 10: Process Completed & Session Reset
4. [Section 2: Standard Operating Procedures (SOPs)](#section-2-standard-operating-procedures-sops)
   - SOP-01: Daily Kiosk Morning Startup & Pre-Flight Sensor Diagnostics
   - SOP-02: Public Citizen Operation & Material Acceptance Rules
   - SOP-03: Storage Bin Emptying & Optical Level Sensor Maintenance (Pins D10/D11)
   - SOP-04: Chamber Lens Cleaning & Ultrasonic Sensor Recalibration (Hotkey `33`)
   - SOP-05: Offline Operation, Failover Queuing & Manual Data Synchronization
   - SOP-06: Emergency Jam Clearance & Anti-Pinch Safety Protocols
   - SOP-07: Digital Signage Video Ads Management & Media Deployment
   - SOP-08: Administrator Access, Diagnostic Hotkeys & Hardware Threshold Tuning
5. [Section 3: Hardware Diagnostics & Sensor Pinout Matrix](#section-3-hardware-diagnostics--sensor-pinout-matrix)
6. [Section 4: Quick Reference Troubleshooting & Error Matrix](#section-4-quick-reference-troubleshooting--error-matrix)

---

# 1. Executive System Overview

The **RVMDesktopApp** is an industrial-grade, mission-critical Reverse Vending Machine (RVM) software designed for public recycling kiosks across Pakistan. Operating under the joint environmental initiative of **Environmental Solutions Pvt. Ltd** and the **World Bank Group**, the kiosk incentivizes citizens to deposit recyclable beverage containers in exchange for digital eco-rewards and mobile wallet credit.

### Key Capabilities:
- **Intelligent Multi-Material Sorting**: Classifies Plastic Bottles (PET), Aluminium Cans (UBC), and Paper Cartons/Cups into Small, Medium, and Large sizes using an optical, inductive, and ultrasonic sensor array.
- **Instant Eco-Impact Analytics**: Calculates live environmental dividends on-screen, including CO₂ emissions prevented ($0.15\text{ kg}/\text{item}$) and fresh water conserved ($0.75\text{ L}/\text{item}$).
- **Instant Digital Rewards**: Credits local Pakistani phone numbers (`03xxxxxxxxx`) or mobile app accounts via live 2-way API synchronization.
- **Dual-Zone Commercial Signage**: Continuously plays high-definition corporate advertisements and environmental awareness videos to ensure commercial viability.
- **Fault-Tolerant Offline Resiliency**: Fully functions during cellular network or Wi-Fi outages by buffering transaction records in a secure local database (`RVMDB`) with automatic cloud sync upon reconnection.

---

# 2. Physical Kiosk Anatomy & Interface Layouts

## 2.1 Physical Fascia Architecture (Demo Enclosure)
The physical kiosk enclosure matches the standardized public profile illustrated in the field demo:

```
+-----------------------------------------------------------------------------------+
|                        RECYCLE PLASTIC • WIN REWARDS                              |
|                   Environmental Solutions Pvt. Ltd • World Bank                   |
+-----------------------------------------------------------------------------------+
|  [ CHAMBER APERTURE 1 ]                  [ CHAMBER APERTURE 2 ]                  |
|    (Plastic / Can Intake)                  (Glass / UBC Intake)                   |
|         (  O  )                                  (  O  )                          |
+------------------------------------+----------------------------------------------+
| INSTRUCTIONS:                      |                                              |
| 1. Insert bottle one by one        |     +----------------------------------+     |
| 2. Enter Phone Number for rewards  |     |                                  |     |
| 3. Help make Pakistan Green!       |     |        HIGH-DEFINITION           |     |
|                                    |     |       INTERACTIVE TOUCH          |     |
| PHYSICAL KEYPAD:                   |     |        KIOSK DISPLAY             |     |
|   [ 1 ] [ 2 ] [ 3 ]                |     |    (Portrait or Landscape)       |     |
|   [ 4 ] [ 5 ] [ 6 ]                |     |                                  |     |
|   [ 7 ] [ 8 ] [ 9 ]                |     |                                  |     |
|   [ * ] [ 0 ] [ # ]                |     +----------------------------------+     |
|   [ Enter ] [ Clear ]              |                                              |
|                                    |                                              |
+------------------------------------+----------------------------------------------+
| [LOGO: Environmental Solutions]      [QR CODE: Scan to Download]   [WORLD BANK]   |
+-----------------------------------------------------------------------------------+
```

## 2.2 Portrait Screen Layout (Vertical Display: 1080 × 1920)
*Implemented in `MainWindow.xaml` — Optimized for tall totem kiosks:*
- **Top 62% (Interactive Kiosk Dashboard)**:
  - **Row 0**: Header Bar with RVM ID (`RVM-001`), Live Health Status Chip, Clock, and Bilingual Welcome (`WELCOME • خوش آمدید`).
  - **Row 1**: Real-Time Hardware Diagnostics Widget (`SERIAL: OK`, `DB: OK`, `API: OK`, `MACHINE: READY`).
  - **Row 2 (Left Column)**: 16:9 Circular Insertion Activation Area / Video Player + Live Session Container Breakdown Cards (Plastic, Can, UBC, Rejects).
  - **Row 2 (Right Column)**: Teal Glassmorphic 7-Step Bilingual Guide (`طریقہ کار`) + Live Top 5 Recyclers Leaderboard + Pulsing Recent Recycler Badge.
  - **Row 3**: Twin Impact & Balance Cards (CO₂ Saved, Water Conserved & Live Point Balance).
- **Bottom 38% (Digital Signage Media Screen)**:
  - Full HD continuous commercial video loop (`MediaElement`), Eco-sustainability slogans (*Reduce, Reuse, Recycle*), and hidden slide-out telemetry console.

## 2.3 Landscape Screen Layout (Horizontal Display: 1920 × 1080)
*Implemented in `LandscapeWindow.xaml` — Optimized for horizontal counter or dual-panel kiosks:*
- **Left 56% (Kiosk Dashboard)**: Header, Diagnostics, Circular Start Button, Container Breakdown, How-To, and Twin Impact Cards in compact horizontal proportion.
- **Right 44% (Digital Signage Screen)**: Dedicated continuous video signage with vertical eco-action banners.

---

# Section 1: Citizen Screen-by-Screen User Manual

The following step-by-step walkthrough details each stage of the recycling journey, aligning the physical kiosk actions with the software's state machine.

---

## Screen 01: System Boot, Calibration & Hardware Diagnostics
*(Corresponds to Demo PDF Page 01: Splash Screen)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 01 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Splash Screen &                   |   +--------------------------------------+   |
|  Diagnostics Check                 |   | [IS LOGO]  REVERSE VENDING MACHINE   |   |
|                                    |   |                                      |   |
|  This screen indicates that the    |   |           SYSTEM STARTING...         |   |
|  RVM is initializing hardware:     |   |                                      |   |
|  - Arduino Serial Port (COM3/COM4) |   |   [●] Serial Controller : CONNECTED  |   |
|  - Storage Bin Optical Sensors     |   |   [●] Local Database    : RVMDB OK   |   |
|  - Drop Gate Servo Motors          |   |   [●] Cloud Telemetry   : ONLINE     |   |
|  - Ultrasonic Chamber Distance     |   |   [●] Chamber Calib     : READY      |   |
|                                    |   |                                      |   |
|  The Home Screen will appear       |   |       === AUTO CALIBRATING ===       |   |
|  automatically once startup is     |   |          Please stand by...          |   |
|  complete. No user input required. |   +--------------------------------------+   |
|                                    |                                              |
+------------------------------------+----------------------------------------------+
```

### Purpose & Behavior:
- **Display Overview**: Upon powering on the kiosk, the system boots into `.NET 8 WPF` in fullscreen kiosk mode. The application runs diagnostic handshakes with the microcontroller and verifies local SQL Server tables (`RVMDB.dbo.Transactions`, `dbo.WalletAccounts`).
- **Chamber Calibration**: The ultrasonic sensor fires 5 test pings against the closed drop gate to establish the clean chamber baseline distance (typically $25\text{ cm} \pm 2\text{ cm}$).
- **Citizen Action**: Stand by. Within 3 to 5 seconds, the system automatically transitions to the Welcome Screen.

---

## Screen 02: Welcome / Home Screen (Bilingual Interface & Live Counters)
*(Corresponds to Demo PDF Page 02: Home Page)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 02 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Home Page                         |   +--------------------------------------+   |
|                                    |   | RVM-001  LIVE 🟢      10:30 AM  [IS] |   |
|  This is the primary standby       |   | WELCOME • خوش آمدید                  |   |
|  screen.                           |   | SERIAL: OK  |  DB: OK  |  API: ONLINE|   |
|                                    |   +--------------------------------------+   |
|  Citizens are greeted with         |   |  (  INSERT BOTTLE / CAN  ) | HOW-TO: |   |
|  bilingual instructions and        |   |  (     داخل کریں         ) | 1.Start |   |
|  live environmental statistics.    |   |  (   PRESS 0 TO START    ) | 2.Insert|   |
|                                    |   +----------------------------+ 3.Scan  |   |
|  To start recycling:               |   | LIVE BREAKDOWN:            | 4.Claim |   |
|  - Press the "0" or "*" button on  |   | [PLASTIC: 0]   [CAN: 0]    | 5.Phone |   |
|    the physical keypad, OR         |   | [UBC: 0]       [REJECT: 0] | 6.Points|   |
|  - Touch the glowing green circle  |   +----------------------------+ 7.Save  |   |
|    on the touchscreen.             |   | IMPACT: 0 CO2 | 0 L WATER  | TOP 5:  |   |
|                                    |   | YOUR BALANCE:  0 PTS       | #1 Ali  |   |
+------------------------------------+----------------------------------------------+
```

### Screen Layout Breakdown:
1. **Header**: Shows Machine ID (`RVM-001`), Live Connection status, Time/Date, and Environmental Solutions/World Bank badges.
2. **Interactive Activation Button**: A large 310px circular trigger with leaf icon and prominent bilingual text: **"INSERT • داخل کریں — PRESS 0 TO START"**.
3. **Live Breakdown Widget**: Displays four real-time counters: Plastic Bottles, Aluminium Cans, Used Beverage Cartons (UBC), and Rejected Items.
4. **Bilingual Guide**: 7 clear steps in English and Urdu Nastaliq explaining the recycling procedure.
5. **Leaderboard & Recent Recycler**: Displays the day's top 5 community eco-champions and pulses when a recent deposit occurs.

---

## Screen 03: Step 01 — Ready to Recycle (Chamber Aperture Active)
*(Corresponds to Demo PDF Page 03: Step 01)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 03 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Step: 01                          |   +--------------------------------------+   |
|                                    |   | RVM-001  🟢 READY      SESSION ACTIVE|   |
|  This is the first active step of  |   +--------------------------------------+   |
|  the recycling process.            |   |                                      |   |
|                                    |   |        >>> INTAKE GATE OPEN <<<      |   |
|  By pressing the "0" button on     |   |                                      |   |
|  the physical keypad, the citizen  |   |      PLEASE INSERT YOUR BOTTLE       |   |
|  signals readiness to deposit.     |   |        ایک ایک کر کے بوتل ڈالیں       |   |
|                                    |   |                                      |   |
|  The motorized security shutter    |   |     [ STATUS: WAITING FOR ITEM ]     |   |
|  opens, the chamber illumination   |   |                                      |   |
|  turns ON, and the intake sensors  |   |   • Ensure container is empty        |   |
|  arm for classification.           |   |   • Do not force or insert hand      |   |
|                                    |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

### Operational Logic:
- Microcontroller receives `START_SESSION` signal.
- The entry gate servo opens the intake flap.
- The UI transitions from idle animation to active listening mode.
- A 30-second citizen inactivity timer begins counting down.

---

## Screen 04: Step 02 — Container Insertion & Sensor Scanning
*(Corresponds to Demo PDF Page 04: Step 02)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 04 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Step: 02                          |   +--------------------------------------+   |
|                                    |   | RVM-001  🔍 SCANNING...              |   |
|  The RVM is now detecting the      |   +--------------------------------------+   |
|  inserted item.                    |   |                                      |   |
|                                    |   |      ⚡ ANALYZING CONTAINER ⚡        |   |
|  Citizen inserts bottle or can     |   |                                      |   |
|  into the aperture base-first.     |   |   Optical Beam (Height) : DETECTED   |   |
|                                    |   |   Inductive Metal       : PLASTIC    |   |
|  Multi-sensor array scans item:    |   |   Ultrasonic Chamber    : 22.4 cm    |   |
|  - Height (IR Pins 2, 7, 8)        |   |   Classification        : PET MEDIUM |   |
|  - Material (Metal Pin 5)          |   |                                      |   |
|  - Length (Ultrasonic Pins 3, 4)   |   |   [ PRESS "1" OR WAIT FOR CONFIRM ]  |   |
|                                    |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

### Multi-Sensor Classification Rules:

| Container Type | Height Profile (IR) | Inductive Metal (D5) | Length (Ultrasonic) | Point Award |
| :--- | :--- | :--- | :--- | :--- |
| **Small Plastic Bottle** ($\le 500\text{ ml}$) | Bottom Triggered (Pin 2) | No Signal (`LOW`) | $< 18\text{ cm}$ | **+5 Points** |
| **Medium Plastic Bottle** ($500\text{ ml} - 1.5\text{ L}$) | Bottom + Middle (Pins 2, 7) | No Signal (`LOW`) | $18 - 26\text{ cm}$ | **+10 Points** |
| **Large Plastic Bottle** ($> 1.5\text{ L}$) | Bottom + Middle + Top (Pins 2, 7, 8) | No Signal (`LOW`) | $> 26\text{ cm}$ | **+15 Points** |
| **Aluminium Can (UBC)** | Any Height Trigger | Metal Detected (`HIGH`) | $10 - 18\text{ cm}$ | **+10 Points** |
| **Tetra Pak / Paper Cup** | Specific Height Trigger | No Metal (`LOW`) | $8 - 16\text{ cm}$ | **+5 Points** |

---

## Screen 05: Step 02 (Continue...) — Item Rejection Advisory
*(Corresponds to Demo PDF Page 05: Step 02 Continue...)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 05 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Step: 02 (Continue...)            |   +--------------------------------------+   |
|  Rejection Advisory                |   | RVM-001  ⚠️ ITEM REJECTED            |   |
|                                    |   +--------------------------------------+   |
|  Machine protects its internal     |   |                                      |   |
|  mechanisms by rejecting:          |   |       ⚠️ CANNOT ACCEPT THIS ITEM      |   |
|                                    |   |         براہ کرم چیز واپس نکالیں       |   |
|  - Containers with liquid residue  |   |                                      |   |
|  - Non-recyclables or glass        |   |   Reason: Liquid / Unrecognized Item |   |
|  - Items jamming the chamber       |   |   Intake Gate: REVERSED (OPEN)       |   |
|                                    |   |                                      |   |
|  Item is safely returned for       |   |   [ PLEASE REMOVE ITEM FROM GATE ]   |   |
|  retrieval without penalty.        |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

---

## Screen 06: Step 03 — Item Accepted & Real-Time Impact Metric
*(Corresponds to Demo PDF Page 06: Step 03)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 06 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Step: 03                          |   +--------------------------------------+   |
|  Item Cleared & Points Awarded     |   | RVM-001  🎉 ITEM ACCEPTED!           |   |
|                                    |   +--------------------------------------+   |
|  When bottle clears internal drop  |   |                                      |   |
|  gate, reward animation triggers:  |   |         🌟 +10 POINTS EARNED!        |   |
|                                    |   |                                      |   |
|  - Points allocated to session     |   |   PET Plastic Medium Recognized      |   |
|  - Drop sensor ping verified       |   |   Total Session Items : 3 Items      |   |
|  - Real-time CO2 & Water update    |   |   Current Points      : 30 PTS       |   |
|                                    |   |                                      |   |
|  Citizen can insert next item or   |   |   [ INSERT MORE OR PRESS ENTER ]     |   |
|  finish session.                   |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

### Cumulative Session Tracking:
- Citizens can deposit up to 50 containers in a single continuous session.
- Live telemetry transmits item count to the Central Cloud dashboard in real-time.
- Environmental impact equations update instantaneously:
  $$\text{CO}_2\text{ Saved (kg)} = \text{Total Accepted Items} \times 0.15$$
  $$\text{Fresh Water Saved (L)} = \text{Total Accepted Items} \times 0.75$$

---

## Screen 07: Step 04 — Mobile Wallet Claim & Identification
*(Corresponds to Demo PDF Page 07: Step 04)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 07 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Step: 04                          |   +--------------------------------------+   |
|  Points Claim & Mobile Entry       |   | 💳 WALLET TRANSFER • انعام حاصل کریں  |   |
|                                    |   +--------------------------------------+   |
|  This screen displays earned       |   | DEPOSIT SUMMARY:                     |   |
|  points and prompts citizen for    |   |   3 Containers Recycled | +30 PTS    |   |
|  identification.                   |   +--------------------------------------+   |
|                                    |   | 📱 ENTER MOBILE NUMBER:              |   |
|  Citizen input methods:            |   |   +--------------------------------+ |   |
|  1. Physical Keypad: Enter         |   |   | 0 3 0 0 1 2 3 4 5 6 7          | |   |
|     11-digit Pakistani phone       |   |   +--------------------------------+ |   |
|     number (03xxxxxxxxx).          |   |   Must start with 03 (11 digits)     |   |
|  2. Press Enter to proceed to      |   |                                      |   |
|     experience rating & crediting. |   |   [ CANCEL ]      [ CREDIT WALLET ✓] |   |
|                                    |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

### Validation & Security Rules:
- **Phone Number Regex Validation**: The software validates standard Pakistani mobile formatting:
  $$\text{Pattern: } \texttt{\textasciicircum 03[0-9]\{9\}\$}$$
- **Strict Digit-Only Input**: Non-numeric characters are automatically stripped.
- **Two-Step Transition**: Upon submitting valid phone number, UI immediately advances to Experience Rating.

---

## Screen 08: Step 04 (Continue...) — Wallet Credited Confirmation
*(Corresponds to Demo PDF Page 08: Step 04 Continue...)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 08 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Step: 04 (Continue...)            |   +--------------------------------------+   |
|  Transaction Approved              |   | RVM-001  🟢 TRANSACTION COMPLETE     |   |
|                                    |   +--------------------------------------+   |
|  Indicates points have been        |   |                                      |   |
|  successfully credited to the      |   |            ✅ SUCCESS!               |   |
|  user's digital account:           |   |                                      |   |
|                                    |   |      +30 REWARD POINTS CREDITED      |   |
|  - Written to Local SQL Database   |   |      TO WALLET: 0300-1234567         |   |
|  - Real-time HTTPS POST to Cloud   |   |                                      |   |
|  - Direct Cloud Sync Confirmed     |   |   Transaction ID : #TXN-948210       |   |
|                                    |   |   New Total Balance : 180 Points     |   |
|                                    |   |                                      |   |
|                                    |   |   [ PROCEEDING TO RATING... ]        |   |
|                                    |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

### Data Pipeline Architecture:
- **Local Transaction Log**: Inserted into table `dbo.Transactions` with `MachineId`, `SessionId`, `Phone`, `ItemCount`, `PointsEarned`, and `Timestamp`.
- **Local Wallet Ledger**: Account created or updated in `dbo.WalletAccounts`.
- **Cloud Synchronization**: Asynchronous HTTPS call to `POST /api/machine/sync-session` with JWT token authorization.
- **Offline Buffer**: If internet is down, record is tagged `IsSynced = 0` for background spooling.

---

## Screen 09: Citizen Experience Feedback Rating
*(Corresponds to Demo PDF Page 09: Feedback)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 09 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Citizen Feedback Prompt           |   +--------------------------------------+   |
|                                    |   | RVM-001  ⭐ FEEDBACK & RATING         |   |
|  On this screen, the citizen is    |   +--------------------------------------+   |
|  prompted to rate their recycling  |   |                                      |   |
|  experience on a 5-star scale:     |   |    HOW WAS YOUR EXPERIENCE?          |   |
|                                    |   |         آپ کا تجربہ کیسا رہا؟        |   |
|  - 1 Star: Very Bad                |   |                                      |   |
|  - 2 Stars: Bad                    |   |        ★   ★   ★   ★   ★         |   |
|  - 3 Stars: Neutral                |   |       [1] [2] [3] [4] [5]            |   |
|  - 4 Stars: Very Good              |   |                                      |   |
|  - 5 Stars: Excellent              |   |   Press keypad number (1 to 5)       |   |
|                                    |   |   then press ENTER to confirm.       |   |
|  Logged to DB & Cloud feedback.    |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

---

## Screen 10: Process Completed & Session Reset
*(Corresponds to Demo PDF Page 10: Process Completed)*

```
+-----------------------------------------------------------------------------------+
| RVM MACHINE GUIDE                                                         PAGE 10 |
+-----------------------------------------------------------------------------------+
|                                    |                                              |
|  Process Completed                 |   +--------------------------------------+   |
|                                    |   | RVM-001  🍃 THANK YOU!               |   |
|  Final confirmation screen         |   +--------------------------------------+   |
|  acknowledging user contribution:  |   |                                      |   |
|                                    |   |       THANK YOU FOR RECYCLING!       |   |
|  "Thank you for your feedback!     |   |         ماحول کی حفاظت کا شکریہ       |   |
|   We will improve our services     |   |                                      |   |
|   based on your input."            |   |   Together we are building a green,  |   |
|                                    |   |   clean, and sustainable Pakistan.   |   |
|  The machine will automatically    |   |                                      |   |
|  reset to the Welcome Screen in    |   |      [ AUTO RESETTING IN 5s... ]     |   |
|  5 seconds for the next citizen.   |   +--------------------------------------+   |
+------------------------------------+----------------------------------------------+
```

---

# Section 2: Standard Operating Procedures (SOPs)

---

## SOP-01: Daily Kiosk Morning Startup & Pre-Flight Diagnostics
- **SOP ID**: SOP-RVM-OPS-01
- **Frequency**: Daily at 07:00 AM (or before site opening)
- **Responsible**: Field Technician / Site Caretaker
- **Objective**: Ensure the RVM kiosk is physically clean, electronically calibrated, and online before public access.

### Step-by-Step Procedure:
1. **Power Inspection**:
   - Verify main AC 220V power cord is plugged into an online UPS or surge protector.
   - Turn ON the main industrial power rocker switch inside the lower cabinet.
2. **Kiosk Launcher Verification**:
   - The system boots Windows 10/11 IoT Enterprise and executes `launch-kiosk.ps1`.
   - Ensure the dual-screen configuration initializes correctly:
     - **Screen 1**: Kiosk UI (`MainWindow.xaml` or `LandscapeWindow.xaml`).
     - **Screen 2**: Digital Signage Ads Player (`AcceptedItemVideoWindow` / Signage).
3. **Hardware Status Checks (Row 1 Diagnostic Widget)**:
   - Check status dots on top banner:
     - `SERIAL: CONNECTED 🟢` (Arduino Uno on COM3/COM4).
     - `DB: OK 🟢` (Local SQL Server `RVMDB`).
     - `API: ONLINE 🟢` (Ping to Central Master Server `< 300ms`).
4. **Physical Intake Aperture Test**:
   - Press Keypad `0`. Confirm the entry gate opens smoothly.
   - Insert a clean test bottle. Confirm IR beams trigger and ultrasonic height calculates accurately.
   - Press `Enter` and test wallet phone window.
5. **Sign-off**: Complete the physical logbook sheet attached inside the service cabinet door.

---

## SOP-02: Public Citizen Operation & Material Acceptance Rules
- **SOP ID**: SOP-RVM-OPS-02
- **Frequency**: Continuous during operational hours
- **Responsible**: Citizen / Machine Facilitator
- **Objective**: Maintain high purity of recycled materials and prevent contamination.

### Material Acceptance Criteria:

```
+-----------------------------------------------------------------------------------+
|                        MATERIAL ACCEPTABILITY MATRIX                              |
+------------------------------------+----------------------------------------------+
| ✅ ACCEPTED MATERIALS               | 🚫 STRICTLY PROHIBITED MATERIALS             |
+------------------------------------+----------------------------------------------+
| • Clear & Colored PET Plastic       | • Glass Bottles (Unless dedicated glass port)|
|   Bottles (Water, Soda, Juice)     | • Bottles containing liquid, oil, or bleach  |
| • Aluminium Beverage UBC Cans      | • Metal Food Tins or Aerosol Cans            |
| • Cardboard UBC / Tetra Pak Cartons| • Crushed, flattened, or mangled containers  |
| • Clean Disposable Paper Cups      | • General garbage, plastic bags, napkins     |
+------------------------------------+----------------------------------------------+
```

### Operational Rules:
1. **Single Container Feed**: Containers must be inserted **one at a time**, bottom-first.
2. **Empty Requirement**: Containers must be empty of all liquid. If liquid is detected, the container is rejected.
3. **Intact Form**: Do not crush or flatten containers prior to insertion. The optical sensors require original geometry for accurate sizing.

---

## SOP-03: Storage Bin Emptying & Optical Level Maintenance
- **SOP ID**: SOP-RVM-MAINT-03
- **Frequency**: When bin reaches 85% capacity or upon automated SMS/Dashboard alert
- **Responsible**: Municipal Waste Handler / Service Technician
- **Sensors Used**: Arduino Pin D10 (Plastic Bin Full), Pin D11 (Can Bin Full)

### Emptying Procedure:
1. **Machine Suspension**:
   - Enter technician mode by typing `888` on the physical keypad and entering PIN.
   - Select **"Pause Kiosk for Maintenance"** to lock public access.
2. **Accessing Lower Bin**:
   - Unlock the lower cabinet door using the master physical key.
   - Pull out the high-capacity collection trolley.
3. **Bag Replacement**:
   - Seal the full 120-liter heavy-duty transparent collection liner.
   - Attach a new heavy-duty liner onto the collection hoop.
4. **Optical Sensor Cleaning**:
   - Inspect the infrared reflective sensors (Pins D10 & D11) mounted at the top rim of the storage bin.
   - Wipe dust or debris off the sensor lenses using a dry microfiber cloth.
5. **Reset & Resume**:
   - Close and lock the cabinet door.
   - In Admin Panel Tab 4, click **"Reset Bin Full Counter"**.
   - The screen will transition back to `MACHINE: READY`.

---

## SOP-04: Chamber Lens Cleaning & Ultrasonic Sensor Recalibration
- **SOP ID**: SOP-RVM-MAINT-04
- **Frequency**: Weekly (every Friday evening)
- **Responsible**: Certified RVM Field Technician
- **Tools Required**: Isopropyl Alcohol (IPA 90%+), lint-free wipes, calibration wand

```
+-----------------------------------------------------------------------------------+
| CHAMBER OPTICAL ARRAY CLEANING POINTS:                                            |
|                                                                                   |
|  [ TOP IR SENSOR (Pin 8) ]    ---- Wipe emitter & receiver lenses with IPA        |
|  [ MID IR SENSOR (Pin 7) ]    ---- Inspect alignment bracket                      |
|  [ BOT IR SENSOR (Pin 2) ]    ---- Clean bottom dust collection tray              |
|  [ METAL SENSOR (Pin 5) ]     ---- Wipe inductive face plate                      |
|  [ ULTRASONIC CONES (Pins 3/4)---- Clean dry air puff on transducer mesh          |
|  [ SERVO DROP FLAP (Pin 9) ]  ---- Lubricate pivot hinge with dry silicone spray  |
+-----------------------------------------------------------------------------------+
```

### Recalibration Procedure (Hotkey `33`):
1. Ensure the chamber is completely empty with drop gate closed.
2. Press `33` on the physical keypad.
3. The software executes the auto-calibration script:
   - Takes 20 ultrasonic pings.
   - Computes Mean Distance ($\bar{D}$) and Standard Deviation ($\sigma$).
   - Saves baseline distance to `config.txt` under `ChamberClearDistanceCm=25.0`.
4. Test with standard 500 ml PET bottle. Ensure classification returns `SMALL PLASTIC (5 PTS)`.

---

## SOP-05: Offline Operation, Failover Queuing & Manual Data Sync
- **SOP ID**: SOP-RVM-NET-05
- **Frequency**: Triggered automatically upon internet disruption
- **Responsible**: System Software / Field Network Technician

### Automated Offline Behavior:
- If cellular 4G router loses connection, `ApiDot` turns Amber (`API: OFFLINE`).
- **The kiosk DOES NOT halt recycling.** Citizens can continue recycling without interruption.
- All transactions are written locally to SQL Server `dbo.Transactions` with flag `IsSynced = 0`.
- Mobile wallet rewards are temporarily credited to the local database cache.

### Reconnection & Manual Sync Procedure:
1. When connectivity restores, background service `CentralSyncService.cs` automatically pushes buffered transactions in chronological FIFO order (batches of 25 records).
2. **Manual Force Sync (Technician Override)**:
   - Open Admin Window (`888` + Admin PIN).
   - Navigate to **Tab 3: Security & Manual Data Sync**.
   - Click **"SYNC PENDING TRANSACTIONS TO CLOUD NOW 🔄"**.
   - Observe progress bar. Confirm pending count drops to `0`.

---

## SOP-06: Emergency Jam Clearance & Anti-Pinch Safety Protocols
- **SOP ID**: SOP-RVM-SAFE-06
- **Frequency**: On emergency alert or citizen report
- **Responsible**: Site Security / Caretaker / Technician

### Hazard Notice:
> [!WARNING]
> **PINCH HAZARD**: The motorized drop gate operates with a high-torque servo motor. Never insert hands or tools into the chamber aperture while power is connected without triggering emergency stop!

### Emergency Jam Procedure:
1. **Immediate De-energization**:
   - Press the red Emergency Stop mushroom button on the right side of the kiosk.
   - This physically cuts 12V power to the servo motor and gate mechanism.
2. **Chamber Inspection**:
   - Unlock the upper maintenance hatch.
   - Inspect the drop chamber with a flashlight.
3. **Foreign Object Extraction**:
   - Using rubberized tongs or protective gloves, carefully extract the jammed object, oversized bottle, or foreign debris.
4. **Sensor Verification**:
   - Check if the IR photoelectric sensors (Pins 2, 7, 8) or Ultrasonic transducer sustained physical damage.
5. **Reset & Power-Up**:
   - Twist and pull the red Emergency Stop mushroom button clockwise to release.
   - System will auto-boot, run calibration, and return to idle.

---

## SOP-07: Digital Signage Video Ads Management & Media Deployment
- **SOP ID**: SOP-RVM-MKT-07
- **Frequency**: Weekly or upon new advertising campaign launch
- **Responsible**: Marketing Operations & Content Administrator

### Video Media Specifications:

| Parameter | Primary Signage (Portrait) | Landscape Secondary Signage |
| :--- | :--- | :--- |
| **Container Format** | `.mp4` (MPEG-4 Part 14) | `.mp4` (MPEG-4 Part 14) |
| **Video Codec** | H.264 / AVC (High Profile) | H.264 / AVC (High Profile) |
| **Audio Codec** | AAC (Stereo, 44.1 kHz, Muted by default) | AAC (Stereo, 44.1 kHz, Muted by default) |
| **Resolution** | $1080 \times 720\text{ px}$ (or $1080 \times 1920$ dedicated) | $1920 \times 1080\text{ px}$ Full HD |
| **Frame Rate** | 25 or 30 fps | 25 or 30 fps |
| **Bitrate** | $4 - 6\text{ Mbps}$ CBR | $6 - 8\text{ Mbps}$ CBR |
| **Storage Directory** | `C:\RVM\Ads\` or `AppDirectory\Ads\` | `C:\RVM\Ads\` or `AppDirectory\Ads\` |

### Deployment Steps:
1. Place formatted `.mp4` files into the `Ads/` directory.
2. Open Admin Window (`888`) $\to$ **Tab 6: Advertisement & Video Signage Module**.
3. The video list automatically refreshes. Check the active checkboxes for videos to include in the playback loop.
4. Set transition duration and preview in the mini-player.
5. Click **"Save Signage Playlist"**. Changes take effect instantly without restarting the application.

---

## SOP-08: Administrator Access, Diagnostic Hotkeys & Hardware Threshold Tuning
- **SOP ID**: SOP-RVM-ADMIN-08
- **Frequency**: As needed during service calls
- **Responsible**: Authorized System Administrator

### Diagnostic Hotkeys Reference:

| Hotkey / Sequence | Function | Target Module |
| :--- | :--- | :--- |
| `0` | Trigger Start Session | Main Kiosk Interface |
| `Enter` | Open Mobile Wallet Claim Window | WalletPhoneWindow |
| `888` | Open Admin Security PIN Prompt | AdminLoginWindow |
| `111` | Direct Service Access (Debug builds) | AdminWindow |
| `33` | Trigger Instant Chamber Calibration | Arduino Serial & Ultrasonic Engine |
| `S` or `s` | Print Diagnostic Status to Debug Console | SerialManager |
| `8` | Toggle Slide-Out Live Telemetry Console | MainWindow TelemetryPanel |
| `Esc` | Close Modal / Exit Telemetry Console | Active Modal Window |

### Hardware Configuration File (`config.txt`):
*Located in root application directory:*
```ini
# RVM Hardware Configuration File
MachineId=RVM-001
PortName=COM3
BaudRate=9600
CentralApiUrl=https://isprvm.binishaqsoft.com
ChamberClearDistanceCm=25.0
SmallBottleThresholdCm=18.0
MediumBottleThresholdCm=26.0
PointsSmallPlastic=5
PointsMediumPlastic=10
PointsLargePlastic=15
PointsCan=10
PointsUbc=5
BinFullThresholdPieces=450
```

---

# Section 3: Hardware Diagnostics & Sensor Pinout Matrix

The following table documents the complete physical pin mapping between the industrial Arduino Uno R3 controller and the kiosk peripheral subsystems:

```
+-----------------------------------------------------------------------------------+
|                        ARDUINO UNO R3 PINOUT ARCHITECTURE                         |
+-----+--------+-------------------------------+------------------------------------+
| Pin | Type   | Subsystem Component           | Operational Logic                  |
+-----+--------+-------------------------------+------------------------------------+
| D2  | Input  | Bottom IR Photoelectric Sensor| Detects container entrance / base  |
| D3  | Output | Ultrasonic Sensor (Trig)      | Transmits 40 kHz acoustic burst    |
| D4  | Input  | Ultrasonic Sensor (Echo)      | Measures pulse return time (cm)    |
| D5  | Input  | Inductive Metal Sensor        | HIGH = Aluminium Can / Metal       |
| D7  | Input  | Middle IR Photoelectric Sensor| Detects Medium height (> 18 cm)    |
| D8  | Input  | Top IR Photoelectric Sensor   | Detects Large height (> 26 cm)     |
| D9  | Output | Drop Gate Servo Motor (PWM)   | Angle 0° = Closed, 90° = Drop Open |
| D10 | Input  | Plastic Bin Level Sensor (IR) | LOW = Storage Bin Full Alert       |
| D11 | Input  | Can/Metal Bin Level Sensor    | LOW = Storage Bin Full Alert       |
| D13 | Output | Internal Chamber LED Ring     | Illumination during scanning       |
+-----+--------+-------------------------------+------------------------------------+
```

---

# Section 4: Quick Reference Troubleshooting & Error Matrix

```
+-----------------------------------------------------------------------------------+
| FAULT CODE / SYMPTOM          | ROOT CAUSE                    | CORRECTIVE ACTION |
+-------------------------------+-------------------------------+-------------------+
| SERIAL: DISCONNECTED 🔴       | • USB cable loose or severed  | 1. Reconnect USB. |
| "HARDWARE CONNECTION ERROR"   | • Incorrect COM port in config| 2. Check Device   |
|                               | • Arduino Uno unpowered       |    Manager for COM|
|                               |                               | 3. Click RETRY 🔄 |
+-------------------------------+-------------------------------+-------------------+
| API: OFFLINE 🟡               | • 4G router disconnected      | 1. Check SIM data.|
|                               | • DNS resolution failure      | 2. System continues|
|                               | • Server maintenance          |    in offline mode|
|                               |                               | 3. Auto syncs later|
+-------------------------------+-------------------------------+-------------------+
| BIN FULL ALERT 🔴             | • Storage trolley at capacity | 1. Follow SOP-03. |
| "Machine Full - Call Operator"| • Dust covering D10/D11 lens  | 2. Empty bag.     |
|                               |                               | 3. Wipe sensor lens|
+-------------------------------+-------------------------------+-------------------+
| BOTTLE STUCK / JAMMED ⚠️      | • Oversized / bent container  | 1. Follow SOP-06. |
| "Bottle stuck - Remove bottle"| • Servo gate obstructed       | 2. Press E-Stop.  |
|                               | • IR beam blocked > 4 seconds | 3. Extract item.  |
+-------------------------------+-------------------------------+-------------------+
| FALSE REJECTIONS 🚫           | • Dirty optical lens          | 1. Follow SOP-04. |
| "Please insert valid container"• Ultrasonic baseline drifted  | 2. Wipe lens IPA. |
| on standard bottles           |                               | 3. Press "33" to  |
|                               |                               |    recalibrate.   |
+-------------------------------+-------------------------------+-------------------+
| INVALID PHONE NUMBER 📱       | • Number does not start 03    | 1. Enter 11 digits|
| "Must be 11 digits (03...)"   | • Number has < or > 11 digits | 2. Format:        |
|                               |                               |    03001234567.   |
+-------------------------------+-------------------------------+-------------------+
```

---

## Concluding Authorization & Revision History

| Revision | Date | Description of Changes | Verified By |
| :--- | :--- | :--- | :--- |
| **v1.0** | Jan 2025 | Initial release for single-stream prototype | Eng. Team |
| **v2.0** | Jan 2026 | Dual-zone UI and Central Cloud API integration | Lead Architect |
| **v2.5** | Sep 2026 | Standardized against physical kiosk enclosure, complete 10-screen citizen manual & multi-role SOPs | Operations Director |

*Published by Environmental Solutions Pvt. Ltd in partnership with the World Bank Group.*  
*All rights reserved. For service inquiries or emergency hotline: support@isprvm.binishaqsoft.com*
