#include <Arduino.h>
#line 1 "D:\\RVM-dash-12Sep2026\\RVM-dash\\PecoDropDesktopApp\\Arduino\\RVM_Arduino\\RVM_Arduino.ino"
#include <Servo.h>
#include <math.h>
#include <util/atomic.h>

// Arduino Mega pin map:
// Plastic: entrance ultrasonic 9/10, iris 11, drop gate 12,
// sizing ultrasonics bottom 22/23, middle 24/41, top 42/43.
// Metal: entrance ultrasonic 25/26, iris 27, drop gate 28,
// sizing ultrasonics bottom 29/30, middle 31/44, top 45/46,
// inductive sensor 32.
// Paper: top ultrasonic 33/34, iris 35, drop gate 36, HX711 37/38,
// bottom ultrasonic 39/40.

// Set each flag false when that compartment is connected, then upload again.
// Set all three false when all three compartments are connected.
const bool PLASTIC_DISABLED = true;
const bool METAL_DISABLED = true;
const bool PAPER_DISABLED = false;
const byte METAL_DETECTED_STATE = LOW;
const byte IRIS_CLOSED_ANGLE = 178;
const byte IRIS_OPEN_ANGLE = 10;
const byte DROP_CLOSED_ANGLE = 0;
const byte DROP_OPEN_ANGLE = 170;
// Paper bottom gate (pin 36): adjust independently, then upload again.
const byte PAPER_DROP_CLOSED_ANGLE = 175;
const byte PAPER_DROP_OPEN_ANGLE = 100;
const unsigned int MAX_DISTANCE_CM = 200;
const unsigned long ECHO_TIMEOUT_US = 20000UL;
// Keep signed: a farther echo gives a negative delta, not an occupied level.
// On AVR, an unsigned threshold converts that negative delta to a large value.
const int DETECTION_CHANGE_CM = 3;
const byte REQUIRED_DETECTIONS = 3;
const byte ENTRANCE_CONFIRM_READINGS = 3;
const byte ENTRANCE_CLEAR_READINGS = 5;
const byte ENTRANCE_CLEAR_TOLERANCE_CM = 2;
const unsigned long ENTRANCE_HOLD_MS = 200;
// Direct Servo.write commands already request full-speed travel.
// Hold the iris open long enough for insertion; keep processing STOP commands.
const unsigned long IRIS_MIN_OPEN_MS = 3000UL;
const unsigned long ENTRANCE_CLEAR_MS = 1000;
const byte SIZE_READING_SAMPLES = 3;
const byte REQUIRED_SIZE_CHANGES = 2;
const unsigned long ARRIVAL_TIMEOUT_MS = 5000UL;
const unsigned long BOTTLE_SETTLE_MS = 2000UL;
const unsigned long CLEAR_TIMEOUT_MS = 5000UL;
const float PAPER_COUNTS_PER_GRAM = 420.0f;
const float PAPER_MIN_WEIGHT_G = 20.0f;
const float PAPER_CLEAR_WEIGHT_G = 8.0f;

Servo plasticIris, plasticDrop, metalIris, metalDrop, paperIris, paperDrop;

struct Compartment {
  const char* name;
  const char* material;
  byte ultrasonicTrigPin;
  byte ultrasonicEchoPin;
  byte bottomUltrasonicTrigPin;
  byte bottomUltrasonicEchoPin;
  byte irisServoPin;
  byte bottomGateServoPin;
  byte bottomSizeTrigPin;
  byte bottomSizeEchoPin;
  byte middleSizeTrigPin;
  byte middleSizeEchoPin;
  byte topSizeTrigPin;
  byte topSizeEchoPin;
  byte materialSensorPin;
  byte loadCellDoutPin;
  byte loadCellSckPin;
  Servo* irisServo;
  Servo* bottomGateServo;
  int emptyDistanceCm;
  int bottomEmptyDistanceCm;
  int bottomSizeEmptyCm;
  int middleSizeEmptyCm;
  int topSizeEmptyCm;
  byte detectionCount;
  byte entranceClearCount;
  bool entranceArmed;
  unsigned long entranceStateSince;
  int candidateMinCm;
  int candidateMaxCm;
};

Compartment plastic = {
  "PLASTIC", "PLASTIC", 9, 10, 0, 0, 11, 12,
  22, 23, 24, 41, 42, 43, 0, 0, 0,
  &plasticIris, &plasticDrop, -1, -1, -1, -1, -1, 0
};
Compartment metal = {
  "METAL", "CAN", 25, 26, 0, 0, 27, 28,
  29, 30, 31, 44, 45, 46, 32, 0, 0,
  &metalIris, &metalDrop, -1, -1, -1, -1, -1, 0
};
Compartment paper = {
  "PAPER", "PAPER", 33, 34, 39, 40, 35, 36,
  0, 0, 0, 0, 0, 0, 0, 37, 38,
  &paperIris, &paperDrop, -1, -1, -1, -1, -1, 0
};

bool machineRunning = false;
bool calibrated = false;
long paperTareRaw = 0;
bool paperScaleReady = false;
String serialBuffer;
bool entranceDebug = false;
bool recoveringSensorFault = false;

