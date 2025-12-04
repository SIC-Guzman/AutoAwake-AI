from app.models.user import User
from app.models.role import Role
from app.utils.sql_connection import engine, Base
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)


# Inicializar datos en roles
def init_roles():
    from sqlalchemy.orm import Session
    session = Session(bind=engine)

    if session.query(Role).count() == 0:
        session.add_all([
            Role(description="Admin"),
            Role(description="User"),
            Role(description="Guest")
        ])
        session.commit()

    session.close()


init_roles()


# Exportar modelos
__all__ = ["User", "Role"]
