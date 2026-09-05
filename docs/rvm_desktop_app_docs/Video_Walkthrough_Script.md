# RVMDesktopApp — Video Walkthrough Recording Script
**Scene-by-Scene Recording Guide with Visual Actions, Voiceover Scripts & Decision Rationales**
*Zaban: Roman Urdu + English Mix | Production: Kiosk Operator & User Training Video*

---

## Fihrist-e-Scenes / Scene Breakdown
- **Scene 1**: Kiosk Welcome Screen & Idle State (Status, Ads & Eco Counters)
- **Scene 2**: Session Initiation & Ultrasonic Auto-Calibration (Starting the Machine)
- **Scene 3**: Container Insertion & Multi-Sensor Scanning (Plastic Bottle Intake)
- **Scene 4**: Drop Confirmation & Celebratory Reward Video (Anti-Cheat Validation)
- **Scene 5**: Aluminium Can Insertion & Live Impact Calculation (Multi-Material Handling)
- **Scene 6**: Non-Recyclable Item Rejection Handling (Safety & Error Guard)
- **Scene 7**: Wallet Transfer & Mobile Number Entry (Claiming Rewards)
- **Scene 8**: Admin Security Gate & Access Control (Secret Technician Hotkey)
- **Scene 9**: Hardware Diagnostics, Calibration & COM Port Setup (Admin Dashboard)
- **Scene 10**: Cloud Central Master Sync & Fleet Telemetry (Closing Overview)

---

### SCENE 1: Kiosk Welcome Screen & Idle State

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: SCENE 1 - WELCOME SCREEN IN IDLE MODE]         |
| Visual: Kiosk UI in Portrait Mode, Instructions Video playing, Green    |
| 'LIVE 🟢' badge, 'START RECYCLING' glowing button, Eco Counters at 0    |
+-------------------------------------------------------------------------+
```

- **On-Screen Action**:
  Kiosk display screen par camera focus hota hai. Header mein machine ID `RVM-RWP`, live date/time, aur green `API: ONLINE 🟢` badge nazar aa raha hai. Screen ke upper half mein guidance video aur advertisement loop chal rahi hai. Center mein bada circular **"START RECYCLING"** button chamak raha hai.
- **Ye Screen Kyun Zaroori Hai?**:
  Yeh aam public ke liye first impression hai. Shehri ko foran maloom hota hai ke machine operational hai ya kharab, kis tarah bottle insert karni hai (video ke zariye), aur kitne points milenge.
- **Yahan User Kya Decision Leta Hai?**:
  User decision leta hai ke usay recycling session start karna hai. Woh center button par touch karta hai ya physical keypad par `0` dabata hai.
- **Voiceover (Roman Urdu)**:
  > *"Assalam-o-Alaikum! Is video mein hum RVMDesktopApp ka mukammal istemal dekhein ge. Yeh hamara main welcome kiosk interface hai. Jab machine idle hoti hai, toh yahan awareness videos aur commercial advertisements chalti hain. Top right par green badge show kar raha hai ke machine Central Cloud Server se live connected hai aur bilkul tayyar hai."*
- **Voiceover (English)**:
  > *"Welcome to the official walkthrough of the RVMDesktopApp. This is the main welcome interface. When idle, it loops educational and advertisement videos while displaying real-time cloud connectivity status. The citizen can initiate a session by touching the glowing start button."*

---

### SCENE 2: Session Initiation & Ultrasonic Auto-Calibration

- **On-Screen Action**:
  User screen par **"START RECYCLING"** tap karta hai (ya Key `0` press hoti hai). Status indicator yellow ho kar **"Calibrating..."** show karta hai. Text display hota hai: *"Keep pipe empty"*. 1 second baad status vibrant green ho jata hai: **"MACHINE: RUNNING"** aur text display hota hai: *"Insert bottle / can into chamber"*.
- **Ye Screen Kyun Zaroori Hai?**:
  Yeh step machine ki self-diagnosis ke liye intehai ahem hai. Machine internal ultrasonic sensor se chamber ka khali hona confirm karti hai taakay ghalat measurement na ho.
- **Yahan User Kya Decision Leta Hai?**:
  User status green hone ka intizar karta hai aur confirm karta hai ke dahanay (entrance gate) mein koi pehle se phansi hui cheez na ho.
- **Voiceover (Roman Urdu)**:
  > *"Jaise hi user 'START RECYCLING' button dabata hai, software internal chamber ko calibrate karta hai taakay empty pipe ka accurate distance measure ho sake. Status green hote hi entrance gate open ho jata hai aur machine item accept karne ke liye tayyar ho jati hai."*
- **Voiceover (English)**:
  > *"Upon tapping Start, the software immediately calibrates the internal drop pipe using ultrasonic sensors. Once empty distance is established, the status turns green, indicating the intake aperture is unlocked and ready."*

---

### SCENE 3: Container Insertion & Multi-Sensor Scanning

- **On-Screen Action**:
  User chamber ke andar ek standard 500ml plastic bottle drop karta hai. Screen par status instant change hota hai: **"Scanning... Bottle detected"**. Telemetry console (ya status area) mein measurement show hoti hai: *"Bottle length: 21 cm | MEDIUM PLASTIC detected"*.
- **Ye Screen Kyun Zaroori Hai?**:
  User ko live transparency milti hai ke machine uske container ko detect kar chuki hai aur physical sensors (IR beams aur ultrasonic length) usay measure kar rahe hain.
- **Yahan User Kya Decision Leta Hai?**:
  User dekhta hai ke bottle sahi orient ho kar andar gayi hai aur screen par points evaluation ka intizar karta hai.
- **Voiceover (Roman Urdu)**:
  > *"Ab hum ek 500ml plastic bottle insert karte hain. Note karein ke machine ne foran IR beam aur ultrasonic sensor se bottle ki unchai aur length measure kar li hai. Screen par 'MEDIUM PLASTIC detected' ka message display ho raha hai."*
- **Voiceover (English)**:
  > *"As the 500ml bottle enters the chamber, three photoelectric IR sensors and the chamber ultrasonic sensor instantly measure its dimensions. The system accurately identifies the container as a MEDIUM PLASTIC bottle."*

---

### SCENE 4: Drop Confirmation & Celebratory Reward Video

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: SCENE 4 - CELEBRATION MODAL POPUP]             |
| Visual: AcceptedItemVideoWindow playing animated celebration badge:     |
| 'ACCEPTED! +10 Points Added', Total Items counter increments to 1       |
+-------------------------------------------------------------------------+
```

