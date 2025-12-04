from passlib.context import CryptContext

# Crear contexto bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    # Hashea una contraseña usando bcrypt.
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    # Verifica si la contraseña coincide con el hash.
    return pwd_context.verify(password, hashed_password)
