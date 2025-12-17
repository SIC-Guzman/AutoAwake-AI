# AutoAwake-AI — Monitor de BPM vía BLE + MQTT

Con este archivo se conecta un reloj/sensor Bluetooth Low Energy (BLE) que expone un servicio tipo UART, lee el ritmo cardiaco (BPM) desde sus notificaciones y publica esos datos en un broker MQTT. Está pensado para ejecutar de forma continua y confiable en Windows (en linux probablemente toca cambiar las librerias), con reconexiones automáticas del dispositivo BLE y publicación segura por TLS cuando el broker usa el puerto 8883.

## Descripción
- **BLE**: Se conecta al dispositivo en la dirección `CD:E9:FE:16:BA:CC` y escucha notificaciones en `UUID_UART_RX`. Envía el comando de inicio al `UUID_UART_TX` para solicitar mediciones.
- **MQTT**: Publica cada BPM válido (entre 30 y 220) en el tópico `autoawake/bpm` como JSON: `{ timestamp, bpm }`.
- **Robustez**: Reintenta la conexión BLE; espera datos con `asyncio` y usa un hilo para la conexión MQTT.

## Requisitos
- **Sistema**: Windows con Bluetooth activado.
- **Python**: 3.10 o superior.
- **Dependencias**: Definidas en [requirements.txt](requirements.txt).
- **Broker MQTT**: Accesible por red; si usa TLS estándar, normalmente en el puerto `8883`.
- **Dispositivo BLE**: Un reloj/sensor compatible con el servicio UART (Nordic UART Service uO similar) que envíe notificaciones con el BPM.

## Instalación
```powershell
# (Opcional) Crear y activar entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

## Configuración
Cree un archivo `.env` en la raíz del proyecto (junto a [main.py](main.py)) con las variables de entorno del broker:
```env
MQTT_BROKER=tu.broker.local.o.cloud
MQTT_PORT=8883
MQTT_USER=usuario
MQTT_PASSWORD=contraseña
```

### Parámetros BLE
Estos valores están en [main.py](main.py) y puede ajustarlos si su dispositivo difiere:
- `DEVICE_ADDRESS = "CD:E9:FE:16:BA:CC"`
- `UUID_UART_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9d"`
- `UUID_UART_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9d"`
- `CMD_START = cd000712012400020001` (hex que se envía para iniciar la medición)

## Uso
Ejecute el servicio desde PowerShell:
```powershell
python main.py
```
Salida esperada:
- `[MQTT] Connected successfully` cuando se conecte al broker.
- `[BLE] Connected to ...` cuando se vincule al reloj.
- `[MQTT] Published BPM: 72` por cada dato válido publicado.

## Publicación MQTT
- **Tópico**: `autoawake/bpm`
- **Payload** (JSON):
```json
{
  "timestamp": "2025-12-17T12:34:56.789012",
  "bpm": 72
}
```

## Personalización
- **Tópico**: Cambie `TOPIC_BPM` en [main.py](main.py) si necesita otro tópico.
- **Rangos válidos**: Ajuste la validación `30 < bpm < 220` en `notification_handler()` si su sensor usa otro rango.
- **Reconexión**: El bucle principal reintenta cada 5s. Ajuste ese intervalo si es necesario.

## Solución de problemas
- **No conecta BLE**: Verifique que el dispositivo esté encendido, dentro de alcance y no esté ya vinculado por otra app. Asegúrese de que Windows Bluetooth esté activo.
- **Errores MQTT/TLS**: Si usa `8883` con TLS, confirme que el broker acepta conexiones sin verificación de certificado o proporcione certificados válidos; de lo contrario, use `1883` sin TLS para pruebas.
- **Sin publicaciones**: Compruebe que llegan notificaciones (mensajes `[BLE]`), y que el payload del reloj realmente contiene el BPM en el último byte (la lógica actual lee `data[-1]`). Ajuste el parser si su dispositivo envía otro formato.

## Estructura
- [main.py](main.py): Servicio principal BLE + MQTT.
- [requirements.txt](requirements.txt): Dependencias del proyecto.

## Notas
- Este código está orientado a pruebas/POC. Para producción, habilite verificación de certificados TLS, gestione reconexiones con backoff y agregue logs estructurados.
