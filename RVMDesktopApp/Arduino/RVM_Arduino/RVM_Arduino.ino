// Reverse Vending Machine - Arduino Uno High-Stability Firmware
// Configured for E3F-DS10C4 NPN Photoelectric IR Proximity Sensors
// STATIC SIZING: Reads sensors ONLY AFTER bottle comes to a complete REST at the gate.

#include <Servo.h>

// ---------------- PIN DEFINITIONS ----------------
const byte irBottomPin = 2;
const byte trigPin = 4;
const byte echoPin = 3;
const byte metalSensorPin = 5; // NPN Inductive Sensor with voltage divider circuit
const byte irMiddlePin = 7;
const byte irTopPin = 8;
const byte servoPin = 9;

// ---- ENTRANCE HARDWARE PINS ----
const byte newTrigPin = 12;     // Entrance HC-SR04 Trig pin
const byte newEchoPin = 11;     // Entrance HC-SR04 Echo iopin
const byte newServoPin = 6;      // Entrance Servo pin
const byte binFullSensorPin = 10; // Bin full sensor input, stops machine when full

// ---------------- SERVO SETTINGS ----------------
const int gateClosedAngle = 60;
const int gateOpenAngle = 180;

// ---- ENTRANCE SERVO ANGLE SETTING ----
const int entranceClosedAngle = 75;   // Entrance gate closed angle
const int entranceOpenAngle = 90;     // Entrance gate open angle

// ---------------- SENSOR LOGIC SETTINGS ----------------
const bool IR_DETECTED_STATE = LOW; 
const bool METAL_DETECTED_STATE = LOW; 
const bool BIN_FULL_DETECTED_STATE = HIGH; 

// ---------------- FAST TIMING SETTINGS ----------------
const unsigned long echoTimeoutUs = 8000;
const unsigned long approachTimeoutMs = 350;
const unsigned long resultCooldownMs = 75;
const unsigned long gateHoldDurationMs = 300;
const unsigned long clearTimeoutMs = 1200;

const unsigned long servoOpenDelayMs = 250;
const unsigned long servoCloseDelayMs = 250;

// ---- DELAY SETTINGS ----
const unsigned long bottleSettleDelayMs = 600;      // Waiting time for bottle to fall & stop completely at gate
const unsigned long gateOpenDelayMs = 2000;         // Delay before opening drop gate after processing (2 sec)
const unsigned long bottleProcessingDelayMs = 2500; // Cooldown after sequence completion

// ---------------- ULTRASONIC SETTINGS ----------------
const byte calibrationReadings = 12;
const int maxSensorDistanceCM = 80;
const byte bottleDetectChangeCM = 2;
const int calibrationBlockedDistanceCM = 6;
const byte calibrationMaxAttempts = 3;

// ---- ENTRANCE SENSOR SETTINGS ----
const int entranceTriggerDistanceCM = 15; 

// ---------------- GLOBAL VARIABLES ----------------
Servo gateServo;
Servo entranceServo; 

bool machineStarted = false;
bool calibrated = false;
bool bottleProcessing = false;
bool metalDetectedForNextBottle = false;
bool waitingForStuckBottleRemoval = false;

bool mainGateCurrentlyOpen = false;
bool entranceGateCurrentlyOpen = false;

int emptyPipeDistanceCM = -1; 

// ---- ENTRANCE TIMEOUT TIMER VARIABLES ----
unsigned long entranceClearStartTime = 0; 
String inputBuffer = "";

// ---------------- HELPER SENSOR READS ----------------
bool isMetalDetected()
{
  return (digitalRead(metalSensorPin) == METAL_DETECTED_STATE);
}

bool isBinFull()
{
  return (digitalRead(binFullSensorPin) == BIN_FULL_DETECTED_STATE);
}

// ---------------- FORWARD DECLARATIONS ----------------
int readDistanceCM();
int readEntranceDistanceCM();
void calibrateEmptyPipe();
void processIncomingBottle(bool metalDetected);
void waitForBottomIRReset();
bool waitForBottleClear(const char* bottleSize);
void sortReadings(int readings[], int count);
void executeCommand(String command);

