from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RegisterSchema(BaseModel):
    name: str
    email: str
    password: str
    role_name: str = "DRIVER"

class LoginSchema(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user_id: int
    role: str
    email: Optional[str] = None
    expires_at: Optional[datetime] = None
