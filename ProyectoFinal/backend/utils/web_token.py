import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET is not set in the environment variables")
JWT_ALGORITHM = "HS256"

def gen_token(user: dict) -> str:
    # Genera un JWT token para el usuario.
    expire = datetime.utcnow() + timedelta(days=1)  # 1 día
    payload = {
        "id": user.get("id"),
        "email": user.get("email"),
        "role": user.get("role"),
        "exp": expire
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token(token: str) -> dict | None:
    # Verifica un JWT token.
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded
    except JWTError:
        return None