int readUltrasonicCm(byte trigPin, byte echoPin);
int readStableUltrasonicCm(byte trigPin, byte echoPin, byte samples);
bool sizeLevelChanged(byte trigPin, byte echoPin, int emptyDistanceCm);
bool updateDetection(Compartment& c);
int readSizeLevel(Compartment& c, const char* level, byte trigPin,
                  byte echoPin, int emptyCm);
const char* calculateSize(Compartment& c);
bool waitForSizingItem(Compartment& c);
bool waitForSizingClear(Compartment& c);
bool metalDetectedStable();
void processSizedItem(Compartment& c);
void recoverSizingFault(Compartment& c);
bool sizedCompartmentEmpty(Compartment& c);
void processPaper();
bool waitForIrisOpenHold(unsigned long openedAt);
bool paperAtBottom();
bool waitForPaperWeight(float& grams);
bool waitForPaperClear();
bool readHx711Raw(long& raw);
bool waitForHx711Ready(unsigned long timeoutMs);
bool readHx711Average(byte samples, long& raw);
float readPaperGrams(byte samples);
void calibrateAll();
void makeSafe();
void handleSerial();
void executeCommand(String command);

#line 136 "D:\\RVM-dash-12Sep2026\\RVM-dash\\PecoDropDesktopApp\\Arduino\\RVM_Arduino\\RVM_Arduino.ino"
void setupSizedCompartment(Compartment& c);
#line 153 "D:\\RVM-dash-12Sep2026\\RVM-dash\\PecoDropDesktopApp\\Arduino\\RVM_Arduino\\RVM_Arduino.ino"
void setupPaper();
#line 167 "D:\\RVM-dash-12Sep2026\\RVM-dash\\PecoDropDesktopApp\\Arduino\\RVM_Arduino\\RVM_Arduino.ino"
void setup();
#line 187 "D:\\RVM-dash-12Sep2026\\RVM-dash\\PecoDropDesktopApp\\Arduino\\RVM_Arduino\\RVM_Arduino.ino"
void loop();
#line 136 "D:\\RVM-dash-12Sep2026\\RVM-dash\\PecoDropDesktopApp\\Arduino\\RVM_Arduino\\RVM_Arduino.ino"
void setupSizedCompartment(Compartment& c) {
  pinMode(c.ultrasonicTrigPin, OUTPUT);
  pinMode(c.ultrasonicEchoPin, INPUT);
  digitalWrite(c.ultrasonicTrigPin, LOW);
  pinMode(c.bottomSizeTrigPin, OUTPUT);
  pinMode(c.bottomSizeEchoPin, INPUT);
  pinMode(c.middleSizeTrigPin, OUTPUT);
  pinMode(c.middleSizeEchoPin, INPUT);
  pinMode(c.topSizeTrigPin, OUTPUT);
  pinMode(c.topSizeEchoPin, INPUT);
  digitalWrite(c.bottomSizeTrigPin, LOW);
  digitalWrite(c.middleSizeTrigPin, LOW);
  digitalWrite(c.topSizeTrigPin, LOW);
  c.irisServo->attach(c.irisServoPin);
  c.bottomGateServo->attach(c.bottomGateServoPin);
}

void setupPaper() {
  pinMode(paper.ultrasonicTrigPin, OUTPUT);
  pinMode(paper.ultrasonicEchoPin, INPUT);
  pinMode(paper.bottomUltrasonicTrigPin, OUTPUT);
  pinMode(paper.bottomUltrasonicEchoPin, INPUT);
  digitalWrite(paper.ultrasonicTrigPin, LOW);
  digitalWrite(paper.bottomUltrasonicTrigPin, LOW);
  pinMode(paper.loadCellDoutPin, INPUT);
  pinMode(paper.loadCellSckPin, OUTPUT);
  digitalWrite(paper.loadCellSckPin, LOW);
  paper.irisServo->attach(paper.irisServoPin);
  paper.bottomGateServo->attach(paper.bottomGateServoPin);
}

void setup() {
  Serial.begin(115200);
  if (!PLASTIC_DISABLED) setupSizedCompartment(plastic);
  if (!METAL_DISABLED) {
    setupSizedCompartment(metal);
    pinMode(metal.materialSensorPin, INPUT_PULLUP);
  }
  if (!PAPER_DISABLED) setupPaper();
  makeSafe();
  delay(500);
  calibrateAll();
  if (calibrated) {
    if (!PLASTIC_DISABLED && !METAL_DISABLED && !PAPER_DISABLED)
      Serial.println("RVM:PLASTIC_METAL_PAPER_READY");
    else if (!PLASTIC_DISABLED && METAL_DISABLED && PAPER_DISABLED)
      Serial.println("RVM:PLASTIC_ONLY_READY");
    else Serial.println("RVM:ENABLED_COMPARTMENTS_READY");
  }
}

void loop() {
  handleSerial();
  if (!machineRunning || !calibrated) {
    delay(20);
    return;
  }
  // IDLE: gates remain closed. Only entrance/top ultrasonics are checked here.
  // Sizing ultrasonics are read only after an entrance sensor opens its iris.
  if (!PLASTIC_DISABLED && updateDetection(plastic)) processSizedItem(plastic);
  else {
    delay(30);
    if (!METAL_DISABLED && updateDetection(metal)) processSizedItem(metal);
    else {
      delay(30);
      if (!PAPER_DISABLED && updateDetection(paper)) processPaper();
    }
  }
  delay(40);
}

