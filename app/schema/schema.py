from pydantic import BaseModel,EmailStr,Field
from typing import Literal

class RegisterRequest(BaseModel):
    name:str
    email:EmailStr
    college:str
    division:str
    degree:str
    password: str = Field(min_length=8, max_length=8)
    role:Literal["admin" ,"student"]
    #attendance: int = 0
    #attendance_date: str | None = None

class Login(BaseModel):
    email:EmailStr
    password: str = Field(min_length=8, max_length=8)


