# PECODROP RVM — Complete Hardware Wiring & Shield Guide (REV 8.0)

Strict 1:1 hardware pin matching for [`PecoDropDesktopApp/Arduino/RVM_Arduino/RVM_Arduino.ino`](file:///d:/GIT-HUB/RVM-dash/PecoDropDesktopApp/Arduino/RVM_Arduino/RVM_Arduino.ino).

---

## 1. Complete Chamber Pin Assignment Table

### Chamber 1 (Plastic Bottle Sizing & Sort)
| Subsystem Component | Sensor Pin | Arduino Mega Pin | Wire Color Code | Terminal Label |
| :--- | :--- | :--- | :--- | :--- |
| **Entrance Ultrasonic** | `VCC` | `+5V_LOGIC` | Red | `CH1_VCC` |
| | `TRIG` | **Pin 9** | Yellow | `CH1_ENTR_TRIG` |
| | `ECHO` | **Pin 10** | Green | `CH1_ENTR_ECHO` |
| | `GND` | `GND` | Black | `CH1_GND` |
| **Bottom Sizing Ultrasonic** | `TRIG` | **Pin 22** | Yellow | `CH1_BOT_TRIG` |
| | `ECHO` | **Pin 23** | Green | `CH1_BOT_ECHO` |
| **Middle Sizing Ultrasonic** | `TRIG` | **Pin 24** | Yellow | `CH1_MID_TRIG` |
| | `ECHO` | **Pin 41** | Green | `CH1_MID_ECHO` |
| **Top Sizing Ultrasonic** | `TRIG` | **Pin 42** | Yellow | `CH1_TOP_TRIG` |
| | `ECHO` | **Pin 43** | Green | `CH1_TOP_ECHO` |
| **Iris Servo Motor** | `SIGNAL (PWM)` | **Pin 11** | Orange | `CH1_IRIS_PWM` |
| | `VCC (+5V Servo)` | `+5V_SERVO` (Ext Reg) | Red | `5V_SERVO_BUS` |
| | `GND` | `GND` | Brown | `COMMON_GND` |
| **Drop Gate Servo Motor** | `SIGNAL (PWM)` | **Pin 12** | Orange | `CH1_DROP_PWM` |
| **[NEW] Bin Full Optical Sensor** | `SIGNAL` | **Pin 47** | Purple/Yellow | `CH1_BIN_FULL` |
| | `VCC` | `+5V_LOGIC` | Red | `+5V_LOGIC` |
| | `GND` | `GND` | Black | `COMMON_GND` |

---

### Chamber 2 (Metal Can Inductive & Sort)
| Subsystem Component | Sensor Pin | Arduino Mega Pin | Wire Color Code | Terminal Label |
| :--- | :--- | :--- | :--- | :--- |
| **Entrance Ultrasonic** | `TRIG` | **Pin 25** | Yellow | `CH2_ENTR_TRIG` |
| | `ECHO` | **Pin 26** | Green | `CH2_ENTR_ECHO` |
| **Bottom Sizing Ultrasonic** | `TRIG` | **Pin 29** | Yellow | `CH2_BOT_TRIG` |
| | `ECHO` | **Pin 30** | Green | `CH2_BOT_ECHO` |
| **Middle Sizing Ultrasonic** | `TRIG` | **Pin 31** | Yellow | `CH2_MID_TRIG` |
| | `ECHO` | **Pin 44** | Green | `CH2_MID_ECHO` |
| **Top Sizing Ultrasonic** | `TRIG` | **Pin 45** | Yellow | `CH2_TOP_TRIG` |
| | `ECHO` | **Pin 46** | Green | `CH2_TOP_ECHO` |
| **Inductive Proximity Sensor** | `SIGNAL` | **Pin 32** | Black/Blue | `CH2_IND_SIG` |
| | `VCC (+12V)` | `+12V_RAW` | Brown | `12V_BUS` |
| | `GND` | `GND` | Blue | `COMMON_GND` |
| **Iris Servo Motor** | `SIGNAL (PWM)` | **Pin 27** | Orange | `CH2_IRIS_PWM` |
| **Drop Gate Servo Motor** | `SIGNAL (PWM)` | **Pin 28** | Orange | `CH2_DROP_PWM` |
| **[NEW] Bin Full Optical Sensor** | `SIGNAL` | **Pin 48** | Purple/Yellow | `CH2_BIN_FULL` |
| | `VCC` | `+5V_LOGIC` | Red | `+5V_LOGIC` |
| | `GND` | `GND` | Black | `COMMON_GND` |

---

### Chamber 3 (Paper & Carton Compartment)
| Subsystem Component | Sensor Pin | Arduino Mega Pin | Wire Color Code | Terminal Label |
| :--- | :--- | :--- | :--- | :--- |
| **Top Entrance Ultrasonic** | `TRIG` | **Pin 33** | Yellow | `CH3_ENTR_TRIG` |
| | `ECHO` | **Pin 34** | Green | `CH3_ENTR_ECHO` |
| **Bottom Ultrasonic** | `TRIG` | **Pin 39** | Yellow | `CH3_BOT_TRIG` |
| | `ECHO` | **Pin 40** | Green | `CH3_BOT_ECHO` |
| **HX711 Load Cell Module** | `DOUT` | **Pin 37** | White | `HX711_DOUT` |
| | `SCK` | **Pin 38** | Yellow | `HX711_SCK` |
| **Iris Servo Motor** | `SIGNAL (PWM)` | **Pin 35** | Orange | `CH3_IRIS_PWM` |
| **Drop Gate Servo Motor** | `SIGNAL (PWM)` | **Pin 36** | Orange | `CH3_DROP_PWM` |
| **[NEW] Bin Full Optical Sensor** | `SIGNAL` | **Pin 49** | Purple/Yellow | `CH3_BIN_FULL` |
| | `VCC` | `+5V_LOGIC` | Red | `+5V_LOGIC` |
| | `GND` | `GND` | Black | `COMMON_GND` |

---

### Environmental Safety Module
| Subsystem Component | Sensor Pin | Arduino Mega Pin | Wire Color Code | Terminal Label |
| :--- | :--- | :--- | :--- | :--- |
| **[NEW] MQ-6 Gas / Smoke Sensor** | `DOUT` | **Pin 50** | Purple | `ENV_MQ6_ALARM` |
| | `VCC` | `+5V_LOGIC` | Red | `+5V_LOGIC` |
| | `GND` | `GND` | Black | `COMMON_GND` |

---

## 2. Power Supply Requirements

1. **Servo Power Supply (+5V_SERVO)**:
   - High-torque MG996R servos draw up to **1.5A peak stall current each**.
   - With 6 servos, provide a dedicated **5V 10A DC Buck Converter** (e.g. XL4015 or MeanWell 5V 10A PSU).
   - **NEVER** power the servos from the Arduino Mega 5V onboard regulator (it will overheat and reset).
2. **Inductive Sensor Power (+12V)**:
   - Standard industrial NPN/PNP inductive proximity sensors (e.g. LJ12A3-4-Z/BX) require **6V to 36V DC** to operate reliably. Connect their VCC to the **12V power supply**.
3. **Common Ground**:
   - Tie 12V PSU Ground, 5V Servo Ground, and Arduino Mega Ground together at the PCB central star ground net-tie.