bool updateDetection(Compartment& c) {
  int distance = readUltrasonicCm(c.ultrasonicTrigPin, c.ultrasonicEchoPin);
  // Compare with the empty distance saved during calibration. Either a
  // nearer or farther valid echo can indicate an object at the entrance.
  bool detected = distance > 0 && c.emptyDistanceCm > 0 &&
                  abs(c.emptyDistanceCm - distance) >= DETECTION_CHANGE_CM;
  // Require a stable empty entrance after calibration and after each item.
  if (!c.entranceArmed) {
    bool clear = distance > 0 && c.emptyDistanceCm > 0 &&
                 abs(distance - c.emptyDistanceCm) <= ENTRANCE_CLEAR_TOLERANCE_CM;
    if (clear) {
      if (c.entranceClearCount == 0) c.entranceStateSince = millis();
      if (c.entranceClearCount < ENTRANCE_CLEAR_READINGS) c.entranceClearCount++;
    } else c.entranceClearCount = 0;
    c.detectionCount = 0;
    if (c.entranceClearCount >= ENTRANCE_CLEAR_READINGS &&
        millis() - c.entranceStateSince >= ENTRANCE_CLEAR_MS) {
      c.entranceArmed = true;
      c.entranceClearCount = 0;
    }
  } else {
    if (detected) {
      if (c.detectionCount == 0) {
        c.entranceStateSince = millis();
        c.candidateMinCm = c.candidateMaxCm = distance;
      }
      c.candidateMinCm = min(c.candidateMinCm, distance);
      c.candidateMaxCm = max(c.candidateMaxCm, distance);
      if (c.candidateMaxCm - c.candidateMinCm > 2) {
        c.detectionCount = 0;
      } else if (c.detectionCount < ENTRANCE_CONFIRM_READINGS) c.detectionCount++;
    }
    if (!detected) c.detectionCount = 0;
  }
  if (entranceDebug) {
    Serial.print("ENTRANCE:"); Serial.print(c.name);
    Serial.print(";CM:"); Serial.print(distance);
    Serial.print(";EMPTY_CM:"); Serial.print(c.emptyDistanceCm);
    Serial.print(";ARMED:"); Serial.print(c.entranceArmed ? 1 : 0);
    Serial.print(";COUNT:"); Serial.println(c.detectionCount);
  }
  if (c.detectionCount < ENTRANCE_CONFIRM_READINGS ||
      millis() - c.entranceStateSince < ENTRANCE_HOLD_MS) return false;
  c.entranceArmed = false;
  c.entranceClearCount = 0;
  c.detectionCount = 0;
  return true;
}

void processSizedItem(Compartment& c) {
  Serial.print(c.name); Serial.println(":OBJECT_DETECTED");
  c.irisServo->write(IRIS_OPEN_ANGLE);
  unsigned long irisOpenedAt = millis();
  delay(700);
  Serial.print(c.name); Serial.println(":WAITING_FOR_BOTTOM");
  if (!waitForSizingItem(c)) {
    c.irisServo->write(IRIS_CLOSED_ANGLE);
    if (machineRunning) {
      Serial.print("ERROR:"); Serial.print(c.name); Serial.println("_ARRIVAL_TIMEOUT");
      Serial.print(c.name); Serial.println(":ARRIVAL_SENSOR_SNAPSHOT");
      readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin, c.bottomSizeEchoPin, c.bottomSizeEmptyCm);
      readSizeLevel(c, "MIDDLE", c.middleSizeTrigPin, c.middleSizeEchoPin, c.middleSizeEmptyCm);
      readSizeLevel(c, "TOP", c.topSizeTrigPin, c.topSizeEchoPin, c.topSizeEmptyCm);
    }
    c.detectionCount = 0;
    return;
  }
  // Keep the iris open while the arriving bottle finishes falling and settles.
  Serial.print(c.name); Serial.println(":BOTTLE_SETTLING");
  unsigned long settleStarted = millis();
  while (millis() - settleStarted < BOTTLE_SETTLE_MS) {
    handleSerial();
    if (!machineRunning) return;
    delay(10);
  }
  // Measure with the same gate positions used for empty calibration.
  if (!waitForIrisOpenHold(irisOpenedAt)) return;
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  delay(700);
  Serial.print(c.name); Serial.println(":SIZING_START");
  const char* size = calculateSize(c);
  if (!machineRunning) return; // A STOP during sizing must not release an item.
  if (strcmp(size, "INVALID") == 0) {
    c.irisServo->write(IRIS_CLOSED_ANGLE);
    Serial.print("ERROR:"); Serial.print(c.name); Serial.println("_INVALID_SENSOR_PATTERN");
    recoverSizingFault(c);
    return;
  }
  bool accepted = (&c != &metal) || metalDetectedStable();
  Serial.print("SIZE:"); Serial.print(size); Serial.print(";MATERIAL:");
  Serial.println(accepted ? c.material : "REJECT");
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  delay(150);
  c.bottomGateServo->write(DROP_OPEN_ANGLE);
  delay(900);
  bool cleared = waitForSizingClear(c);
  c.bottomGateServo->write(DROP_CLOSED_ANGLE);
  Serial.println(cleared ? "BOTTLE:CLEARED" : "ERROR:CLEAR_TIMEOUT");
  c.detectionCount = 0;
  delay(600);
}

