from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.services.auth_service import AuthService
from app.utils.sql_connection import get_db


class AuthController:
    def __init__(self, db: Session):
        self.auth_service = AuthService(db)

    def login(self, email: str, password: str):
        try:
            return self.auth_service.login(email, password)
        except HTTPException as e:
            raise e
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal Server Error"
            )

    def register(self, name: str, email: str, password: str, role_id: int):
        try:
            return self.auth_service.register(name, email, password, role_id)
        except HTTPException as e:
            raise e
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal Server Error"
            )
