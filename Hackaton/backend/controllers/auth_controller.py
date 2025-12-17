from fastapi import HTTPException, status
from database.autoawake_db import Database
from services.auth_service import AuthService


class AuthController:
    def __init__(self, db: Database):
        self.auth_service = AuthService(db)

    def login(self, email: str, password: str):
        try:
            return self.auth_service.login(email, password)
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error in login: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal Server Error"
            )

    def register(self, name: str, email: str, password: str, role_name: str):
        try:
            return self.auth_service.register(name, email, password, role_name)
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error in register: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal Server Error"
            )

    def logout(self, token: str):
        try:
            return self.auth_service.logout(token)
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error in logout: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal Server Error"
            )
