from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers.auth_controller import AuthController
from app.utils.sql_connection import get_db
from app.schemas import LoginSchema, RegisterSchema

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
async def login(credentials: LoginSchema, db: Session = Depends(get_db)):
    controller = AuthController(db)
    return controller.login(credentials.email, credentials.password)


@router.post("/register")
def register(credentials: RegisterSchema, db: Session = Depends(get_db)):
    controller = AuthController(db)
    return controller.register(
        name=credentials.name,
        email=credentials.email,
        password=credentials.password,
        role_id=credentials.role_id
    )
