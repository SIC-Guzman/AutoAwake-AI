from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from utils.sql_connection import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    description = Column(String(100), nullable=False)

    # Relación con User
    users = relationship("User", back_populates="role")

    def __repr__(self):
        return f"<Role(id={self.id}, description={self.description})>"
