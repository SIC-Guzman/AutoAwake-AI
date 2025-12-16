# AutoAwake AI – Driver Drowsiness Detection (TFLite + OpenCV + MQTT)

Este proyecto implementa un sistema ligero de **detección de somnolencia en tiempo real**, diseñado para dispositivos embebidos (Raspberry Pi, Orange Pi, etc.). Utiliza:

* **TFLite** para el modelo de landmarks faciales.
* **OpenCV** para detección de rostros.
* **Eye Aspect Ratio (EAR)** para detección de ojos cerrados.
* **MQTT** para enviar alertas al backend.

El sistema detecta si el conductor mantiene los ojos cerrados durante un tiempo prolongado y envía automáticamente una alerta al topic MQTT configurado.

---

## Características principales

* Detección de rostro mediante **Haar Cascade**.
* Extracción de **68 puntos faciales** usando un modelo TFLite cuantizado INT8.
* Cálculo del **EAR** para ambos ojos.
* Temporizador de somnolencia configurable.
* Publicación de alertas mediante MQTT (TLS opcional).
* Sistema ligero, optimizado para FPS bajos en hardware ARM.

---

## Requisitos del sistema

* Python 3.8+
* OpenCV con soporte para cámara
* Un modelo TFLite de landmarks faciales:

  ```
  landmarks_model_int8.tflite
  ```
* MQTT Broker accesible (Mosquitto, EMQX, HiveMQ, etc.)

Consulta los requisitos exactos en:

```
requirements.txt
```

Instalación recomendada:

```bash
pip install -r requirements.txt
```

---

## Configuración de entorno

El sistema utiliza variables de entorno definidas en un archivo `.env`.

Ejemplo de `.env`:

```
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=8883
MQTT_USER=samsung
MQTT_PASSWORD=samsung
MQTT_TOPIC_ALERTS=autoawake/alerts
MQTT_TOPIC_CONTROL=autoawake/control
```

---

## Arquitectura del sistema

### 1. Captura y preprocesamiento

* Se abre la cámara con resolución configurable (ej. 320×240).
* Se convierte a escala de grises y se ecualiza el histograma.
* Se detecta el rostro usando:

  ```
  haarcascade_frontalface_default.xml
  ```

### 2. Inferencia con TFLite

* Se recorta la cara detectada.
* Se normaliza y cuantiza la imagen de entrada.
* El modelo TFLite devuelve los 68 landmarks faciales.

### 3. Cálculo de EAR

Se usa la métrica **Eye Aspect Ratio**:

```
EAR = (‖p2−p6‖ + ‖p3−p5‖) / (2 * ‖p1−p4‖)
```

Un valor bajo indica ojos cerrados.

### 4. Detección de somnolencia por tiempo

El sistema considera somnolencia si:

```
EAR promedio < EAR_THRESHOLD por más de CLOSED_EYE_DURATION segundos
```

Valores por defecto:

```python
EAR_THRESHOLD = 0.4
CLOSED_EYE_DURATION = 3
```

### 5. Envío de alertas por MQTT

Cuando se detecta somnolencia, se envía un mensaje JSON:

```json
{
  "trip_id": 1,
  "alert_type": "DROWSINESS",
  "severity": "HIGH",
  "message": "Driver is drowsy"
}
```

Se publica en el topic:

```
autoawake/alerts
```

---

## Ejecución

Para iniciar la detección:

```bash
python3 main.py
```

El sistema imprimirá logs como:

```
[Frame 120] EAR=0.310, Estado=Ojos Cerrados
[MQTT] Published alert: {...}
```

Para detenerlo:

```
Ctrl + C
```

---

## Estructura del proyecto

```
.
├── main.py                  # Lógica principal de visión y detección
├── mqtt_service.py          # Cliente MQTT con TLS opcional
├── requirements.txt         # Dependencias Python
├── landmarks_model_int8.tflite
├── .env                     # Configuración de MQTT
└── README.md
```

---

## MQTT y seguridad

El sistema soporta:

* Autenticación con usuario y contraseña.
* TLS simple usando:

  ```
  self.client.tls_set(cert_reqs=ssl.CERT_NONE)
  self.client.tls_insecure_set(True)
  ```

Esto permite usarse en brokers corporativos como EMQX, HiveMQ o Mosquitto.

---

## Consideraciones en hardware embebido

Recomendaciones:

* Reducir resolución de cámara a **320×240**.
* Establecer FPS a **15**.
* Usar modelos TFLite cuantizados para máximo desempeño.
* Utilizar `num_threads=4` en Orange Pi o Raspberry Pi 4.
