# RVMDesktopApp — Comprehensive User Guide
**Reverse Vending Machine (RVM) Kiosk Software Manual**
*Zaban: Roman Urdu + English Mix | System Version: .NET 8.0 WPF / Arduino Uno*

---

## Fihrist / Table of Contents
1. [Nazam ka Taaruf / System Overview](#1-nazam-ka-taaruf--system-overview)
2. [Section 1: Citizen / Recycler Guide (Aam Shehri Ka Tareeqa-e-Istemal)](#section-1-citizen--recycler-guide-aam-shehri-ka-tareeqa-e-istemal)
   - 1.1 Kiosk Ki Shuruaat Aur Welcome Screen
   - 1.2 Bottle / Can / Cup / Paper Insert Karne Ka Tareeqa
   - 1.3 Machine Ka Live Scan Aur Acceptance / Rejection
   - 1.4 Eco-Impact Metrics (CO2 & Water Saved)
   - 1.5 Points Wallet Mein Transfer Karna (Mobile Number Entry)
3. [Section 2: Administrator & Field Technician Guide (Admin Panel Aur Hardware Config)](#section-2-administrator--field-technician-guide-admin-panel-aur-hardware-config)
   - 2.1 Admin Panel Mein Login Karna (Security Access)
   - 2.2 Tab 1: Point Settings Module (Rewards Configuration)
   - 2.3 Tab 2: Transactions Log Module (Local Transaction History)
   - 2.4 Tab 3: Security & Manual Data Sync (Password & Offline Sync)
   - 2.5 Tab 4: System & Hardware Config (`config.txt` Settings)
   - 2.6 Tab 5: Central Dashboard Simulator & Test Suite (2-Way Live Sync)
   - 2.7 Tab 6: Advertisement & Video Signage Module (Video Management)
   - 2.8 Diagnostic Hotkeys (111, 888, 33, 0, S)
4. [Section 3: Deployment & Multi-Display Kiosk Launcher (`launch-kiosk.ps1`)](#section-3-deployment--multi-display-kiosk-launcher-launch-kioskps1)
5. [Section 4: Troubleshooting Guide (Kharabiyan Aur Unka Hal)](#section-4-troubleshooting-guide-kharabiyan-aur-unka-hal)
   - 4.1 Hardware & Serial Connection Issues (COM Port Errors)
   - 4.2 Chamber Jam & Stuck Item Issues
   - 4.3 Bin Full / Sensor Blocked Alert (Pin D10/D11)
   - 4.4 Local Database (SQL Server / RVMDB) Failures
   - 4.5 Central Server Network & Live Sync Failures (Unauthorized / Offline)
   - 4.6 Video Playback & Display Issues
6. [Section 5: Aksar Poochay Janay Walay Sawalat (FAQs)](#section-5-aksar-poochay-janay-walay-sawalat-faqs)

---

## 1. Nazam ka Taaruf / System Overview

**RVMDesktopApp** ek advanced Reverse Vending Machine software hai jo Windows environment par .NET 8 WPF framework mein run hota hai. Ye software physical hardware sensors (Arduino Uno, Infrared Photoelectric Sensors, Inductive Metal Sensors, Ultrasonic Distance Sensors, aur Servo Drop Gates) ke sath real-time communicate karta hai.

### Core Objectives:
- **Automatic Intake & Classification**: Shehriyon se Plastic Bottles, Aluminium Cans, Cups aur Paper containers accept karna aur unka size (Small, Medium, Large) aur material classify karna.
- **Eco-Rewards System**: Har successfully recycled item ke badlay user ko reward points dena.
- **Wallet Credit System**: User ka Pakistani mobile number (`03xxxxxxxxx`) enter karwa kar points uske account mein jama karna.
- **Central Master Sync**: Local SQL Server (`RVMDB`) se Central Master Dashboard (`https://isprvm.binishaqsoft.com`) tak transaction logs, machine health heartbeat, aur real-time telemetry sync karna.
- **Digital Signage & Ads**: Kiosk display par awareness videos aur commercial advertisements continuously loop karna.

---

## Section 1: Citizen / Recycler Guide (Aam Shehri Ka Tareeqa-e-Istemal)

Yeh section aam public aur recycling karne walay users ke liye hai jo kiosk ke samnay kharay ho kar containers recycle karte hain.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: RVM KIOSK MAIN WELCOME SCREEN (PORTRAIT/LANDSCAPE)]|
| Caption: Main Welcome Interface showing 'START RECYCLING' button,       |
| Live Impact counters, Instructions video player, and Advertisement area |
+-------------------------------------------------------------------------+
```

### 1.1 Kiosk Ki Shuruaat Aur Welcome Screen
1. Kiosk screen par **"START RECYCLING"** ya **"INSERT BOTTLE / CAN"** ka glowing button nazar aayega.
2. Agar touchscreen kiosk hai toh screen par touch karein, ya machine par mojood physical start button dabayein (Keyboard hotkey: `0`).
3. Screen par status **"MACHINE: READY"** ya **"Calibrating..."** show hoga.
   - Machine internal chamber ko calibrate karti hai taakay pipe ke andar ka distance measure ho sakay.
   - Status green hone par entrance aperture / gate open ho jata hai.

---

### 1.2 Bottle / Can / Cup / Paper Insert Karne Ka Tareeqa
1. Bottle ya can ko aik aik kar ke input aperture (dahanay) mein daalein.
2. **Ehtiyat (Guidelines)**:
   - Container bilkul khali hona chahiye (koi liquid ya kachra andar na ho).
   - Ek waqt mein sirf **ek item** daalein.
   - Item ko seedha chamber ke andar drop hone dein taakay sensors sahi scan kar sakein.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: ITEM DETECTION & REAL-TIME SCANNING SCREEN]    |
| Caption: Display showing detected item: 'Scanning...', IR beam trigger, |
| and Ultrasonic length measurement in centimeters (cm)                   |
+-------------------------------------------------------------------------+
```

---

### 1.3 Machine Ka Live Scan Aur Acceptance / Rejection
Jab item chamber ke andar jata hai, software yeh live checks karta hai:
1. **IR Sensors Trigger**: Bottom (Pin 2), Middle (Pin 7), aur Top (Pin 8) photo-electric sensors item ki presence aur unchai (height) detect karte hain.
2. **Inductive Metal Sensor (Pin 5)**: Check karta hai ke item Metal Can hai ya Plastic bottle.
3. **Ultrasonic Sensor (Pins 3 & 4)**: Item ki length (cm) aur drop duration (ms) measure karta hai.
4. **Item Classification**:
   - **SMALL PLASTIC / CAN**: 5 Points (Default)
   - **MEDIUM PLASTIC / CAN**: 10 Points (Default)
   - **LARGE PLASTIC / CAN**: 15 Points (Default)
5. **Item Rejection Cases**:
   - Agar item unknown object ho ya scan timeout ho jaye, toh screen par **"REJECTED: Invalid Item"** show hoga aur points add nahi honge.
   - Agar bottle chamber mein phans jaye toh screen par **"Bottle stuck - Remove the bottle"** aayega.
6. **Drop Confirmation (Anti-Fraud Check)**:
   - Jab servo gate (Pin 9) open hota hai aur item drop confirm hota hai (`BOTTLE:CLEARED`), tab software points commit karta hai.
   - Har accepted item par celebratory video window (`AcceptedItemVideoWindow`) pop-up hoti hai jo green success message dikhati hai.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: ACCEPTED ITEM CELEBRATION MODAL]               |
| Caption: Pop-up showing 'ACCEPTED! +10 Points Added' with animated badge|
+-------------------------------------------------------------------------+
```

---

### 1.4 Eco-Impact Metrics (CO2 & Water Saved)
Kiosk par har item accept hone ke baad real-time environment counters update hotay hain:
- **CO2 Saved (kg)**: Formula = `Total Items × 0.15 kg`
- **Water Saved (Liters)**: Formula = `Total Items × 0.75 L`
- **Total Points Earned**: Session ke doran jama honay walay points ka live sum.

Yeh metrics screen par live show hotay hain taakay shehri ko unke recycling contribution ka ehsaas ho.

---

### 1.5 Points Wallet Mein Transfer Karna (Mobile Number Entry)
Apni recycling mukammal karne ke baad points ko apne mobile account mein save karne ka tareeqa:

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: WALLET PHONE ENTRY MODAL (WalletPhoneWindow)]   |
| Caption: Dark slate modal showing Recycled Items summary, Total Points, |
| and 11-digit Mobile Number input field with 'Credit Wallet' button      |
+-------------------------------------------------------------------------+
```

1. Kiosk screen par **"CREDIT TO WALLET"** ya **"FINISH & CLAIM REWARDS"** button par tap karein (Keyboard shortcut: `Enter`).
2. Screen par **`WalletPhoneWindow`** open hogi:
   - Summary card mein apka total items count aur jama hone walay total points show honge (e.g. `+30 PTS`).
3. Input box mein apna 11-digit Pakistani mobile number darj karein:
   - Format: `03xxxxxxxxx` (Maslan: `03001234567`).
   - Rule: Yeh field sirf numbers accept karti hai aur `03` se start hona lazmi hai.
4. **"Credit Wallet ✓"** button par tap karein.
5. **Result & Receipt**:
   - Software apka local database (`dbo.WalletAccounts`) update karta hai.
   - Real-time mein Central Server API (`/api/machine/sync-session`) par call bhej kar points online wallet mein credit karta hai.
   - Screen par confirmation message show hota hai aur session automatically reset ho jata hai agli recycling ke liye.

---

## Section 2: Administrator & Field Technician Guide (Admin Panel Aur Hardware Config)

Yeh section RVM technicians, hardware maintenance team, aur system administrators ke liye hai.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: ADMIN LOGIN WINDOW (AdminLoginWindow)]          |
| Caption: Secure Login Modal asking for Administrator Username & Password |
+-------------------------------------------------------------------------+
```

### 2.1 Admin Panel Mein Login Karna (Security Access)
Admin settings ko aam public access nahi kar sakti. Isay open karne ke 3 tareeqay hain:
1. **Screen Icon**: Kiosk screen ke top header ya navigation bar mein chotay **"Admin"** gear icon par tap karein.
2. **Hotkey Shortcut**: Kiosk keyboard / keypad par digit `1` ko musalsal 3 dafa jaldi dabayein (`111` within 1.5 seconds) ya key `A` dabayein.
3. **Login Modal**:
   - **Default Username**: `RVM`
   - **Default Password**: `Admin786`
4. Credentials enter kar ke **"🔓 Login to Admin"** button par click karein.

---

### 2.2 Tab 1: Point Settings Module (Rewards Configuration)
Yeh tab machine ke har size aur material ke mutabiq reward points set karne ke liye hai.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: POINT SETTINGS TAB IN ADMIN WINDOW]            |
| Caption: DataGrid displaying BottleSize, MaterialType (PLASTIC, CAN,    |
| GLASS, TETRA), Points value, and 'Save Point Settings' button           |
+-------------------------------------------------------------------------+
```

- **Features**:
  - `DataGrid` mein tamam active categories show hoti hain:
    - `SMALL PLASTIC`, `MEDIUM PLASTIC`, `LARGE PLASTIC`
    - `SMALL METAL/CAN`, `MEDIUM METAL/CAN`, `LARGE METAL/CAN`
    - `GLASS`, `TETRA`
  - Technician kisi bhi category ke points par click kar ke unhein direct edit kar sakta hai.
  - **"Save Point Settings"** button: Naye points local database (`PointSettings`) mein save kar deta hai.
  - **"Fetch from Central Dashboard"** button: Central Cloud Server se latest official point policy pull karta hai.

---

### 2.3 Tab 2: Transactions Log Module (Local Transaction History)
Is tab mein kiosk par honay wali tamam tareekhi transactions ka record hota hai.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: TRANSACTIONS LOG TAB]                          |
| Caption: Table showing TransactionID, SessionID, DateTime, BottleSize,  |
| MaterialType, PointsAwarded, MobileNumber, and IsAccepted status        |
+-------------------------------------------------------------------------+
```

- **Features**:
  - Har item intake ka unique `TransactionID` aur session ka `GUID` show hota hai.
  - Check kar sakte hain ke item accept hua tha (`IsAccepted = 1`) ya reject (`0`).
  - Kis mobile number par points credit huay woh audit kiya ja sakta hai.
  - **"Refresh Log"** button: Latest local records refresh karta hai.

---

### 2.4 Tab 3: Security & Manual Data Sync (Password & Offline Sync)

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: SECURITY & DATA SYNC TAB]                      |
| Caption: Admin Password Change Panel and 'Sync All Local Offline        |
| Sessions to Central Master Server' control card                         |
+-------------------------------------------------------------------------+
```

1. **Change Admin Password**:
   - Username select karein (Default: `RVM`).
   - Old Password, New Password, aur Confirm Password darj karein.
   - **"Update Password"** dabayein. Password instantly database mein hash/update ho jayega.
2. **Offline Data Recovery & Manual Sync**:
   - Agar kiosk internet disconnect hone ki waja se offline chal raha tha, toh tamam transactions local SQL database mein mehfooz rehti hain.
   - Jab internet wapis aaye, **"Sync All Unsynced Local Sessions to Central"** button dabayein.
   - Background worker tamam pending transactions ko pack kar ke Central Server API par upload karta hai aur unka status updated mark karta hai.

---

### 2.5 Tab 4: System & Hardware Config (`config.txt` Settings)
Is module ke zariye machine ki core hardware aur network settings ko bina code touch kiye configure kiya jata hai.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: SYSTEM & HARDWARE CONFIG TAB]                   |
| Caption: Form fields for ConnectionString, MachineId, CentralApiUrl,    |
| ArduinoPort, BaudRates, and Video Folders with 'Save Config' button     |
+-------------------------------------------------------------------------+
```

- **Fields Explanation**:
  - `ConnectionString`: Local SQL Express connection string (`Server=.\SQLEXPRESS;Database=RVMDB;User ID=RVM;Password=RVM;...`).
  - `MachineId`: Kiosk ka unique identifier (Maslan: `RVM-RWP`, `RVM-001`). Central Server isi ID se machine ko pehchanta hai.
  - `CentralApiUrl`: Cloud dashboard ka URL (Default: `https://isprvm.binishaqsoft.com`).
  - `ArduinoPort`: Arduino board ka COM port (Maslan: `COM7`, `COM16`).
  - `ArduinoBaud`: Serial baud rate (Default: `9600`).
  - `CameraPort` & `CameraBaud`: Barcode scanner camera port settings (Default: `COM31`, `921600`).
  - `AdvertisementVideoFolder`: Ads videos ka local path (`Ads\Advertisements`).
  - `InstructionVideoFolder`: Guidance video ka local path (`Ads\Instructions`).
- **Control Buttons**:
  - **"Save Configuration"**: Settings ko file `config.txt` mein write karta hai aur heartbeat ko naye URL par restart karta hai.
  - **"Re-initialize Arduino (DTR & Soft Reset)"**: Windows COM port handle ko cleanly release karta hai, Arduino ko hardware reset pulse bhejta hai aur connection dobara establish karta hai.

---

### 2.6 Tab 5: Central Dashboard Simulator & Test Suite (2-Way Live Sync)
Technicians ke liye machine ki cloud connectivity aur API testing ka comprehensive console.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: CENTRAL DASHBOARD SIMULATOR TAB]               |
| Caption: Live Communication Console, Ping Test, Simulate Bottle Drop,   |
| Send Heartbeat, and Verify QR Code test buttons                         |
+-------------------------------------------------------------------------+
```

- **Simulate Bottle Drop**: Hardware ke baghair synthetic bottle drop bhej kar live cloud sync test karein.
- **Send Heartbeat**: Central server par bin capacity aur local IP ping bhej kar check karein ke server 200 OK deta hai ya nahi.
- **Verify QR Code**: Mobile App user ka scanned QR code token test karein.
- **Live Communication Console**: Har incoming aur outgoing HTTP payload ka live debug text display karta hai.

---

### 2.7 Tab 6: Advertisement & Video Signage Module (Video Management)
Kiosk par commercial aur environmental videos play karne ka management console.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: ADVERTISEMENT & VIDEO SIGNAGE TAB]             |
| Caption: Video playlist listbox, In-app Media Player preview,           |
| 'Add Video', 'Delete Video', and 'Sync Ads from Central' controls       |
+-------------------------------------------------------------------------+
```

