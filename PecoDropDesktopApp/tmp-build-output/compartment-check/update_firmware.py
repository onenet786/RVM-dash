from pathlib import Path
p = Path('Arduino/RVM_Arduino/RVM_Arduino.ino')
s = p.read_text(encoding='utf-8-sig')
s = s.replace('const byte METAL_DETECTED_STATE', '''// Digital obstacle sensors: LOW means blocked. Change polarity for your modules.
const byte PLASTIC_BIN_PIN = 47;
const byte METAL_BIN_PIN = 48;
const byte PAPER_BIN_PIN = 49;
const byte MQ6_DIGITAL_PIN = 50;
const byte BIN_BLOCKED_STATE = LOW;
const byte MQ6_ALARM_STATE = LOW;
const unsigned long BIN_BLOCK_MS = 500UL;
const unsigned long BIN_CLEAR_MS = 2000UL;
const unsigned long MQ6_DEBOUNCE_MS = 1000UL;
const byte METAL_DETECTED_STATE''', 1)
s = s.replace('  int candidateMaxCm;','''  int candidateMaxCm;
  bool workingFailed;
  bool binFull;
  bool binCandidate;
  unsigned long binCandidateSince;
  byte missingEntranceReadings;''')
s = s.replace('bool recoveringSensorFault = false;', '''bool calibrating = false;
Compartment* activeCompartment = NULL;
bool activeCycleAborted = false;
bool mq6Alarm = false;
bool mq6Candidate = false;
unsigned long mq6CandidateSince = 0;
unsigned long lastStatusMs = 0;

bool compartmentDisabled(const Compartment& c) {
  return &c == &plastic ? PLASTIC_DISABLED : (&c == &metal ? METAL_DISABLED : PAPER_DISABLED);
}

bool compartmentAvailable(const Compartment& c) {
  return !compartmentDisabled(c) && !c.workingFailed && !c.binFull;
}

void closeCompartment(Compartment& c) {
  c.detectionCount = c.entranceClearCount = 0;
  c.entranceArmed = false;
  if (compartmentDisabled(c)) return;
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  c.bottomGateServo->write(&c == &paper ? PAPER_DROP_CLOSED_ANGLE : DROP_CLOSED_ANGLE);
}

void reportCompartment(const Compartment& c) {
  Serial.print("COMPARTMENT:"); Serial.print(c.name);
  Serial.print(";WORKING:");
  Serial.print(compartmentDisabled(c) || c.workingFailed ? "FAILED" : "OK");
  Serial.print(";BIN:"); Serial.println(c.binFull ? "FULL" : "CLEAR");
}

void failCompartment(Compartment& c, const char* reason) {
  if (c.workingFailed) return;
  c.workingFailed = true;
  if (activeCompartment == &c) activeCycleAborted = true;
  closeCompartment(c);
  Serial.print("FAULT:"); Serial.print(c.name);
  Serial.print(';'); Serial.println(reason);
  reportCompartment(c);
}

void reportHardwareStatus() {
  reportCompartment(plastic);
  reportCompartment(metal);
  reportCompartment(paper);
  Serial.println(mq6Alarm ? "MQ6:WARNING" : "MQ6:CLEAR");
}

void pollBin(Compartment& c, byte pin) {
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
    reportCompartment(c);
  }
}

void pollSensors() {
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
    Serial.println(mq6Alarm ? "MQ6:WARNING" : "MQ6:CLEAR");
  }
}

bool cycleRunning() {
  return machineRunning && !activeCycleAborted &&
         (activeCompartment == NULL || compartmentAvailable(*activeCompartment));
}

bool waitActive(unsigned long durationMs) {
  unsigned long started = millis();
  while (millis() - started < durationMs) {
    handleSerial();
    if (!cycleRunning()) return false;
    delay(5);
  }
  return cycleRunning();
}''')
s = s.replace('  Serial.begin(115200);', '''  Serial.begin(115200);
  pinMode(PLASTIC_BIN_PIN, INPUT_PULLUP);
  pinMode(METAL_BIN_PIN, INPUT_PULLUP);
  pinMode(PAPER_BIN_PIN, INPUT_PULLUP);
  pinMode(MQ6_DIGITAL_PIN, INPUT_PULLUP);''')
