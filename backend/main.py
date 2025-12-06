from dotenv import load_dotenv
load_dotenv()
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import JSONResponse

# Import routers
from routes.auth_router import router as auth_router
from routes.drivers_router import router as drivers_router
from routes.vehicles_router import router as vehicles_router
from routes.trips_router import router as trips_router
from routes.alerts_router import router as alerts_router
from routes.issues_router import router as issues_router
from routes.devices_router import router as devices_router

# Cargar variables de entorno


from contextlib import asynccontextmanager
from services.mqtt_service import mqtt_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_service.start()
    yield
    mqtt_service.stop()

app = FastAPI(
    title="Backend API",
    description="API con FastAPI y SQLAlchemy",
    version="1.0.0",
    docs_url=None,   # Desactivamos la doc por defecto
    redoc_url=None,  # Desactivamos Redoc (opcional)
    lifespan=lifespan
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Ruta para Swagger (equivalente a swagger-ui-express)
@app.get("/api-docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - API Docs"
    )

# Root endpoint
@app.get("/")
async def root():
    return JSONResponse(content={"message": "OK"}, status_code=200)

# Registrar routers
app.include_router(auth_router)
app.include_router(drivers_router)
app.include_router(vehicles_router)
app.include_router(trips_router)
app.include_router(alerts_router)
app.include_router(issues_router)
app.include_router(devices_router)
