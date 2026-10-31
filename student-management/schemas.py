
from pydantic import BaseModel, EmailStr

class StudentCreate(BaseModel):
    batch_id: int
    student_name: str
    email: EmailStr
    phone: str
    qualification: str
    location: str