// Recovery must see real echoes near the old empty baselines. A missing or
// unexpectedly distant echo is not evidence that the chamber is empty.
bool sizedCompartmentEmpty(Compartment& c) {
  int entrance = readUltrasonicCm(c.ultrasonicTrigPin, c.ultrasonicEchoPin);
  int bottom = readUltrasonicCm(c.bottomSizeTrigPin, c.bottomSizeEchoPin);
  int middle = readUltrasonicCm(c.middleSizeTrigPin, c.middleSizeEchoPin);
  int top = readUltrasonicCm(c.topSizeTrigPin, c.topSizeEchoPin);
  return entrance > 0 && bottom > 0 && middle > 0 && top > 0 &&
         c.emptyDistanceCm > 0 && c.bottomSizeEmptyCm > 0 &&
         c.middleSizeEmptyCm > 0 && c.topSizeEmptyCm > 0 &&
         abs(entrance - c.emptyDistanceCm) <= ENTRANCE_CLEAR_TOLERANCE_CM &&
         abs(bottom - c.bottomSizeEmptyCm) <= ENTRANCE_CLEAR_TOLERANCE_CM &&
         abs(middle - c.middleSizeEmptyCm) <= ENTRANCE_CLEAR_TOLERANCE_CM &&
         abs(top - c.topSizeEmptyCm) <= ENTRANCE_CLEAR_TOLERANCE_CM;
}

void recoverSizingFault(Compartment& c) {
  recoveringSensorFault = true;
  calibrated = false;
  makeSafe();
  // No SIZE event: an invalid scan must not award credit.
  Serial.print(c.name); Serial.println(":RELEASING_INVALID_BOTTLE");
  c.bottomGateServo->write(DROP_OPEN_ANGLE);
  unsigned long started = millis();
  while (machineRunning && millis() - started < 1500UL) {
    handleSerial();
    delay(10);
  }
  c.bottomGateServo->write(DROP_CLOSED_ANGLE);
  delay(700);
  Serial.println("RECOVERY:VERIFYING_EMPTY");
  started = millis();
  byte emptyScans = 0;
  bool empty = false;
  while (machineRunning && millis() - started < 8000UL) {
    handleSerial();
    if (!machineRunning) break;
    bool clear = PLASTIC_DISABLED || sizedCompartmentEmpty(plastic);
    if (!METAL_DISABLED) clear = sizedCompartmentEmpty(metal) && clear;
    if (!PAPER_DISABLED) {
      int paperTop = readUltrasonicCm(paper.ultrasonicTrigPin, paper.ultrasonicEchoPin);
      int paperBottom = readUltrasonicCm(paper.bottomUltrasonicTrigPin, paper.bottomUltrasonicEchoPin);
      clear = clear && paperTop > 0 && paperBottom > 0 &&
              abs(paperTop - paper.emptyDistanceCm) <= ENTRANCE_CLEAR_TOLERANCE_CM &&
              abs(paperBottom - paper.bottomEmptyDistanceCm) <= ENTRANCE_CLEAR_TOLERANCE_CM;
    }
    emptyScans = clear ? emptyScans + 1 : 0;
    if (emptyScans >= 3) { empty = true; break; }
  }
  recoveringSensorFault = false;
  if (!machineRunning) return;
  if (!empty) {
    machineRunning = false;
    makeSafe();
    Serial.println("ERROR:SENSOR_FAULT_REMOVE_OBJECTS_AND_CALIBRATE");
    return;
  }
  Serial.println("BOTTLE:CLEARED");
  Serial.println("RECOVERY:AUTO_CALIBRATING");
  calibrateAll();
}

// Return -1 for an unreliable reading, 0 for clear, and 1 for occupied.
// Missing echoes must not silently turn a large bottle into a smaller one.
int readSizeLevel(Compartment& c, const char* level, byte trigPin,
                  byte echoPin, int emptyCm) {
  byte occupied = 0, clear = 0;
  Serial.print("SIZING:"); Serial.print(c.name);
  Serial.print(";LEVEL:"); Serial.print(level);
  Serial.print(";EMPTY_CM:"); Serial.print(emptyCm);
  Serial.print(";READINGS_CM:");
  for (byte sample = 0; sample < SIZE_READING_SAMPLES; sample++) {
    int distance = readUltrasonicCm(trigPin, echoPin);
    if (sample > 0) Serial.print(',');
    Serial.print(distance);
    if (distance > 0 && emptyCm > 0) {
      if (emptyCm - distance >= DETECTION_CHANGE_CM) occupied++;
      else if (abs(emptyCm - distance) <= ENTRANCE_CLEAR_TOLERANCE_CM) clear++;
    }
  }
  int state = occupied >= REQUIRED_SIZE_CHANGES ? 1 :
              (clear >= REQUIRED_SIZE_CHANGES ? 0 : -1);
  Serial.print(";STATE:"); Serial.println(state);
  return state;
}