- **On-Screen Action**:
  Machine ka internal servo gate 180° open hota hai. Bottle neeche bin mein girte hi drop sensor trigger hota hai (`BOTTLE:CLEARED`). Instantly screen par **`AcceptedItemVideoWindow`** pop-up hoti hai: green checkmark animation aur text: *"ACCEPTED! +10 Points Added"*. Total items `1` aur total points `10` ho jatay hain.
- **Ye Screen Kyun Zaroori Hai?**:
  Yeh machine ka sab se bara anti-fraud layer hai. Jab tak bottle physical drop clear na ho, points kabhi commit nahi hotay. User ko celebratory animation positive psychological feedback deti hai.
- **Yahan User Kya Decision Leta Hai?**:
  User confirm karta hai ke uski bottle accept ho chuki hai aur faisla karta hai ke kya mazeed items recycle karne hain ya wallet mein points credit karne hain.
- **Voiceover (Roman Urdu)**:
  > *"Ye step intehai ahem hai! Points tab tak commit nahi hote jab tak drop gate khul kar bottle ke storage bin mein girne ki confirmation na de. Jaise hi bottle clear hoti hai, screen par celebration window aati hai aur user ke session mein 10 points add ho jate hain."*
- **Voiceover (English)**:
  > *"Notice our anti-cheat confirmation in action: points are never awarded until the drop gate opens and confirms the physical fall of the item into the bin. Once confirmed, a celebratory reward window displays the awarded 10 points."*

---

### SCENE 5: Aluminium Can Insertion & Live Impact Calculation

- **On-Screen Action**:
  User ab ek metal cold drink can insert karta hai. Inductive sensor (Pin 5) metallic presence pakadta hai. Screen par foran show hota hai: **"MEDIUM CAN detected"**. Drop confirm hotay hi points `20` ho jatay hain. Neeche Eco-Impact counters smoothly animate hotay hain: **CO2 Saved: 0.30 kg**, **Water Saved: 1.50 Liters**.
