import json
import os
import threading
import paho.mqtt.client as mqtt
from database.autoawake_db import Database, log_alert
from utils.db_instance import get_db_instance
from services.telegram_service import telegram_service

import ssl

class MQTTService:
    def __init__(self):
        self.broker = os.getenv("MQTT_BROKER", "localhost")
        self.port = int(os.getenv("MQTT_PORT", 1883))
        self.username = os.getenv("MQTT_USER")
        self.password = os.getenv("MQTT_PASSWORD")
        self.topic_alerts = "autoawake/alerts"
        self.topic_control = "autoawake/control"
        
        self.client = mqtt.Client()
        
        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)
            
        if self.port == 8883:
            self.client.tls_set(cert_reqs=ssl.CERT_NONE)
            self.client.tls_insecure_set(True)
            
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.db = Database() # Create a dedicated DB instance for the service

    def on_connect(self, client, userdata, flags, rc):
        conn_codes = {
            0: "Connection accepted",
            1: "Connection refused, unacceptable protocol version",
            2: "Connection refused, identifier rejected",
            3: "Connection refused, server unavailable",
            4: "Connection refused, bad user name or password",
            5: "Connection refused, not authorized"
        }
        print(f"MQTT Connected with result code {rc}: {conn_codes.get(rc, 'Unknown error')}")
        if rc == 0:
            client.subscribe(self.topic_alerts)

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            print(f"Received message on {msg.topic}: {payload}")
            
            if msg.topic == self.topic_alerts:
                self.handle_alert(payload)
                
        except Exception as e:
            print(f"Error processing message: {e}")

    def handle_alert(self, payload):
        try:
            # Expected payload: {"trip_id": 1, "alert_type": "DROWSINESS", "severity": "HIGH", "message": "Driver is drowsy"}
            trip_id = payload.get("trip_id")
            alert_type = payload.get("alert_type")
            severity = payload.get("severity")
            message = payload.get("message")

            if all([trip_id, alert_type, severity, message]):
                log_alert(self.db, trip_id, alert_type, severity, message)
                telegram_service.send_alert(
                    self.db,
                    alert_type,
                    severity,
                    message,
                    trip_id,
                )
                print(f"Alert logged: {message}")
            else:
                print("Incomplete alert data")

        except Exception as e:
            print(f"Error saving alert to DB: {e}")

    def publish_control(self, action: str):
        """
        Publishes a control command to the Raspberry Pi.
        Example action: "buzzer_on", "buzzer_off"
        """
        payload = json.dumps({"action": action})
        self.client.publish(self.topic_control, payload)
        print(f"Published control command: {action}")

    def start(self):
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            print("MQTT Service started")
        except Exception as e:
            print(f"Failed to connect to MQTT broker: {e}")

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()
        print("MQTT Service stopped")

mqtt_service = MQTTService()
