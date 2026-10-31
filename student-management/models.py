from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base


class Batch(Base):

    __tablename__ = "batches"

    batch_id = Column(Integer, primary_key=True)
    batch_name = Column(String(50), unique=True, nullable=False)


class Student(Base):

    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("batches.batch_id"))
    student_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(15))
    qualification = Column(String(50))
    location = Column(String(100))