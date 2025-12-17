from fastapi import APIRouter, Depends
from controllers.auth_controller import AuthController
from database.autoawake_db import Database
from schemas import LoginSchema, RegisterSchema, AuthResponse
from core.deps import get_current_user, get_db

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginSchema, db: Database = Depends(get_db)):
    controller = AuthController(db)
    return controller.login(credentials.email, credentials.password)


@router.post("/register", response_model=AuthResponse)
def register(credentials: RegisterSchema, db: Database = Depends(get_db)):
    controller = AuthController(db)
    return controller.register(
        name=credentials.name,
        email=credentials.email,
        password=credentials.password,
        role_name=credentials.role_name,
    )


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    controller = AuthController(db)
    return controller.logout(current_user["token"])
