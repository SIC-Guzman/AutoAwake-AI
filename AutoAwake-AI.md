# SafeFleet IA: Sistema Inteligente de Monitoreo de Somnolencia

## Descripción del Proyecto

SafeFleet IA es un sistema integral de control de flotas vehiculares diseñado para prevenir accidentes causados por la somnolencia al volante. La solución combina hardware IoT instalado en cada vehículo con una plataforma de gestión en la nube.

## Funcionalidades Principales

### En el Vehículo (Edge Computing)

En cada unidad se instala una Raspberry Pi con una cámara frontal que ejecuta un modelo de Inteligencia Artificial en tiempo real.

- **Detección de Somnolencia:** Análisis de visión por computadora para detectar ojos cerrados, cabeceo y micro-sueños.
- **Alertas Inmediatas:**
  - Activación de alarma sonora (buzzer).
  - Encendido de luz de emergencia.
  - Envío de alerta en tiempo real al backend.

### Plataforma Web (Backend & Frontend)

Panel administrativo para encargados de flota y logística.

- **Gestión de Flota:** Registro de vehículos (placa, modelo, estado) y conductores.
- **Monitoreo en Tiempo Real:** Recepción de alertas con detalles del evento (piloto, vehículo, hora).
- **Reportes y Analítica:** Historial de incidentes, tiempos de viaje y estadísticas por piloto/vehículo.
- **Notificaciones:** Alertas vía web, correo o notificaciones móviles para acción inmediata.

## Tech Stack

### Hardware & Edge AI

- **Raspberry Pi:** Unidad de procesamiento central en el vehículo.
- **Cámara:** Captura de video para análisis facial.
- **TensorFlow / TensorFlow Lite:** Entrenamiento y ejecución optimizada del modelo de detección de somnolencia (CNN).
- **Componentes:** Buzzer y luz LED para alertas locales.

### Backend

- **Python:** Lenguaje principal del backend.
- **FastAPI:** Framework para la creación de la API RESTful.
- **MySQL:** Base de datos relacional para almacenar usuarios, vehículos y eventos.
- **SQLAlchemy:** ORM para interacción con la base de datos.
- **Pydantic:** Validación de datos.

### Frontend

- **HTML/CSS/JavaScript:** Interfaz web para el dashboard de administración.

## Arquitectura del Sistema

1.  **Captura:** La cámara captura el video del conductor.
2.  **Procesamiento:** La Raspberry Pi procesa los frames usando el modelo TFLite.
3.  **Acción Local:** Si se detecta somnolencia, se activan el buzzer y la luz.
4.  **Transmisión:** Se envía una alerta HTTP al servidor FastAPI.
5.  **Almacenamiento:** El backend guarda el evento en la base de datos MySQL.
6.  **Visualización:** El dashboard web consulta la API para mostrar alertas y reportes.

## Instalación y Uso

### Prerrequisitos

- Docker y Docker Compose (recomendado para la base de datos).
- Python 3.9+
- Raspberry Pi 4 (para el módulo de vehículo).

### Configuración del Backend

1.  Clonar el repositorio.
2.  Crear un entorno virtual: `python -m venv .venv`
3.  Activar el entorno e instalar dependencias: `pip install -r requirements.txt`
4.  Configurar las variables de entorno en un archivo `.env`.
5.  Iniciar el servidor: `uvicorn main:app --reload`

### Despliegue de Base de Datos

Ejecutar el contenedor de MySQL:

```bash
docker run --name autoawake-db -e MYSQL_ROOT_PASSWORD=secret -p 3306:3306 -d mysql:latest
```

## Beneficios

- **Seguridad:** Reducción drástica de accidentes por fatiga.
- **Control:** Visibilidad total del estado de la flota.
- **Optimización:** Mejora en la toma de decisiones logísticas y de RRHH.
