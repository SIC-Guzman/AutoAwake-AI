from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings
from database.autoawake_db import Database, get_active_session

# Singleton DB instance (mysql-connector pool inside)
db_instance = Database()


def get_db() -> Database:
    return db_instance


security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Database = Depends(get_db),
):
    """
    Validates a session token against user_sessions.
    """
    if settings.auth_disable:
        return {
            "id": 0,
            "role": "DEV",
            "email": "dev@example.com",
            "token": "dev-token",
        }

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    session = get_active_session(db, token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": session["user_id"],
        "email": session["email"],
        "role": session["role_name"],
        "token": token,
        "expires_at": session["expires_at"],
    }


def require_roles(*roles: str):
    """
    Dependency factory to enforce role-based access.
    """

    def _require_roles(user=Depends(get_current_user)):
        if roles and user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden",
            )
        return user

    return _require_roles
