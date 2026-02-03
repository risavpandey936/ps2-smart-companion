import os
from datetime import datetime, timedelta
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt

# Local imports
from database import engine, Base, SessionLocal
import models
from input_validator import is_valid_input
from output_validator import is_valid_output
from task_utils import split_tasks, prioritize_tasks
from rag_patterns import get_task_pattern


# -------------------- SETUP --------------------
load_dotenv()

# Create Database Tables
Base.metadata.create_all(bind=engine)

if not os.getenv("GROQ_API_KEY"):
    # Warning instead of crash if just testing auth, but ideally needed
    print("WARNING: GROQ_API_KEY not found in .env")

# Initialize Groq client if key exists
try:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except:
    client = None

app = FastAPI(title="PS-2 Smart Companion")

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for simplicity in hackathon/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------- SECURITY CONFIG --------------------
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# -------------------- DEPENDENCIES --------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------- MODELS --------------------
class TaskRequest(BaseModel):
    tasks: str


class StartResponse(BaseModel):
    task: str
    current_step: str
    next_step_index: int
    total_steps: int
    all_steps: list[str]


class ContinueRequest(BaseModel):
    task: str
    steps: list[str]
    step_index: int


class StepResponse(BaseModel):
    task: str
    current_step: str
    next_step_index: int
    total_steps: int

class UserCreate(BaseModel):
    email: str
    password: str


# -------------------- ENDPOINTS --------------------

# --- AI Planning ---
@app.post("/generate-plan", response_model=list[StartResponse])
def generate_plan(request: TaskRequest):
    if not client:
        raise HTTPException(status_code=500, detail="AI Service unavailable (Missing API Key)")

    user_input = request.tasks.strip()

    if not is_valid_input(user_input):
        raise HTTPException(
            status_code=400,
            detail="Invalid input. Please provide simple actionable tasks."
        )

    tasks = split_tasks(user_input)
    tasks = prioritize_tasks(tasks)
    tasks = tasks[:3]

    results = []

    for task in tasks:
        pattern = get_task_pattern(task)

        system_prompt = (
            "You are an executive-function assistant for neurodivergent users.\n\n"
            f"{pattern}\n\n"
            "Rules:\n"
            "- Output ONLY a numbered list\n"
            "- Maximum 8 steps\n"
            "- One action per line\n"
            "- Each sentence under 12 words\n"
            "- No explanations\n"
            "- No emojis\n"
            "- No extra text"
        )

        steps = None

        for _ in range(3):
            # Retry logic
            try:
                response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": task},
                    ],
                    temperature=0.2,
                    max_tokens=120
                )
                output = response.choices[0].message.content

                if is_valid_output(output):
                    steps = [line.split(". ", 1)[1] for line in output.split("\n") if ". " in line]
                    if steps:
                        break
            except Exception as e:
                print(f"Error generating steps: {e}")
                continue

        if steps is None:
            steps = ["Unable to generate safe steps. Try again later."]

        results.append({
            "task": task,
            "current_step": steps[0] if steps else "Error",
            "next_step_index": 1,
            "total_steps": len(steps),
            "all_steps": steps
        })

    return results


@app.post("/next-step", response_model=StepResponse)
def next_step(request: ContinueRequest):

    if request.step_index >= len(request.steps):
        return {
            "task": request.task,
            "current_step": "Task completed.",
            "next_step_index": request.step_index,
            "total_steps": len(request.steps)
        }

    return {
        "task": request.task,
        "current_step": request.steps[request.step_index],
        "next_step_index": request.step_index + 1,
        "total_steps": len(request.steps)
    }


# --- Auth & User ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    print(f"DEBUG: Registering user {user.email}")
    print(f"DEBUG: Password length: {len(user.password)}")
    
    if not user.password:
        raise HTTPException(status_code=400, detail="Password is required")

    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        print(f"DEBUG: User {user.email} already exists")
        raise HTTPException(status_code=400, detail="User already exists. Please login instead.")

    try:
        hashed_password = pwd_context.hash(user.password)
    except Exception as e:
        print(f"DEBUG: Hashing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed at security step: {str(e)}")

    new_user = models.User(
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    print(f"DEBUG: User {user.email} created successfully")

    return {"message": "User created successfully"}


@app.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = jwt.encode(
        {
            "sub": user.email,
            "exp": datetime.utcnow() + timedelta(hours=24)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {"access_token": token}


@app.post("/save-task")
def save_task(content: str, email: str, db: Session = Depends(get_db)):
    # Assuming the frontend sends these as query parameters or form data?
    # If they send JSON, this signature might need Body() if they aren't matching query params.
    # But usually simple types -> Query.
    task = models.Task(content=content, user_email=email)
    db.add(task)
    db.commit()
    return {"message": "Task saved"}


@app.get("/user-tasks")
def get_user_tasks(email: str, db: Session = Depends(get_db)):
    tasks = db.query(models.Task).filter(models.Task.user_email == email).all()
    return [task.content for task in tasks]
