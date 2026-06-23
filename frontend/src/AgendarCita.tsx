import React, { useState, useEffect } from 'react';

type CitaType = 'Presencial' | 'Virtual';
type AgendamientoMethod = 'Médico' | 'Especialidad';
type Step = 'TYPE' | 'METHOD' | 'ALL_DOCTORS' | 'SPECIALTIES' | 'LOCATIONS' | 'FILTERED_DOCTORS' | 'DATETIME' | 'CONFIRMATION' | 'SUCCESS';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  location: string;
  schedule: string;
}

export default function AgendarCita({ onCancel }: { onCancel: () => void }) {
  const [step, setStep] = useState<Step>('TYPE');
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [booking, setBooking] = useState({
    type: '' as CitaType | '',
    method: '' as AgendamientoMethod | '',
    specialty: '',
    location: '',
    doctor: null as Doctor | null,
    date: '',
    time: ''
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/doctors');
        if (!response.ok) throw new Error('Error al obtener médicos');
        const data = await response.json();
        setDoctorsList(data);
      } catch (error) {
        console.error("Error cargando médicos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const specialtiesList = Array.from(new Set(doctorsList.map(d => d.specialty)));
  const locationsList = Array.from(new Set(doctorsList.map(d => d.location)));

  const selectType = (type: CitaType) => { setBooking({ ...booking, type }); setStep('METHOD'); };
  const selectMethod = (method: AgendamientoMethod) => { setBooking({ ...booking, method }); setStep(method === 'Médico' ? 'ALL_DOCTORS' : 'SPECIALTIES'); };
  const selectSpecialty = (spec: string) => { setBooking({ ...booking, specialty: spec }); if (booking.type === 'Presencial') setStep('LOCATIONS'); else setStep('FILTERED_DOCTORS'); };
  const selectLocation = (loc: string) => { setBooking({ ...booking, location: loc }); setStep('FILTERED_DOCTORS'); };
  const handleConfirm = () => setStep('SUCCESS');
  const handleCancel = () => { setStep('TYPE'); setBooking({ type: '', method: '', specialty: '', location: '', doctor: null, date: '', time: '' }); };

  const selectDoctor = (doc: Doctor) => {
    setBooking({ ...booking, doctor: doc, specialty: doc.specialty, location: booking.type === 'Virtual' ? 'Virtual' : doc.location });
    setStep('DATETIME');
  };

  const Header = ({ title, showBack }: { title: string, showBack?: boolean }) => (
    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      {showBack && <button onClick={() => setStep('TYPE')} style={{...buttonOutlineStyle, padding: '6px 12px', fontSize: '14px'}}>← Reiniciar</button>}
      <h2 style={{ margin: 0, color: '#002855' }}>{title}</h2>
    </div>
  );

  const OptionCard = ({ label, subLabel, onClick }: { label: string, subLabel?: string, onClick: () => void }) => (
    <div onClick={onClick} style={cardStyle}>
      <div style={{ fontWeight: 'bold', color: '#0056b3', fontSize: '16px' }}>{label}</div>
      {subLabel && <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{subLabel}</div>}
    </div>
  );

  if (isLoading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando datos de la clínica...</div>;

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
            {doctorsList.map(doc => <OptionCard key={doc.id} label={doc.name} subLabel={`${doc.specialty} - ${doc.location}`} onClick={() => selectDoctor(doc)} />)}
          </div>
        </div>
      )}

      {step === 'SPECIALTIES' && (
        <div>
          <Header title="Selecciona la especialidad" showBack />
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {specialtiesList.map(spec => <OptionCard key={spec} label={spec} onClick={() => selectSpecialty(spec)} />)}
          </div>
        </div>
      )}

      {step === 'LOCATIONS' && (
        <div>
          <Header title="Selecciona la sede presencial" showBack />
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {locationsList.map(loc => <OptionCard key={loc} label={loc} onClick={() => selectLocation(loc)} />)}
          </div>
        </div>
      )}

      {step === 'FILTERED_DOCTORS' && (
        <div>
          <Header title={`Médicos en ${booking.specialty}`} showBack />
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            {doctorsList.filter(d => d.specialty === booking.specialty).filter(d => booking.type === 'Virtual' || d.location === booking.location).map(doc => (
                <OptionCard key={doc.id} label={doc.name} subLabel={booking.type === 'Virtual' ? 'Atención Virtual' : doc.location} onClick={() => selectDoctor(doc)} />
            ))}
            {doctorsList.filter(d => d.specialty === booking.specialty).filter(d => booking.type === 'Virtual' || d.location === booking.location).length === 0 && (
              <p style={{color: 'red'}}>No hay médicos disponibles para esta selección.</p>
            )}
          </div>
        </div>
      )}

      {step === 'DATETIME' && (
        <div>
          <Header title="Selecciona Fecha y Hora" showBack />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>Fecha:</label>
              <input type="date" min={new Date().toISOString().split('T')[0]} style={inputStyle} onChange={(e) => setBooking({...booking, date: e.target.value})} />
            </div>
            {booking.date && (
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>Horas disponibles de {booking.doctor?.name}:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {booking.doctor && booking.doctor.schedule.split(',').map(t => (
                    <button key={t} onClick={() => { setBooking({...booking, time: t.trim()}); setStep('CONFIRMATION'); }} style={booking.time === t.trim() ? buttonStyle : buttonOutlineStyle}>
                      {t.trim()}
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

// Estilos
const cardStyle: React.CSSProperties = { padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#f8fafc' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const buttonStyle: React.CSSProperties = { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#0056b3', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
const buttonOutlineStyle: React.CSSProperties = { padding: '12px', borderRadius: '6px', border: '1px solid #0056b3', backgroundColor: 'transparent', color: '#0056b3', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };