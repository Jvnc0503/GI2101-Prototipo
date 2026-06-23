import sqlite3
import random
import os
import hashlib
from datetime import datetime, timedelta
from faker import Faker

fake = Faker('es_ES')

# ==========================================
# RUTA ABSOLUTA FORZADA
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "clinica.db")

SPECIALTIES = ['Medicina General', 'Cardiología', 'Dermatología', 'Neurología', 'Pediatría', 'Traumatología', 'Gastroenterología', 'Ginecología']
LOCATIONS = ['Sede San Borja', 'Sede Lima Centro', 'Sede Surco', 'Clínica San Isidro', 'Sede Independencia']
ALL_TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM']

def hash_password(password: str) -> str:
    """Aplica el mismo hash de seguridad que usa FastAPI"""
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database(num_doctors=30):
    print(f"Conectando a la base de datos en: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 1. Limpiar TODA la base de datos para una demo limpia
    print("Limpiando tablas antiguas...")
    cursor.execute('DROP TABLE IF EXISTS doctors')
    cursor.execute('DROP TABLE IF EXISTS users')
    cursor.execute('DROP TABLE IF EXISTS appointments')

    # 2. Crear las estructuras de las tablas
    print("Creando esquema de tablas...")
    cursor.execute('''CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL)''')
    cursor.execute('''CREATE TABLE doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, specialty TEXT NOT NULL, location TEXT NOT NULL, schedule TEXT NOT NULL)''')
    cursor.execute('''CREATE TABLE appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT NOT NULL, doctor_name TEXT NOT NULL, specialty TEXT NOT NULL, location TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, type TEXT NOT NULL)''')

    # 3. Crear Usuario Administrador / Demo
    print("👤 Creando cuenta de demostración...")
    admin_email = "admin@clinica.com"
    admin_pass = "admin123"
    cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
                   ("Paciente Demo", admin_email, hash_password(admin_pass)))

    # 4. Generar Médicos
    print(f"👨‍⚕️ Generando {num_doctors} médicos aleatorios...")
    doctors_data = []
    for _ in range(num_doctors):
        prefix = random.choice(['Dr.', 'Dra.'])
        name = f"{prefix} {fake.first_name()} {fake.last_name()}"
        specialty = random.choice(SPECIALTIES)
        location = random.choice(LOCATIONS)
        num_hours = random.randint(3, 6)
        assigned_times = random.sample(ALL_TIMES, num_hours)
        assigned_times.sort(key=lambda x: ALL_TIMES.index(x))
        schedule_str = ",".join(assigned_times)
        doctors_data.append((name, specialty, location, schedule_str))

    cursor.executemany('''INSERT INTO doctors (name, specialty, location, schedule) VALUES (?, ?, ?, ?)''', doctors_data)

    # 5. Agendar citas automáticas para el usuario Demo
    print("🗓️ Inyectando citas médicas de prueba...")
    today = datetime.now()
    
    # Extraemos los datos de 3 doctores que acabamos de crear
    doc1 = doctors_data[0]
    doc2 = doctors_data[1]
    doc3 = doctors_data[2]

    # Cita 1: Presencial (Dentro de 2 días)
    date1 = (today + timedelta(days=2)).strftime("%Y-%m-%d")
    time1 = doc1[3].split(",")[0] # Tomamos su primera hora disponible
    cursor.execute('''INSERT INTO appointments (user_email, doctor_name, specialty, location, date, time, type) VALUES (?, ?, ?, ?, ?, ?, ?)''',
                   (admin_email, doc1[0], doc1[1], doc1[2], date1, time1, "Presencial"))

    # Cita 2: Virtual (Dentro de 5 días)
    date2 = (today + timedelta(days=5)).strftime("%Y-%m-%d")
    time2 = doc2[3].split(",")[-1] # Tomamos su última hora disponible
    cursor.execute('''INSERT INTO appointments (user_email, doctor_name, specialty, location, date, time, type) VALUES (?, ?, ?, ?, ?, ?, ?)''',
                   (admin_email, doc2[0], doc2[1], "Virtual", date2, time2, "Virtual"))

    # Cita 3: Presencial (Dentro de 1 semana)
    date3 = (today + timedelta(days=7)).strftime("%Y-%m-%d")
    time3 = doc3[3].split(",")[1] if len(doc3[3].split(",")) > 1 else doc3[3].split(",")[0]
    cursor.execute('''INSERT INTO appointments (user_email, doctor_name, specialty, location, date, time, type) VALUES (?, ?, ?, ?, ?, ?, ?)''',
                   (admin_email, doc3[0], doc3[1], doc3[2], date3, time3, "Presencial"))

    conn.commit()
    conn.close()
    
    print("\n" + "="*45)
    print("✅ BASE DE DATOS POBLADA CON ÉXITO")
    print("="*45)
    print("Credenciales para tu presentación:")
    print(f"👉 Correo: {admin_email}")
    print(f"👉 Clave:  {admin_pass}")
    print("="*45 + "\n")

if __name__ == "__main__":
    seed_database()