# RVMDesktopApp — Architecture & Logic Explanation
**Comprehensive Technical Logic, Data Flow, Dependency Graph & Business Rules**
*Zaban: Roman Urdu + English Mix | Target: Engineering, Architecture & Operations*

---

## 1. Nazam Ka End-to-End Data Flow (Input Se Output Tak)

RVMDesktopApp physical hardware interaction se shuru ho kar cloud database tak aik multi-layer asynchronous pipeline ke zariye chalta hai. Niche iska mukammal step-by-step data flow diya gaya hai:

```
+---------------------------------------------------------------------------------------------------+
|                                 END-TO-END RVM DATA PIPELINE                                      |
+---------------------------------------------------------------------------------------------------+

 [1. PHYSICAL INPUT]
     Citizen inserts Bottle / Can / Cup into Chamber
                    │
                    ▼
 [2. HARDWARE SENSING LAYER (Arduino Uno)]
     ├── Entrance Sensor (HC-SR04 on Pins 11, 12) -> Detects approach (<15 cm) -> Opens Entrance Servo (Pin 6)
     ├── Bottom IR (Pin 2), Middle IR (Pin 7), Top IR (Pin 8) -> Measures object height & beam interruptions
     ├── Inductive Metal Sensor (Pin 5) -> Detects metallic presence (Aluminium vs Plastic)
     └── Chamber Ultrasonic (Pins 3, 4) -> Measures item length (cm) and settle duration (ms)
                    │
                    ▼
 [3. SERIAL COMMUNICATION LAYER (SerialManager.cs)]
     Arduino emits ASCII event: "SIZE:MEDIUM MATERIAL:PLASTIC" or "BOTTLE_LENGTH_CM:22"
     SerialManager reads newline-terminated frames via COM Port (9600 baud, DTR/RTS stabilized)
     Fires C# Event: DataReceived -> MainWindow.xaml.cs Dispatcher
                    │
                    ▼
 [4. KIOSK CLASSIFICATION & STATE ENGINE (MainWindow.xaml.cs)]
     ├── State Check: Verify machine is in RUNNING state (Key 0 / START)
     ├── Point Evaluation: PointRulesCache -> Local SQL PointSettings -> Fallback (5/10/15)
     ├── Gate Actuation: Arduino opens Drop Gate Servo (Pin 9: 180°)
     └── Anti-Fraud Drop Confirmation: Waits for "BOTTLE:CLEARED" before allocating points
                    │
                    ▼
 [5. DROP CONFIRMED & LOCAL PERSISTENCE (DatabaseManager.cs)]
     ├── Stored Procedure: RVM_sp_SaveTransaction -> dbo.BottleTransactions (GUID Session, Material, Size)
     ├── Live Eco-Metrics: Updates CO2 Saved (+0.15 kg/item) and Water Saved (+0.75 L/item)
     └── Celebratory Signage: AcceptedItemVideoWindow pops up green reward feedback
                    │
                    ▼
 [6. WALLET ATTRIBUTION (WalletPhoneWindow.cs)]
     Citizen taps "Credit Wallet" -> Enters 11-digit mobile (03xxxxxxxxx)
     ├── Local DB Commit: RVM_sp_CreditWallet credits dbo.WalletAccounts
     └── Session ID tagged to phone number in dbo.BottleTransactions
                    │
                    ▼
 [7. REAL-TIME CLOUD SYNCHRONIZATION (CentralSyncService.cs)]
     Asynchronous HTTP POST payload sent to Central Server:
     URL: https://isprvm.binishaqsoft.com/api/machine/sync-session
     Payload: { machineId, localSessionId, mobileNumber, plasticCount, aluminiumCount, points, ... }
                    │
                    ▼
 [8. AUTONOMOUS HEALTH & HEARTBEAT (HeartbeatService.cs)]
     Runs every 15 seconds independently:
     ├── POST /api/machine/heartbeat (Machine ID, Bin status, Local LAN IP)
     ├── GET /api/machine/config/{machineId} -> Updates PointRulesCache in-memory
     └── Synchronizes dynamic Top Leaderboard and Remote Video Playlist
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Modules Connection & Dependency Architecture

Yeh diagram wazeh karti hai ke software ke components aik doosray ke sath kis tarah connected hain:

```
                           +──────────────────────────────+
                           |       launch-kiosk.ps1       |
                           |  (Win32 Monitor Coordinates, |
                           |   Single Instance Guardian)  |
                           +──────────────┬───────────────+
                                          │ launches
                                          ▼
                           +──────────────────────────────+
                           |       App.xaml / .cs         |
                           |  (WPF Bootstrapper, Routes   |
                           |   Portrait vs Landscape)     |
                           +──────────────┬───────────────+
                                          │
                     ┌────────────────────┴───────────────────┐
                     ▼                                        ▼
       +───────────────────────────+            +───────────────────────────+
       |     MainWindow.xaml       |            |   LandscapeWindow.xaml    |
       |  (Portrait Kiosk Display) |            |  (Landscape Screen Mode)  |
       +─────────────┬─────────────+            +─────────────┬─────────────+
                     │                                        │
                     └────────────────────┬───────────────────┘
                                          │
    ┌───────────────────┬─────────────────┼───────────────────┬───────────────────┐
    ▼                   ▼                 ▼                   ▼                   ▼
