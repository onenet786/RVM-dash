from pathlib import Path
p=Path('Arduino/RVM_Arduino/RVM_Arduino.ino')
s=p.read_text(encoding='utf-8-sig')
def change(a,b,n=1):
    global s
    assert a in s, a
    s=s.replace(a,b,n)
change('AUTO_RECALIBRATE_RETRY_MS = 5000UL','AUTO_RECALIBRATE_RETRY_MS = 1000UL')
change('const byte AUTO_RECALIBRATE_SAMPLES = 5;', '''const byte AUTO_RECALIBRATE_SAMPLES = 3;
const byte CALIBRATION_SAMPLES = 3;
const unsigned long PURGE_OPEN_MS = 1000UL;
const unsigned long GATE_SETTLE_MS = 700UL;''')
change('  AutoRecovery recovery;', '  AutoRecovery recovery;\n  bool purging;\n  unsigned long purgeStartedMs;')
change('bool calibrating = false;', 'bool calibrating = false;\nbool calibrationCancelled = false;')
change('!c.workingFailed && !c.binFull;', '!c.workingFailed && !c.binFull && !c.purging;')
change('void closeCompartment(Compartment& c) {', 'void closeCompartment(Compartment& c) {\n  c.purging = false;')
change('void reportCompartment(const Compartment& c) {', '''byte binPin(const Compartment& c) {
  return &c == &plastic ? PLASTIC_BIN_PIN : (&c == &metal ? METAL_BIN_PIN : PAPER_BIN_PIN);
}

void beginPurge(Compartment& c) {
  if (compartmentDisabled(c)) return;
  c.detectionCount = c.entranceClearCount = 0;
  c.entranceArmed = false;
  c.irisServo->write(IRIS_CLOSED_ANGLE);
  // Do not release into a blocked bin, including during sensor debounce.
  if (c.binFull || digitalRead(binPin(c)) == BIN_BLOCKED_STATE) {
    closeCompartment(c);
    return;
  }
  c.purging = true;
  c.purgeStartedMs = millis();
  c.bottomGateServo->write(&c == &paper ? PAPER_DROP_OPEN_ANGLE : DROP_OPEN_ANGLE);
  Serial.print("PURGE:"); Serial.print(c.name); Serial.println(";STATE:OPEN");
}

void servicePurge(Compartment& c) {
  if (!c.purging) return;
  if (digitalRead(binPin(c)) == BIN_BLOCKED_STATE ||
      millis() - c.purgeStartedMs >= PURGE_OPEN_MS) {
    closeCompartment(c);
    c.recovery.lastAttemptMs = millis();
  }
}

void reportCompartment(const Compartment& c) {''')
change('  reportCompartment(c);\n}\n\nvoid reportHardwareStatus()', '  reportCompartment(c);\n  beginPurge(c);\n}\n\nvoid reportHardwareStatus()')
change('void pollSensors() {','void pollSensors() {\n  servicePurge(plastic);\n  servicePurge(metal);\n  servicePurge(paper);')
change('  makeSafe();\n  delay(500);\n  calibrateAll();','  calibrateAll();')
change('  // Never release an unclassified object into a bin that may be full.', '  // Purge without credit, then require stable empty readings before recovery.')
change('if (compartmentDisabled(c) || !c.workingFailed || !c.hasEmptyCalibration ||', 'if (compartmentDisabled(c) || c.purging || !c.workingFailed || !c.hasEmptyCalibration ||')
# Calibration pauses are responsive to STOP and continue monitoring bin sensors.
change('void calibrateAll() {\n', '''bool waitCalibration(unsigned long durationMs) {
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
''')
change('  makeSafe();\n  Serial.println("CALIBRATION:REMOVE_OBJECTS");\n  delay(1000);', '''  plastic.recovery = metal.recovery = paper.recovery = AutoRecovery();
  Serial.println("CALIBRATION:REMOVE_OBJECTS");
  // First commanded bottom-gate position at startup is OPEN (unless bin full).
  // Open all enabled gates together, then close and settle before measuring.
  beginPurge(plastic);
  beginPurge(metal);
  beginPurge(paper);
  if (!waitCalibration(PURGE_OPEN_MS + GATE_SETTLE_MS)) {
    calibrating = false;
    makeSafe();
    return;
  }''')
a=s.index('void calibrateAll() {'); b=s.index('\nvoid makeSafe()',a)
part=s[a:b]
import re
part=re.sub(r', (7|5)\);', ', CALIBRATION_SAMPLES);', part)
part=re.sub(r'    delay\((100|500)\);\n','',part)
part=part.replace('readHx711Average(12, tare)', 'readHx711Average(5, tare)')
part=part.replace('  plastic.workingFailed =', '''  if (calibrationCancelled) {
    calibrating = false;
    makeSafe();
    return;
  }
  plastic.workingFailed =''',1)
part=part.replace('  reportHardwareStatus();','''  reportHardwareStatus();
  if (plastic.workingFailed) beginPurge(plastic);
  if (metal.workingFailed) beginPurge(metal);
  if (paper.workingFailed) beginPurge(paper);''',1)
s=s[:a]+part+s[b:]
# Keep the 60ms trigger spacing in readUltrasonicCm, remove the duplicate pause.
a=s.index('int readStableUltrasonicCm(byte trigPin, byte echoPin, byte samples) {');b=s.index('\nbool waitForHx711Ready',a)
part=s[a:b].replace('    int distance =', '    handleSerial();\n    if (calibrationCancelled) return -1;\n    int distance =',1)
part=part.replace('    delay(60);', '''    if (distance <= 0 || farthest - nearest > 2) {
      Serial.print("ERROR:UNSTABLE_CALIBRATION_TRIG:"); Serial.println(trigPin);
      return -1;
    }''')
s=s[:a]+part+s[b:]
change('bool readHx711Raw(long& raw) {', 'bool readHx711Raw(long& raw) {\n  if (calibrating && calibrationCancelled) return false;')
change('    pollSensors();\n    if (activeCompartment', '    if (calibrating) handleSerial();\n    else pollSensors();\n    if (calibrating && calibrationCancelled) return false;\n    if (activeCompartment')
change('void makeSafe() {', 'void makeSafe() {\n  plastic.purging = metal.purging = paper.purging = false;')
change('        executeCommand(serialBuffer);\n        serialBuffer = "";', '        String command = serialBuffer;\n        serialBuffer = "";\n        executeCommand(command);')
# Do not allow SCALE to recursively read HX711 while calibration services serial.
change('command == "START" || command == "CALIBRATE"', 'command == "START" || command == "CALIBRATE" || command == "SCALE"')
change('  } else if (command == "STOP" || command == "RESET") {', '  } else if (command == "STOP" || command == "RESET") {\n    if (calibrating) calibrationCancelled = true;')
p.write_text(s,encoding='utf-8')