const char* calculateSize(Compartment& c) {
  const char* previous = "INVALID";
  byte largeFallbackScans = 0;
  // Allow the bottle to settle, requiring two matching valid scans.
  for (byte attempt = 0; attempt < 4; attempt++) {
    handleSerial();
    if (!machineRunning) return "INVALID";
    int bottom = readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin,
                              c.bottomSizeEchoPin, c.bottomSizeEmptyCm);
    int middle = readSizeLevel(c, "MIDDLE", c.middleSizeTrigPin,
                              c.middleSizeEchoPin, c.middleSizeEmptyCm);
    int top = readSizeLevel(c, "TOP", c.topSizeTrigPin,
                           c.topSizeEchoPin, c.topSizeEmptyCm);
    // Plastic bottles can deflect the middle echo. Require bottom and top
    // occupancy twice in this scan window; unknown echoes alone never qualify.
    if (&c == &plastic && bottom == 1 && middle == -1 && top == 1) {
      if (++largeFallbackScans >= 2) {
        Serial.println("SIZING:PLASTIC;FALLBACK:LARGE_MIDDLE_UNRELIABLE");
        return "LARGE";
      }
    } else if (bottom == 0 || middle == 0 || top == 0) {
      largeFallbackScans = 0;
    }
    const char* size = "INVALID";
    if (bottom == 1 && middle == 1 && top == 1) size = "LARGE";
    else if (bottom == 1 && middle == 1 && top == 0) size = "MEDIUM";
    else if (bottom == 1 && middle == 0 && top == 0) size = "SMALL";
    if (strcmp(size, "INVALID") != 0 && strcmp(size, previous) == 0) return size;
    previous = size;
    delay(150);
  }
  return "INVALID";
}

bool waitForSizingItem(Compartment& c) {
  unsigned long started = millis();
  byte bottomChangeCount = 0;
  while (millis() - started < ARRIVAL_TIMEOUT_MS) {
    handleSerial();
    if (!machineRunning) return false;
    // DEBUG ON exposes arrival readings while the iris is still open.
    bool bottomOccupied;
    if (entranceDebug) {
      Serial.print(c.name); Serial.println(":ARRIVAL_CHECK");
      bottomOccupied = readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin,
                                    c.bottomSizeEchoPin, c.bottomSizeEmptyCm) == 1;
    } else {
      bottomOccupied = sizeLevelChanged(c.bottomSizeTrigPin, c.bottomSizeEchoPin,
                                       c.bottomSizeEmptyCm);
    }
    if (bottomOccupied) {
      if (++bottomChangeCount >= REQUIRED_DETECTIONS) return true;
    } else {
      bottomChangeCount = 0;
    }
    delay(15);
  }
  return false;
}

bool waitForSizingClear(Compartment& c) {
  unsigned long started = millis();
  byte clearCount = 0;
  while (millis() - started < CLEAR_TIMEOUT_MS) {
    handleSerial();
    if (!machineRunning) return false;
    bool bottomClear = !sizeLevelChanged(c.bottomSizeTrigPin,
                                         c.bottomSizeEchoPin,
                                         c.bottomSizeEmptyCm);
    delay(30);
    bool middleClear = !sizeLevelChanged(c.middleSizeTrigPin,
                                         c.middleSizeEchoPin,
                                         c.middleSizeEmptyCm);
    delay(30);
    bool topClear = !sizeLevelChanged(c.topSizeTrigPin,
                                      c.topSizeEchoPin,
                                      c.topSizeEmptyCm);
    bool clear = bottomClear && middleClear && topClear;
    clearCount = clear ? clearCount + 1 : 0;
    if (clearCount >= 5) return true;
    delay(30);
  }
  return false;
}

bool metalDetectedStable() {
  byte count = 0;
  for (byte i = 0; i < 12; i++) {
    if (digitalRead(metal.materialSensorPin) == METAL_DETECTED_STATE) count++;
    delay(15);
  }
  return count >= 9;
}

bool waitForIrisOpenHold(unsigned long openedAt) {
  while (millis() - openedAt < IRIS_MIN_OPEN_MS) {
    handleSerial();
    if (!machineRunning) return false;
    delay(10);
  }
  return machineRunning;
}

void processPaper() {
  Serial.println("PAPER:OBJECT_DETECTED");
  paper.irisServo->write(IRIS_OPEN_ANGLE);
  // Weigh after the insertion window so the final reading includes the item.
  if (!waitForIrisOpenHold(millis())) return;
  float grams = 0.0f;
  if (!waitForPaperWeight(grams)) {
    paper.irisServo->write(IRIS_CLOSED_ANGLE);
    if (machineRunning) Serial.println("ERROR:PAPER_WEIGHT_TIMEOUT");
    paper.detectionCount = 0;
    return;
  }
  paper.irisServo->write(IRIS_CLOSED_ANGLE);
  Serial.print("SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:");
  Serial.println(grams / 1000.0f, 3);
  delay(150);
  paper.bottomGateServo->write(PAPER_DROP_OPEN_ANGLE);
  delay(900);
  bool cleared = waitForPaperClear();
  paper.bottomGateServo->write(PAPER_DROP_CLOSED_ANGLE);
  Serial.println(cleared ? "BOTTLE:CLEARED" : "ERROR:CLEAR_TIMEOUT");
  paper.detectionCount = 0;
  delay(600);
}

bool paperAtBottom() {
  int distance = readUltrasonicCm(paper.bottomUltrasonicTrigPin,
                                  paper.bottomUltrasonicEchoPin);
  return distance > 0 && paper.bottomEmptyDistanceCm > 0 &&
         paper.bottomEmptyDistanceCm - distance >= DETECTION_CHANGE_CM;
}

