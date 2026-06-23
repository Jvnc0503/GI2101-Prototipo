import React, { useState } from 'react';

// --- Tipos y Mock Data ---
type CitaType = 'Presencial' | 'Virtual';
type AgendamientoMethod = 'Médico' | 'Especialidad';
type Step = 'TYPE' | 'METHOD' | 'ALL_DOCTORS' | 'SPECIALTIES' | 'LOCATIONS' | 'FILTERED_DOCTORS' | 'DATETIME' | 'CONFIRMATION' | 'SUCCESS';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

const SPECIALTIES = ['Medicina General', 'Cardiología', 'Dermatología', 'Neurología', 'Pediatría'];
const LOCATIONS = ['Sede San Borja', 'Sede Lima Centro', 'Sede Surco', 'Clínica San Isidro'];
const DOCTORS: Doctor[] = [
  { id: 1, name: 'Dr. Carlos Mendoza', specialty: 'Medicina General' },
  { id: 2, name: 'Dra. Lucía Rojas', specialty: 'Cardiología' },
  { id: 3, name: 'Dr. Jorge Silva', specialty: 'Dermatología' },
  { id: 4, name: 'Dra. María Fernández', specialty: 'Neurología' },
  { id: 5, name: 'Dr. Roberto Torres', specialty: 'Pediatría' },
  { id: 6, name: 'Dra. Ana Gómez', specialty: 'Medicina General' },
];
const AVAILABLE_TIMES = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'];

