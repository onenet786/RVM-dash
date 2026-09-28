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
const bool PLASTIC_DISABLED = false;
const bool METAL_DISABLED = false;
const bool PAPER_DISABLED = false;

// Digital obstacle sensors: LOW means blocked. Change polarity for your modules.
// Enable only installed bin sensors. Plastic is currently not connected.
const bool PLASTIC_BIN_SENSOR_ENABLED = true;
const bool METAL_BIN_SENSOR_ENABLED = true;
const bool PAPER_BIN_SENSOR_ENABLED = true;
const byte PLASTIC_BIN_PIN = 47;
const byte METAL_BIN_PIN = 48;
const byte PAPER_BIN_PIN = 49;
const byte MQ6_DIGITAL_PIN = 50;
const byte BIN_BLOCKED_STATE = LOW;
const byte MQ6_ALARM_STATE = LOW;
const unsigned long BIN_BLOCK_MS = 500UL;
const unsigned long BIN_CLEAR_MS = 2000UL;
const unsigned long BIN_POWERUP_CLEAR_STABLE_MS = 750UL;
const unsigned long BIN_POWERUP_SETTLE_TIMEOUT_MS = 2500UL;
const unsigned long HOST_LEASE_TIMEOUT_MS = 5000UL;
const unsigned long MQ6_DEBOUNCE_MS = 1000UL;
const byte METAL_DETECTED_STATE = LOW;
const byte IRIS_CLOSED_ANGLE = 178;
const byte IRIS_OPEN_ANGLE = 10;
const byte DROP_CLOSED_ANGLE = 0;
const byte DROP_OPEN_ANGLE = 180;

// Paper bottom gate (pin 36): adjust independently, then upload again.
const byte PAPER_DROP_CLOSED_ANGLE = 160;
const byte PAPER_DROP_OPEN_ANGLE = 40;
const unsigned int MAX_DISTANCE_MM = 2000;

// Optimized timeout: 12000us allows measuring up to 2060 mm without blocking 20ms on lost echoes
const unsigned long ECHO_TIMEOUT_US = 12000UL;
// Standard HC-SR04 ping cycle interval (30ms provides clean echo decay without cross-talk)
const unsigned long ULTRASONIC_MIN_INTERVAL_MS = 30UL;

// A valid echo at least 20 mm (2 cm) nearer OR farther than calibration is occupied.
// Raised from 15mm: reduces echo noise false-triggers on the metal entrance ultrasonic.
const int DETECTION_CHANGE_MM = 20;
// Require 5 consecutive changed readings + 400 ms hold before treating as real detection.
// Raised from 3/3 and 200ms: prevents metal iris from opening on 1-3 jitter echoes
// that resolve within a single ULTRASONIC_MIN_INTERVAL cycle (tick-tick symptom).
const byte REQUIRED_DETECTIONS = 3;
const byte ENTRANCE_CONFIRM_READINGS = 5;
const byte ENTRANCE_CLEAR_READINGS = 5;
// Clear must stay below the active threshold (no overlapping states).
const byte ENTRANCE_CLEAR_TOLERANCE_MM = 14;
const unsigned long ENTRANCE_HOLD_MS = 400;

// Hold the iris open long enough for insertion; keep processing STOP commands.
const unsigned long IRIS_MIN_OPEN_MS = 3000UL;
const unsigned long ENTRANCE_CLEAR_MS = 1000;
const byte SIZE_READING_SAMPLES = 3;
const byte REQUIRED_SIZE_CHANGES = 2;
const unsigned long ARRIVAL_TIMEOUT_MS = 5000UL;
const unsigned long BOTTLE_SETTLE_MS = 2000UL;
const unsigned long CLEAR_TIMEOUT_MS = 5000UL;
const float PAPER_COUNTS_PER_GRAM = 420.0f;
const float PAPER_MIN_WEIGHT_G = 4.0f;
const float PAPER_CLEAR_WEIGHT_G = 8.0f;
const unsigned long AUTO_RECOVERY_RETRY_MS = 5000UL;
const byte AUTO_RECOVERY_SAMPLES = 3;
const byte CALIBRATION_SAMPLES = 3;
const unsigned long PURGE_OPEN_MS = 1000UL;
const unsigned long GATE_SETTLE_MS = 700UL;

struct AutoRecovery {
  bool active;
  byte channel;
  byte rounds;
  unsigned long lastAttemptMs;
  unsigned long scaleWaitSince;
  int nearest[4];
  int farthest[4];
  byte weightSamples;
  long weightMin;
  long weightMax;
};

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
  int emptyDistanceMm;
  int bottomEmptyDistanceMm;
  int bottomSizeEmptyMm;
  int middleSizeEmptyMm;
  int topSizeEmptyMm;
  byte detectionCount;
  byte entranceClearCount;
  bool entranceArmed;
  unsigned long entranceStateSince;
  int candidateMinMm;
  int candidateMaxMm;
  bool workingFailed;
  bool binFull;
  bool binCandidate;
  unsigned long binCandidateSince;
  byte missingEntranceReadings;
  bool hasEmptyCalibration;
  AutoRecovery recovery;
  bool purging;
  unsigned long purgeStartedMs;
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
static char serialBuffer[48];
static byte serialBufIdx = 0;
bool entranceDebug = false;
bool calibrating = false;
bool calibrationCancelled = false;
Compartment* activeCompartment = NULL;
bool activeCycleAborted = false;
bool mq6Alarm = false;
bool mq6Candidate = false;
unsigned long mq6CandidateSince = 0;
unsigned long lastStatusMs = 0;
bool hardwareStatusDirty = true;
bool hostOnline = false;
unsigned long lastHostAliveMs = 0;

// Fast integer-based distance output (10x faster than floating point division, zero SRAM overhead)
void printDistanceCm(int distanceMm) {
  if (distanceMm < 0) {
    Serial.print(-1);
  } else {
    Serial.print(distanceMm / 10);
    Serial.print('.');
    Serial.print(distanceMm % 10);
  }
}

bool compartmentDisabled(const Compartment& c) {
  return &c == &plastic ? PLASTIC_DISABLED : (&c == &metal ? METAL_DISABLED : PAPER_DISABLED);
}

bool binSensorEnabled(const Compartment& c) {
  return &c == &plastic ? PLASTIC_BIN_SENSOR_ENABLED :
         (&c == &metal ? METAL_BIN_SENSOR_ENABLED : PAPER_BIN_SENSOR_ENABLED);
}

bool compartmentAvailable(const Compartment& c) {
  return !compartmentDisabled(c) && !c.workingFailed && !c.binFull && !c.purging;
}

void closeCompartment(Compartment& c) {
  c.purging = false;
  c.detectionCount = c.entranceClearCount = 0;
  c.entranceArmed = false;
  if (compartmentDisabled(c)) return;
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  c.bottomGateServo->write(&c == &paper ? PAPER_DROP_CLOSED_ANGLE : DROP_CLOSED_ANGLE);
  // Hold position briefly, then detach to kill continuous PWM.
  // An attached-but-idle servo fires a 50Hz pulse indefinitely; any
  // 1-tick jitter in the AVR timer creates audible tick-tick buzzing.
  // Detaching removes PWM entirely while the servo gear-train holds
  // the last angle. The servo is re-attached inside openCompartment()
  // before the next write so positioning is never lost.
  delay(300);
  c.irisServo->detach();
  c.bottomGateServo->detach();
}