- **Features**:
  - **Local Playlist Management**: Nayi videos (`.mp4`, `.wmv`, `.avi`, `.mov`) browse kar ke playlist mein add karein ya delete karein.
  - **In-App Video Preview**: Admin panel ke andar video play, pause, aur stop kar ke check karein.
  - **Auto-Sync from Central Server**: Central Server par assign ki gayi nayi advertising campaigns background mein download ho kar playlist mein shamil ho jati hain.

---

### 2.8 Diagnostic Hotkeys (Quick Keystroke Reference)
Field engineers ke liye keyboard shortcuts jo fast troubleshooting ke kaam aati hain:

| Hotkey / Keystroke | Function | Description / Asar |
| :--- | :--- | :--- |
| **`111`** (Triple 1) ya **`A`** | **Open Admin Login** | Admin security credential popup kholta hai. |
| **`888`** (Triple 8) | **Toggle Telemetry Console** | Screen ke side par live serial RX/TX aur cloud telemetry panel show/hide karta hai. |
| **`33`** (Double 3) | **Manual Clear Chamber** | Arduino ko `CLEAR_CHAMBER` command bhej kar drop gate open karta hai taakay phansi hui bottle gir jaye. |
| **`0`** ya **`NumPad0`** | **Start Machine** | Kiosk session start karta hai aur calibration trigger karta hai. |
| **`S`** | **Stop Machine** | Machine ko emergency stop karta hai aur gates close kar deta hai. |
| **`Enter`** | **Wallet Credit** | Phone entry modal kholta hai points save karne ke liye. |
| **`Escape`** | **Close Panel / Exit** | Khuli hui telemetry window ya app ko close karta hai. |

