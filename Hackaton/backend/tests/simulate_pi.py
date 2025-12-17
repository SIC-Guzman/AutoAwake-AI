import json
import time
import threading
import ssl

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

from core.config import settings

load_dotenv()

# Configuration
BROKER = settings.mqtt_broker
PORT = settings.mqtt_port
USERNAME = settings.mqtt_user or ""
PASSWORD = settings.mqtt_password or ""
TOPIC_ALERTS = settings.mqtt_topic_alerts
TOPIC_CONTROL = settings.mqtt_topic_control

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT Broker with result code {rc}")
    client.subscribe(TOPIC_CONTROL)

def on_message(client, userdata, msg):
    print(f"Received control command on {msg.topic}: {msg.payload.decode()}")

client = mqtt.Client()

if USERNAME and PASSWORD:
    client.username_pw_set(USERNAME, PASSWORD)

if PORT == 8883:
    client.tls_set(cert_reqs=ssl.CERT_NONE)
    client.tls_insecure_set(True)

client.on_connect = on_connect
client.on_message = on_message

def start_simulation():
    try:
        client.connect(BROKER, PORT, 60)
        client.loop_start()
        
        # Simulate sending an alert
        alert_data = {
            "trip_id": 1,
            "alert_type": "DROWSINESS",
            "severity": "HIGH",
            "message": "Test Alert from Simulation"
        }
        client.publish(TOPIC_ALERTS, json.dumps(alert_data))
        print(f"Published alert: {alert_data}")
        
        # Keep running to receive control commands
        while True:
            time.sleep(1)
            
    except Exception as e:
        print(f"Simulation error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    start_simulation()