// Re-attach both servos to their PWM timer slots before moving them.
// Servos are detached after every closeCompartment() to kill idle PWM jitter.
// The AVR Servo library silently ignores write() on a detached servo,
// so re-attach is mandatory before any open/movement command.
void reattachServos(Compartment& c) {
  if (compartmentDisabled(c)) return;
  if (!c.irisServo->attached())       c.irisServo->attach(c.irisServoPin);
  if (!c.bottomGateServo->attached()) c.bottomGateServo->attach(c.bottomGateServoPin);
}

byte binPin(const Compartment& c) {
  return &c == &plastic ? PLASTIC_BIN_PIN : (&c == &metal ? METAL_BIN_PIN : PAPER_BIN_PIN);
}

bool binInputBlocked(const Compartment& c) {
  return binSensorEnabled(c) && digitalRead(binPin(c)) == BIN_BLOCKED_STATE;
}

void beginPurge(Compartment& c) {
  if (compartmentDisabled(c)) return;
  c.detectionCount = c.entranceClearCount = 0;
  c.entranceArmed = false;
  reattachServos(c);
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  // Do not release into a blocked bin, including during sensor debounce.
  if ((binSensorEnabled(c) && c.binFull) || binInputBlocked(c)) {
    closeCompartment(c);
    return;
  }
  c.purging = true;
  c.purgeStartedMs = millis();
  c.bottomGateServo->write(&c == &paper ? PAPER_DROP_OPEN_ANGLE : DROP_OPEN_ANGLE);
  Serial.print(F("PURGE:")); Serial.print(c.name); Serial.println(F(";STATE:OPEN"));
}

void servicePurge(Compartment& c) {
  if (!c.purging) return;
  if (binInputBlocked(c) ||
      millis() - c.purgeStartedMs >= PURGE_OPEN_MS) {
    closeCompartment(c);
    c.recovery.lastAttemptMs = millis();
  }
}

void reportCompartment(const Compartment& c) {
  Serial.print(F("COMPARTMENT:")); Serial.print(c.name);
  Serial.print(F(";WORKING:"));
  Serial.print(compartmentDisabled(c) || c.workingFailed ||
               !c.hasEmptyCalibration || calibrating ? F("FAILED") : F("OK"));
  Serial.print(F(";BIN:")); Serial.println(c.binFull ? F("FULL") : F("CLEAR"));
}

void failCompartment(Compartment& c, const char* reason) {
  if (c.workingFailed) return;
  c.workingFailed = true;
  c.recovery = AutoRecovery();
  c.recovery.lastAttemptMs = millis();
  if (activeCompartment == &c) activeCycleAborted = true;
  closeCompartment(c);
  Serial.print(F("FAULT:")); Serial.print(c.name);
  Serial.print(';'); Serial.println(reason);
  reportCompartment(c);
  beginPurge(c);
}

void reportHardwareStatus() {
  reportCompartment(plastic);
  reportCompartment(metal);
  reportCompartment(paper);
  Serial.println(mq6Alarm ? F("MQ6:WARNING") : F("MQ6:CLEAR"));
  hardwareStatusDirty = false;
}

void pollBin(Compartment& c, byte pin) {
  if (!binSensorEnabled(c)) {
    // An uninstalled sensor cannot block intake, recovery, or a gate purge.
    if (c.binFull) hardwareStatusDirty = true;
    c.binFull = false;
    c.binCandidate = false;
    c.binCandidateSince = millis();
    return;
  }
  bool blocked = digitalRead(pin) == BIN_BLOCKED_STATE;
  if (blocked != c.binCandidate) {
    c.binCandidate = blocked;
    c.binCandidateSince = millis();
  }
  if (blocked != c.binFull && millis() - c.binCandidateSince >=
      (blocked ? BIN_BLOCK_MS : BIN_CLEAR_MS)) {
    c.binFull = blocked;
    if (blocked) {
      if (activeCompartment == &c) activeCycleAborted = true;
      closeCompartment(c);
    }
    hardwareStatusDirty = true;
  }
}

void pollSensors() {
  servicePurge(plastic);
  servicePurge(metal);
  servicePurge(paper);
  pollBin(plastic, PLASTIC_BIN_PIN);
  pollBin(metal, METAL_BIN_PIN);
  pollBin(paper, PAPER_BIN_PIN);
  bool alarm = digitalRead(MQ6_DIGITAL_PIN) == MQ6_ALARM_STATE;
  if (alarm != mq6Candidate) {
    mq6Candidate = alarm;
    mq6CandidateSince = millis();
  }
  if (alarm != mq6Alarm && millis() - mq6CandidateSince >= MQ6_DEBOUNCE_MS) {
    mq6Alarm = alarm;
    // Warning only: MQ6 never stops the machine or disables a compartment.
    hardwareStatusDirty = true;
  }
}

bool cycleRunning() {
  return machineRunning && !activeCycleAborted &&
         (activeCompartment == NULL || compartmentAvailable(*activeCompartment));
}

void handleSerial();

bool waitActive(unsigned long durationMs) {
  unsigned long started = millis();
  while (millis() - started < durationMs) {
    handleSerial();
    if (!cycleRunning()) return false;
    delay(5);
  }
  return cycleRunning();
}

int readUltrasonicMm(byte trigPin, byte echoPin);
int readStableUltrasonicMm(byte trigPin, byte echoPin, byte samples);
bool sizeLevelChanged(byte trigPin, byte echoPin, int emptyDistanceMm);
bool updateDetection(Compartment& c);
int readSizeLevel(Compartment& c, const char* level, byte trigPin,
                  byte echoPin, int emptyMm, bool previouslyActive = false);
const char* calculateSize(Compartment& c);
bool waitForSizingItem(Compartment& c);
bool waitForSizingClear(Compartment& c);
bool metalDetectedOnce();
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
void enforceHostLease();
void executeCommand(char* command);
void autoRecover(Compartment& c);

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
  pinMode(PLASTIC_BIN_PIN, INPUT_PULLUP);
  pinMode(METAL_BIN_PIN, INPUT_PULLUP);
  pinMode(PAPER_BIN_PIN, INPUT_PULLUP);
  pinMode(MQ6_DIGITAL_PIN, INPUT_PULLUP);
  if (!PLASTIC_DISABLED) setupSizedCompartment(plastic);
  if (!METAL_DISABLED) {
    setupSizedCompartment(metal);
    pinMode(metal.materialSensorPin, INPUT_PULLUP);
  }
  if (!PAPER_DISABLED) setupPaper();
  // Safety-first boot: hardware remains closed and inactive until the
  // PecoDrop desktop application begins renewing the host lease.
  makeSafe();
  Serial.println(F("HOST:WAITING"));
}

void loop() {
  handleSerial();
  enforceHostLease();
  if (!machineRunning || !calibrated) {
    delay(10);
    return;
  }
  // A fault/full bin only removes its own compartment from the intake loop.
  Compartment* compartments[] = { &plastic, &metal, &paper };
  for (byte i = 0; i < 3 && machineRunning; i++) {
    Compartment& c = *compartments[i];
    if (c.workingFailed) autoRecover(c);
    if (!compartmentAvailable(c) || !updateDetection(c)) continue;
    activeCompartment = &c;
    activeCycleAborted = false;
    if (&c == &paper) processPaper();
    else processSizedItem(c);
    activeCompartment = NULL;
    activeCycleAborted = false;
  }
  // No blocking delay in active loop: sensors already throttle pings via ULTRASONIC_MIN_INTERVAL_MS
}