// ---------------- MAIN SERVO FUNCTIONS ----------------
void openGate()
{
  if (!mainGateCurrentlyOpen)
  {
    gateServo.write(gateOpenAngle);
    mainGateCurrentlyOpen = true;
    Serial.println("GATE:OPEN");
  }
}

void closeGate()
{
  if (mainGateCurrentlyOpen || true)
  {
    gateServo.write(gateClosedAngle);
    mainGateCurrentlyOpen = false;
    Serial.println("GATE:CLOSED");
  }
}

void openEntranceGate()
{
  if (!entranceGateCurrentlyOpen)
  {
    entranceServo.write(entranceOpenAngle);
    entranceGateCurrentlyOpen = true;
    Serial.println("ENTRANCE_GATE:OPEN");
  }
}

void closeEntranceGate()
{
  if (entranceGateCurrentlyOpen)
  {
    entranceServo.write(entranceClosedAngle);
    entranceGateCurrentlyOpen = false;
    entranceClearStartTime = 0;
    Serial.println("ENTRANCE_GATE:CLOSED");
  }
}

// ---------------- SETUP ----------------
void setup()
{
  Serial.begin(9600);

  pinMode(irBottomPin, INPUT_PULLUP);
  pinMode(irMiddlePin, INPUT_PULLUP);
  pinMode(irTopPin, INPUT_PULLUP);

  pinMode(metalSensorPin, INPUT);
  pinMode(binFullSensorPin, INPUT_PULLUP);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(trigPin, LOW);

  pinMode(newTrigPin, OUTPUT);
  pinMode(newEchoPin, INPUT);
  digitalWrite(newTrigPin, LOW);
  
  entranceServo.attach(newServoPin);
  entranceGateCurrentlyOpen = true; // Force position write
  closeEntranceGate(); 

  gateServo.attach(servoPin);
  mainGateCurrentlyOpen = true; // Force position write
  closeGate();

  Serial.println("READY");

  calibrateEmptyPipe();
}

// ---------------- MAIN LOOP ----------------
void loop()
{
  handleSerialCommand();

  if (isBinFull())
  {
    if (machineStarted)
    {
      machineStarted = false;
      closeGate();
      closeEntranceGate();
      Serial.println("BIN:FULL");
      Serial.println("MACHINE:STOPPED");
    }
    delay(50);
    return;
  }

  if (machineStarted)
  {
    int entranceDist = readEntranceDistanceCM();
    
    if (entranceDist > 0 && entranceDist <= entranceTriggerDistanceCM)
    {
      openEntranceGate();   
      entranceClearStartTime = 0; 
    }
    else
    {
      if (entranceGateCurrentlyOpen)
      {
        if (entranceClearStartTime == 0)
        {
          entranceClearStartTime = millis(); 
        }
        
        if (millis() - entranceClearStartTime >= 5000)
        {
          closeEntranceGate();  
        }
      }
    }
  }
  else
  {
    closeEntranceGate();  
  }

  if (!machineStarted)
  {
    delay(5);
    return;
  }

  if (!calibrated)
  {
    Serial.println("ERROR:NOT_CALIBRATED");
    machineStarted = false;
    delay(100);
    return;
  }

  bool bottomTriggered = (digitalRead(irBottomPin) == IR_DETECTED_STATE);

  if (waitingForStuckBottleRemoval)
  {
    bool allClear = digitalRead(irBottomPin) != IR_DETECTED_STATE &&
                    digitalRead(irMiddlePin) != IR_DETECTED_STATE &&
                    digitalRead(irTopPin) != IR_DETECTED_STATE;
    if (allClear)
    {
      waitingForStuckBottleRemoval = false;
      Serial.println("BOTTLE:REMOVED");
    }
    else
    {
      delay(20);
      return;
    }
  }

  if (!bottleProcessing && isMetalDetected())
  {
    metalDetectedForNextBottle = true;
  }

  if (bottomTriggered && !bottleProcessing)
  {
    bottleProcessing = true;
    
    bool metalResult = metalDetectedForNextBottle || isMetalDetected();
    metalDetectedForNextBottle = false;
    
    processIncomingBottle(metalResult);
    
    bottleProcessing = false;
  }

  delay(5);
}

