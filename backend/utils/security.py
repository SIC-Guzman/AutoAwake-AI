import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from utils.web_token import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

DISABLE_AUTH = os.getenv("DISABLE_AUTH", "").lower() in ("1", "true", "yes")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Returns current user payload when token is valid.
    If DISABLE_AUTH is set, returns a dummy user and skips validation (for local/testing only).
    """
    if DISABLE_AUTH:
        return {"id": 0, "role": "DEV", "email": "dev@example.com"}

    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