bool updateDetection(Compartment& c) {
  int distance = readUltrasonicMm(c.ultrasonicTrigPin, c.ultrasonicEchoPin);
  if (distance <= 0) {
    c.detectionCount = 0;
    if (++c.missingEntranceReadings >= 3) failCompartment(c, "ENTRANCE_SENSOR");
    return false;
  }
  c.missingEntranceReadings = 0;
  if (!compartmentAvailable(c)) return false;
  // Compare with the empty distance saved during calibration. Either a
  // nearer or farther valid echo can indicate an object at the entrance.
  bool detected = distance > 0 && c.emptyDistanceMm > 0 &&
                  abs(c.emptyDistanceMm - distance) >= DETECTION_CHANGE_MM;
  // Require a stable empty entrance after calibration and after each item.
  if (!c.entranceArmed) {
    bool clear = distance > 0 && c.emptyDistanceMm > 0 &&
                 abs(distance - c.emptyDistanceMm) <= ENTRANCE_CLEAR_TOLERANCE_MM;
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
        c.candidateMinMm = c.candidateMaxMm = distance;
      }
      c.candidateMinMm = min(c.candidateMinMm, distance);
      c.candidateMaxMm = max(c.candidateMaxMm, distance);
      if (c.candidateMaxMm - c.candidateMinMm > 20) {
        c.detectionCount = 0;
      } else if (c.detectionCount < ENTRANCE_CONFIRM_READINGS) c.detectionCount++;
    }
    if (!detected) c.detectionCount = 0;
  }
  if (entranceDebug) {
    Serial.print(F("ENTRANCE:")); Serial.print(c.name);
    Serial.print(F(";CM:")); printDistanceCm(distance);
    Serial.print(F(";EMPTY_CM:")); printDistanceCm(c.emptyDistanceMm);
    Serial.print(F(";ARMED:")); Serial.print(c.entranceArmed ? 1 : 0);
    Serial.print(F(";COUNT:")); Serial.println(c.detectionCount);
  }
  if (c.detectionCount < ENTRANCE_CONFIRM_READINGS ||
      millis() - c.entranceStateSince < ENTRANCE_HOLD_MS) return false;
  c.entranceArmed = false;
  c.entranceClearCount = 0;
  c.detectionCount = 0;
  return true;
}

// Pin 32 has no external/pin-change interrupt on the Mega. Timer2 samples
// every 250 us, including during delay() and ultrasonic measurements.
// Timer2 is not used by the Mega Servo library or millis(). Do not use tone()
// or Timer2 PWM while this capture is active.
volatile bool metalPulseSeen = false;

ISR(TIMER2_COMPA_vect) {
  if (digitalRead(metal.materialSensorPin) == METAL_DETECTED_STATE)
    metalPulseSeen = true;
}

class MetalPulseCapture {
  bool enabled;
public:
  explicit MetalPulseCapture(bool capture) : enabled(capture) {
    if (!enabled) return;
    ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
      TIMSK2 = 0;
      TCCR2A = _BV(WGM21);
      TCCR2B = 0;
      TCNT2 = 0;
      OCR2A = (F_CPU / 64UL / 4000UL) - 1;
      TIFR2 = _BV(OCF2A);
      metalPulseSeen = digitalRead(metal.materialSensorPin) == METAL_DETECTED_STATE;
      TIMSK2 = _BV(OCIE2A);
      TCCR2B = _BV(CS22); // Timer2 prescaler 64.
    }
  }
  ~MetalPulseCapture() {
    if (!enabled) return;
    ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
      TIMSK2 = 0;
      TCCR2B = 0;
      metalPulseSeen = false;
    }
  }
};

void processSizedItem(Compartment& c) {
  // Scope cleanup also runs on STOP, timeout, and invalid-size returns.
  MetalPulseCapture metalCapture(&c == &metal);
  Serial.print(c.name); Serial.println(F(":OBJECT_DETECTED"));
  reattachServos(c); // servos were detached after last closeCompartment()
  c.irisServo->write(IRIS_OPEN_ANGLE);
  unsigned long irisOpenedAt = millis();
  if (!waitActive(700)) return;
  Serial.print(c.name); Serial.println(F(":WAITING_FOR_BOTTOM"));
  if (!waitForSizingItem(c)) {
    c.irisServo->write(IRIS_CLOSED_ANGLE);
    if (cycleRunning()) {
      failCompartment(c, "ARRIVAL_TIMEOUT");
      Serial.print(F("ERROR:")); Serial.print(c.name); Serial.println(F("_ARRIVAL_TIMEOUT"));
      Serial.print(c.name); Serial.println(F(":ARRIVAL_SENSOR_SNAPSHOT"));
      readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin, c.bottomSizeEchoPin, c.bottomSizeEmptyMm);
      readSizeLevel(c, "MIDDLE", c.middleSizeTrigPin, c.middleSizeEchoPin, c.middleSizeEmptyMm);
      readSizeLevel(c, "TOP", c.topSizeTrigPin, c.topSizeEchoPin, c.topSizeEmptyMm);
    }
    c.detectionCount = 0;
    return;
  }
  // Keep the iris open while the arriving bottle finishes falling and settles.
  Serial.print(c.name); Serial.println(F(":BOTTLE_SETTLING"));
  unsigned long settleStarted = millis();
  while (millis() - settleStarted < BOTTLE_SETTLE_MS) {
    handleSerial();
    if (!cycleRunning()) return;
    delay(10);
  }
  // Measure with the same gate positions used for empty calibration.
  if (!waitForIrisOpenHold(irisOpenedAt)) return;
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!waitActive(700)) return;
  Serial.print(c.name); Serial.println(F(":SIZING_START"));
  const char* size = calculateSize(c);
  if (!cycleRunning()) return; // A STOP during sizing must not release an item.
  if (strcmp(size, "INVALID") == 0) {
    c.irisServo->write(IRIS_CLOSED_ANGLE);
    Serial.print(F("ERROR:")); Serial.print(c.name); Serial.println(F("_INVALID_SENSOR_PATTERN"));
    recoverSizingFault(c);
    return;
  }
  bool accepted = (&c != &metal) || metalDetectedOnce();
  handleSerial();
  if (!cycleRunning()) return;
  Serial.print(F("SIZE:")); Serial.print(size); Serial.print(F(";MATERIAL:"));
  Serial.println(accepted ? c.material : "REJECT");
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!waitActive(150)) return;
  c.bottomGateServo->write(DROP_OPEN_ANGLE);
  if (!waitActive(900)) return;
  bool cleared = waitForSizingClear(c);
  c.bottomGateServo->write(DROP_CLOSED_ANGLE);
  if (cleared && cycleRunning()) {
    Serial.print(F("BOTTLE:CLEARED;COMPARTMENT:")); Serial.println(c.name);
  }
  else if (cycleRunning()) failCompartment(c, "CLEAR_TIMEOUT");
  c.detectionCount = 0;
  if (!waitActive(600)) return;
}

// Recovery must see real echoes near the old empty baselines. A missing or
// unexpectedly distant echo is not evidence that the chamber is empty.
bool sizedCompartmentEmpty(Compartment& c) {
  int entrance = readUltrasonicMm(c.ultrasonicTrigPin, c.ultrasonicEchoPin);
  int bottom = readUltrasonicMm(c.bottomSizeTrigPin, c.bottomSizeEchoPin);
  int middle = readUltrasonicMm(c.middleSizeTrigPin, c.middleSizeEchoPin);
  int top = readUltrasonicMm(c.topSizeTrigPin, c.topSizeEchoPin);
  return entrance > 0 && bottom > 0 && middle > 0 && top > 0 &&
         c.emptyDistanceMm > 0 && c.bottomSizeEmptyMm > 0 &&
         c.middleSizeEmptyMm > 0 && c.topSizeEmptyMm > 0 &&
         abs(entrance - c.emptyDistanceMm) <= ENTRANCE_CLEAR_TOLERANCE_MM &&
         abs(bottom - c.bottomSizeEmptyMm) <= ENTRANCE_CLEAR_TOLERANCE_MM &&
         abs(middle - c.middleSizeEmptyMm) <= ENTRANCE_CLEAR_TOLERANCE_MM &&
         abs(top - c.topSizeEmptyMm) <= ENTRANCE_CLEAR_TOLERANCE_MM;
}