---

## Section 3: Deployment & Multi-Display Kiosk Launcher (`launch-kiosk.ps1`)

Kiosk machines par aksar 2 screens hoti hain (e.g. aik Portrait touch screen user ke liye aur aik landscape commercial screen). Isay manage karne ke liye PowerShell script banaya gaya hai.

### Script Ka Maqsad:
- System se connected tamam monitors ko scan karta hai.
- Target display ka orientation (Portrait ya Landscape) khud ba khud detect karta hai.
- `RVMDesktopApp.exe` ko target monitor par fullscreen snap karta hai (Win32 API `SetWindowPos` ke zariye).
- Agar app pehle se chal rahi ho toh duplicate instance rokta hai aur 2-second notification dikhata hai.

### Run Karne Ka Tareeqa:
PowerShell open karein aur run karein:
```powershell
# Default: Secondary display par auto-detect orientation mein launch
powershell -ExecutionPolicy Bypass -File .\launch-kiosk.ps1 -ScreenIndex 1 -Mode Auto

# Primary display par Portrait mode mein force launch
powershell -ExecutionPolicy Bypass -File .\launch-kiosk.ps1 -ScreenIndex 0 -Mode Portrait
```

---

## Section 4: Troubleshooting Guide (Kharabiyan Aur Unka Hal)