bool waitForPaperWeight(float& grams) {
  unsigned long started = millis();
  byte stableCount = 0;
  float previous = 0.0f;
  while (millis() - started < ARRIVAL_TIMEOUT_MS) {
    handleSerial();
    if (!machineRunning) return false;
    // The entrance ultrasonic detects the object; the load cell measures it.
    // Start weighing without waiting for the bottom ultrasonic to confirm it.
    float current = readPaperGrams(3);
    if (current >= PAPER_MIN_WEIGHT_G) {
      stableCount = abs(current - previous) <= 5.0f ? stableCount + 1 : 0;
      previous = current;
      if (stableCount >= 3) {
        grams = readPaperGrams(8);
        return !isnan(grams) && grams >= PAPER_MIN_WEIGHT_G;
      }
    } else {
      stableCount = 0;
      previous = current;
    }
    delay(40);
  }
  long raw;
  if (!readHx711Average(3, raw)) return false;
  Serial.print("PAPER:WEIGHT_TIMEOUT_RAW:"); Serial.print(raw);
  Serial.print(";TARE_RAW:"); Serial.print(paperTareRaw);
  Serial.print(";SIGNED_GRAMS:");
  Serial.println((float)(raw - paperTareRaw) / PAPER_COUNTS_PER_GRAM, 2);
  return false;
}

bool waitForPaperClear() {
  unsigned long started = millis();
  byte clearCount = 0;
  while (millis() - started < CLEAR_TIMEOUT_MS) {
    handleSerial();
    if (!machineRunning) return false;
    bool clear = !paperAtBottom() && readPaperGrams(2) <= PAPER_CLEAR_WEIGHT_G;
    clearCount = clear ? clearCount + 1 : 0;
    if (clearCount >= 4) return true;
    delay(40);
  }
  return false;
}

bool sizeLevelChanged(byte trigPin, byte echoPin, int emptyDistanceCm) {
  if (emptyDistanceCm <= 0) return false;

  byte changedReadings = 0;
  for (byte sample = 0; sample < SIZE_READING_SAMPLES; sample++) {
    int distance = readUltrasonicCm(trigPin, echoPin);
    if (distance > 0 && emptyDistanceCm - distance >= DETECTION_CHANGE_CM) {
      changedReadings++;
    }
    delay(25);
  }
  return changedReadings >= REQUIRED_SIZE_CHANGES;
}

int readUltrasonicCm(byte trigPin, byte echoPin) {
  // Space all ultrasonic triggers, including transitions between sensors.
  static unsigned long lastTriggerMs = 0;
  unsigned long elapsed = millis() - lastTriggerMs;
  if (elapsed < 60UL) delay(60UL - elapsed);
  lastTriggerMs = millis();
  digitalWrite(trigPin, LOW); delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  unsigned long duration = pulseIn(echoPin, HIGH, ECHO_TIMEOUT_US);
  if (duration == 0) return -1;
  int distance = (int)(duration / 58UL);
  return distance > 0 && distance <= MAX_DISTANCE_CM ? distance : -1;
}

int readStableUltrasonicCm(byte trigPin, byte echoPin, byte samples) {
  long total = 0;
  byte valid = 0;
  int nearest = MAX_DISTANCE_CM, farthest = 0;
  for (byte i = 0; i < samples; i++) {
    int distance = readUltrasonicCm(trigPin, echoPin);
    if (distance > 0) {
      total += distance;
      valid++;
      nearest = min(nearest, distance);
      farthest = max(farthest, distance);
    }
    delay(60);
  }
  // A baseline averaged from jumping echoes can create phantom objects.
  // Require every sample and at most 2 cm spread before enabling motion.
  if (samples == 0 || valid != samples || farthest - nearest > 2) {
    Serial.print("ERROR:UNSTABLE_CALIBRATION_TRIG:"); Serial.println(trigPin);
    return -1;
  }
  return (int)(total / valid);
}

bool waitForHx711Ready(unsigned long timeoutMs) {
  unsigned long started = millis();
  while (digitalRead(paper.loadCellDoutPin) == HIGH &&
         millis() - started < timeoutMs) {
    delay(1);
  }
  return digitalRead(paper.loadCellDoutPin) == LOW;
}

bool readHx711Raw(long& raw) {
  if (!waitForHx711Ready(1000UL)) {
    Serial.println("ERROR:HX711_NOT_READY_DOUT_HIGH");
    return false;
  }
  unsigned long value = 0;
  for (byte i = 0; i < 24; i++) {
    // Interrupts must not stretch SCK HIGH into the HX711 power-down interval.
    // Restore interrupts between pulses so servo timing can still run.
    ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
      digitalWrite(paper.loadCellSckPin, HIGH);
      delayMicroseconds(1);
      value = (value << 1) | digitalRead(paper.loadCellDoutPin);
      digitalWrite(paper.loadCellSckPin, LOW);
    }
    delayMicroseconds(1);
  }
  // Pulse 25 selects channel A, gain 128 for the next conversion.
  ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
    digitalWrite(paper.loadCellSckPin, HIGH);
    delayMicroseconds(1);
    digitalWrite(paper.loadCellSckPin, LOW);
  }
  delayMicroseconds(1);
  if (digitalRead(paper.loadCellDoutPin) != HIGH) {
    Serial.println("ERROR:HX711_DOUT_NOT_HIGH_AFTER_READ");
    return false;
  }
  if (value & 0x800000UL) value |= 0xFF000000UL;
  raw = (long)value;
  return true;
}