// ---------------- SERIAL COMMAND HANDLER (NON-BLOCKING) ----------------
void handleSerialCommand()
{
  while (Serial.available() > 0)
  {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r')
    {
      inputBuffer.trim();
      if (inputBuffer.length() > 0)
      {
        inputBuffer.toUpperCase();
        executeCommand(inputBuffer);
        inputBuffer = "";
      }
    }
    else
    {
      inputBuffer += c;
    }
  }
}

void executeCommand(String command)
{
  if (command == "START")
  {
    waitingForStuckBottleRemoval = false;
    if (isBinFull())
    {
      machineStarted = false;
      Serial.println("BIN:FULL");
      Serial.println("MACHINE:STOPPED");
      return;
    }

    if (!calibrated)
    {
      calibrateEmptyPipe();
    }

    if (calibrated)
    {
      machineStarted = true;
      metalDetectedForNextBottle = false;
      closeGate();
      Serial.println("MACHINE:STARTED");
    }
    else
    {
      machineStarted = false;
      Serial.println("ERROR:NOT_CALIBRATED");
    }
  }
  else if (command == "STOP")
  {
    machineStarted = false;
    metalDetectedForNextBottle = false;
    waitingForStuckBottleRemoval = false;
    closeGate();
    closeEntranceGate();
    Serial.println("MACHINE:STOPPED");
  }
  else if (command == "RESET")
  {
    machineStarted = false;
    metalDetectedForNextBottle = false;
    waitingForStuckBottleRemoval = false;
    closeGate();
    closeEntranceGate();
    Serial.println("RESET:OK");
  }
  else if (command == "CALIBRATE")
  {
    machineStarted = false;
    metalDetectedForNextBottle = false;
    closeGate();
    calibrateEmptyPipe();
  }
  else if (command == "CLEAR_CHAMBER" || command == "CLEAR" || command == "CLEARING" || command == "33")
  {
    Serial.println("CALIBRATION:CLEARING_CHAMBER");
    openGate();
    delay(2000);
    closeGate();
    delay(300);
    waitingForStuckBottleRemoval = false;
    Serial.println("CHAMBER:CLEARED");
    Serial.println("STATUS:READY");
  }
  else if (command == "STATUS")
  {
    Serial.print("STATUS:");
    Serial.print(calibrated ? "ONLINE" : "NOT_CALIBRATED");

    Serial.print(";EMPTY_DISTANCE:");
    Serial.print(emptyPipeDistanceCM);
    
    Serial.print(";METAL_PIN_STATE:");
    Serial.println(digitalRead(metalSensorPin));
  }
  else
  {
    Serial.println("ERROR:UNKNOWN_COMMAND");
  }
}

// ---------------- CALIBRATION ----------------
void calibrateEmptyPipe()
{
  Serial.println("CALIBRATION:START");

  calibrated = false;
  emptyPipeDistanceCM = -1;

  for (byte attempt = 1; attempt <= calibrationMaxAttempts; attempt++)
  {
    closeGate();
    delay(200);

    int readings[calibrationReadings];
    int validReadings = 0;

    for (byte i = 0; i < calibrationReadings; i++)
    {
      int distance = readDistanceCM();

      // Only accept true pipe depth readings (>= 10 cm) to filter out 5cm blind-zone/lip echoes
      if (distance >= 10 && distance <= maxSensorDistanceCM)
        readings[validReadings++] = distance;

      delay(25);
    }

    if (validReadings < 3)
    {
      // Chamber genuinely blocked near top (<10 cm)
      Serial.println("CALIBRATION:CLEARING_CHAMBER");
      openGate();
      delay(1500);
      closeGate();
      delay(500);
      Serial.println("CALIBRATION:RETRY");
      continue;
    }

    sortReadings(readings, validReadings);
    // Select true maximum empty distance (e.g. 36 cm)
    int measuredEmptyDistanceCM = readings[validReadings - 1];

    if (measuredEmptyDistanceCM < calibrationBlockedDistanceCM)
    {
      Serial.print("CALIBRATION:BLOCKED_DISTANCE_CM:");
      Serial.println(measuredEmptyDistanceCM);
      Serial.println("CALIBRATION:CLEARING_CHAMBER");
      openGate();
      delay(1500);
      closeGate();
      delay(500);
      Serial.println("CALIBRATION:RETRY");
      continue;
    }

    emptyPipeDistanceCM = measuredEmptyDistanceCM;
    calibrated = true;
    Serial.print("CALIBRATED:EMPTY_DISTANCE_CM:");
    Serial.println(emptyPipeDistanceCM);
    return;
  }

  closeGate();
  Serial.println("ERROR:CALIBRATION_FAILED");
}

