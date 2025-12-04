import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Lee variables de entorno
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB")
DB_DIALECT = os.getenv("DB_DIALECT")       # Ej: mysql, postgresql
DB_DRIVER = os.getenv("DB_DRIVER")       # Ej: pymysql, mysqlclient, asyncmy

# Construir URL dinámicamente
DATABASE_URL = f"{DB_DIALECT}+{DB_DRIVER}://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

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