bool readHx711Average(byte samples, long& raw) {
  if (samples == 0) return false;
  long total = 0;
  for (byte i = 0; i < samples; i++) {
    long sample;
    if (!readHx711Raw(sample)) return false;
    total += sample;
  }
  raw = total / samples;
  return true;
}

float readPaperGrams(byte samples) {
  long raw;
  if (!readHx711Average(samples, raw)) return NAN;
  float grams = (float)(raw - paperTareRaw) /
                PAPER_COUNTS_PER_GRAM;
  return grams > 0.0f ? grams : 0.0f;
}

void calibrateAll() {
  machineRunning = false;
  calibrated = false;
  paperScaleReady = false;
  makeSafe();
  Serial.println("CALIBRATION:REMOVE_OBJECTS");
  delay(1000);
  if (!PLASTIC_DISABLED) {
    plastic.emptyDistanceCm = readStableUltrasonicCm(
      plastic.ultrasonicTrigPin, plastic.ultrasonicEchoPin, 7);
    delay(100);
    plastic.bottomSizeEmptyCm = readStableUltrasonicCm(
      plastic.bottomSizeTrigPin, plastic.bottomSizeEchoPin, 5);
    delay(100);
    plastic.middleSizeEmptyCm = readStableUltrasonicCm(
      plastic.middleSizeTrigPin, plastic.middleSizeEchoPin, 5);
    delay(100);
    plastic.topSizeEmptyCm = readStableUltrasonicCm(
      plastic.topSizeTrigPin, plastic.topSizeEchoPin, 5);
  }
  if (!METAL_DISABLED) {
    delay(100);
    metal.emptyDistanceCm = readStableUltrasonicCm(
      metal.ultrasonicTrigPin, metal.ultrasonicEchoPin, 7);
    delay(100);
    metal.bottomSizeEmptyCm = readStableUltrasonicCm(
      metal.bottomSizeTrigPin, metal.bottomSizeEchoPin, 5);
    delay(100);
    metal.middleSizeEmptyCm = readStableUltrasonicCm(
      metal.middleSizeTrigPin, metal.middleSizeEchoPin, 5);
    delay(100);
    metal.topSizeEmptyCm = readStableUltrasonicCm(
      metal.topSizeTrigPin, metal.topSizeEchoPin, 5);
    delay(100);
  }
  if (!PAPER_DISABLED) {
    paper.emptyDistanceCm = readStableUltrasonicCm(
      paper.ultrasonicTrigPin, paper.ultrasonicEchoPin, 7);
    delay(100);
    paper.bottomEmptyDistanceCm = readStableUltrasonicCm(
      paper.bottomUltrasonicTrigPin, paper.bottomUltrasonicEchoPin, 7);
    delay(500);
    long tare;
    paperScaleReady = readHx711Average(12, tare);
    if (paperScaleReady) paperTareRaw = tare;
  }
  calibrated = (!PLASTIC_DISABLED || !METAL_DISABLED || !PAPER_DISABLED) &&
               (PLASTIC_DISABLED || (plastic.emptyDistanceCm > 0 &&
                plastic.bottomSizeEmptyCm > 0 && plastic.middleSizeEmptyCm > 0 &&
                plastic.topSizeEmptyCm > 0)) &&
               (METAL_DISABLED || (metal.emptyDistanceCm > 0 &&
                metal.bottomSizeEmptyCm > 0 && metal.middleSizeEmptyCm > 0 &&
                metal.topSizeEmptyCm > 0)) &&
               (PAPER_DISABLED || (paper.emptyDistanceCm > 0 &&
                paper.bottomEmptyDistanceCm > 0 && paperScaleReady));
  Serial.print("MODE:PLASTIC:"); Serial.print(PLASTIC_DISABLED ? "DISABLED" : "ENABLED");
  Serial.print(";METAL:"); Serial.print(METAL_DISABLED ? "DISABLED" : "ENABLED");
  Serial.print(";PAPER:"); Serial.println(PAPER_DISABLED ? "DISABLED" : "ENABLED");
  if (!PLASTIC_DISABLED) {
    Serial.print("CALIBRATION:PLASTIC_EMPTY_CM:"); Serial.println(plastic.emptyDistanceCm);
    Serial.print("CALIBRATION:PLASTIC_SIZE_BOTTOM_CM:"); Serial.println(plastic.bottomSizeEmptyCm);
    Serial.print("CALIBRATION:PLASTIC_SIZE_MIDDLE_CM:"); Serial.println(plastic.middleSizeEmptyCm);
    Serial.print("CALIBRATION:PLASTIC_SIZE_TOP_CM:"); Serial.println(plastic.topSizeEmptyCm);
  }
  if (!METAL_DISABLED) {
    Serial.print("CALIBRATION:METAL_EMPTY_CM:"); Serial.println(metal.emptyDistanceCm);
    Serial.print("CALIBRATION:METAL_SIZE_BOTTOM_CM:"); Serial.println(metal.bottomSizeEmptyCm);
    Serial.print("CALIBRATION:METAL_SIZE_MIDDLE_CM:"); Serial.println(metal.middleSizeEmptyCm);
    Serial.print("CALIBRATION:METAL_SIZE_TOP_CM:"); Serial.println(metal.topSizeEmptyCm);
  }
  if (!PAPER_DISABLED) {
    Serial.print("CALIBRATION:PAPER_TOP_EMPTY_CM:"); Serial.println(paper.emptyDistanceCm);
    Serial.print("CALIBRATION:PAPER_BOTTOM_EMPTY_CM:"); Serial.println(paper.bottomEmptyDistanceCm);
    if (paperScaleReady) {
      Serial.print("CALIBRATION:PAPER_TARE_RAW:"); Serial.println(paperTareRaw);
    }
    if (!paperScaleReady) Serial.println("ERROR:PAPER_SCALE_NOT_READY");
  }
  if (calibrated) {
    machineRunning = true;
    Serial.println("CALIBRATION:OK");
    Serial.println("MACHINE:STARTED");
    Serial.println("MACHINE:IDLE");
  } else {
    Serial.println("ERROR:CALIBRATION_FAILED");
  }
}