export default function AgendarCita({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState<Step>('TYPE');
  
  // Estado que acumula las selecciones del usuario
  const [booking, setBooking] = useState({
    type: '' as CitaType | '',
    method: '' as AgendamientoMethod | '',
    specialty: '',
    location: '',
    doctor: null as Doctor | null,
    date: '',
    time: ''
  });

  // --- Manejadores de Flujo (Lógica de Negocio) ---
  const selectType = (type: CitaType) => {
    setBooking({ ...booking, type });
    setStep('METHOD');
  };

  const selectMethod = (method: AgendamientoMethod) => {
    setBooking({ ...booking, method });
    setStep(method === 'Médico' ? 'ALL_DOCTORS' : 'SPECIALTIES');
  };

  const selectDoctor = (doc: Doctor) => {
    setBooking({ ...booking, doctor: doc, specialty: doc.specialty });
    // Si viene por "Médico" y es presencial, pedir sede. Sino, directo a Fecha/Hora.
    if (booking.type === 'Presencial') setStep('LOCATIONS');
    else setStep('DATETIME');
  };

  const selectSpecialty = (spec: string) => {
    setBooking({ ...booking, specialty: spec });
    // Si es presencial, pedir sede. Si es virtual, ir a la lista de médicos de esa especialidad.
    if (booking.type === 'Presencial') setStep('LOCATIONS');
    else setStep('FILTERED_DOCTORS');
  };

  const selectLocation = (loc: string) => {
    setBooking({ ...booking, location: loc });
    // Si venía de "Especialidad", ahora toca elegir médico. Si venía de "Médico", ya lo eligió, pasar a Fecha/Hora.
    if (booking.method === 'Especialidad') setStep('FILTERED_DOCTORS');
    else setStep('DATETIME');
  };

  const handleConfirm = () => setStep('SUCCESS');
  
  const handleCancel = () => {
    // Reiniciar flujo
    setStep('TYPE');
    setBooking({ type: '', method: '', specialty: '', location: '', doctor: null, date: '', time: '' });
  };

  // --- Sub-componentes visuales reutilizables ---
  const Header = ({ title, showBack }: { title: string, showBack?: boolean }) => (
    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      {showBack && (
        <button onClick={() => setStep('TYPE')} style={{...buttonOutlineStyle, padding: '6px 12px', fontSize: '14px'}}>
          ← Reiniciar
        </button>
      )}
      <h2 style={{ margin: 0, color: '#002855' }}>{title}</h2>
    </div>
  );

  const OptionCard = ({ label, subLabel, onClick }: { label: string, subLabel?: string, onClick: () => void }) => (
    <div onClick={onClick} style={cardStyle}>
      <div style={{ fontWeight: 'bold', color: '#0056b3', fontSize: '16px' }}>{label}</div>
      {subLabel && <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{subLabel}</div>}
    </div>
  );

  // --- Renderizado de Pantallas (Vistas del Flujo) ---
  return (
    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      
      {step === 'TYPE' && (
        <div>
          <Header title="1. ¿Qué tipo de servicio necesitas?" />
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <OptionCard label="🏥 Cita Presencial" subLabel="Atención en nuestras sedes físicas" onClick={() => selectType('Presencial')} />
            <OptionCard label="💻 Cita Virtual (Telemedicina)" subLabel="Atención médica por videollamada" onClick={() => selectType('Virtual')} />
          </div>
        </div>
      )}

      {step === 'METHOD' && (
        <div>
          <Header title="2. ¿Cómo deseas agendar?" showBack />
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <OptionCard label="👨‍⚕️ Por Médico" subLabel="Si ya conoces al doctor que te atiende" onClick={() => selectMethod('Médico')} />
            <OptionCard label="🩺 Por Especialidad" subLabel="Si buscas la especialidad requerida" onClick={() => selectMethod('Especialidad')} />
          </div>
        </div>
      )}

      {step === 'ALL_DOCTORS' && (
        <div>
          <Header title="Selecciona a tu médico" showBack />
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {DOCTORS.map(doc => (
              <OptionCard key={doc.id} label={doc.name} subLabel={doc.specialty} onClick={() => selectDoctor(doc)} />
            ))}
          </div>
        </div>
      )}

      {step === 'SPECIALTIES' && (
        <div>
          <Header title="Selecciona la especialidad" showBack />
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {SPECIALTIES.map(spec => (
              <OptionCard key={spec} label={spec} onClick={() => selectSpecialty(spec)} />
            ))}
          </div>
        </div>
      )}

      {step === 'LOCATIONS' && (
        <div>
          <Header title="Selecciona la sede presencial" showBack />
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {LOCATIONS.map(loc => (
              <OptionCard key={loc} label={loc} onClick={() => selectLocation(loc)} />
            ))}
          </div>
        </div>
      )}

      {step === 'FILTERED_DOCTORS' && (
        <div>
          <Header title={`Médicos en ${booking.specialty}`} showBack />
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {DOCTORS.filter(d => d.specialty === booking.specialty).map(doc => (
              <OptionCard key={doc.id} label={doc.name} subLabel={booking.location ? `Atiende en: ${booking.location}` : 'Atención Virtual'} onClick={() => selectDoctor(doc)} />
            ))}
          </div>
        </div>
      )}

      {step === 'DATETIME' && (
        <div>
          <Header title="Selecciona Fecha y Hora" showBack />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>Fecha:</label>
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]} 
                style={inputStyle}
                onChange={(e) => setBooking({...booking, date: e.target.value})}
              />
            </div>
            
            {booking.date && (
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>Hora disponible:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {AVAILABLE_TIMES.map(t => (
                    <button 
                      key={t} 
                      onClick={() => { setBooking({...booking, time: t}); setStep('CONFIRMATION'); }}
                      style={booking.time === t ? buttonStyle : buttonOutlineStyle}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'CONFIRMATION' && (
        <div>
          <Header title="Resumen de tu Cita" />
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <p><strong>Tipo:</strong> {booking.type}</p>
            <p><strong>Especialidad:</strong> {booking.specialty}</p>
            <p><strong>Médico:</strong> {booking.doctor?.name}</p>
            {booking.type === 'Presencial' && <p><strong>Sede:</strong> {booking.location}</p>}
            <p><strong>Fecha:</strong> {booking.date}</p>
            <p><strong>Hora:</strong> {booking.time}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={handleConfirm} style={{...buttonStyle, flex: 1, backgroundColor: '#16a34a'}}>✅ Confirmar Cita</button>
            <button onClick={handleCancel} style={{...buttonOutlineStyle, flex: 1, borderColor: '#ef4444', color: '#ef4444'}}>❌ Cancelar</button>
          </div>
        </div>
      )}

      {step === 'SUCCESS' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: '#16a34a', marginBottom: '16px' }}>¡Cita Confirmada!</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Se ha enviado un correo con los detalles de tu cita con {booking.doctor?.name} para el {booking.date} a las {booking.time}.
          </p>
          <button onClick={onCancel} style={buttonStyle}>Volver al menú principal</button>
        </div>
      )}

    </div>
  );
}

// --- Estilos ---
const cardStyle: React.CSSProperties = {
  padding: '16px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: '#f8fafc',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', outline: 'none', boxSizing: 'border-box'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#0056b3', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
};

const buttonOutlineStyle: React.CSSProperties = {
  padding: '12px', borderRadius: '6px', border: '1px solid #0056b3', backgroundColor: 'transparent', color: '#0056b3', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
};