void recoverSizingFault(Compartment& c) {
  failCompartment(c, "INVALID_SENSOR_PATTERN");
}

void retryAutoRecovery(Compartment& c) {
  c.recovery = AutoRecovery();
  c.recovery.lastAttemptMs = millis();
  Serial.print(F("RECOVERY:")); Serial.print(c.name);
  Serial.println(F(";STATE:WAITING_FOR_EMPTY"));
}

void autoRecover(Compartment& c) {
  if (!c.workingFailed) return;
  if (compartmentDisabled(c) || c.purging || !c.hasEmptyCalibration ||
      !machineRunning || calibrating || activeCompartment != NULL) return;
  AutoRecovery& r = c.recovery;
  if (c.binFull) {
    r = AutoRecovery();
    r.lastAttemptMs = millis();
    return;
  }
  if (!r.active) {
    if (millis() - r.lastAttemptMs < AUTO_RECOVERY_RETRY_MS) return;
    r.active = true;
    closeCompartment(c);
    Serial.print(F("RECOVERY:")); Serial.print(c.name);
    Serial.println(F(";STATE:CHECKING_EMPTY"));
  }

  byte channels = &c == &paper ? 2 : 4;
  if (r.rounds < AUTO_RECOVERY_SAMPLES) {
    byte trig = c.ultrasonicTrigPin, echo = c.ultrasonicEchoPin;
    int baseline = c.emptyDistanceMm;
    if (&c == &paper && r.channel == 1) {
      trig = c.bottomUltrasonicTrigPin; echo = c.bottomUltrasonicEchoPin;
      baseline = c.bottomEmptyDistanceMm;
    } else if (r.channel == 1) {
      trig = c.bottomSizeTrigPin; echo = c.bottomSizeEchoPin; baseline = c.bottomSizeEmptyMm;
    } else if (r.channel == 2) {
      trig = c.middleSizeTrigPin; echo = c.middleSizeEchoPin; baseline = c.middleSizeEmptyMm;
    } else if (r.channel == 3) {
      trig = c.topSizeTrigPin; echo = c.topSizeEchoPin; baseline = c.topSizeEmptyMm;
    }
    int mm = readUltrasonicMm(trig, echo);
    if (c.binFull || mm <= 0 || baseline <= 0 ||
        abs(mm - baseline) > ENTRANCE_CLEAR_TOLERANCE_MM) {
      retryAutoRecovery(c);
      return;
    }
    byte channel = r.channel;
    if (r.rounds == 0) r.nearest[channel] = r.farthest[channel] = mm;
    r.nearest[channel] = min(r.nearest[channel], mm);
    r.farthest[channel] = max(r.farthest[channel], mm);
    if (r.farthest[channel] - r.nearest[channel] > 20) {
      retryAutoRecovery(c);
      return;
    }
    if (++r.channel == channels) { r.channel = 0; r.rounds++; }
    r.scaleWaitSince = millis();
    return;
  }

  if (&c == &paper && r.weightSamples < AUTO_RECOVERY_SAMPLES) {
    // Wait up to 120 ms for HX711 DOUT to go LOW (ready). The HX711 samples
    // at ~10 Hz (100 ms period), so a single-shot digitalRead() misses the
    // ready window most of the time, immediately fires the 1-second retry
    // timeout, and produces the "paper re-initializing repeatedly" loop.
    if (!paperScaleReady) {
      retryAutoRecovery(c);
      return;
    }
    if (!waitForHx711Ready(120UL)) {
      // DOUT did not go LOW within 120 ms — scale may be noisy or disconnected.
      if (millis() - r.scaleWaitSince >= 2000UL) retryAutoRecovery(c);
      return;
    }
    r.scaleWaitSince = millis(); // reset on every successful DOUT wait
    long raw;
    if (!readHx711Raw(raw) ||
        fabs((float)(raw - paperTareRaw) / PAPER_COUNTS_PER_GRAM) > PAPER_CLEAR_WEIGHT_G) {
      retryAutoRecovery(c);
      return;
    }
    if (r.weightSamples == 0) r.weightMin = r.weightMax = raw;
    r.weightMin = min(r.weightMin, raw);
    r.weightMax = max(r.weightMax, raw);
    if (fabs((float)(r.weightMax - r.weightMin) / PAPER_COUNTS_PER_GRAM) > 5.0f) {
      retryAutoRecovery(c);
      return;
    }
    r.weightSamples++;
    r.scaleWaitSince = millis();
    return;
  }

  c.workingFailed = false;
  c.missingEntranceReadings = 0;
  closeCompartment(c);
  r = AutoRecovery();
  Serial.print(F("RECOVERY:")); Serial.print(c.name); Serial.println(F(";STATE:OK"));
  reportCompartment(c);
}

// Return -1 for an unreliable reading, 0 for clear, and 1 for occupied.
// During sizing only, a confirmed active level survives a missing echo.
int readSizeLevel(Compartment& c, const char* level, byte trigPin,
                  byte echoPin, int emptyMm, bool previouslyActive) {
  byte occupied = 0, clear = 0, missing = 0;
  Serial.print(F("SIZING:")); Serial.print(c.name);
  Serial.print(F(";LEVEL:")); Serial.print(level);
  Serial.print(F(";EMPTY_CM:")); printDistanceCm(emptyMm);
  Serial.print(F(";READINGS_CM:"));
  for (byte sample = 0; sample < SIZE_READING_SAMPLES; sample++) {
    int distance = readUltrasonicMm(trigPin, echoPin);
    if (sample > 0) Serial.print(',');
    printDistanceCm(distance);
    if (distance > 0 && emptyMm > 0) {
      if (abs(emptyMm - distance) >= DETECTION_CHANGE_MM) occupied++;
      else if (abs(emptyMm - distance) <= ENTRANCE_CLEAR_TOLERANCE_MM) clear++;
    }
    if (distance <= 0) missing++;
    // Stop once the majority is decided; a third sample cannot change it.
    if (occupied >= REQUIRED_SIZE_CHANGES || clear >= REQUIRED_SIZE_CHANGES) break;
  }
  int state = occupied >= REQUIRED_SIZE_CHANGES ? 1 :
              (clear >= REQUIRED_SIZE_CHANGES ? 0 : -1);
  bool heldActive = state == -1 && emptyMm > 0 && previouslyActive && missing > 0;
  if (heldActive) state = 1;
  Serial.print(F(";HELD_ACTIVE:")); Serial.print(heldActive ? 1 : 0);
  Serial.print(F(";STATE:")); Serial.println(state);
  return state;
}

