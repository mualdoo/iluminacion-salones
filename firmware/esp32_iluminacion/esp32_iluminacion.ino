/*
 * Fase 7 - Iluminación de salones: ESP32 <-> Supabase (Edge Function esp32-sync)
 *
 * loop()      -> sensores y LED (nunca espera a la red)
 * networkTask -> WiFi + HTTPS en una tarea FreeRTOS aparte
 *
 * Librerías: WiFi, WiFiClientSecure, HTTPClient (core ESP32) y ArduinoJson 7.
 * Monitor Serial: 115200 baudios.
 */
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "secrets.h"   // Copia secrets.example.h como secrets.h

// ===================== PINES =====================
constexpr uint8_t PIN_LDR = 34;  // ADC1. No usar ADC2: choca con el WiFi
constexpr uint8_t PIN_PIR = 27;
constexpr uint8_t PIN_LED = 26;

// ================ CALIBRACIÓN LDR ================
// Reemplaza con lo que imprima el Monitor Serial (campo "raw").
constexpr int LDR_RAW_DARK   = 4095;   // sensor tapado           -> 0 u.r.
constexpr int LDR_RAW_BRIGHT = 0;  // iluminación más intensa -> 1000 u.r.
// Si tu divisor da un raw MENOR con más luz, basta con que DARK > BRIGHT.
static_assert(LDR_RAW_DARK != LDR_RAW_BRIGHT, "La calibración del LDR no puede ser igual");
constexpr int LDR_SAMPLES = 20;

// =================== TIEMPOS =====================
constexpr uint32_t PIR_WARMUP_MS      = 60000;  // estabilización HC-SR501
constexpr uint32_t SENSOR_PERIOD_MS   = 200;
constexpr uint32_t LOG_PERIOD_MS      = 2000;
constexpr uint32_t TELEMETRY_MS       = 10000;
constexpr uint32_t MIN_SYNC_GAP_MS    = 2000;   // mínimo entre envíos inmediatos
constexpr uint32_t RETRY_MS           = 5000;
constexpr uint32_t WIFI_RETRY_MS      = 10000;
constexpr uint32_t AUTO_MIN_STATE_MS  = 3000;   // anti-parpadeo
constexpr uint32_t AUTO_HOLD_MS = 30000;  // 30 s encendido tras el último movimiento
constexpr float    LIGHT_HYSTERESIS   = 40.0f;  // u.r.
constexpr uint16_t HTTP_TIMEOUT_MS    = 10000;

// ===================== TLS =======================
// nullptr = setInsecure(): cifra la conexión pero NO verifica la identidad del
// servidor, así que alguien en la red podría suplantarlo y capturar el token.
// Aceptable solo para el prototipo académico. Para verificarlo, pega aquí el
// certificado raíz (PEM) de tu dominio *.supabase.co.
const char* ROOT_CA = nullptr;

// =============== ESTADO COMPARTIDO ===============
// Todo lo de este bloque se lee y escribe con stateMutex tomado.
constexpr size_t MAX_ACKS = 20;

struct Ack {
  char id[37];
  bool failed;
};

SemaphoreHandle_t stateMutex;
float    lightThreshold = 500.0f;  // valores por defecto si aún no hay red
bool     automaticMode  = true;
bool     ledOn          = false;
int      lightValue     = 0;
int      lightRaw       = 0;
int      motionValue    = 0;
bool     pirReady       = false;
bool     sensorsReady   = false;
bool     syncRequested  = false;   // pide un envío inmediato con lecturas
uint32_t ledChangedAt   = 0;
Ack      acks[MAX_ACKS];
size_t   ackCount       = 0;

struct Lock {
  Lock()  { xSemaphoreTake(stateMutex, portMAX_DELAY); }
  ~Lock() { xSemaphoreGive(stateMutex); }
};

uint32_t lastMotionAt = 0;
bool     motionSeen   = false;

// ================= LED Y SENSORES ================
void setLed(bool on, const char* reason) {  // requiere Lock
  if (on == ledOn) return;
  ledOn = on;
  ledChangedAt = millis();
  digitalWrite(PIN_LED, on ? HIGH : LOW);
  Serial.printf("[LED] %s (%s)\n", on ? "ENCENDIDO" : "APAGADO", reason);
}

void applyAutomatic(bool ignoreMinTime) {  // requiere Lock
  if (!automaticMode || !sensorsReady) return;

  bool wanted = ledOn;
  const bool occupied = motionSeen && (millis() - lastMotionAt < AUTO_HOLD_MS);
  if (!pirReady || !occupied)                            wanted = false;
  else if (lightValue < lightThreshold)                  wanted = true;
  else if (lightValue >= lightThreshold + LIGHT_HYSTERESIS) wanted = false;
  // Entre umbral y umbral+histéresis se conserva el estado.

  if (wanted == ledOn) return;
  if (!ignoreMinTime && ledChangedAt != 0 && millis() - ledChangedAt < AUTO_MIN_STATE_MS) return;
  setLed(wanted, "automatico");
}

