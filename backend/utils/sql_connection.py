import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Lee variables de entorno
# Lee variables de entorno
DB_USER = os.getenv("DB_USER", "autoawake_user")
DB_PASS = os.getenv("DB_PASS", "super_secret")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "AutoAwakeAI")

# Construir URL dinámicamente
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Crear engine
engine = create_engine(DATABASE_URL, echo=False, future=True)

# Crear sesión
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Base de los modelos
Base = declarative_base()

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()