- **Ye Screen Kyun Zaroori Hai?**:
  Yeh demonstrate karta hai ke machine multi-material capable hai (Plastic vs Metal Can) aur user ko uske environmental impact ka live hisab deti hai.
- **Yahan User Kya Decision Leta Hai?**:
  User apne total points aur environmental saving dekh kar satisfied hota hai.
- **Voiceover (Roman Urdu)**:
  > *"Ab hum ek aluminium beverage can daalte hain. Inductive metal sensor foran metallic material detect kar leta hai. Drop confirmation par mazeed 10 points jama ho jate hain aur niche real-time mein CO2 aur Water Saved ke impact metrics update ho jate hain."*
- **Voiceover (English)**:
  > *"Next, we deposit an aluminium can. The inductive proximity sensor identifies the metallic signature instantly. Upon drop confirmation, the cumulative points rise to 20, and the live Eco-Impact counters show the exact kilograms of CO2 and liters of water conserved."*

---

### SCENE 6: Non-Recyclable Item Rejection Handling

- **On-Screen Action**:
  User ek irregular kharab item ya non-standard box daalta hai. Ultrasonic reading invalid aati hai ya timeout ho jata hai. Screen par red text blink karta hai: **"REJECTED: Invalid item"**. Rejected counter `1` ho jata hai. Drop gate close rehta hai aur item storage bin mein nahi jata.
- **Ye Screen Kyun Zaroori Hai?**:
  Yeh safety aur bin quality preservation ke liye zaroori hai. Kiosk kachra ya patthar accept kar ke storage bin ko kharab hone se bachata hai.
- **Yahan User Kya Decision Leta Hai?**:
  User reject shuda item ko aperture se bahir nikaal leta hai.
- **Voiceover (Roman Urdu)**:
  > *"Agar koi user ghalat ya non-recyclable item daalta hai, toh machine usay reject kar deti hai. Drop gate bilkul open nahi hota taakay kachra storage bin mein na jaye, aur zero points award hote hain."*
- **Voiceover (English)**:
  > *"If an unrecognized or non-recyclable object is introduced, the system rejects it immediately. The drop gate remains securely closed to protect bin purity, and no points are credited."*

---