// ---------------- BOTTLE PROCESS (STATIC SIZING AT REST) ----------------
void processIncomingBottle(bool metalDetected)
{
  Serial.println("IR:DETECTED_TRIGGER");

  bool settled = false;
  int closestBottleDistanceCM = -1;
  int maxDistanceChangeCM = 0;

  int lastDistance = -1;
  int stableCount = 0;

  unsigned long settleStart = millis();

  // 1. Wait for bottle to drop down completely
  while (millis() - settleStart < approachTimeoutMs)
  {
    int currentDistance = readDistanceCM();

    if (isMetalDetected())
    {
      metalDetected = true;
    }

    if (currentDistance > 0 && currentDistance <= maxSensorDistanceCM)
    {
      int changeCM = abs(emptyPipeDistanceCM - currentDistance);

      if (changeCM >= bottleDetectChangeCM)
      {
        if (closestBottleDistanceCM == -1 || currentDistance < closestBottleDistanceCM)
        {
          closestBottleDistanceCM = currentDistance;
          maxDistanceChangeCM = changeCM;
        }

        if (lastDistance != -1 && abs(currentDistance - lastDistance) <= 1)
        {
          stableCount++;
        }
        else
        {
          stableCount = 0;
        }

        lastDistance = currentDistance;

        if (stableCount >= 2)
        {
          settled = true;
          break;
        }
      }
    }

    delay(10);
  }

  if (closestBottleDistanceCM == -1)
  {
    Serial.println("ERROR:NO_BOTTLE_CHANGE");
    waitForBottomIRReset(); 
    return;
  }

  // ---------------- 2. WAITING FOR BOTTLE TO STOP AT GATE ----------------
  unsigned long waitStart = millis();
  while (millis() - waitStart < bottleSettleDelayMs)
  {
    if (isMetalDetected())
    {
      metalDetected = true;
    }
    delay(10);
  }

  // ---------------- 3. READ STATIC BOTTLE SIZE NOW ----------------
  bool topIsCurrentlyBlocked    = (digitalRead(irTopPin) == IR_DETECTED_STATE);
  bool middleIsCurrentlyBlocked = (digitalRead(irMiddlePin) == IR_DETECTED_STATE);

  const char* bottleSize = "SMALL";

  if (topIsCurrentlyBlocked) 
  {
    bottleSize = "LARGE";
  } 
  else if (middleIsCurrentlyBlocked) 
  {
    bottleSize = "MEDIUM";
  } 
  else 
  {
    bottleSize = "SMALL";
  }

  unsigned long measurementDurationMs = millis() - settleStart;

  // ---------------- HOLD BOTTLE FOR METAL CHECK (300ms Hold) ----------------
  unsigned long holdStart = millis();
  int metalHoldCount = 0;

  while (millis() - holdStart < gateHoldDurationMs)
  {
    if (isMetalDetected())
    {
      metalHoldCount++;
    }
    delay(10);
  }

  // ---------------- PHYSICAL SENSOR MATERIAL CLASSIFICATION ----------------
  const char* materialType = "PLASTIC";

  if (metalHoldCount >= 2)
  {
    // 1. SOLID METAL BODY AT REST (2+ samples during hold) = TIN / ALUMINIUM CAN
    materialType = "CAN";
  }
  else if (metalHoldCount == 1 || metalDetected)
  {
    // 2. INTERNAL FOIL TRANSIENT SIGNAL (1 hold sample or dynamic drop pulse) = TETRA PAK CARTON
    materialType = "TETRAPAK";
  }
  else
  {
    // 3. ZERO METAL DETECTED (0 samples) = PLASTIC PET BOTTLE
    materialType = "PLASTIC";
  }

  // ---------------- SEND RESULT TO SYSTEM ----------------
  Serial.print("SIZE:");
  Serial.print(bottleSize);

  Serial.print(";MATERIAL:");
  Serial.print(materialType);

  Serial.print(";METAL:");
  Serial.print(metalDetected ? "1" : "0");

  Serial.print(";SETTLED:");
  Serial.print(settled ? "1" : "0");

  Serial.print(";DURATION:");
  Serial.print(measurementDurationMs);

  Serial.print(";DISTANCE:");
  Serial.print(closestBottleDistanceCM);

  Serial.print(";CHANGE:");
  Serial.print(maxDistanceChangeCM);

  Serial.print(";EMPTY:");
  Serial.println(emptyPipeDistanceCM);

  delay(gateOpenDelayMs);

  // ---------------- OPEN MAIN GATE ----------------
  openGate();
  delay(500);

  // ---------------- WAIT FOR BOTTLE TO CLEAR ----------------
  bool cleared = waitForBottleClear(bottleSize);

  if (cleared)
  {
    Serial.println("BOTTLE:CLEARED");
  }
  else
  {
    Serial.println("ERROR:CLEAR_TIMEOUT");
    waitingForStuckBottleRemoval = true;
  }

  // ---------------- CLOSE MAIN GATE ----------------
  closeGate();
  delay(servoCloseDelayMs);

  delay(bottleProcessingDelayMs); 
  delay(resultCooldownMs);
}

