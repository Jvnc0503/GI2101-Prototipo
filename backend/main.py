import os
import sqlite3
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import Groq

app = FastAPI(title="API de Triage Digital - Clínica")

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
# FIX: RUTA ABSOLUTA FORZADA
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
    conn.commit()
    conn.close()

init_db()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class Doctor(BaseModel):
    id: int
    name: str
    specialty: str
    location: str
    schedule: str

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
    cursor.execute("SELECT id, name FROM users WHERE email = ? AND password = ?", (user.email, hashed_pw))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {"message": "Inicio de sesión exitoso", "name": result[1]}
    else:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")

@app.get("/api/doctors", response_model=List[Doctor])
async def get_doctors():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, specialty, location, schedule FROM doctors")
    rows = cursor.fetchall()
    conn.close()
    
    doctors_list = [{"id": r[0], "name": r[1], "specialty": r[2], "location": r[3], "schedule": r[4]} for r in rows]
    return doctors_list

SYSTEM_PROMPT = (
    "Eres el Asistente Virtual de Triage y Orientación Médica de la Clínica Internacional. "
    "Tu objetivo es ayudar al paciente a identificar la especialidad médica adecuada según sus síntomas "
    "o explicar de forma muy didáctica los resultados de exámenes de laboratorio basados en texto. "
    "REGLAS CRÍTICAS DE NEGOCIO Y ÉTICA:\n"
    "1. BAJO NINGUNA CIRCUNSTANCIA debes dar un diagnóstico médico definitivo ni recetar fármacos.\n"
    "2. Sé empático, claro, profesional y utiliza un lenguaje amigable.\n"
    "3. Siempre incluye un descargo de responsabilidad al final indicando que esta orientación no reemplaza una consulta médica.\n"
    "4. Si el paciente menciona síntomas de alerta roja (dolor opresivo en el pecho, pérdida de conocimiento, dificultad severa para respirar), "
    "indícale de inmediato de forma imperativa que acuda al servicio de Emergencias de la clínica."
)

@app.post("/api/chat")
async def chat_with_groq(request: ChatRequest):
    try:
        formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in request.messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=formatted_messages,
            temperature=0.3,
            max_tokens=1024,
        )
        response_content = completion.choices[0].message.content
        return {"role": "assistant", "content": response_content}
    except Exception as e:
        import traceback
        print("\n" + "="*50)
        print("🔥 ERROR DETALLADO DE GROQ:")
        traceback.print_exc()
        print("="*50 + "\n")
        raise HTTPException(status_code=500, detail=f"Error en el motor de IA: {str(e)}")