#include <Servo.h>

// Arduino Mega pin map:
// Plastic: entrance ultrasonic 9/10, iris 11, drop gate 12,
// sizing ultrasonics bottom 22/23, middle 24/41, top 42/43.
// Metal: entrance ultrasonic 25/26, iris 27, drop gate 28,
// sizing ultrasonics bottom 29/30, middle 31/44, top 45/46,
// inductive sensor 32.
// Paper: top ultrasonic 33/34, iris 35, drop gate 36, HX711 37/38,
// bottom ultrasonic 39/40.

const byte METAL_DETECTED_STATE = LOW;
const byte IRIS_CLOSED_ANGLE = 10;
const byte IRIS_OPEN_ANGLE = 120;
const byte DROP_CLOSED_ANGLE = 10;
const byte DROP_OPEN_ANGLE = 120;
const unsigned int MAX_DISTANCE_CM = 200;
const unsigned long ECHO_TIMEOUT_US = 20000UL;
const unsigned int DETECTION_CHANGE_CM = 5;
const byte REQUIRED_DETECTIONS = 3;
const byte SIZE_READING_SAMPLES = 3;
const byte REQUIRED_SIZE_CHANGES = 2;
const unsigned long ARRIVAL_TIMEOUT_MS = 5000UL;
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

int readUltrasonicCm(byte trigPin, byte echoPin);
int readStableUltrasonicCm(byte trigPin, byte echoPin, byte samples);
bool sizeLevelChanged(byte trigPin, byte echoPin, int emptyDistanceCm);
bool updateDetection(Compartment& c);
const char* calculateSize(Compartment& c);
bool waitForSizingItem(Compartment& c);
bool waitForSizingClear(Compartment& c);
bool metalDetectedStable();
void processSizedItem(Compartment& c);
void processPaper();
bool paperAtBottom();
bool waitForPaperWeight(float& grams);
bool waitForPaperClear();
long readHx711Raw();
bool waitForHx711Ready(unsigned long timeoutMs);
long readHx711Average(byte samples);
float readPaperGrams(byte samples);
void calibrateAll();
void makeSafe();
void handleSerial();
void executeCommand(String command);

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
  setupSizedCompartment(plastic);
  setupSizedCompartment(metal);
  setupPaper();
  pinMode(metal.materialSensorPin, INPUT_PULLUP);
  makeSafe();
  delay(500);
  calibrateAll();
  Serial.println("RVM:PLASTIC_METAL_PAPER_READY");
}

void loop() {
  handleSerial();
  if (!machineRunning || !calibrated) {
    delay(20);
    return;
  }
  // IDLE: gates remain closed. Only entrance/top ultrasonics are checked here.
  // Sizing ultrasonics are read only after an entrance sensor opens its iris.
  if (updateDetection(plastic)) processSizedItem(plastic);
  else {
    delay(30);
    if (updateDetection(metal)) processSizedItem(metal);
    else {
      delay(30);
      if (updateDetection(paper)) processPaper();
    }
  }
  delay(40);
}

bool updateDetection(Compartment& c) {
  int distance = readUltrasonicCm(c.ultrasonicTrigPin, c.ultrasonicEchoPin);
  bool detected = distance > 0 && c.emptyDistanceCm > 0 &&
                  c.emptyDistanceCm - distance >= DETECTION_CHANGE_CM;
  if (detected && c.detectionCount < REQUIRED_DETECTIONS) c.detectionCount++;
  if (!detected) c.detectionCount = 0;
  return c.detectionCount >= REQUIRED_DETECTIONS;
}

