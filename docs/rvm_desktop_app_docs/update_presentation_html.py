import os

p_html = r"d:\GIT-HUB\RVM-dash\docs\rvm_desktop_app_docs\User_Manual_and_SOP_Presentation.html"
with open(p_html, "r", encoding="utf-8") as f:
    text = f.read()

new_js = '''    const screensData = {
      1: {
        page: "PAGE 01",
        title: "Splash Screen",
        urdu: "شروعاتی اسکرین اور ہارڈویئر ٹیسٹ",
        desc: "This screen indicates that the Reverse Vending Machine (RVM) is starting up and initializing subsystems. The system automatically tests the Arduino serial COM port, verifies local SQL database connectivity, connects to the Central Master Cloud, and calibrates the ultrasonic chamber distance.",
        instruction: "Citizen Action: No action required. Stand by while machine finishes auto-calibration (3-5 seconds).",
        specs: [
          { label: "Serial COM Port", val: "COM3 @ 9600 Baud (Auto-Detect)" },
          { label: "Local Database", val: "Microsoft SQL Server RVMDB" },
          { label: "Chamber Calibration", val: "Baseline 25.0 cm ± 2 cm" },
          { label: "Signage Engine", val: "WPF MediaElement Full HD" }
        ],
        highlightKey: null,
        screenHtml: `<img src="snapshots/screen_01_splash.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Splash Screen" />`
      },
      2: {
        page: "PAGE 02",
        title: "Home Page",
        urdu: "مرکزی اسکرین اور طریقہ کار",
        desc: "This is the primary standby welcome screen. Citizens are greeted with bilingual Urdu/English environmental messaging, live container intake counts, today's top community eco-champions, and cumulative environmental impact meters (CO2 & Water saved).",
        instruction: "Citizen Action: Press the '*' or '0' button on the physical keypad, OR touch the glowing green circle on screen to start recycling.",
        specs: [
          { label: "Keypad Trigger", val: "Press '0' or '*' Key" },
          { label: "Touchscreen Trigger", val: "Tap Central 310px Button" },
          { label: "Bilingual Mode", val: "English + Urdu Nastaliq" },
          { label: "Leaderboard", val: "Live Top 5 + Recent Pulse" }
        ],
        highlightKey: "0",
        screenHtml: `<img src="snapshots/screen_02_home_page.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Home Page" />`
      },
      3: {
        page: "PAGE 03",
        title: "Step: 01 — Ready to Insert",
        urdu: "پہلا مرحلہ: بوتل ڈالنے کی تیاری",
        desc: "This is the first active step of the recycling process. By pressing the '0' button or touching the screen, the citizen indicates readiness. The motorized security gate opens, internal chamber lights turn ON, and optical sensors begin listening.",
        instruction: "Citizen Action: Ensure container is empty of liquid. Insert container bottom-first into the aperture.",
        specs: [
          { label: "Intake Gate Servo", val: "Rotates to 90° (Open)" },
          { label: "Chamber LED Ring", val: "Pin D13 HIGH (Illuminated)" },
          { label: "Citizen Inactivity Timer", val: "30 Seconds Timeout" },
          { label: "Sensor Baseline", val: "Ultrasonic Calibrated" }
        ],
        highlightKey: "0",
        screenHtml: `<img src="snapshots/screen_03_step_01.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Step 01" />`
      },
      4: {
        page: "PAGE 04",
        title: "Step: 02 — Container Scanning",
        urdu: "دوسرا مرحلہ: اسکیننگ اور پیمائش",
        desc: "The RVM is actively scanning the inserted container. The multi-sensor array checks container height (IR photo-beams), material conductivity (Inductive sensor), and length (Ultrasonic distance sensor).",
        instruction: "Citizen Action: Let the container rest in the chamber. Press '1' to proceed or allow automatic sensor trigger.",
        specs: [
          { label: "Height Sizing", val: "Bottom (D2), Mid (D7), Top (D8)" },
          { label: "Material Check", val: "Inductive Metal Sensor (D5)" },
          { label: "Length / Distance", val: "Ultrasonic Cones (D3/D4)" },
          { label: "Scan Time", val: "< 850 milliseconds" }
        ],
        highlightKey: "1",
        screenHtml: `<img src="snapshots/screen_04_step_02.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Step 02" />`
      },
      5: {
        page: "PAGE 05",
        title: "Step: 02 (Cont.) — Rejection Alert",
        urdu: "نامنظور یا بوتل پھنس جانے کا انتباہ",
        desc: "If an invalid container is inserted (e.g. unemptied liquid bottle, non-recyclable garbage, glass), or if an item blocks the beam without dropping, the machine halts drop gate motion and alerts the user.",
        instruction: "Citizen Action: Remove the rejected item from the aperture as prompted. Insert an acceptable plastic bottle or can.",
        specs: [
          { label: "Rejection Logic", val: "No clear beam / Heavy Liquid" },
          { label: "Jam Prevention", val: "Servo reverse pulse after 4.0s" },
          { label: "Anti-Pinch Gate", val: "Auto-reverses if obstructed" },
          { label: "Audit Counter", val: "Increments RejectedTotalCount" }
        ],
        highlightKey: null,
        screenHtml: `<img src="snapshots/screen_05_step_02_rejection.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Step 02 Rejection" />`
      },
      6: {
        page: "PAGE 06",
        title: "Step: 03 — Item Accepted",
        urdu: "تیسرا مرحلہ: بوتل قبول اور پوائنٹس کا اندراج",
        desc: "The container drops through the servo flap and into the collection bin. The celebratory pop-up modal triggers, reward points are allocated, and real-time environmental metrics update immediately.",
        instruction: "Citizen Action: Insert another container for more points, OR press 'Enter' on keypad to claim your rewards.",
        specs: [
          { label: "Confirmation Event", val: "BOTTLE:CLEARED Drop Ping" },
          { label: "Reward Allocation", val: "+5, +10, or +15 Points" },
          { label: "CO2 Dividend", val: "+0.15 kg per item" },
          { label: "Water Dividend", val: "+0.75 Liters per item" }
        ],
        highlightKey: "Enter",
        screenHtml: `<div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><img src="snapshots/screen_02_home_page.png" style="width:100%; height:100%; object-fit:cover; filter:brightness(0.25) blur(1px); border-radius:6px;" /><img src="snapshots/screen_06_step_03_accepted.png" style="position:absolute; width:90%; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.8);" alt="Accepted Modal" /></div>`
      },
      7: {
        page: "PAGE 07",
        title: "Step: 04 — Mobile Wallet Claim",
        urdu: "چوتھا مرحلہ: انعام کیلئے موبائل نمبر کا اندراج",
        desc: "The citizen has finished inserting containers. The screen prompts for their 11-digit Pakistani mobile phone number (03xxxxxxxxx) or offers a QR code scan to transfer earned points into their EcoDrop digital wallet.",
        instruction: "Citizen Action: Type your 11-digit mobile number using the keypad or touch screen, then press 'Enter' or tap 'Credit Wallet'.",
        specs: [
          { label: "Validation Regex", val: "^03[0-9]{9}$ (11 Digits)" },
          { label: "Input Masking", val: "Digit-Only Prevention" },
          { label: "Target Ledger", val: "dbo.WalletAccounts" },
          { label: "QR Alternative", val: "Intake Camera Scan" }
        ],
        highlightKey: "Enter",
        screenHtml: `<div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><img src="snapshots/screen_02_home_page.png" style="width:100%; height:100%; object-fit:cover; filter:brightness(0.25) blur(1px); border-radius:6px;" /><img src="snapshots/screen_07_step_04_wallet.png" style="position:absolute; width:90%; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.8);" alt="Wallet Modal" /></div>`
      },
      8: {
        page: "PAGE 08",
        title: "Step: 04 (Cont.) — Transaction Success",
        urdu: "کامیابی: پوائنٹس کامیابی سے منتقل ہوگئے",
        desc: "Indicates that the recycling session is committed. The transaction is written to the local database and pushed to the Central Cloud via API. The citizen's wallet points balance is updated immediately.",
        instruction: "Citizen Action: Review your credit receipt on screen. Proceed to feedback.",
        specs: [
          { label: "Cloud Endpoint", val: "POST /api/machine/sync-session" },
          { label: "Local Database", val: "dbo.Transactions Inserted" },
          { label: "Sync Flag", val: "IsSynced = 1" },
          { label: "SMS Gateway", val: "Dispatches SMS Receipt" }
        ],
        highlightKey: null,
        screenHtml: `<img src="snapshots/screen_08_step_04_success.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Transaction Success" />`
      },
      9: {
        page: "PAGE 09",
        title: "Feedback Screen",
        urdu: "تجربے کی درجہ بندی اور فیڈبیک",
        desc: "Citizens are invited to submit their feedback regarding machine cleanliness, speed, and overall satisfaction using a 5-star rating system.",
        instruction: "Citizen Action: Press a keypad number from 1 (Poor) to 5 (Excellent) or touch the corresponding star on the display.",
        specs: [
          { label: "Input Range", val: "Keypad keys 1 to 5" },
          { label: "Default Timeout", val: "10 Seconds Auto-Skip" },
          { label: "Storage", val: "Stored in Session Telemetry" },
          { label: "Analytics", val: "Synced to Central QA Dashboard" }
        ],
        highlightKey: "5",
        screenHtml: `<img src="snapshots/screen_09_feedback.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Feedback Screen" />`
      },
      10: {
        page: "PAGE 10",
        title: "Process Completed",
        urdu: "عمل مکمل اور مشین کی بحالی",
        desc: "Final acknowledgement thanking the citizen for supporting environmental protection. An automated 5-second countdown timer runs before resetting the machine back to the Welcome standby screen for the next user.",
        instruction: "Citizen Action: Process finished! Have a great day and continue building a Clean & Green Pakistan.",
        specs: [
          { label: "Auto-Reset Timer", val: "5 Seconds Countdown" },
          { label: "Chamber Shutter", val: "Locks Closed for Security" },
          { label: "Session Buffer", val: "Cleared for Next User" },
          { label: "Digital Signage", val: "Resumes Full Ads Playback" }
        ],
        highlightKey: null,
        screenHtml: `<img src="snapshots/screen_10_complete.png" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" alt="Process Complete" />`
      }
    };'''

idx_start = text.find('const screensData = {')
idx_end = text.find('    function showScreen(idx) {')

if idx_start != -1 and idx_end != -1:
    new_text = text[:idx_start] + new_js + '\n\n' + text[idx_end:]
    with open(p_html, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("SUCCESS: User_Manual_and_SOP_Presentation.html updated with actual screen captures!")
else:
    print(f"Error: indices not found ({idx_start}, {idx_end})")
