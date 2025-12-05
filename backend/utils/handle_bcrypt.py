import bcrypt

def hash_password(password: str) -> str:
    # Hashea una contraseña usando bcrypt.
    # bcrypt.hashpw devuelve bytes, lo decodificamos a str para guardar en DB
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    # Verifica si la contraseña coincide con el hash.
    # bcrypt.checkpw espera bytes en ambos argumentos
    return bcrypt.checkpw(
        password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )
