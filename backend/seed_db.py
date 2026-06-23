import sqlite3
import random
import os
from faker import Faker

fake = Faker('es_ES')

# ==========================================
# FIX: RUTA ABSOLUTA FORZADA
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "clinica.db")

SPECIALTIES = ['Medicina General', 'Cardiología', 'Dermatología', 'Neurología', 'Pediatría', 'Traumatología', 'Gastroenterología', 'Ginecología']
LOCATIONS = ['Sede San Borja', 'Sede Lima Centro', 'Sede Surco', 'Clínica San Isidro', 'Sede Independencia']
ALL_TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM']

def seed_database(num_doctors=30):
    print(f"Conectando a la base de datos en la ruta EXACTA: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute('DROP TABLE IF EXISTS doctors')
    cursor.execute('''
        CREATE TABLE doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            location TEXT NOT NULL,
            schedule TEXT NOT NULL
        )
    ''')

    print(f"Generando {num_doctors} médicos aleatorios...")
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

    cursor.executemany('''
        INSERT INTO doctors (name, specialty, location, schedule)
        VALUES (?, ?, ?, ?)
    ''', doctors_data)

    conn.commit()
    conn.close()
    print("✅ Base de datos poblada con éxito. ¡Lista para usar!")

if __name__ == "__main__":
    seed_database()