const char* calculateSize(Compartment& c) {
  const char* previous = "INVALID";
  byte largeFallbackScans = 0;
  bool bottomActive = true, middleActive = false, topActive = false;
  for (byte attempt = 0; attempt < 4; attempt++) {
    handleSerial();
    if (!cycleRunning()) return "INVALID";
    int bottom = readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin,
                              c.bottomSizeEchoPin, c.bottomSizeEmptyMm, bottomActive);
    int middle = readSizeLevel(c, "MIDDLE", c.middleSizeTrigPin,
                              c.middleSizeEchoPin, c.middleSizeEmptyMm, middleActive);
    int top = readSizeLevel(c, "TOP", c.topSizeTrigPin,
                           c.topSizeEchoPin, c.topSizeEmptyMm, topActive);
    if (bottom >= 0) bottomActive = bottom == 1;
    if (middle >= 0) middleActive = middle == 1;
    if (top >= 0) topActive = top == 1;

    if (bottom == 1 && middle == -1 && top == 1) {
      if (++largeFallbackScans >= 2) {
        Serial.print(F("SIZING:")); Serial.print(c.name);
        Serial.println(F(";FALLBACK:LARGE_MIDDLE_UNRELIABLE"));
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
  }
  return "INVALID";
}

bool waitForSizingItem(Compartment& c) {
  unsigned long started = millis();
  byte bottomChangeCount = 0;
  while (millis() - started < ARRIVAL_TIMEOUT_MS) {
    handleSerial();
    if (!cycleRunning()) return false;
    bool bottomOccupied;
    if (entranceDebug) {
      Serial.print(c.name); Serial.println(F(":ARRIVAL_CHECK"));
      bottomOccupied = readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin,
                                    c.bottomSizeEchoPin, c.bottomSizeEmptyMm) == 1;
    } else {
      bottomOccupied = sizeLevelChanged(c.bottomSizeTrigPin, c.bottomSizeEchoPin,
                                       c.bottomSizeEmptyMm);
    }
    if (bottomOccupied) {
      if (++bottomChangeCount >= REQUIRED_DETECTIONS) return true;
    } else {
      bottomChangeCount = 0;
    }
  }
  return false;
}

bool waitForSizingClear(Compartment& c) {
  unsigned long started = millis();
  byte clearCount = 0;
  while (millis() - started < CLEAR_TIMEOUT_MS) {
    handleSerial();
    if (!cycleRunning()) return false;
    bool bottomClear = readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin,
                                     c.bottomSizeEchoPin, c.bottomSizeEmptyMm) == 0;
    bool middleClear = readSizeLevel(c, "MIDDLE", c.middleSizeTrigPin,
                                     c.middleSizeEchoPin, c.middleSizeEmptyMm) == 0;
    bool topClear = readSizeLevel(c, "TOP", c.topSizeTrigPin,
                                  c.topSizeEchoPin, c.topSizeEmptyMm) == 0;
    bool clear = bottomClear && middleClear && topClear;
    clearCount = clear ? clearCount + 1 : 0;
    if (clearCount >= 5) return true;
    delay(10);
  }
  return false;
}

bool metalDetectedOnce() {
  if (metalPulseSeen) return true;
  if (!waitActive(180)) return false;
  return metalPulseSeen;
}

bool waitForIrisOpenHold(unsigned long openedAt) {
  while (millis() - openedAt < IRIS_MIN_OPEN_MS) {
    handleSerial();
    if (!cycleRunning()) return false;
    delay(10);
  }
  return cycleRunning();
}

void processPaper() {
  Serial.println(F("PAPER:OBJECT_DETECTED"));
  reattachServos(paper); // servos were detached after last closeCompartment()
  paper.irisServo->write(IRIS_OPEN_ANGLE);
  if (!waitForIrisOpenHold(millis())) return;
  float grams = 0.0f;
  if (!waitForPaperWeight(grams)) {
    paper.irisServo->write(IRIS_CLOSED_ANGLE);
    if (cycleRunning()) failCompartment(paper, "WEIGHT_TIMEOUT");
    paper.detectionCount = 0;
    return;
  }
  handleSerial();
  if (!cycleRunning()) return;
  paper.irisServo->write(IRIS_CLOSED_ANGLE);
  Serial.print(F("SIZE:WEIGHT;MATERIAL:PAPER;WEIGHT_KG:"));
  Serial.println(grams / 1000.0f, 3);
  if (!waitActive(150)) return;
  paper.bottomGateServo->write(PAPER_DROP_OPEN_ANGLE);
  if (!waitActive(900)) return;
  bool cleared = waitForPaperClear();
  paper.bottomGateServo->write(PAPER_DROP_CLOSED_ANGLE);
  if (cleared && cycleRunning()) {
    Serial.println(F("BOTTLE:CLEARED;COMPARTMENT:PAPER"));
  }
  else if (cycleRunning()) failCompartment(paper, "CLEAR_TIMEOUT");
  paper.detectionCount = 0;
  if (!waitActive(600)) return;
}

bool paperAtBottom() {
  int distance = readUltrasonicMm(paper.bottomUltrasonicTrigPin,
                                  paper.bottomUltrasonicEchoPin);
  return distance > 0 && paper.bottomEmptyDistanceMm > 0 &&
         abs(paper.bottomEmptyDistanceMm - distance) >= DETECTION_CHANGE_MM;
}

bool waitForPaperWeight(float& grams) {
  unsigned long started = millis();
  unsigned long lastSampleAt = started;
  byte stableCount = 0;
  float previous = 0.0f;
  long recent[8] = {};
  long recentSum = 0;
  byte recentIndex = 0, recentCount = 0;
  long groupSum = 0, lastRaw = 0;
  byte groupCount = 0;
  bool discardFirst = true;

  while (millis() - started < ARRIVAL_TIMEOUT_MS) {
    handleSerial();
    if (!cycleRunning()) return false;
    if (digitalRead(paper.loadCellDoutPin) != LOW) {
      if (millis() - lastSampleAt >= 1000UL) {
        Serial.println(F("ERROR:HX711_NOT_READY_DOUT_HIGH"));
        failCompartment(paper, "LOAD_CELL");
        return false;
      }
      delay(1);
      continue;
    }
    if (!readHx711Raw(lastRaw)) {
      if (cycleRunning()) failCompartment(paper, "LOAD_CELL");
      return false;
    }
    lastSampleAt = millis();
    if (discardFirst) { discardFirst = false; continue; }
    recentSum -= recent[recentIndex];
    recent[recentIndex] = lastRaw;
    recentSum += lastRaw;
    recentIndex = (recentIndex + 1) % 8;
    if (recentCount < 8) recentCount++;
    groupSum += lastRaw;
    if (++groupCount < 3) continue;
    float current = max(0.0f, (float)(groupSum / 3 - paperTareRaw) / PAPER_COUNTS_PER_GRAM);
    groupSum = 0;
    groupCount = 0;
    if (current >= PAPER_MIN_WEIGHT_G) {
      stableCount = abs(current - previous) <= 5.0f ? stableCount + 1 : 0;
      previous = current;
      if (stableCount >= 3 && recentCount == 8) {
        grams = (float)(recentSum / 8 - paperTareRaw) / PAPER_COUNTS_PER_GRAM;
        return cycleRunning() && !isnan(grams) && grams >= PAPER_MIN_WEIGHT_G;
      }
    } else {
      stableCount = 0;
      previous = current;
    }
  }
  Serial.print(F("PAPER:WEIGHT_TIMEOUT_RAW:")); Serial.print(lastRaw);
  Serial.print(F(";TARE_RAW:")); Serial.print(paperTareRaw);
  Serial.print(F(";SIGNED_GRAMS:"));
  Serial.println((float)(lastRaw - paperTareRaw) / PAPER_COUNTS_PER_GRAM, 2);
  return false;
}

