
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from utils.sql_connection import Base
from models.role import Role


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    password = Column(String(60), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    # Relación con Role 
    role = relationship("Role", back_populates="users")

    def say_hello(self) -> str:
        return f"Hello, I am {self.name}"