a=s.index('  // IDLE: gates remain closed.', s.index('void loop()'))
b=s.index('\n  delay(40);',a)
s=s[:a]+'''  // A fault/full bin only removes its own compartment from the intake loop.
  Compartment* compartments[] = { &plastic, &metal, &paper };
  for (byte i = 0; i < 3 && machineRunning; i++) {
    Compartment& c = *compartments[i];
    if (!compartmentAvailable(c) || !updateDetection(c)) continue;
    activeCompartment = &c;
    activeCycleAborted = false;
    if (&c == &paper) processPaper();
    else processSizedItem(c);
    activeCompartment = NULL;
    activeCycleAborted = false;
  }'''+s[b:]
s=s.replace('  int distance = readUltrasonicCm(c.ultrasonicTrigPin, c.ultrasonicEchoPin);\n  // Compare', '''  int distance = readUltrasonicCm(c.ultrasonicTrigPin, c.ultrasonicEchoPin);
  if (distance <= 0) {
    c.detectionCount = 0;
    if (++c.missingEntranceReadings >= 3) failCompartment(c, "ENTRANCE_SENSOR");
    return false;
  }
  c.missingEntranceReadings = 0;
  if (!compartmentAvailable(c)) return false;
  // Compare''')
a=s.index('void recoverSizingFault(Compartment& c) {')
b=s.index('// Return -1',a)
s=s[:a]+'''void recoverSizingFault(Compartment& c) {
  // Latch only this compartment until an operator clears it and calibrates.
  // Never release an unclassified object into a bin that may be full.
  failCompartment(c, "INVALID_SENSOR_PATTERN");
}

'''+s[b:]
# Abort every active wait on a local fault/full bin, without stopping other bins.
a=s.index('void processSizedItem(Compartment& c) {')
b=s.index('bool sizeLevelChanged(byte trigPin, byte echoPin, int emptyDistanceCm) {',a)
part=s[a:b].replace('if (!machineRunning)', 'if (!cycleRunning())').replace('return machineRunning;', 'return cycleRunning();')
import re
part=re.sub(r'  delay\((700|150|900|600)\);',r'  if (!waitActive(\1)) return;',part[:part.index('const char* calculateSize')])+part[part.index('const char* calculateSize'):]
# Return types differ in measurement helpers; keep those delays but monitor between scans.
pa=part.index('void processPaper() {'); pb=part.index('bool paperAtBottom()',pa)
part=part[:pa]+re.sub(r'  delay\((150|900|600)\);',r'  if (!waitActive(\1)) return;',part[pa:pb])+part[pb:]
part=part.replace('if (machineRunning) {\n      Serial.print("ERROR:");', 'if (cycleRunning()) {\n      failCompartment(c, "ARRIVAL_TIMEOUT");\n      Serial.print("ERROR:");',1)
part=part.replace('if (machineRunning) Serial.println("ERROR:PAPER_WEIGHT_TIMEOUT");','if (cycleRunning()) failCompartment(paper, "WEIGHT_TIMEOUT");')
part=part.replace('  bool accepted = (&c != &metal) || metalDetectedStable();','  bool accepted = (&c != &metal) || metalDetectedStable();\n  handleSerial();\n  if (!cycleRunning()) return;')
part=part.replace('  Serial.println(cleared ? "BOTTLE:CLEARED" : "ERROR:CLEAR_TIMEOUT");', '''  if (cleared && cycleRunning()) Serial.println("BOTTLE:CLEARED");
  else if (cycleRunning()) failCompartment(c, "CLEAR_TIMEOUT");''',1)
part=part.replace('  Serial.println(cleared ? "BOTTLE:CLEARED" : "ERROR:CLEAR_TIMEOUT");', '''  if (cleared && cycleRunning()) Serial.println("BOTTLE:CLEARED");
  else if (cycleRunning()) failCompartment(paper, "CLEAR_TIMEOUT");''',1)