// Optimized non-blocking clear check: tests ultrasonic bottom first, only reads HX711 when clear
bool waitForPaperClear() {
  unsigned long started = millis();
  byte clearCount = 0;
  while (millis() - started < CLEAR_TIMEOUT_MS) {
    handleSerial();
    if (!cycleRunning()) return false;
    int bottom = readUltrasonicMm(paper.bottomUltrasonicTrigPin, paper.bottomUltrasonicEchoPin);
    bool bottomClear = (bottom > 0 && abs(bottom - paper.bottomEmptyDistanceMm) <= ENTRANCE_CLEAR_TOLERANCE_MM);
    // Short-circuit: only perform HX711 acquisition if ultrasonic sensor indicates physical path is clear
    bool clear = bottomClear && (readPaperGrams(1) <= PAPER_CLEAR_WEIGHT_G);
    clearCount = clear ? clearCount + 1 : 0;
    if (clearCount >= 4) return true;
    delay(20);
  }
  return false;
}

bool sizeLevelChanged(byte trigPin, byte echoPin, int emptyDistanceMm) {
  if (emptyDistanceMm <= 0) return false;
  byte changedReadings = 0;
  for (byte sample = 0; sample < SIZE_READING_SAMPLES; sample++) {
    int distance = readUltrasonicMm(trigPin, echoPin);
    if (distance > 0 && abs(emptyDistanceMm - distance) >= DETECTION_CHANGE_MM) {
      changedReadings++;
      if (changedReadings >= REQUIRED_SIZE_CHANGES) return true;
    }
  }
  return changedReadings >= REQUIRED_SIZE_CHANGES;
}

int readUltrasonicMm(byte trigPin, byte echoPin) {
  pollSensors();
  static unsigned long lastTriggerMs = 0;
  unsigned long elapsed = millis() - lastTriggerMs;
  if (elapsed < ULTRASONIC_MIN_INTERVAL_MS) {
    delay(ULTRASONIC_MIN_INTERVAL_MS - elapsed);
  }
  lastTriggerMs = millis();
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  unsigned long duration = pulseIn(echoPin, HIGH, ECHO_TIMEOUT_US);
  if (duration == 0) return -1;
  int distance = (int)((duration * 10UL) / 58UL);
  return (distance > 0 && distance <= MAX_DISTANCE_MM) ? distance : -1;
}

int readStableUltrasonicMm(byte trigPin, byte echoPin, byte samples) {
  long total = 0;
  byte valid = 0;
  int nearest = MAX_DISTANCE_MM, farthest = 0;
  for (byte i = 0; i < samples; i++) {
    handleSerial();
    if (calibrationCancelled) return -1;
    int distance = readUltrasonicMm(trigPin, echoPin);
    if (distance > 0) {
      total += distance;
      valid++;
      nearest = min(nearest, distance);
      farthest = max(farthest, distance);
    }
    if (distance <= 0 || farthest - nearest > 20) {
      Serial.print(F("ERROR:UNSTABLE_CALIBRATION_TRIG:")); Serial.println(trigPin);
      return -1;
    }
  }
  if (samples == 0 || valid != samples || farthest - nearest > 20) {
    Serial.print(F("ERROR:UNSTABLE_CALIBRATION_TRIG:")); Serial.println(trigPin);
    return -1;
  }
  return (int)(total / valid);
}

bool waitForHx711Ready(unsigned long timeoutMs) {
  unsigned long started = millis();
  while (digitalRead(paper.loadCellDoutPin) == HIGH &&
         millis() - started < timeoutMs) {
    if (calibrating || activeCompartment != NULL) handleSerial();
    else pollSensors();
    if (calibrating && calibrationCancelled) return false;
    if (activeCompartment != NULL && !cycleRunning()) return false;
    delay(1);
  }
  return digitalRead(paper.loadCellDoutPin) == LOW;
}

// Fast grouped atomic HX711 bit-banging: eliminates 25 context switches per reading,
// guarantees SCK pulse timing is never stretched into false power-down intervals.
bool readHx711Raw(long& raw) {
  if (calibrating && calibrationCancelled) return false;
  if (!waitForHx711Ready(1000UL)) {
    if ((calibrating && calibrationCancelled) ||
        (activeCompartment != NULL && !cycleRunning())) return false;
    Serial.println(F("ERROR:HX711_NOT_READY_DOUT_HIGH"));
    return false;
  }
  unsigned long value = 0;
  byte sckPin = paper.loadCellSckPin;
  byte doutPin = paper.loadCellDoutPin;

  ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
    for (byte i = 0; i < 24; i++) {
      digitalWrite(sckPin, HIGH);
      delayMicroseconds(1);
      value = (value << 1) | (digitalRead(doutPin) == HIGH ? 1 : 0);
      digitalWrite(sckPin, LOW);
      delayMicroseconds(1);
    }
    // 25th pulse: Channel A, gain 128
    digitalWrite(sckPin, HIGH);
    delayMicroseconds(1);
    digitalWrite(sckPin, LOW);
    delayMicroseconds(1);
  }

  if (digitalRead(doutPin) != HIGH) {
    Serial.println(F("ERROR:HX711_DOUT_NOT_HIGH_AFTER_READ"));
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
  float grams = (float)(raw - paperTareRaw) / PAPER_COUNTS_PER_GRAM;
  return grams > 0.0f ? grams : 0.0f;
}

bool waitCalibration(unsigned long durationMs) {
  unsigned long started = millis();
  while (millis() - started < durationMs) {
    handleSerial();
    if (calibrationCancelled) return false;
    delay(5);
  }
  return !calibrationCancelled;
}

