from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Student, Batch
from schemas import StudentCreate


app = FastAPI(
    title="Student Management API",
    description="API for managing student details",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Home API
@app.get("/")
def home():
    return {
        "message": "Student Management API is running!"
    }


# Add a new student
@app.post("/students")
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db)
):
    new_student = Student(**student.model_dump())

    db.add(new_student)

    try:
        db.commit()
        db.refresh(new_student)

    except IntegrityError as e:
        db.rollback()
        print("POST DATABASE ERROR:", repr(e.orig), flush=True)

        raise HTTPException(
            status_code=409,
            detail="Database constraint error"
        )

    return {
        "message": "Student added successfully",
        "student_id": new_student.student_id
    }


# Get all students
@app.get("/students")
def get_students(db: Session = Depends(get_db)):

    students = db.query(Student).all()

    return students


# Get all batches
@app.get("/batches")
def get_batches(db: Session = Depends(get_db)):

    batches = db.query(Batch).all()

    return batches


# Get students by batch ID
@app.get("/students/batch/{batch_id}")
def get_students_by_batch(
    batch_id: int,
    db: Session = Depends(get_db)
):

    students = db.query(Student).filter(
        Student.batch_id == batch_id
    ).all()

    return students


# Update student details
@app.put("/students/{student_id}")
def update_student(
    student_id: int,
    student: StudentCreate,
    db: Session = Depends(get_db)
):

    existing_student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if existing_student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    for key, value in student.model_dump().items():
        setattr(existing_student, key, value)

    try:
        db.commit()
        db.refresh(existing_student)

    except IntegrityError as e:
        db.rollback()
        print("PUT DATABASE ERROR:", repr(e.orig), flush=True)

        raise HTTPException(
            status_code=409,
            detail="Database constraint error"
        )

    return {
        "message": "Student updated successfully",
        "student_id": existing_student.student_id
    }

# Delete a student
@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    existing_student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if existing_student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    db.delete(existing_student)
    db.commit()

    return {
        "message": "Student deleted successfully",
        "student_id": student_id
    }