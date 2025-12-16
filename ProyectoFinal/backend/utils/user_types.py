# app/utils/user_types.py
from enum import Enum

class UserTypes(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"