void makeSafe() {
  plastic.detectionCount = metal.detectionCount = paper.detectionCount = 0;
  plastic.entranceClearCount = metal.entranceClearCount = paper.entranceClearCount = 0;
  plastic.entranceArmed = metal.entranceArmed = paper.entranceArmed = false;
  if (!PLASTIC_DISABLED) plastic.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!PLASTIC_DISABLED) plastic.bottomGateServo->write(DROP_CLOSED_ANGLE);
  if (!METAL_DISABLED) metal.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!METAL_DISABLED) metal.bottomGateServo->write(DROP_CLOSED_ANGLE);
  if (!PAPER_DISABLED) paper.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!PAPER_DISABLED) paper.bottomGateServo->write(PAPER_DROP_CLOSED_ANGLE);
}

void handleSerial() {
  while (Serial.available() > 0) {
    char ch = (char)Serial.read();
    if (ch == '\n' || ch == '\r') {
      if (serialBuffer.length() > 0) {
        executeCommand(serialBuffer);
        serialBuffer = "";
      }
    } else if (serialBuffer.length() < 40) serialBuffer += ch;
  }
}

void executeCommand(String command) {
  command.trim();
  command.toUpperCase();
  if (recoveringSensorFault && (command == "START" || command == "CALIBRATE")) {
    Serial.println("ERROR:RECOVERY_IN_PROGRESS");
    return;
  }
  if (command == "DEBUG ON" || command == "DEBUG OFF") {
    entranceDebug = command == "DEBUG ON";
    Serial.println(entranceDebug ? "DEBUG:ON" : "DEBUG:OFF");
  } else if (command == "SCALE") {
    if (PAPER_DISABLED) {
      Serial.println("ERROR:PAPER_DISABLED");
      return;
    }
    long raw;
    if (readHx711Average(3, raw)) {
      Serial.print("PAPER:SCALE_RAW:"); Serial.print(raw);
      Serial.print(";TARE_VALID:"); Serial.print(paperScaleReady ? "YES" : "NO");
      if (paperScaleReady) {
        Serial.print(";TARE_RAW:"); Serial.print(paperTareRaw);
        Serial.print(";SIGNED_GRAMS:");
        Serial.print((float)(raw - paperTareRaw) / PAPER_COUNTS_PER_GRAM, 2);
      }
      Serial.println();
    }
  } else if (command == "START") {
    machineRunning = calibrated;
    Serial.println(machineRunning ? "MACHINE:STARTED" : "ERROR:NOT_CALIBRATED");
  } else if (command == "STOP" || command == "RESET") {
    machineRunning = false;
    makeSafe();
    Serial.println(command == "STOP" ? "MACHINE:STOPPED" : "RESET:OK");
  } else if (command == "CALIBRATE") calibrateAll();
  else if (command == "STATUS") {
    Serial.print("STATUS:");
    Serial.print(calibrated ? (machineRunning ? "RUNNING" : "READY") : "NOT_CALIBRATED");
    Serial.print(";PLASTIC_CM:"); Serial.print(plastic.emptyDistanceCm);
    Serial.print(";PLASTIC_SIZE_CM:");
    Serial.print(plastic.bottomSizeEmptyCm); Serial.print(',');
    Serial.print(plastic.middleSizeEmptyCm); Serial.print(',');
    Serial.print(plastic.topSizeEmptyCm);
    Serial.print(";METAL_CM:"); Serial.print(metal.emptyDistanceCm);
    Serial.print(";METAL_SIZE_CM:");
    Serial.print(metal.bottomSizeEmptyCm); Serial.print(',');
    Serial.print(metal.middleSizeEmptyCm); Serial.print(',');
    Serial.print(metal.topSizeEmptyCm);
    Serial.print(";PAPER_TOP_CM:"); Serial.print(paper.emptyDistanceCm);
    Serial.print(";PAPER_BOTTOM_CM:"); Serial.print(paper.bottomEmptyDistanceCm);
    Serial.print(";METAL_SENSOR:");
    Serial.print(METAL_DISABLED ? "DISABLED" :
                 (digitalRead(metal.materialSensorPin) == METAL_DETECTED_STATE ? "DETECTED" : "CLEAR"));
    Serial.print(";PAPER_SCALE:");
    Serial.println(PAPER_DISABLED ? "DISABLED" : (paperScaleReady ? "READY" : "ERROR"));
  } else Serial.println("ERROR:UNKNOWN_COMMAND");
}