int readLdrRaw() {
  uint32_t sum = 0;
  for (int i = 0; i < LDR_SAMPLES; i++) {
    sum += analogRead(PIN_LDR);
    delayMicroseconds(250);  // ~5 ms en total
  }
  return sum / LDR_SAMPLES;
}

int rawToLight(int raw) {
  long v = (long)(raw - LDR_RAW_DARK) * 1000L / (LDR_RAW_BRIGHT - LDR_RAW_DARK);
  return constrain(v, 0L, 1000L);
}

void updateSensors() {
  const int raw = readLdrRaw();
  const bool ready = millis() >= PIR_WARMUP_MS;
  const int motion = (ready && digitalRead(PIN_PIR) == HIGH) ? 1 : 0;

  Lock lock;
  lightRaw = raw;
  lightValue = rawToLight(raw);
  if (ready && !pirReady) {
    pirReady = true;
    syncRequested = true;
    Serial.println("[PIR] Sensor estabilizado");
  }
  if (motion != motionValue) {
    motionValue = motion;
    syncRequested = true;
    Serial.printf("[PIR] Movimiento: %d\n", motion);
  }

  if (motion == 1) {
    lastMotionAt = millis();
    motionSeen = true;
  }

  sensorsReady = true;
  applyAutomatic(false);
}

// ==================== COMANDOS ===================
bool alreadyHandled(const char* id) {  // requiere Lock
  for (size_t i = 0; i < ackCount; i++) {
    if (strcmp(acks[i].id, id) == 0) return true;
  }
  return false;
}

void processCommand(JsonObjectConst cmd) {  // requiere Lock
  const char* id    = cmd["id"] | "";
  const char* type  = cmd["command_type"] | "";
  const char* value = cmd["value"] | "";

  if (strlen(id) != 36 || alreadyHandled(id)) return;
  if (ackCount >= MAX_ACKS) return;  // volverá a llegar en otro ciclo

  const bool isOn = strcmp(value, "on") == 0;
  const bool valid = strcmp(type, "set_light") == 0 && (isOn || strcmp(value, "off") == 0);
  const bool ok = valid && !automaticMode;

  if (ok) {
    setLed(isOn, "comando");
    Serial.printf("[CMD] %s set_light=%s -> executed\n", id, value);
  } else {
    Serial.printf("[CMD] %s -> failed (%s)\n", id,
                  valid ? "modo automatico activo" : "comando no soportado");
  }
  strlcpy(acks[ackCount].id, id, sizeof(acks[ackCount].id));
  acks[ackCount].failed = !ok;
  ackCount++;
}

bool applyResponse(const String& payload, bool firstSync) {
  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.printf("[NET] JSON invalido: %s\n", err.c_str());
    return false;
  }
  JsonObjectConst config = doc["config"];
  if (!config["light_threshold"].is<float>() || !config["automatic_mode"].is<bool>()) {
    Serial.println("[NET] Respuesta sin configuracion valida");
    return false;
  }
  JsonArrayConst commands = doc["commands"];

  Lock lock;
  // La configuración se aplica ANTES que los comandos del mismo ciclo.
  const float newThreshold = config["light_threshold"];
  const bool  newMode      = config["automatic_mode"];
  const bool  changed      = newThreshold != lightThreshold || newMode != automaticMode;
  lightThreshold = newThreshold;
  automaticMode  = newMode;
  if (changed) {
    Serial.printf("[CFG] modo=%s umbral=%.0f\n",
                  automaticMode ? "AUTO" : "MANUAL", lightThreshold);
    applyAutomatic(true);
  }

  // Tras un reinicio en modo manual, recupera el último estado confirmado.
  if (firstSync && !automaticMode && commands.size() == 0) {
    const char* last = doc["last_executed_value"] | "";
    if (strlen(last) > 0) setLed(strcmp(last, "on") == 0, "estado recuperado");
  }

  for (JsonObjectConst cmd : commands) processCommand(cmd);
  return true;
}

// ====================== RED ======================
WiFiClientSecure tlsClient;
HTTPClient http;

