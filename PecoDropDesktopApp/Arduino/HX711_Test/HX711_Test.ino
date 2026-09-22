#include <Arduino.h>
#include <util/atomic.h>

// Standalone Arduino Mega + HX711 test. No extra library required.
// HX711 DOUT/DT -> Mega 37, SCK/CLK -> Mega 38, GND -> Mega GND.
// Power the HX711 according to its board specification.
// Serial Monitor: 115200 baud. Send T with the platform empty to tare.
// This test reports raw ADC counts, NOT grams; no scale factor is assumed.
const byte HX_DOUT = 37;
const byte HX_SCK = 38;
const unsigned long READY_TIMEOUT_MS = 1500UL;

long tareRaw = 0;
bool tareValid = false;
bool tareRequested = false;

bool readRaw(long& raw) {
  unsigned long started = millis();
  while (digitalRead(HX_DOUT) == HIGH) {
    if (millis() - started >= READY_TIMEOUT_MS) {
      Serial.println(F("ERROR:NOT_READY DOUT stayed HIGH; check power, GND, DT and SCK"));
      return false;
    }
    delay(1);
  }

  uint32_t bits = 0;
  for (byte i = 0; i < 24; i++) {
    // Keep clock HIGH short even when serial/timer interrupts are pending.
    ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
      digitalWrite(HX_SCK, HIGH);
      delayMicroseconds(1);
      bits = (bits << 1) | digitalRead(HX_DOUT);
      digitalWrite(HX_SCK, LOW);
    }
    delayMicroseconds(1);
  }

  // The 25th clock selects channel A, gain 128.
  ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
    digitalWrite(HX_SCK, HIGH);
    delayMicroseconds(1);
    digitalWrite(HX_SCK, LOW);
  }
  delayMicroseconds(1);
  if (digitalRead(HX_DOUT) != HIGH) {
    Serial.println(F("ERROR:PROTOCOL DOUT did not rise after 25 clocks; check module and DT/SCK"));
    return false;
  }

  // Convert the unsigned 24-bit word to signed counts without hiding negatives.
  raw = (bits & 0x800000UL) ? (long)bits - 16777216L : (long)bits;
  return true;
}

void setup() {
  Serial.begin(115200);
  digitalWrite(HX_SCK, LOW);
  pinMode(HX_SCK, OUTPUT);
  // A disconnected DT wire should report NOT_READY instead of floating.
  pinMode(HX_DOUT, INPUT_PULLUP);

  // Deliberate reset: HIGH >60 us, then LOW and allow conversion settling.
  digitalWrite(HX_SCK, HIGH);
  delayMicroseconds(80);
  digitalWrite(HX_SCK, LOW);
  delay(500);

  Serial.println(F("HX711_TEST_V1 MEGA DT=37 SCK=38 BAUD=115200"));
  Serial.println(F("Raw counts only. Send T with no load to tare; then apply a load."));
}

void loop() {
  while (Serial.available()) {
    char command = Serial.read();
    if (command == 't' || command == 'T') tareRequested = true;
  }

  long raw;
  if (readRaw(raw)) {
    if (tareRequested) {
      tareRaw = raw;
      tareValid = true;
      tareRequested = false;
      Serial.print(F("TARE_RAW=")); Serial.println(tareRaw);
    }
    Serial.print(F("RAW=")); Serial.print(raw);
    Serial.print(F(" HEX=0x"));
    Serial.print((uint32_t)raw & 0xFFFFFFUL, HEX);
    if (tareValid) {
      Serial.print(F(" DELTA=")); Serial.print(raw - tareRaw);
    }
    if (raw == -1) Serial.print(F(" ALL_BITS_HIGH; persistent -1 needs investigation"));
    if (raw == 8388607L || raw == -8388608L) {
      Serial.print(F(" ADC_LIMIT; check load cell input connections and loading"));
    }
    Serial.println();
  }
  delay(500);
}
