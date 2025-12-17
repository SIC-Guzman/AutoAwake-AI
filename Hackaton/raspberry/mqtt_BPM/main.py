import asyncio
import json
import ssl
import os
from datetime import datetime
from threading import Thread
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
from bleak import BleakClient

load_dotenv()

# MQTT Config
BROKER = os.getenv("MQTT_BROKER", "")
PORT = int(os.getenv("MQTT_PORT", 8883))
USERNAME = os.getenv("MQTT_USER", "")
PASSWORD = os.getenv("MQTT_PASSWORD", "")
TOPIC_BPM = "autoawake/bpm"

# Device Config
DEVICE_ADDRESS = "CD:E9:FE:16:BA:CC"
UUID_UART_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9d"
UUID_UART_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9d"
CMD_START = bytes.fromhex("cd000712012400020001")

dato_recibido = asyncio.Event()

class MQTTService:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        
        if USERNAME and PASSWORD:
            self.client.username_pw_set(USERNAME, PASSWORD)

        if PORT == 8883:
            self.client.tls_set(cert_reqs=ssl.CERT_NONE)
            self.client.tls_insecure_set(True)

        self.client.on_connect = self.on_connect
        
        try:
            self.client.connect(BROKER, PORT, 60)
            self.loop_thread = Thread(target=self.client.loop_forever, daemon=True)
            self.loop_thread.start()
        except Exception as e:
            print(f"[MQTT] Connection Error: {e}")

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("[MQTT] Connected successfully")
        else:
            print(f"[MQTT] Connection failed with code {rc}")

    def publicar_bpm(self, bpm):
        payload = {
            "trip_id": 1,
            "timestamp": datetime.now().isoformat(),
            "bpm": bpm
        }
        self.client.publish(TOPIC_BPM, json.dumps(payload))
        print(f"[MQTT] Published BPM: {bpm}")

mqtt_service = MQTTService()

def notification_handler(sender, data):
    try:
        bpm = data[-1]
        if 30 < bpm < 220:
            mqtt_service.publicar_bpm(bpm)
            dato_recibido.set()
    except Exception:
        pass

async def correr_monitoreo(client):
    while True:
        try:
            dato_recibido.clear()
            await client.write_gatt_char(UUID_UART_TX, CMD_START)
            
            # Wait for valid data from watch
            await asyncio.wait_for(dato_recibido.wait(), timeout=15.0)
            
            # Production delay
            await asyncio.sleep(2)
            
        except asyncio.TimeoutError:
            continue
        except Exception as e:
            print(f"[BLE] Cycle Error: {e}")
            break

async def main():
    print(f"Starting service for device: {DEVICE_ADDRESS}")
    while True:
        try:
            async with BleakClient(DEVICE_ADDRESS) as client:
                print(f"[BLE] Connected to {DEVICE_ADDRESS}")
                await client.start_notify(UUID_UART_RX, notification_handler)
                await correr_monitoreo(client)
        except Exception as e:
            print(f"[BLE] Connection Error: {e}. Retrying in 5s...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Service stopped by user")