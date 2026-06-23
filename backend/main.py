import os
import sqlite3
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import Groq

app = FastAPI(title="API de Triage Digital - Clínica Internacional")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "TU_GROQ_API_KEY_AQUI")
client = Groq(api_key=GROQ_API_KEY)

# ==========================================
# RUTA ABSOLUTA DE LA BASE DE DATOS
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "clinica.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            location TEXT NOT NULL,
            schedule TEXT NOT NULL
        )
    ''')
    # NUEVA TABLA: CITAS MÉDICAS
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            location TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            type TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ==========================================
# MODELOS (Pydantic)
# ==========================================
class UserRegister(BaseModel): name: str; email: str; password: str
class UserLogin(BaseModel): email: str; password: str
class Message(BaseModel): role: str; content: str
class ChatRequest(BaseModel): messages: List[Message]
class Doctor(BaseModel): id: int; name: str; specialty: str; location: str; schedule: str

# NUEVOS MODELOS PARA CITAS
class AppointmentCreate(BaseModel):
    user_email: str
    doctor_name: str
    specialty: str
    location: str
    date: str
    time: str
    type: str

class AppointmentResponse(AppointmentCreate):
    id: int

# ==========================================
# ENDPOINTS: AUTENTICACIÓN
# ==========================================
@app.post("/api/register")
async def register_user(user: UserRegister):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        hashed_pw = hash_password(user.password)
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (user.name, user.email, hashed_pw))
        conn.commit()
        return {"message": "Usuario registrado exitosamente"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
    finally:
        conn.close()

@app.post("/api/login")
async def login_user(user: UserLogin):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    hashed_pw = hash_password(user.password)
    cursor.execute("SELECT id, name, email FROM users WHERE email = ? AND password = ?", (user.email, hashed_pw))
    result = cursor.fetchone()
    conn.close()
    if result:
        # Ahora también devolvemos el email para que el frontend lo use
        return {"message": "Inicio de sesión exitoso", "name": result[1], "email": result[2]}
    else:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")

# ==========================================
# ENDPOINTS: DOCTORES Y CITAS
# ==========================================
@app.get("/api/doctors", response_model=List[Doctor])
async def get_doctors():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, specialty, location, schedule FROM doctors")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "specialty": r[2], "location": r[3], "schedule": r[4]} for r in rows]

@app.post("/api/appointments")
async def create_appointment(appt: AppointmentCreate):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO appointments (user_email, doctor_name, specialty, location, date, time, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (appt.user_email, appt.doctor_name, appt.specialty, appt.location, appt.date, appt.time, appt.type))
    conn.commit()
    conn.close()
    return {"message": "Cita guardada exitosamente"}

@app.get("/api/appointments/{email}", response_model=List[AppointmentResponse])
async def get_appointments(email: str):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Obtenemos las citas del usuario específico, ordenadas por fecha y hora
    cursor.execute("SELECT id, user_email, doctor_name, specialty, location, date, time, type FROM appointments WHERE user_email = ? ORDER BY date, time", (email,))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "user_email": r[1], "doctor_name": r[2], "specialty": r[3], "location": r[4], "date": r[5], "time": r[6], "type": r[7]} for r in rows]

# ==========================================
# ENDPOINTS: IA CHATBOT
# ==========================================
SYSTEM_PROMPT = (
    "Eres el Asistente Virtual de Triage y Orientación Médica de la Clínica Internacional. "
    "Tu objetivo es ayudar al paciente a identificar la especialidad médica adecuada según sus síntomas o explicar resultados. "
    "REGLAS CRÍTICAS: 1. NUNCA des diagnósticos. 2. Sé empático. 3. Incluye descargo de responsabilidad. 4. Deriva a emergencias si hay alertas rojas."
)

@app.post("/api/chat")
async def chat_with_groq(request: ChatRequest):
    try:
        formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + [{"role": msg.role, "content": msg.content} for msg in request.messages]
        completion = client.chat.completions.create(model="llama-3.1-8b-instant", messages=formatted_messages, temperature=0.3, max_tokens=1024)
        return {"role": "assistant", "content": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor de IA: {str(e)}")