from fastapi import HTTPException, status
from database.autoawake_db import (
    Database,
    get_active_session,
    get_user_by_email,
    login_user,
    logout_session,
    register_user,
)


class AuthService:
    """
    Servicio de autenticación basado en stored procedures y sesiones en BD.
    """

    def __init__(self, db: Database):
        self.db = db

    def login(self, email: str, password: str) -> dict:
        try:
            session_data = login_user(self.db, email, password)
            session = get_active_session(self.db, session_data["session_token"])
            return {
                "token": session_data["session_token"],
                "user_id": session_data["user_id"],
                "role": session_data["role_name"],
                "email": session["email"] if session else email,
                "expires_at": session["expires_at"] if session else None,
            }
        except Exception as exc:
            # La SP devuelve SIGNAL con SQLSTATE 45000; mysql-connector lo propaga como Exception.
            message = str(exc)
            if "INVALID_CREDENTIALS" in message:
                detail = "INVALID_CREDENTIALS"
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail=detail
                ) from exc
            if "USER_DISABLED" in message:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="USER_DISABLED"
                ) from exc
            raise

    def register(self, name: str, email: str, password: str, role_name: str) -> dict:
        if get_user_by_email(self.db, email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="EMAIL_ALREADY_EXISTS",
            )

        try:
            register_user(self.db, name, email, password, role_name)
        except Exception as exc:
            if "ROLE_NOT_FOUND" in str(exc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="ROLE_NOT_FOUND"
                ) from exc
            raise

        return self.login(email, password)

    def logout(self, token: str) -> dict:
        logout_session(self.db, token)
        return {"message": "Session revoked"}