void calibrateAll() {
  calibrationCancelled = false;
  calibrating = true;
  machineRunning = false;
  calibrated = false;
  paperScaleReady = false;
  plastic.recovery = metal.recovery = paper.recovery = AutoRecovery();

  // Stabilize bin sensor INPUT_PULLUP lines before broadcasting initial status.
  // On hot-plug (cable inserted after software launch), the USB 5V rail and
  // pull-up resistors can take several seconds to settle. Without this loop
  // the very first digitalRead() may see LOW (= BIN_BLOCKED_STATE) and fire a
  // false BIN:FULL to the PC before the debounce timer can reject it.
  // We poll throughout the power-up settling interval so the debounce state
  // follows the stabilized input rather than the first transient read. This loop
  // runs only at startup/recalibrate — never during normal intake cycles.
  {
    unsigned long settleStart = millis();
    unsigned long allClearSince = 0;
    while (millis() - settleStart < BIN_POWERUP_SETTLE_TIMEOUT_MS) {
      // Only poll bin sensors — do not servicePurge or MQ6 here
      pollBin(plastic, PLASTIC_BIN_PIN);
      pollBin(metal, METAL_BIN_PIN);
      pollBin(paper, PAPER_BIN_PIN);
      bool allClear = (!PLASTIC_BIN_SENSOR_ENABLED || digitalRead(PLASTIC_BIN_PIN) != BIN_BLOCKED_STATE) &&
                      (!METAL_BIN_SENSOR_ENABLED || digitalRead(METAL_BIN_PIN) != BIN_BLOCKED_STATE) &&
                      (!PAPER_BIN_SENSOR_ENABLED || digitalRead(PAPER_BIN_PIN) != BIN_BLOCKED_STATE);
      if (allClear) {
        if (allClearSince == 0) allClearSince = millis();
        if (millis() - allClearSince >= BIN_POWERUP_CLEAR_STABLE_MS) break;
      } else {
        allClearSince = 0;
      }
      delay(10);
    }
    // Force all binFull flags clear — any real full bin will re-trigger
    // within BIN_BLOCK_MS once the machine is running.
    if (plastic.binFull) { plastic.binFull = false; plastic.binCandidate = false; }
    if (metal.binFull)   { metal.binFull   = false; metal.binCandidate   = false; }
    if (paper.binFull)   { paper.binFull   = false; paper.binCandidate   = false; }
    plastic.binCandidateSince = metal.binCandidateSince = paper.binCandidateSince = millis();
  }

  reportHardwareStatus();
  Serial.println(F("CALIBRATION:REMOVE_OBJECTS"));
  beginPurge(plastic);
  beginPurge(metal);
  beginPurge(paper);
  if (!waitCalibration(PURGE_OPEN_MS + GATE_SETTLE_MS)) {
    calibrating = false;
    makeSafe();
    return;
  }
  if (!PLASTIC_DISABLED) {
    plastic.emptyDistanceMm = readStableUltrasonicMm(
      plastic.ultrasonicTrigPin, plastic.ultrasonicEchoPin, CALIBRATION_SAMPLES);
    plastic.bottomSizeEmptyMm = readStableUltrasonicMm(
      plastic.bottomSizeTrigPin, plastic.bottomSizeEchoPin, CALIBRATION_SAMPLES);
    plastic.middleSizeEmptyMm = readStableUltrasonicMm(
      plastic.middleSizeTrigPin, plastic.middleSizeEchoPin, CALIBRATION_SAMPLES);
    plastic.topSizeEmptyMm = readStableUltrasonicMm(
      plastic.topSizeTrigPin, plastic.topSizeEchoPin, CALIBRATION_SAMPLES);
  }
  if (!METAL_DISABLED) {
    metal.emptyDistanceMm = readStableUltrasonicMm(
      metal.ultrasonicTrigPin, metal.ultrasonicEchoPin, CALIBRATION_SAMPLES);
    metal.bottomSizeEmptyMm = readStableUltrasonicMm(
      metal.bottomSizeTrigPin, metal.bottomSizeEchoPin, CALIBRATION_SAMPLES);
    metal.middleSizeEmptyMm = readStableUltrasonicMm(
      metal.middleSizeTrigPin, metal.middleSizeEchoPin, CALIBRATION_SAMPLES);
    metal.topSizeEmptyMm = readStableUltrasonicMm(
      metal.topSizeTrigPin, metal.topSizeEchoPin, CALIBRATION_SAMPLES);
  }
  if (!PAPER_DISABLED) {
    paper.emptyDistanceMm = readStableUltrasonicMm(
      paper.ultrasonicTrigPin, paper.ultrasonicEchoPin, CALIBRATION_SAMPLES);
    paper.bottomEmptyDistanceMm = readStableUltrasonicMm(
      paper.bottomUltrasonicTrigPin, paper.bottomUltrasonicEchoPin, CALIBRATION_SAMPLES);
    long tare;
    paperScaleReady = readHx711Average(5, tare);
    if (paperScaleReady) paperTareRaw = tare;
  }
  if (calibrationCancelled) {
    calibrating = false;
    makeSafe();
    return;
  }
  plastic.workingFailed = PLASTIC_DISABLED || plastic.emptyDistanceMm <= 0 ||
    plastic.bottomSizeEmptyMm <= 0 || plastic.middleSizeEmptyMm <= 0 || plastic.topSizeEmptyMm <= 0;
  metal.workingFailed = METAL_DISABLED || metal.emptyDistanceMm <= 0 ||
    metal.bottomSizeEmptyMm <= 0 || metal.middleSizeEmptyMm <= 0 || metal.topSizeEmptyMm <= 0;
  paper.workingFailed = PAPER_DISABLED || paper.emptyDistanceMm <= 0 ||
    paper.bottomEmptyDistanceMm <= 0 || !paperScaleReady;
  plastic.hasEmptyCalibration = !plastic.workingFailed;
  metal.hasEmptyCalibration = !metal.workingFailed;
  paper.hasEmptyCalibration = !paper.workingFailed;
  plastic.recovery = metal.recovery = paper.recovery = AutoRecovery();
  plastic.missingEntranceReadings = metal.missingEntranceReadings = paper.missingEntranceReadings = 0;
  calibrated = hostOnline &&
    (!plastic.workingFailed || !metal.workingFailed || !paper.workingFailed);
  calibrating = false;
  pollSensors();
  reportHardwareStatus();
  if (plastic.workingFailed) beginPurge(plastic);
  if (metal.workingFailed) beginPurge(metal);
  if (paper.workingFailed) beginPurge(paper);
  Serial.print(F("MODE:PLASTIC:")); Serial.print(PLASTIC_DISABLED ? F("DISABLED") : F("ENABLED"));
  Serial.print(F(";METAL:")); Serial.print(METAL_DISABLED ? F("DISABLED") : F("ENABLED"));
  Serial.print(F(";PAPER:")); Serial.println(PAPER_DISABLED ? F("DISABLED") : F("ENABLED"));
  if (!PLASTIC_DISABLED) {
    Serial.print(F("CALIBRATION:PLASTIC_EMPTY_CM:")); printDistanceCm(plastic.emptyDistanceMm); Serial.println();
    Serial.print(F("CALIBRATION:PLASTIC_SIZE_BOTTOM_CM:")); printDistanceCm(plastic.bottomSizeEmptyMm); Serial.println();
    Serial.print(F("CALIBRATION:PLASTIC_SIZE_MIDDLE_CM:")); printDistanceCm(plastic.middleSizeEmptyMm); Serial.println();
    Serial.print(F("CALIBRATION:PLASTIC_SIZE_TOP_CM:")); printDistanceCm(plastic.topSizeEmptyMm); Serial.println();
  }
  if (!METAL_DISABLED) {
    Serial.print(F("CALIBRATION:METAL_EMPTY_CM:")); printDistanceCm(metal.emptyDistanceMm); Serial.println();
    Serial.print(F("CALIBRATION:METAL_SIZE_BOTTOM_CM:")); printDistanceCm(metal.bottomSizeEmptyMm); Serial.println();
    Serial.print(F("CALIBRATION:METAL_SIZE_MIDDLE_CM:")); printDistanceCm(metal.middleSizeEmptyMm); Serial.println();
    Serial.print(F("CALIBRATION:METAL_SIZE_TOP_CM:")); printDistanceCm(metal.topSizeEmptyMm); Serial.println();
  }
  if (!PAPER_DISABLED) {
    Serial.print(F("CALIBRATION:PAPER_TOP_EMPTY_CM:")); printDistanceCm(paper.emptyDistanceMm); Serial.println();
    Serial.print(F("CALIBRATION:PAPER_BOTTOM_EMPTY_CM:")); printDistanceCm(paper.bottomEmptyDistanceMm); Serial.println();
    if (paperScaleReady) {
      Serial.print(F("CALIBRATION:PAPER_TARE_RAW:")); Serial.println(paperTareRaw);
    }
    if (!paperScaleReady) Serial.println(F("ERROR:PAPER_SCALE_NOT_READY"));
  }
  if (calibrated && hostOnline) {
    machineRunning = true;
    Serial.println(F("CALIBRATION:OK"));
    Serial.println(F("MACHINE:STARTED"));
    Serial.println(F("MACHINE:IDLE"));
  } else {
    Serial.println(F("ERROR:CALIBRATION_FAILED"));
  }
}

