import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import Groq

app = FastAPI(title="API de Triage Digital - Clínica Internacional")

# Configuración de CORS para permitir la conexión desde el frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar el cliente de Groq
# Asegúrate de configurar la variable de entorno: export GROQ_API_KEY="tu_api_key"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "TU_GROQ_API_KEY_AQUI")
client = Groq(api_key=GROQ_API_KEY)

# Definición de los modelos de datos con Pydantic
class Message(BaseModel):
    role: str       # 'user' o 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

# Prompt del sistema para definir el comportamiento estricto de la IA
SYSTEM_PROMPT = (
    "Eres el Asistente Virtual de Triage y Orientación Médica de una clínica. "
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

        # Llamada a la API de Groq (Modelo actualizado a la familia 3.1)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant", # <- Modelo más rápido y actual soportado por Groq
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)