+─────────────+  +─────────────+  +─────────────+  +──────────────────+  +──────────────────+
|SerialManager|  |DatabaseMgr  |  |CentralSync  |  | HeartbeatService |  |PointRulesCache   |
| (RS232/USB  |  | (Local SQL  |  | (Cloud REST |  | (15s Telemetry & |  | (Memory Pricing  |
|  to Arduino)|  |  Express)   |  |  Sync API)  |  |  Config Polling) |  |  Matrix Cache)   |
+──────┬──────+  +──────┬──────+  +──────┬──────+  +────────┬─────────+  +────────┬─────────+
       │                │                │                  │                     │
       ▼                ▼                ▼                  ▼                     │
[Arduino Uno]    [MS SQL RVMDB]   [Cloud Master API] [Central Health Fleet]       │
(Sensors/Servos) (Transactions/   (isprvm.binishaq-   (Status: Online/            │
                 WalletAccounts)       soft.com)       Unauthorized)              │
                                                                                  │
    ┌───────────────────┬─────────────────────────────────────────────────────────┘
    ▼                   ▼
+─────────────────+ +───────────────────+
|WalletPhoneWindow| | AdminWindow.xaml  |
| (Citizen Phone  | | (Diagnostic Suite,|
|  Keypad Modal)  | |  config.txt tool) |
+─────────────────+ +───────────────────+
```

### Module Interconnection Key Points:
1. **Sensor Trigger se Presentation tak**: Arduino ka serial message `SerialManager` ke zariye event fire karta hai -> `MainWindow` ka dispatcher UI text aur counters update karta hai.
2. **Drop Confirmation se Database tak**: Jab drop confirmation `BOTTLE:CLEARED` aata hai -> `MainWindow` `DatabaseManager.SaveTransaction` ko call karta hai.
3. **Wallet Modal se Cloud tak**: Jab user phone number submit karta hai -> `WalletPhoneWindow` validation pass kar ke `MainWindow` ko signal deta hai, jo `DatabaseManager.CreditWallet` aur `CentralSyncService.SyncSessionToCentralDetailedAsync` ko ek sath execute karta hai.
4. **Heartbeat se Rule Cache tak**: `HeartbeatService` central server se naye points rules fetch kar ke `PointRulesCache` ko update karta hai, taakay `MainWindow` ko local DB query kiye baghair zero-latency mein points mil jayein.

---

## 3. Har Module Ka "WHY" (Agar Remove Kar Dein Toh Kya Hoga?)

Yeh section har component ki ahemiyat, uska maqsad, aur usay remove karne ki soorat mein peda hone walay khatraat (risks) ko detail mein bayaan karta hai.

### Module 1: `SerialManager.cs`
- **Maqsad (Purpose)**: Windows COM Port aur Arduino Uno micro-controller ke darmiyan stable serial pipe qayam karna. Is mein auto-reconnect, progressive sleep, DTR/RTS hardware reset pulse, aur newline buffer splitting shamil hai.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Software physical dunya se andha aur behra ho jayega. Kiosk ko pata hi nahi chalega ke kisi ne bottle daali hai ya nahi.
- **Khatraat (Security / Operational Risks)**:
  - Windows background mein stale COM port handles lock kar leta hai. Agar `SerialManager` ka DTR reset aur graceful handle management na ho, toh machine crash ho jayegi aur technician ko physically USB cable nikaal kar lagani padegi.

---

### Module 2: Arduino Firmware (`RVM_Arduino.ino`)
- **Maqsad (Purpose)**: Real-time hardware time-sensitive operations ko handle karna (microsecond ultrasonic timing, servo PWM pulses, debounced IR beam detection, metal inductive threshold).
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Windows OS real-time microsecond level timing control nahi kar sakta. Baghair Arduino ke sensors read nahi ho saktay aur drop motors rotate nahi kar sakeingi.
- **Khatraat (Operational Risks)**:
  - Motors jam ho sakti hain ya continuous power lene se jal sakti hain. Machine mein physical hand pinching (ungli phansne) ka shaded risk hoga agar physical timeout guards micro-controller par na hon.

---

### Module 3: `DatabaseManager.cs` & `Database.sql`
- **Maqsad (Purpose)**: Local Microsoft SQL Server Express (`RVMDB`) ke sath interaction. ACID transactions ke zariye `BottleTransactions` aur `WalletAccounts` ko local disk par safe rakhna.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Offline recycling namumkin ho jayegi. Agar internet 1 second ke liye bhi drop hua toh shehri ki recycled bottles ke points zaaya ho jayeinge.
- **Khatraat (Security Risks)**:
  - Financial data loss aur public trust collapse. User bottle daal chuka hoga lekin machine internet na hone par points claim nahi karne degi. Fraud audit trail khatam ho jayega.

---

### Module 4: `CentralSyncService.cs`
- **Maqsad (Purpose)**: Kiosk ki local activities ko Central Master Dashboard (`isprvm.binishaqsoft.com`) ke sath synchronize karna. Machine session sync, remote advertisement video downloading, aur QR validation provide karta hai.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - RVM aik isolated dabba ban kar reh jayegi. Mobile App users ko unke points kabhi nahi milenge kyunke cloud database update nahi hoga. Head office ko pata hi nahi chalega ke machine kitna kachra collect kar chuki hai.
- **Khatraat (Operational Risks)**:
  - Remote fleet monitoring zero ho jayegi. Centralized marketing campaigns (ads) machine par push nahi ho sakeingi.

---

### Module 5: `HeartbeatService.cs`
- **Maqsad (Purpose)**: Har 15 second baad background daemon ke taur par central server ko machine ki zinda hone ki ittela (ping), internal LAN IP address, aur bin status bhejna.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Central Dashboard par machine hamesha "DEAD / OFFLINE" show hogi. Technician ko machine ka local IP nahi mil sakega remote access ke liye.
- **Khatraat (Security Risks)**:
  - Unauthorized machine detection khatam ho jayegi. Agar koi chori shuda machine copy banaye toh central system usay detect aur block nahi kar sakega.

---

### Module 6: `PointRulesCache.cs`
- **Maqsad (Purpose)**: In-memory ultra-fast reward rules repository. Database par har bottle drop par SQL query chalane ke bajaye RAM mein thread-safe dictionary se points provide karta hai.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Har bottle drop par local SQL database par disk I/O query chalegi jis se latency barh jayegi aur bottle scanning slow ho jayegi.
- **Khatraat (Operational Risks)**:
  - SQL Server connection pool exhaust ho sakta hai jab tez raftari se bottles daali ja rahi hon. Agar database restart ho raha ho toh machine zero points dekar items drop kar degi.

---

### Module 7: `WalletPhoneWindow.cs`
- **Maqsad (Purpose)**: Touch-friendly on-screen dialer aur input dialog jo user ka 11-digit Pakistani phone number validate karta hai.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Shehri apne points apne account mein save nahi kar sakega. Kiosk sirf anonymous drop box ban kar reh jayegi.
- **Khatraat (Security Risks)**:
  - SQL injection aur bad input data ka risk barh jayega agar regex validation `^03[0-9]{9}$` remove kar di jaye. Ghalat mobile number par points chale jayenge jinhein reverse karna mushkil hoga.

---

### Module 8: `AdminLoginWindow.cs` & `AdminWindow.xaml.cs`
- **Maqsad (Purpose)**: Role-based authenticated management interface. Credentials `RVM` / `Admin786` verify kar ke diagnostics, sensor calibration, COM port configuration, aur manual sync unlock karta hai.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Field technicians COM port change nahi kar sakeinge, jam chamber manually clear nahi kar sakeinge, aur naye points adjust nahi kar sakeinge.
- **Khatraat (Security Risks)**:
  - Agar security login na ho, toh koi bhi aam shehri kiosk screen se settings tabdeel kar ke machine ko band kar sakta hai ya reward points 1000x kar ke fraud loot macha sakta hai.

---

### Module 9: `AcceptedItemVideoWindow.xaml.cs`
- **Maqsad (Purpose)**: Har accept honay walay item par celebratory pop-up video / dynamic graphic play karna.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - User ko physical machine se visual feedback nahi milega ke item accept hua ya reject. Kiosk dull aur unresponsive mehsoos hogi.
- **Khatraat (Fraud Prevention Risk)**:
  - Visual confirmation na hone par user ko pata nahi chalta ke points add huay ya nahi, jis se user dispute aur frustration peda hoti hai.

---

### Module 10: `launch-kiosk.ps1`
- **Maqsad (Purpose)**: Windows boot hone par secondary portrait / landscape monitor ko identify karna aur Win32 API ke zariye fullscreen pin karna. Duplicate processes ko kill karna.
- **Agar Remove Kar Dein Toh Kya Hoga?**:
  - Kiosk app primary desktop monitor par ghalat window size mein khul sakti hai, window borders nazar aayengi, aur double-click karne par 2 instances chal kar serial port ko lock kar denge.
- **Khatraat (Operational Risks)**:
  - Kiosk public ke liye unusable ho jayegi kyunke taskbar aur desktop icons public ko nazar aane lagenge jinhein woh misuse kar sakte hain.

---

## 4. Business Logic Ke Zaroori Qawaneen (Crucial Business Rules)

Software ke andar kuch sakht business aur physical rules code kiye gaye hain jo machine ki safety aur reward integrity ko ensure karte hain:

### Rule 1: Multi-Sensor Classification Matrix
Item tab tak accept nahi ho sakta jab tak teeno sensors verification na dein:
- **Material Check**: Agar Inductive sensor (Pin 5) LOW trigger kare toh material strictly `CAN` / `METAL` classify hoga. Agar LOW trigger na ho toh `PLASTIC` classify hoga.
- **Height Check**: Bottom IR (D2), Middle IR (D7), aur Top IR (D8) ke zariye size tay hota hai:
  - Sirf Bottom IR = `SMALL` (5 Points)
  - Bottom + Middle IR = `MEDIUM` (10 Points)
  - Bottom + Middle + Top IR = `LARGE` (15 Points)
- **Object Integrity Check**: Agar item bohot chota ho (<2 cm) ya distance sensor koi reading na de (`ERROR:NO_DISTANCE`), toh item reject ho jayega aur drop gate open nahi hoga.

---

### Rule 2: Anti-Cheat Drop Confirmation Rule
- **Rule**: Machine par item ka size detect hone par points *PENDING* state mein rehte hain, kabhi foran credit nahi hotay.
- **Confirmation Mechanism**: Drop gate servo (Pin 9) 180° open hota hai. Jab bottle drop ho kar bin ke switch se pass hoti hai aur Arduino `BOTTLE:CLEARED` emit karta hai, *sirf aur sirf usi waqt* points commit hotay hain.
- **Anti-Cheat Benefit**: Agar koi shakhs bottle ko dhaagay (string) se baandh kar bar bar andar bahir kare, toh machine usay confirm nahi karegi aur `ERROR:CLEAR_TIMEOUT` generate kar ke points cancel kar degi.

---

### Rule 3: Bin Full Capacity Safety Shutdown
- **Rule**: Agar waste collection bin bhar jaye (optical sensor Pin D10/D11 trigger ho jaye), toh machine foran shutdown state mein chali jati hai.
- **Action**:
  - Arduino `BIN:FULL` aur `ERROR:BIN_FULL` emit karta hai.
  - Drop gate aur entrance gate dono band ho jatay hain.
  - Screen par red alert aa jata hai: *"kindly empty the bin"*.
  - Koi bhi user naya session start nahi kar sakta jab tak technician bin khali kar ke sensor clear na kar de.

---

### Rule 4: Pakistani Mobile Format & Wallet Attribution Rule
- **Rule**: Points claim karne ke liye phone number strictly regex `^03[0-9]{9}$` par poora utarna chahiye.
- **Conditions**:
  - Length: Exactly 11 digits.
  - Prefix: Must start with `03`.
  - Non-numeric characters allow nahi hain (Keypad sirf 0-9 accept karta hai).
  - Ek session ke points sirf ek phone number par credit ho sakte hain. Phone number save hotay hi session ID close ho jata hai aur naya unique GUID generate hota hai aglay session ke liye.

---

### Rule 5: Ultrasonic Pipe Calibration & Auto-Purge Rule
- **Rule**: Session start hotay waqt machine internal pipe ka empty distance measure karti hai (`CALIBRATE`).
- **Auto-Purge Safeguard**: Agar calibration ke waqt pipe ke andar 12 cm se kam distance par koi cheez detect ho jaye, iska matlab hai ke pehle se koi bottle phansi hui hai. Machine foran drop gate open karti hai (`CALIBRATION:CLEARING_CHAMBER`), phansi hui cheez ko drop karti hai, aur dubara re-calibrate karti hai.

---

### Rule 6: Offline Resilience & Zero Data Loss Policy
- **Rule**: Central Cloud API ka down hona kiosk ke operation ko block nahi kar sakta.
- **Strategy**:
  1. Points hamesha pehle local SQL Server `dbo.BottleTransactions` mein commit hotay hain.
  2. Background task Central Server ko notify karta hai. Agar central server offline ho toh transaction local database mein rehti hai.
  3. Jab internet restore hota hai, manual ya automatic batch sync ke zariye تمام offline records upload ho jatay hain.

---

### Rule 7: Dynamic Points Hierarchy Fallback
Points calculate karne ke liye software teen levels ki hierarchy follow karta hai:
1. **Level 1 (Highest)**: `PointRulesCache` (Central Dashboard se real-time dynamic sync).
2. **Level 2 (Middle)**: Local Database table `dbo.PointSettings`.
3. **Level 3 (Hard Fallback)**: Hardcoded safety values (Small: 5, Medium: 10, Large: 15).

Is hierarchy ki waja se machine kabhi bhi crash nahi hoti chahay database band ho ya cloud server offline ho.

---
*Document prepared for RVMDesktopApp Software Engineering & Architecture Reference.*