void processSizedItem(Compartment& c) {
  Serial.print(c.name); Serial.println(":OBJECT_DETECTED");
  c.irisServo->write(IRIS_OPEN_ANGLE);
  delay(700);
  if (!waitForSizingItem(c)) {
    c.irisServo->write(IRIS_CLOSED_ANGLE);
    if (machineRunning) {
      Serial.print("ERROR:"); Serial.print(c.name); Serial.println("_ARRIVAL_TIMEOUT");
    }
    c.detectionCount = 0;
    return;
  }
  Serial.print(c.name); Serial.println(":SIZING_START");
  delay(350);
  const char* size = calculateSize(c);
  if (strcmp(size, "INVALID") == 0) {
    c.irisServo->write(IRIS_CLOSED_ANGLE);
    Serial.print("ERROR:"); Serial.print(c.name); Serial.println("_INVALID_SENSOR_PATTERN");
    c.detectionCount = 0;
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

const char* calculateSize(Compartment& c) {
  bool bottom = sizeLevelChanged(c.bottomSizeTrigPin, c.bottomSizeEchoPin,
                                 c.bottomSizeEmptyCm);
  delay(30);
  bool middle = sizeLevelChanged(c.middleSizeTrigPin, c.middleSizeEchoPin,
                                 c.middleSizeEmptyCm);
  delay(30);
  bool top = sizeLevelChanged(c.topSizeTrigPin, c.topSizeEchoPin,
                              c.topSizeEmptyCm);
  if (bottom && middle && top) return "LARGE";
  if (bottom && middle && !top) return "MEDIUM";
  if (bottom && !middle && !top) return "SMALL";
  return "INVALID";
}

bool waitForSizingItem(Compartment& c) {
  unsigned long started = millis();
  byte bottomChangeCount = 0;
  while (millis() - started < ARRIVAL_TIMEOUT_MS) {
    handleSerial();
    if (!machineRunning) return false;
    if (sizeLevelChanged(c.bottomSizeTrigPin, c.bottomSizeEchoPin,
                         c.bottomSizeEmptyCm)) {
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

void processPaper() {
  Serial.println("PAPER:OBJECT_DETECTED");
  paper.irisServo->write(IRIS_OPEN_ANGLE);
  delay(700);
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
  paper.bottomGateServo->write(DROP_OPEN_ANGLE);
  delay(900);
  bool cleared = waitForPaperClear();
  paper.bottomGateServo->write(DROP_CLOSED_ANGLE);
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
  byte bottomCount = 0, stableCount = 0;
  float previous = 0.0f;
  while (millis() - started < ARRIVAL_TIMEOUT_MS) {
    handleSerial();
    if (!machineRunning) return false;
    if (paperAtBottom()) {
      if (bottomCount < REQUIRED_DETECTIONS) bottomCount++;
    } else bottomCount = 0;
    if (bottomCount < REQUIRED_DETECTIONS) {
      delay(35);
      continue;
    }
    float current = readPaperGrams(3);
    if (current >= PAPER_MIN_WEIGHT_G) {
      stableCount = abs(current - previous) <= 5.0f ? stableCount + 1 : 0;
      previous = current;
      if (stableCount >= 3) {
        grams = readPaperGrams(8);
        return true;
      }
    } else {
      stableCount = 0;
      previous = current;
    }
    delay(40);
  }
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
  for (byte i = 0; i < samples; i++) {
    int distance = readUltrasonicCm(trigPin, echoPin);
    if (distance > 0) { total += distance; valid++; }
    delay(60);
  }
  // Reject calibration when most samples time out instead of accepting one
  // accidental echo as the empty-pipe baseline.
  byte requiredValid = (samples / 2) + 1;
  return valid < requiredValid ? -1 : (int)(total / valid);
}

bool waitForHx711Ready(unsigned long timeoutMs) {
  unsigned long started = millis();
  while (digitalRead(paper.loadCellDoutPin) == HIGH &&
         millis() - started < timeoutMs) {
    delay(1);
  }
  return digitalRead(paper.loadCellDoutPin) == LOW;
}

long readHx711Raw() {
  unsigned long started = millis();
  while (digitalRead(paper.loadCellDoutPin) == HIGH && millis() - started < 250UL) delay(1);
  if (digitalRead(paper.loadCellDoutPin) == HIGH) return paperTareRaw;
  unsigned long value = 0;
  for (byte i = 0; i < 24; i++) {
    digitalWrite(paper.loadCellSckPin, HIGH);
    value = (value << 1) | digitalRead(paper.loadCellDoutPin);
    digitalWrite(paper.loadCellSckPin, LOW);
  }
  digitalWrite(paper.loadCellSckPin, HIGH);
  digitalWrite(paper.loadCellSckPin, LOW);
  if (value & 0x800000UL) value |= 0xFF000000UL;
  return (long)value;
}

long readHx711Average(byte samples) {
  long total = 0;
  for (byte i = 0; i < samples; i++) total += readHx711Raw();
  return total / samples;
}

float readPaperGrams(byte samples) {
  float grams = (float)(readHx711Average(samples) - paperTareRaw) /
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
  paper.emptyDistanceCm = readStableUltrasonicCm(
    paper.ultrasonicTrigPin, paper.ultrasonicEchoPin, 7);
  delay(100);
  paper.bottomEmptyDistanceCm = readStableUltrasonicCm(
    paper.bottomUltrasonicTrigPin, paper.bottomUltrasonicEchoPin, 7);
  delay(500);
  paperScaleReady = waitForHx711Ready(1000UL);
  paperTareRaw = paperScaleReady ? readHx711Average(12) : 0;
  calibrated = plastic.emptyDistanceCm > 0 &&
               plastic.bottomSizeEmptyCm > 0 &&
               plastic.middleSizeEmptyCm > 0 &&
               plastic.topSizeEmptyCm > 0 &&
               metal.emptyDistanceCm > 0 &&
               metal.bottomSizeEmptyCm > 0 &&
               metal.middleSizeEmptyCm > 0 &&
               metal.topSizeEmptyCm > 0 &&
               paper.emptyDistanceCm > 0 && paper.bottomEmptyDistanceCm > 0 &&
               paperScaleReady;
  Serial.print("CALIBRATION:PLASTIC_EMPTY_CM:"); Serial.println(plastic.emptyDistanceCm);
  Serial.print("CALIBRATION:PLASTIC_SIZE_BOTTOM_CM:"); Serial.println(plastic.bottomSizeEmptyCm);
  Serial.print("CALIBRATION:PLASTIC_SIZE_MIDDLE_CM:"); Serial.println(plastic.middleSizeEmptyCm);
  Serial.print("CALIBRATION:PLASTIC_SIZE_TOP_CM:"); Serial.println(plastic.topSizeEmptyCm);
  Serial.print("CALIBRATION:METAL_EMPTY_CM:"); Serial.println(metal.emptyDistanceCm);
  Serial.print("CALIBRATION:METAL_SIZE_BOTTOM_CM:"); Serial.println(metal.bottomSizeEmptyCm);
  Serial.print("CALIBRATION:METAL_SIZE_MIDDLE_CM:"); Serial.println(metal.middleSizeEmptyCm);
  Serial.print("CALIBRATION:METAL_SIZE_TOP_CM:"); Serial.println(metal.topSizeEmptyCm);
  Serial.print("CALIBRATION:PAPER_TOP_EMPTY_CM:"); Serial.println(paper.emptyDistanceCm);
  Serial.print("CALIBRATION:PAPER_BOTTOM_EMPTY_CM:"); Serial.println(paper.bottomEmptyDistanceCm);
  Serial.print("CALIBRATION:PAPER_TARE_RAW:"); Serial.println(paperTareRaw);
  if (!paperScaleReady) Serial.println("ERROR:PAPER_SCALE_NOT_READY");
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
  plastic.irisServo->write(IRIS_CLOSED_ANGLE);
  plastic.bottomGateServo->write(DROP_CLOSED_ANGLE);
  metal.irisServo->write(IRIS_CLOSED_ANGLE);
  metal.bottomGateServo->write(DROP_CLOSED_ANGLE);
  paper.irisServo->write(IRIS_CLOSED_ANGLE);
  paper.bottomGateServo->write(DROP_CLOSED_ANGLE);
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
  if (command == "START") {
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
    Serial.print(digitalRead(metal.materialSensorPin) == METAL_DETECTED_STATE ? "DETECTED" : "CLEAR");
    Serial.print(";PAPER_SCALE:");
    Serial.println(paperScaleReady ? "READY" : "ERROR");
  } else Serial.println("ERROR:UNKNOWN_COMMAND");
}
