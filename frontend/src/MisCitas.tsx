import React, { useState, useEffect } from 'react';

interface Appointment {
  id: number;
  doctor_name: string;
  specialty: string;
  location: string;
  date: string;
  time: string;
  type: string;
}

export default function MisCitas({ userEmail }: { userEmail: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/appointments/${userEmail}`);
        if (!response.ok) throw new Error('Error al cargar las citas');
        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userEmail) {
      fetchAppointments();
    }
  }, [userEmail]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando tus citas...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#002855', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>Mis Citas Programadas</h2>
      
      {appointments.length === 0 ? (
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗓️</div>
          <h3 style={{ color: '#64748b' }}>Aún no tienes citas agendadas</h3>
          <p style={{ color: '#94a3b8' }}>Utiliza el botón de agendar cita en el menú principal para programar tu primera atención.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {appointments.map(appt => {
            // --- LÓGICA DE COLORES DINÁMICOS PARA MEJORAR EL CONTRASTE ---
            const isVirtual = appt.type === 'Virtual';
            const borderLeftColor = isVirtual ? '#3b82f6' : '#10b981'; // Azul o Verde fuerte
            const bgDateColor = isVirtual ? '#eff6ff' : '#ecfdf5';     // Fondo Azul o Verde muy claro
            const borderDateColor = isVirtual ? '#bfdbfe' : '#a7f3d0'; // Borde delineado sutil
            
            return (
              <div key={appt.id} style={{ 
                backgroundColor: '#fff', 
                padding: '20px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // Sombra ligeramente más fuerte
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderLeft: `6px solid ${borderLeftColor}` 
              }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px' }}>{appt.specialty}</h3>
                  <p style={{ margin: '0 0 4px 0', color: '#475569', fontWeight: 'bold' }}>{appt.doctor_name}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                    {appt.type} {appt.type === 'Presencial' ? `📍 ${appt.location}` : '💻 Link será enviado al correo'}
                  </p>
                </div>
                
                {/* CUADRO DE FECHA/HORA CON MEJOR CONTRASTE */}
                <div style={{ 
                  textAlign: 'right', 
                  backgroundColor: bgDateColor, 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: `1px solid ${borderDateColor}` 
                }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '16px' }}>📅 {appt.date}</div>
                  <div style={{ color: isVirtual ? '#2563eb' : '#059669', fontWeight: 'bold', marginTop: '4px' }}>⏰ {appt.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}