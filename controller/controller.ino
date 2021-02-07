#include <ArduinoHttpClient.h>
#include <WiFi101.h>
#include <ArduinoJson.h>
#include "arduino_secrets.h"
#include <numeric>

char serverAddress[] = "172.21.11.20";
int port = 3000;
char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;
const int POWER_PIN = 5;
const int CURRENT_PIN = A0;

WiFiClient wifi;
WebSocketClient client = WebSocketClient(wifi, serverAddress, port);
int status = WL_IDLE_STATUS;
int count = 0;
char address[42];
StaticJsonDocument<300> doc;

class RMS
{
public:

  typedef void (*callback_t)(int value);

  RMS(callback_t callback)
  :callback(callback)
  {
    for (float& value:dcValues)
    {
      value = NAN;
    }
  }

  void sample()
  {
    unsigned long time = millis();
    unsigned long elapsed = time - lastSample;
    if (lastSample != 0 && elapsed < sampleInterval)
    {
      delay(sampleInterval - elapsed);
    }
    lastSample = millis();
    int value = analogRead(CURRENT_PIN);
    if (value < 0 || value > 4096)
    {
      Serial.println("invalid read");
      Serial.println(value);
      return;
    }
    min = std::min(min, value);
    max = std::max(max, value);
    sum += value;
    value -= dcOffset;
    sumSquared += value * value;
    sampleCount++;
    if (sampleCount >= sampleLength)
    {
      calculate();
    }
  }

private:
  static constexpr int sampleInterval = 2;
  static constexpr int sampleLength = 5000 / sampleInterval;
  static constexpr int dcSize = 5;
  callback_t callback;
  float dcValues[dcSize];
  int min = 4096;
  int max = 0;
  int dcOffset = 0;
  int dcIndex = 0;
  int sampleCount = 0;
  float sum = 0;
  float sumSquared = 0;
  unsigned long lastSample = 0;

  void calculate()
  {
    bool valid = !isnan(dcValues[dcIndex]);
    dcValues[dcIndex] = sum / sampleCount;
    dcIndex = (dcIndex + 1) % dcSize;
    dcOffset = round(std::accumulate(dcValues, dcValues + dcSize, 0) / 5);
    if (valid)
    {
      callback(round(sqrt(sumSquared/sampleCount)));
    }
    sampleCount = 0;
    sum = 0;
    sumSquared = 0;
    min = 4096;
    max = 0;    
  }
};

void setup() {
  pinMode(POWER_PIN, OUTPUT);
  analogReadResolution(12);
  digitalWrite(POWER_PIN, HIGH);
  WiFi.setPins(8,7,4,2);
  Serial.begin(9600);
  while ( status != WL_CONNECTED) {
    status = WiFi.begin(ssid, pass);
  }
  byte mac[6];
  WiFi.macAddress(mac);
  sprintf(address, "/api/v1/power/controller?mac=%02X%02X%02X%02X%02X%02X", mac[5], mac[4], mac[3], mac[2], mac[1], mac[0]);
}

void loop() {
  Serial.println("starting WebSocket client");
  client.begin(address);
  RMS rms([](int value)
  {
    doc.clear();
    doc["current"] = value;
    client.beginMessage(TYPE_TEXT);
    serializeJson(doc, client);
    client.endMessage();
  });
  
  while (client.connected()) {
    rms.sample();

    // check if a message is available to be received
    int messageSize = client.parseMessage();
    if (messageSize > 0) {
      deserializeJson(doc, client);
      bool power = doc["power"];
      digitalWrite(POWER_PIN, power ? HIGH : LOW);
    }
  }

  Serial.println("disconnected");
}