# Missing echoes must never count as a successfully cleared chamber.
ca=part.index('    bool bottomClear ='); cb=part.index('    bool clear = bottomClear',ca)
part=part[:ca]+'''    bool bottomClear = readSizeLevel(c, "BOTTOM", c.bottomSizeTrigPin,
                                         c.bottomSizeEchoPin, c.bottomSizeEmptyCm) == 0;
    bool middleClear = readSizeLevel(c, "MIDDLE", c.middleSizeTrigPin,
                                         c.middleSizeEchoPin, c.middleSizeEmptyCm) == 0;
    bool topClear = readSizeLevel(c, "TOP", c.topSizeTrigPin,
                                      c.topSizeEchoPin, c.topSizeEmptyCm) == 0;
'''+part[cb:]
part=part.replace('    bool clear = !paperAtBottom() && readPaperGrams(2) <= PAPER_CLEAR_WEIGHT_G;', '''    int bottom = readUltrasonicCm(paper.bottomUltrasonicTrigPin, paper.bottomUltrasonicEchoPin);
    bool clear = bottom > 0 && abs(bottom - paper.bottomEmptyDistanceCm) <= ENTRANCE_CLEAR_TOLERANCE_CM &&
                 readPaperGrams(2) <= PAPER_CLEAR_WEIGHT_G;''')
part=part.replace('    float current = readPaperGrams(3);','''    float current = readPaperGrams(3);
    if (isnan(current)) {
      failCompartment(paper, "LOAD_CELL");
      return false;
    }''')
s=s[:a]+part+s[b:]
s=s.replace('  // Space all ultrasonic triggers', '  pollSensors();\n  // Space all ultrasonic triggers')
s=s.replace('    delay(1);\n  }\n  return digitalRead', '    pollSensors();\n    if (activeCompartment != NULL && !cycleRunning()) return false;\n    delay(1);\n  }\n  return digitalRead')
s=s.replace('void calibrateAll() {\n', 'void calibrateAll() {\n  calibrating = true;\n')
a=s.index('  calibrated = (!PLASTIC_DISABLED'); b=s.index('  Serial.print("MODE:PLASTIC:',a)
s=s[:a]+'''  plastic.workingFailed = PLASTIC_DISABLED || plastic.emptyDistanceCm <= 0 ||
    plastic.bottomSizeEmptyCm <= 0 || plastic.middleSizeEmptyCm <= 0 || plastic.topSizeEmptyCm <= 0;
  metal.workingFailed = METAL_DISABLED || metal.emptyDistanceCm <= 0 ||
    metal.bottomSizeEmptyCm <= 0 || metal.middleSizeEmptyCm <= 0 || metal.topSizeEmptyCm <= 0;
  paper.workingFailed = PAPER_DISABLED || paper.emptyDistanceCm <= 0 ||
    paper.bottomEmptyDistanceCm <= 0 || !paperScaleReady;
  plastic.missingEntranceReadings = metal.missingEntranceReadings = paper.missingEntranceReadings = 0;
  calibrated = !plastic.workingFailed || !metal.workingFailed || !paper.workingFailed;
  calibrating = false;
  pollSensors();
  reportHardwareStatus();
'''+s[b:]
s=s.replace('void handleSerial() {\n', '''void handleSerial() {
  pollSensors();
  if (!calibrating && millis() - lastStatusMs >= 2000UL) {
    lastStatusMs = millis();
    reportHardwareStatus();
  }
''')
s=s.replace('if (recoveringSensorFault && (command == "START" || command == "CALIBRATE"))', 'if ((calibrating || activeCompartment != NULL) && (command == "START" || command == "CALIBRATE"))')
s=s.replace('ERROR:RECOVERY_IN_PROGRESS','ERROR:COMPARTMENT_BUSY')
s=s.replace('  else if (command == "STATUS") {','  else if (command == "STATUS") {\n    reportHardwareStatus();')
p.write_text(s, encoding='utf-8')
