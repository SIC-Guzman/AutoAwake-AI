import os
from typing import Any, Dict

import requests

from database.autoawake_db import Database


class TelegramService:
    def __init__(self) -> None:
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.base_url = (
            f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            if self.bot_token
            else None
        )

    def is_configured(self) -> bool:
        return bool(self.bot_token and self.chat_id and self.base_url)

    def _build_alert_message(
        self,
        alert_type: str,
        severity: str,
        message: str,
        trip_id: int,
        context: Dict[str, Any],
    ) -> str:
        driver_name = context.get("driver_name")
        vehicle_plate = context.get("vehicle_plate")

        lines = [
            "Alerta activada en AutoAwakeAI",
            f"Tipo: {alert_type}",
            f"Severidad: {severity}",
            f"Mensaje: {message}",
            f"Viaje ID: {trip_id}",
        ]

        if driver_name:
            lines.append(f"Conductor: {driver_name}")
        if vehicle_plate:
            lines.append(f"Vehiculo: {vehicle_plate}")

        return "\n".join(lines)

    def _get_trip_context(self, db: Database, trip_id: int) -> Dict[str, Any]:
        """
        Retrieve driver/vehicle info to enrich the Telegram message.
        """
        try:
            row = db.fetch_one(
                """
                SELECT 
                    t.trip_id,
                    t.driver_id,
                    t.vehicle_id,
                    CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
                    v.plate AS vehicle_plate
                FROM trips t
                JOIN drivers d ON d.driver_id = t.driver_id
                JOIN vehicles v ON v.vehicle_id = t.vehicle_id
                WHERE t.trip_id = %s
                LIMIT 1
                """,
                (trip_id,),
            )
            return row or {}
        except Exception as exc:
            print(f"Error fetching trip context for Telegram: {exc}")
            return {}

    def send_alert(
        self,
        db: Database,
        alert_type: str,
        severity: str,
        message: str,
        trip_id: int,
    ) -> None:
        """
        Sends a Telegram notification when an alert is recorded.
        """
        if not self.is_configured():
            print("Telegram not configured; skipping notification.")
            return

        context = self._get_trip_context(db, trip_id)
        text = self._build_alert_message(alert_type, severity, message, trip_id, context)

        payload = {"chat_id": self.chat_id, "text": text}

        try:
            resp = requests.post(self.base_url, json=payload, timeout=10)
            if resp.status_code >= 300:
                print(f"Failed to send Telegram alert [{resp.status_code}]: {resp.text}")
        except Exception as exc:
            print(f"Error sending Telegram alert: {exc}")


telegram_service = TelegramService()