bool syncWithServer(bool includeReadings, bool firstSync) {
  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  size_t sentAcks = 0;
  {
    Lock lock;
    if (includeReadings && sensorsReady) {
      doc["light"] = lightValue;
      if (pirReady) doc["motion"] = motionValue;  // no enviar durante el warm-up
    }
    JsonArray executed = doc["executed_command_ids"].to<JsonArray>();
    JsonArray failed = doc["failed_command_ids"].to<JsonArray>();
    sentAcks = ackCount;
    for (size_t i = 0; i < sentAcks; i++) {
      (acks[i].failed ? failed : executed).add(acks[i].id);
    }
  }
  String body;
  serializeJson(doc, body);

  if (!http.begin(tlsClient, String(SUPABASE_URL) + "/functions/v1/esp32-sync")) {
    Serial.println("[NET] No se pudo iniciar HTTPS");
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);

  const uint32_t started = millis();
  const int code = http.POST(body);
  if (code <= 0) {
    Serial.printf("[NET] Error de conexion: %s\n", HTTPClient::errorToString(code).c_str());
    http.end();
    tlsClient.stop();
    return false;
  }
  const String payload = http.getString();
  http.end();  // con setReuse(true) conserva la conexión si el servidor lo permite
  Serial.printf("[NET] HTTP %d en %lu ms\n", code, (unsigned long)(millis() - started));

  if (code != 200) {
    Serial.printf("[NET] %s\n", payload.c_str());
    return false;
  }

  // HTTP 200: el servidor ya registró las confirmaciones enviadas. Se quitan
  // antes de procesar la respuesta (las nuevas se agregan al final).
  {
    Lock lock;
    memmove(acks, acks + sentAcks, (ackCount - sentAcks) * sizeof(Ack));
    ackCount -= sentAcks;
  }
  return applyResponse(payload, firstSync);
}

void networkTask(void*) {
  uint32_t lastWifiAttempt = 0;
  uint32_t lastAttempt = 0;
  uint32_t lastTelemetry = 0;
  bool wasConnected = false;
  bool everSynced = false;
  bool lastFailed = false;

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  if (ROOT_CA != nullptr) tlsClient.setCACert(ROOT_CA);
  else                    tlsClient.setInsecure();
  tlsClient.setHandshakeTimeout(10);  // segundos
  http.setReuse(true);
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);

  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(100));
    const uint32_t now = millis();

    if (WiFi.status() != WL_CONNECTED) {
      if (wasConnected) {
        Serial.println("[WIFI] Conexion perdida");
        tlsClient.stop();
        wasConnected = false;
      }
      if (lastWifiAttempt == 0 || now - lastWifiAttempt >= WIFI_RETRY_MS) {
        lastWifiAttempt = now;
        Serial.printf("[WIFI] Conectando a %s...\n", WIFI_SSID);
        WiFi.disconnect();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
      continue;
    }
    if (!wasConnected) {
      wasConnected = true;
      Serial.printf("[WIFI] Conectado. IP %s, RSSI %d dBm\n",
                    WiFi.localIP().toString().c_str(), WiFi.RSSI());
    }

    bool ready, eventPending, acksPending;
    {
      Lock lock;
      ready = sensorsReady;
      eventPending = syncRequested;
      acksPending = ackCount > 0;
    }
    if (!ready) continue;

    const uint32_t gap = lastFailed ? RETRY_MS : MIN_SYNC_GAP_MS;
    if (lastAttempt != 0 && now - lastAttempt < gap) continue;

    const bool periodic = lastTelemetry == 0 || now - lastTelemetry >= TELEMETRY_MS;
    if (!periodic && !eventPending && !acksPending) continue;

    // Un envío solo de confirmaciones no genera filas en measurements.
    const bool includeReadings = periodic || eventPending;
    if (includeReadings) {
      Lock lock;
      syncRequested = false;
    }

    lastAttempt = now;
    const bool ok = syncWithServer(includeReadings, !everSynced);
    lastFailed = !ok;
    if (ok) {
      everSynced = true;
      if (includeReadings) lastTelemetry = now;
    } else if (includeReadings) {
      Lock lock;
      syncRequested = true;
    }
  }
}

// ================= SETUP / LOOP ==================
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== Iluminacion de salones - Fase 7 ===");

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);
  pinMode(PIN_PIR, INPUT_PULLDOWN);  // sin sensor conectado lee 0
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_LDR, ADC_11db);

  Serial.printf("[PIR] Estabilizando %lu s...\n", (unsigned long)(PIR_WARMUP_MS / 1000));

  stateMutex = xSemaphoreCreateMutex();
  if (stateMutex == nullptr ||
      xTaskCreatePinnedToCore(networkTask, "net", 12288, nullptr, 1, nullptr, 0) != pdPASS) {
    Serial.println("[ERROR] Sin memoria; reiniciando");
    delay(2000);
    ESP.restart();
  }
}

void loop() {
  static uint32_t lastSensor = 0;
  static uint32_t lastLog = 0;
  const uint32_t now = millis();

  if (now - lastSensor >= SENSOR_PERIOD_MS) {
    lastSensor = now;
    updateSensors();
  }
  if (now - lastLog >= LOG_PERIOD_MS) {
    lastLog = now;
    Lock lock;
    Serial.printf("[SENS] raw=%d luz=%d mov=%d%s | %s umbral=%.0f | LED=%s\n",
                  lightRaw, lightValue, motionValue, pirReady ? "" : "(warm-up)",
                  automaticMode ? "AUTO" : "MANUAL", lightThreshold, ledOn ? "ON" : "OFF");
  }
  delay(5);  // cede CPU
}
