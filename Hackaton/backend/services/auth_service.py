from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.user import User
from utils.handle_bcrypt import hash_password, verify_password
from utils.web_token import gen_token


class AuthService:
    """
    Servicio de autenticación: login y register
    """

    def __init__(self, db: Session):
        self.db = db

    def login(self, email: str, password: str) -> dict:
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="INVALID_CREDENTIALS"
            )

        if not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="INVALID_CREDENTIALS"
            )

        token = gen_token({
            "id": user.id,
            "email": user.email,
            "role": user.role.description if user.role else None
        })
        return {"token": token}

    def register(self, name: str, email: str, password: str, role_id: int) -> dict:
        existing_user = self.db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="EMAIL_ALREADY_EXISTS"
            )

        hashed_password = hash_password(password)
        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            role_id=role_id
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        token = gen_token({
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role.description if new_user.role else None
        })
        return {"token": token}