void makeSafe() {
  plastic.purging = metal.purging = paper.purging = false;
  plastic.recovery = metal.recovery = paper.recovery = AutoRecovery();
  plastic.recovery.lastAttemptMs = metal.recovery.lastAttemptMs =
    paper.recovery.lastAttemptMs = millis();
  plastic.detectionCount = metal.detectionCount = paper.detectionCount = 0;
  plastic.entranceClearCount = metal.entranceClearCount = paper.entranceClearCount = 0;
  plastic.entranceArmed = metal.entranceArmed = paper.entranceArmed = false;
  if (!PLASTIC_DISABLED) reattachServos(plastic);
  if (!PLASTIC_DISABLED) plastic.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!PLASTIC_DISABLED) plastic.bottomGateServo->write(DROP_CLOSED_ANGLE);
  if (!METAL_DISABLED) reattachServos(metal);
  if (!METAL_DISABLED) metal.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!METAL_DISABLED) metal.bottomGateServo->write(DROP_CLOSED_ANGLE);
  if (!PAPER_DISABLED) reattachServos(paper);
  if (!PAPER_DISABLED) paper.irisServo->write(IRIS_CLOSED_ANGLE);
  if (!PAPER_DISABLED) paper.bottomGateServo->write(PAPER_DROP_CLOSED_ANGLE);
  // After makeSafe the machine is in a stable rest state — detach all.
  delay(400);
  if (!PLASTIC_DISABLED) { plasticIris.detach(); plasticDrop.detach(); }
  if (!METAL_DISABLED)   { metalIris.detach();   metalDrop.detach(); }
  if (!PAPER_DISABLED)   { paperIris.detach();   paperDrop.detach(); }
}

void enforceHostLease() {
  if (!hostOnline || millis() - lastHostAliveMs <= HOST_LEASE_TIMEOUT_MS) return;
  hostOnline = false;
  machineRunning = false;
  calibrated = false;
  calibrationCancelled = calibrating;
  activeCycleAborted = true;
  makeSafe();
  Serial.println(F("HOST:TIMEOUT"));
  Serial.println(F("MACHINE:STOPPED"));
}

// Zero-allocation serial reader: eliminates heap fragmentation and dynamic memory churn
void handleSerial() {
  pollSensors();
  if (!calibrating && (hardwareStatusDirty || millis() - lastStatusMs >= 2000UL)) {
    lastStatusMs = millis();
    reportHardwareStatus();
  }
  while (Serial.available() > 0) {
    char ch = (char)Serial.read();
    if (ch == '\n' || ch == '\r') {
      if (serialBufIdx > 0) {
        serialBuffer[serialBufIdx] = '\0';
        serialBufIdx = 0;
        executeCommand(serialBuffer);
      }
    } else if (serialBufIdx < sizeof(serialBuffer) - 1) {
      serialBuffer[serialBufIdx++] = ch;
    }
  }
  enforceHostLease();
}

void executeCommand(char* cmd) {
  // Trim leading whitespace
  while (*cmd == ' ' || *cmd == '\t') cmd++;
  int len = strlen(cmd);
  // Trim trailing whitespace
  while (len > 0 && (cmd[len - 1] == ' ' || cmd[len - 1] == '\t' || cmd[len - 1] == '\r' || cmd[len - 1] == '\n')) {
    cmd[--len] = '\0';
  }
  if (len == 0) return;

  // Uppercase in place
  for (int i = 0; cmd[i]; i++) {
    if (cmd[i] >= 'a' && cmd[i] <= 'z') cmd[i] -= 32;
  }

  if (strcmp(cmd, "HOST:ALIVE") == 0) {
    bool newSession = !hostOnline;
    hostOnline = true;
    lastHostAliveMs = millis();
    if (newSession) Serial.println(F("HOST:ONLINE"));
    if (!calibrated && !calibrating) calibrateAll();
    return;
  }

  // Only safety and diagnostic status commands are accepted without the
  // desktop lease. In particular, CALIBRATE must never move gates standalone.
  if (!hostOnline && strcmp(cmd, "STOP") != 0 &&
      strcmp(cmd, "RESET") != 0 && strcmp(cmd, "STATUS") != 0) {
    Serial.println(F("ERROR:HOST_OFFLINE"));
    return;
  }

  if ((calibrating || activeCompartment != NULL) &&
      (strcmp(cmd, "START") == 0 || strcmp(cmd, "CALIBRATE") == 0 || strcmp(cmd, "SCALE") == 0)) {
    Serial.println(F("ERROR:COMPARTMENT_BUSY"));
    return;
  }

  if (strcmp(cmd, "DEBUG ON") == 0 || strcmp(cmd, "DEBUG OFF") == 0) {
    entranceDebug = (strcmp(cmd, "DEBUG ON") == 0);
    Serial.println(entranceDebug ? F("DEBUG:ON") : F("DEBUG:OFF"));
  } else if (strcmp(cmd, "SCALE") == 0) {
    if (PAPER_DISABLED) {
      Serial.println(F("ERROR:PAPER_DISABLED"));
      return;
    }
    long raw;
    if (readHx711Average(3, raw)) {
      Serial.print(F("PAPER:SCALE_RAW:")); Serial.print(raw);
      Serial.print(F(";TARE_VALID:")); Serial.print(paperScaleReady ? F("YES") : F("NO"));
      if (paperScaleReady) {
        Serial.print(F(";TARE_RAW:")); Serial.print(paperTareRaw);
        Serial.print(F(";SIGNED_GRAMS:"));
        Serial.print((float)(raw - paperTareRaw) / PAPER_COUNTS_PER_GRAM, 2);
      }
      Serial.println();
    }
  } else if (strcmp(cmd, "START") == 0) {
    machineRunning = calibrated && hostOnline;
    Serial.println(machineRunning ? F("MACHINE:STARTED") :
                   (hostOnline ? F("ERROR:NOT_CALIBRATED") : F("ERROR:HOST_OFFLINE")));
  } else if (strcmp(cmd, "STOP") == 0 || strcmp(cmd, "RESET") == 0) {
    if (calibrating) calibrationCancelled = true;
    machineRunning = false;
    makeSafe();
    Serial.println(strcmp(cmd, "STOP") == 0 ? F("MACHINE:STOPPED") : F("RESET:OK"));
  } else if (strcmp(cmd, "CALIBRATE") == 0) {
    calibrateAll();
  } else if (strcmp(cmd, "STATUS") == 0) {
    reportHardwareStatus();
    Serial.print(F("STATUS:"));
    Serial.print(calibrating ? F("CALIBRATING") :
                 (calibrated ? (machineRunning ? F("RUNNING") : F("READY")) : F("NOT_CALIBRATED")));
    Serial.print(F(";PLASTIC_CM:")); printDistanceCm(plastic.emptyDistanceMm);
    Serial.print(F(";PLASTIC_SIZE_CM:"));
    printDistanceCm(plastic.bottomSizeEmptyMm); Serial.print(',');
    printDistanceCm(plastic.middleSizeEmptyMm); Serial.print(',');
    printDistanceCm(plastic.topSizeEmptyMm);
    Serial.print(F(";METAL_CM:")); printDistanceCm(metal.emptyDistanceMm);
    Serial.print(F(";METAL_SIZE_CM:"));
    printDistanceCm(metal.bottomSizeEmptyMm); Serial.print(',');
    printDistanceCm(metal.middleSizeEmptyMm); Serial.print(',');
    printDistanceCm(metal.topSizeEmptyMm);
    Serial.print(F(";PAPER_TOP_CM:")); printDistanceCm(paper.emptyDistanceMm);
    Serial.print(F(";PAPER_BOTTOM_CM:")); printDistanceCm(paper.bottomEmptyDistanceMm);
    Serial.print(F(";METAL_SENSOR:"));
    Serial.print(METAL_DISABLED ? F("DISABLED") :
                 (digitalRead(metal.materialSensorPin) == METAL_DETECTED_STATE ? F("DETECTED") : F("CLEAR")));
    Serial.print(F(";PAPER_SCALE:"));
    Serial.println(PAPER_DISABLED ? F("DISABLED") : (paperScaleReady ? F("READY") : F("ERROR")));
  } else {
    Serial.println(F("ERROR:UNKNOWN_COMMAND"));
  }
}