Yeh section kiosk me aane walay technical masail aur unke verified solution steps faraham karta hai.

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: HARDWARE ERROR BANNER ON KIOSK SCREEN]         |
| Caption: Red alert banner: 'HARDWARE CONNECTION ERROR • ہارڈویئر کا    |
| رابطہ منقطع ہے' with 'RETRY' button                                   |
+-------------------------------------------------------------------------+
```

### 4.1 Hardware & Serial Connection Issues (COM Port Errors)
- **Alamat (Symptoms)**: Screen par red banner aata hai: *"HARDWARE CONNECTION ERROR • ہارڈویئر کا رابطہ منقطع ہے"* ya Status dot red ho jata hai.
- **Wajohat (Causes)**:
  1. Arduino USB cable loose ya disconnect ho gayi hai.
  2. Windows Device Manager ne Arduino ka COM port change kar diya hai (e.g. COM7 se COM8 ho gaya).
  3. Koi doosra software (jaise Arduino IDE Serial Monitor) ne port ko lock kar rakha hai.
- **Hal (Resolution)**:
  1. Red banner par mojood **"RETRY 🔄"** button tap karein.
  2. Agar theek na ho, toh Admin panel kholien (`111` press karein) -> **Tab 4 (Hardware Config)** par jayein.
  3. Windows Device Manager check karein ke Arduino kis COM port par hai.
  4. Sahi COM port (e.g. `COM16`) darj karein aur **"Save Configuration"** dabayein.
  5. **"Re-initialize Arduino"** button dabayein. Software DTR line reset pulse bhej kar board ko re-connect kar lega.

---

### 4.2 Chamber Jam & Stuck Item Issues
- **Alamat**: Screen par status aata hai: *"Bottle stuck - Remove the bottle before inserting another item"*, drop confirm nahi hota aur points commit nahi hotay.
- **Wajohat**:
  1. Citizen ne aisi oversized bottle ya twisted container daala jo drop chute mein phans gaya.
  2. Bottom ya Middle IR sensor ke aagay kachra ya dust aa gayi hai jis se beam break ho rahi hai.
- **Hal**:
  1. Keypad par key `3` ko double press karein (`33`). Yeh software se direct `CLEAR_CHAMBER` command bhejega jis se servo drop gate 180° open ho kar item ko neeche drop kar dega.
  2. Agar item physical phans gaya hai toh machine cabinet open kar ke haath se bottle remove karein.
  3. IR sensor lenses ko soft cloth se saaf karein.
  4. Screen par Key `0` dabayein taakay machine recalibrate ho kar **"MACHINE: READY"** state mein wapis aa jaye.

---

### 4.3 Bin Full / Sensor Blocked Alert (Pin D10/D11)
- **Alamat**: Screen par status aata hai: *"Bin Full / Blocked - Collection bin is full or sensor blocked (D11)"*. Machine mazeed items accept karna band kar deti hai.
- **Wajohat**:
  1. Collection container (waste storage bin) bottles aur cans se bhar chuka hai.
  2. Bin full optical sensor ke samnay bottle aa gayi hai.
- **Hal**:
  1. Maintenance technician RVM door open karein aur internal collection bin ko khali (empty) karein.
  2. Naya collection bag install karein aur sensor ke samnay rasta clear karein.
  3. Kiosk door band karein. Status automatically **"BIN:CLEARED"** show karega.
  4. Machine screen par Start button tap karein ya Key `0` dabayein taakay session resume ho sakay.

---

### 4.4 Local Database (SQL Server / RVMDB) Failures
- **Alamat**: App start hotay waqt warning aati hai: *"Database unavailable. Running in memory / offline mode"*.
- **Wajohat**:
  1. SQL Server (`SQLEXPRESS`) service stopped hai.
  2. `config.txt` mein connection string ya SQL user password ghalat hai.
- **Hal**:
  1. Windows Services (`services.msc`) open karein aur check karein ke `SQL Server (SQLEXPRESS)` running state mein hai.
  2. Agar stopped ho toh Right click kar ke **Start** karein.
  3. Command prompt mein command run karein:
     ```cmd
     sqlcmd -S .\SQLEXPRESS -E -Q "IF DB_ID('RVMDB') IS NULL CREATE DATABASE RVMDB;"
     ```
  4. App ke root folder mein mojood `Database.sql` script ko execute karein taakay tables aur stored procedures restore ho sakein.

---

### 4.5 Central Server Network & Live Sync Failures (Unauthorized / Offline)
- **Alamat**: Kiosk header mein live badge show hota hai: **"API: OFFLINE 🔴"** ya **"UNAUTHORIZED 🔴"**.
- **Wajohat**:
  1. Kiosk ka internet connection disconnect ho gaya hai.
  2. `MachineId` Central Dashboard par register nahi hai ya status unauthorized hai.
- **Hal**:
  1. **Offline State**: Fikr ki zaroorat nahi! RVMDesktopApp fully offline-tolerant hai. Tamam transactions local SQL database mein record hoti rahengi. Internet aane par Admin Tab 3 se manual sync kiya ja sakta hai.
  2. **Unauthorized State**: Central Dashboard (`isprvm.binishaqsoft.com`) par Super Admin se login karein, **"RVM Fleet / Machines"** section mein jayein aur is Machine ID (e.g. `RVM-RWP`) ko approve/authorize karein.
  3. Heartbeat service aglay 15 seconds ke andar status ko green **"LIVE 🟢"** mein convert kar degi.

---

### 4.6 Video Playback & Display Issues
- **Alamat**: Screen par video nahi chal rahi ya black box show ho raha hai.
- **Wajohat**:
  1. `Ads\Advertisements` ya `Ads\Instructions` folder mein koi supported video file mojood nahi hai.
  2. Video codec corrupt hai.
- **Hal**:
  1. Supported format sirf `.mp4` (H.264 codec) use karein.
  2. Admin Panel -> Tab 6 (Advertisement) mein jayein aur **"Browse & Add Video"** ke zariye valid MP4 video load karein.
  3. **"Apply & Play"** dabayein.

---

## Section 5: Aksar Poochay Janay Walay Sawalat (FAQs)

#### Q1: Agar internet band ho jaye toh kya aam shehri bottle recycle kar sakta hai?
**Jawab**: Haan, bilkul! RVMDesktopApp fully offline-capable hai. Machine bottles accept karegi, sensors classification karenge aur points local database mein mehfooz hotay rahenge. Jaise hi internet connect hoga, HeartbeatService aur CentralSyncService records ko Central Server par bhej dengi.

#### Q2: Ek user ko reward points claim karne ke liye mobile number kyun dena padta hai?
**Jawab**: Mobile number user ka unique identity wallet identifier hai. Citizen mobile app par isi phone number se login kar ke apne total points, transaction history, aur reward vouchers dekh sakta hai.

#### Q3: Agar koi user bottle ke bajaye patthar, larki ya kachra daal de toh kya hoga?
**Jawab**: Machine mein multi-layer verification mojood hai. Ultrasonic sensor length check karta hai aur IR photo-electric sensors shape aur beam break timing measure karte hain. Agar object bottle ya can ke standard dimension par poora na utre toh machine status `REJECTED` emit karti hai, drop gate open nahi hota aur zero (0) points award hotay hain.

#### Q4: Dropped item ke points kab tak account mein credit hotay hain?
**Jawab**: Real-Time! Jaise hi user apna 11-digit mobile number enter kar ke "Credit Wallet" tap karta hai, usi lamhay local database aur Central Cloud API call execute hoti hai aur points account mein credit ho jatay hain.

#### Q5: Agar drop gate ke andar bottle phans jaye toh user ko points milenge?
**Jawab**: Nahi. Anti-fraud safety rule ke mutabiq points sirf usi waqt finalize hotay hain jab drop switch se `BOTTLE:CLEARED` ka confirmation signal generate ho. Phansi hui bottle par points cancel ho jatay hain taakay koi user aik hi bottle ko baar baar hilo kar points na le sakay.

---
*Document prepared for RVMDesktopApp Deployment & Operations.*