// ---------------- CHECK BOTTLE CLEAR ----------------
bool waitForBottleClear(const char* bottleSize)
{
  unsigned long clearStart = millis();
  int consecutiveClearReadings = 0;

  while (millis() - clearStart < clearTimeoutMs)
  {
    int currentDistance = readDistanceCM();
    
    bool bottomClear = (digitalRead(irBottomPin) != IR_DETECTED_STATE);
    bool middleClear = (digitalRead(irMiddlePin) != IR_DETECTED_STATE);
    bool topClear = (digitalRead(irTopPin) != IR_DETECTED_STATE);
    bool sizeSensorClear = bottomClear;

    if (strcmp(bottleSize, "LARGE") == 0)
      sizeSensorClear = topClear && middleClear && bottomClear;
    else if (strcmp(bottleSize, "MEDIUM") == 0)
      sizeSensorClear = middleClear && bottomClear;

    if (currentDistance > 0)
    {
      // Distance is clear if it reaches/exceeds empty baseline (bottle dropped past sensor into bin)
      bool distanceIsClear = (currentDistance >= (emptyPipeDistanceCM - bottleDetectChangeCM));

      if (distanceIsClear && sizeSensorClear)
      {
        consecutiveClearReadings++;
      }
      else
      {
        consecutiveClearReadings = 0;
      }

      if (consecutiveClearReadings >= 3)
      {
        return true;
      }
    }

    delay(15);
  }

  return false;
}

// ---------------- WAIT FOR BOTTOM IR RESET ----------------
void waitForBottomIRReset()
{
  unsigned long startTime = millis();

  while (digitalRead(irBottomPin) == IR_DETECTED_STATE)
  {
    if (millis() - startTime > 1500)
    {
      Serial.println("ERROR:IR_BOTTOM_STUCK_DETECTED");
      break;
    }

    delay(10);
  }
}

// ---------------- HC-SR04 DISTANCE FUNCTION ----------------
int readDistanceCM()
{
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  unsigned long duration = pulseIn(echoPin, HIGH, echoTimeoutUs);

  if (duration == 0)
  {
    return -1;
  }

  int distance = duration / 58;

  if (distance <= 0 || distance > maxSensorDistanceCM)
  {
    return -1;
  }

  return distance;
}

// ---- ENTRANCE HC-SR04 DISTANCE FUNCTION ----
int readEntranceDistanceCM()
{
  digitalWrite(newTrigPin, LOW);
  delayMicroseconds(2);
  
  digitalWrite(newTrigPin, HIGH);
  delayMicroseconds(10);
  
  digitalWrite(newTrigPin, LOW);

  unsigned long duration = pulseIn(newEchoPin, HIGH, 15000); 

  if (duration == 0)
  {
    return -1;
  }

  int distance = duration / 58;
  return distance;
}

// ---------------- MEDIAN SORT ----------------
void sortReadings(int readings[], int count)
{
  for (int i = 0; i < count - 1; i++)
  {
    for (int j = i + 1; j < count; j++)
    {
      if (readings[j] < readings[i])
      {
        int temp = readings[i];
        readings[i] = readings[j];
        readings[j] = temp;
      }
    }
  }
}
