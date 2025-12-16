from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.web_token import verify_token

# FastAPI trae un esquema de seguridad para extraer el header Authorization
security = HTTPBearer()

def check_auth(roles: list[str] | None = None):
    """
    Middleware de autenticación como dependencia.
    - Verifica JWT
    - Valida rol del usuario si se especifica
    """
    def _check_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
        token = credentials.credentials
        user = verify_token(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized"
            )
        if roles and user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden"
            )
        return user
    return _check_auth