### SCENE 7: Wallet Transfer & Mobile Number Entry

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: SCENE 7 - WALLET ENTRY DIALOG]                 |
| Visual: WalletPhoneWindow open on screen with total points summary,     |
| 11-digit input field '03001234567', and green 'Credit Wallet ✓' button  |
+-------------------------------------------------------------------------+
```

- **On-Screen Action**:
  User screen par **"CREDIT TO WALLET"** (ya keypad par `Enter`) press karta hai. Dark slate theme wali **`WalletPhoneWindow`** pop-up hoti hai. Summary card mein show hota hai: `2 Items Recycled` | `+20 PTS`. User on-screen touch keypad se number type karta hai: `03001234567`. Green **"Credit Wallet ✓"** tap karta hai. Success popup aati hai aur session reset ho jata hai.
- **Ye Screen Kyun Zaroori Hai?**:
  Yeh citizen ke session ki financial settlement screen hai. Yahan points anonymous kiosk se nikal kar citizen ke registered account ka hissa bante hain.
- **Yahan User Kya Decision Leta Hai?**:
  User apna Pakistani mobile number verify kar ke submit karta hai taakay reward vouchers claim kar sakay.
- **Voiceover (Roman Urdu)**:
  > *"Recycling mukammal karne ke baad user 'Credit to Wallet' par tap karta hai. Yeh popup window khul jati hai jahan user apna 11-digit Pakistani mobile number enter karta hai. Submit karne par local SQL database aur Central Cloud API call execute hoti hai aur points citizen ke wallet mein foran credit ho jate hain."*
- **Voiceover (English)**:
  > *"To finalize the session, the citizen taps 'Credit to Wallet'. The secure phone input dialog appears, displaying a summary of recycled items and points. The user enters their 11-digit Pakistani mobile number. Tapping Credit executes an instant transaction across both the local database and the central cloud API."*

---

### SCENE 8: Admin Security Gate & Access Control

- **On-Screen Action**:
  Technician screen ke top par Admin gear icon tap karta hai ya keyboard par `1` ko teen baar dabata hai (`111`). **`AdminLoginWindow`** khulti hai. Username `RVM` pehle se filled hai. Technician password field mein `Admin786` enter kar ke **"🔓 Login to Admin"** tap karta hai.
- **Ye Screen Kyun Zaroori Hai?**:
  Unauthorized logon ko machine ki hardware calibration aur reward points change karne se rokna.
- **Yahan User Kya Decision Leta Hai?**:
  Technician credentials verify kar ke control suite mein dakhil hota hai.
- **Voiceover (Roman Urdu)**:
  > *"Ab aate hain Administrator aur Field Technician mode ki taraf. Technician secret hotkey '111' dabata hai jis se Admin Security Login window khulti hai. Authorized credentials darj kar ke Admin Control Suite unlock ho jata hai."*
- **Voiceover (English)**:
  > *"Now let's examine the Administrator & Technician experience. By invoking the diagnostic shortcut '111', the secure Admin Login portal is presented. Entering authorized credentials grants access to hardware diagnostics and system controls."*

---

### SCENE 9: Hardware Diagnostics, Calibration & COM Port Setup

```
+-------------------------------------------------------------------------+
| [SCREENSHOT PLACEHOLDER: SCENE 9 - ADMIN HARDWARE CONFIG TAB]           |
| Visual: AdminWindow showing COM Port settings, Baud Rate, 'Save Config',|
| 'Re-initialize Arduino' button, and Live Communication Console          |
+-------------------------------------------------------------------------+
```

- **On-Screen Action**:
  AdminWindow khulti hai. Technician **Tab 4 (Hardware Config)** par jata hai, Arduino port `COM16` dekhta hai aur **"Re-initialize Arduino"** tap karta hai. Console mein DTR reset pulse aur `RESET:OK` show hota hai. Phir Technician Keypad par `33` press karta hai; screen par display hota hai: *"Chamber Cleared - Gate closed. Ready for next item"*.
- **Ye Screen Kyun Zaroori Hai?**:
  Technician ko troubleshooting ke liye software restart kiye baghair COM ports theek karne aur stuck containers nikaalne ki sahulat faraham karta hai.
- **Yahan User Kya Decision Leta Hai?**:
  Technician sensor readings verify karta hai aur calibration run karta hai.
- **Voiceover (Roman Urdu)**:
  > *"Admin Panel mein technician COM ports ko re-assign kar sakta hai aur Arduino ko hardware reset pulse bhej sakta hai. Agar koi container phansa ho, toh hotkey '33' ke zariye drop gate ko manually open kar ke chamber clear kiya ja sakta hai bina machine khole."*
- **Voiceover (English)**:
  > *"Inside the Admin Console, technicians can re-assign COM ports and issue hardware DTR resets on the fly. Should a foreign object jam the chute, shortcut '33' manually triggers the servo gate to clear the blockage immediately without opening the chassis."*

---

### SCENE 10: Cloud Central Master Sync & Fleet Telemetry

- **On-Screen Action**:
  Technician **Tab 5 (Simulator & Test Suite)** par jata hai aur **"Send Heartbeat"** button tap karta hai. Console par status aata hai: `[HEARTBEAT 🟢] Status: 200 OK | Machine online`. Video signage tab mein naye promotional videos show hoti hain jo cloud se auto-sync hui hain. Technician panel close karta hai, aur kiosk wapis main screen par green badge ke sath aa jati hai.
- **Ye Screen Kyun Zaroori Hai?**:
  Audit trail aur remote management ki verification. Ensures machine is connected to head office.
- **Yahan User Kya Decision Leta Hai?**:
  Technician maintenance complete kar ke kiosk ko public ke liye live chhor deta hai.
- **Voiceover (Roman Urdu)**:
  > *"Aakhir mein, test suite se live cloud heartbeat test ki jati hai. Har 15 second baad machine central dashboard ko status bhejti hai aur naye advertisement videos download kar leti hai. Is tarah RVMDesktopApp ek automatic, mehfooz aur reliable recycling experience faraham karta hai. Shukriya!"*
- **Voiceover (English)**:
  > *"Finally, the live heartbeat test confirms two-way synchronization with the master cloud server. The machine autonomously reports telemetry every 15 seconds and downloads fresh marketing campaigns. This concludes our comprehensive walkthrough of RVMDesktopApp. Thank you!"*

---
*Script finalized for high-definition video recording & narration.*
