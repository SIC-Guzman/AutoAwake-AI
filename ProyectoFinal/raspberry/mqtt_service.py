# mqtt_service.py
import paho.mqtt.client as mqtt
import json
import ssl
import os
from threading import Thread
from dotenv import load_dotenv

load_dotenv()

BROKER = os.getenv("MQTT_BROKER", "")
PORT = int(os.getenv("MQTT_PORT", 8883))
USERNAME = os.getenv("MQTT_USER", "")
PASSWORD = os.getenv("MQTT_PASSWORD", "")
TOPIC_ALERTS = os.getenv("MQTT_TOPIC_ALERTS", "autoawake/alerts")
TOPIC_CONTROL = os.getenv("MQTT_TOPIC_CONTROL", "autoawake/control")

class MQTTHandler:
    def __init__(self):
        self.client = mqtt.Client()
        if USERNAME and PASSWORD:
            self.client.username_pw_set(USERNAME, PASSWORD)        

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        if PORT == 8883:
            self.client.tls_set(cert_reqs=ssl.CERT_NONE)
            self.client.tls_insecure_set(True)

        self.client_thread = Thread(target=self._start_loop, daemon=True)
        self.client.connect(BROKER, PORT, 60)
        print("[MQTT] Connecting to broker...")
        self.client_thread.start()
        print("[MQTT] Client loop started.")

    def _start_loop(self):
        self.client.loop_forever()

    def on_connect(self, client, userdata, flags, rc):
        print(f"[MQTT] Connected with result code {rc}")
        client.subscribe(TOPIC_CONTROL)

    def on_message(self, client, userdata, msg):
        print(f"[MQTT] Received control command on {msg.topic}: {msg.payload.decode()}")

    def publish_alert(self, trip_id, alert_type, severity, message):
        alert_data = {
            "trip_id": trip_id,
            "alert_type": alert_type,
            "severity": severity,
            "message": message
        }
        self.client.publish(TOPIC_ALERTS, json.dumps(alert_data))
        print(f"[MQTT] Published alert: {alert_data} to topic {TOPIC_ALERTS}")

# Crear una instancia global para importar en main.py
mqtt_handler = MQTTHandler()
