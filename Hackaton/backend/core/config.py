from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List


def _split_csv(value: str) -> List[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


@dataclass
class Settings:
    # Database
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "3306"))
    db_user: str = os.getenv("DB_USER", "autoawake_user")
    db_pass: str = os.getenv("DB_PASS", "super_secret")
    db_name: str = os.getenv("DB_NAME", "AutoAwakeAI")

    # Auth
    auth_disable: bool = os.getenv("DISABLE_AUTH", "").lower() in ("1", "true", "yes")

    # MQTT
    mqtt_broker: str = os.getenv("MQTT_BROKER", "localhost")
    mqtt_port: int = int(os.getenv("MQTT_PORT", "1883"))
    mqtt_user: str | None = os.getenv("MQTT_USER")
    mqtt_password: str | None = os.getenv("MQTT_PASSWORD")
    mqtt_topic_alerts: str = os.getenv("MQTT_TOPIC_ALERTS", "autoawake/alerts")
    mqtt_topic_control: str = os.getenv("MQTT_TOPIC_CONTROL", "autoawake/control")

    # Telegram
    telegram_bot_token: str | None = os.getenv("TELEGRAM_BOT_TOKEN")
    telegram_chat_id: str | None = os.getenv("TELEGRAM_CHAT_ID")

    # API
    cors_origins: List[str] = field(
        default_factory=lambda: _split_csv(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:5173,http://localhost:3000",
            )
        )
    )


settings = Settings()
