import React, { useState } from 'react';
import AgendarCita from './AgendarCita';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ViewState = 'login' | 'register' | 'chat' | 'agendar';

export default function App() {
  const [view, setView] = useState<ViewState>('login');
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de la Clínica Internacional. Cuéntame qué síntomas tienes o utiliza los botones de simulación rápida para ayudarte.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = view === 'login' ? '/api/login' : '/api/register';
    const bodyData = view === 'login' 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error en la autenticación');
      setAuthPassword('');
      setView('chat');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      const data = await response.json();
      setMessages([...updatedMessages, { role: 'assistant', content: data.content }]);
    } catch (error) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Lo siento, hubo un problema al conectar.' }]);
    } finally {
      setLoading(false);
    }
  };

  const simulateAction = (type: 'sintomas' | 'pdf') => {
    if (type === 'sintomas') sendMessage("Tengo un fuerte dolor de estómago desde ayer por la noche, me dan náuseas al comer.");
    else sendMessage("[Simulación de Archivo PDF Adjunto: Examen_Laboratorio_Glucosa.pdf]\nContenido extraído del PDF:\n- Glucosa en ayunas: 135 mg/dL\n- Rango de referencia normal: 70 - 100 mg/dL");
  };

  if (view === 'login' || view === 'register') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', color: '#0056b3', marginBottom: '24px' }}>Clínica Internacional</h2>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>{view === 'login' ? 'Iniciar Sesión' : 'Registro de Paciente'}</h3>
          {authError && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{authError}</div>}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {view === 'register' && <input type="text" placeholder="Nombres Completos" required style={inputStyle} value={authName} onChange={(e) => setAuthName(e.target.value)} />}
            <input type="email" placeholder="Correo Electrónico" required style={inputStyle} value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" required style={inputStyle} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
            <button type="submit" style={buttonStyle}>{view === 'login' ? 'Ingresar' : 'Registrarse'}</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#666' }}>
            {view === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <span style={{ color: '#0056b3', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setView(view === 'login' ? 'register' : 'login'); setAuthError(''); }}>
              {view === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f7fb', fontFamily: 'Arial, sans-serif' }}>
      
      {/* BARRA LATERAL */}
      <div style={{ width: '300px', backgroundColor: '#002855', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ margin: 0, borderBottom: '1px solid #ffffff33', paddingBottom: '10px' }}>Pasaporte Digital</h3>
        
        <button onClick={() => setView('agendar')} style={{ ...mockButtonStyle, backgroundColor: '#2563eb', fontWeight: 'bold' }}>
          📅 Agendar Cita (Nuevo)
        </button>
        <button onClick={() => { setView('chat'); simulateAction('sintomas'); }} style={mockButtonStyle}>
          📋 Simular Triage
        </button>
        <button onClick={() => { setView('chat'); simulateAction('pdf'); }} style={mockButtonStyle}>
          📄 Simular PDF
        </button>
        
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => { setView('login'); setAuthPassword(''); }} style={{ ...mockButtonStyle, backgroundColor: '#dc2626' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL (Se alterna entre Chat y AgendarCita) */}
      {view === 'agendar' ? (
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <AgendarCita onCancel={() => setView('chat')} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: 0, color: '#0056b3', fontSize: '20px' }}>Asistente Virtual de Triage y Orientación</h2>
            <span style={{ fontSize: '12px', color: '#22c55e' }}>● En línea</span>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: '12px', lineHeight: '1.5', fontSize: '15px', whiteSpace: 'pre-line', backgroundColor: msg.role === 'user' ? '#0056b3' : '#fff', color: msg.role === 'user' ? '#fff' : '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#e2e8f0', color: '#666', fontSize: '14px' }}>Procesando...</div>
              </div>
            )}
          </div>

          <div style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="text" placeholder="Escribe tus síntomas..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)} style={{ ...inputStyle, flex: 1 }} disabled={loading} />
              <button onClick={() => sendMessage(input)} style={{ ...buttonStyle, width: '100px' }} disabled={loading}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos
const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', outline: 'none' };
const buttonStyle: React.CSSProperties = { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#0056b3', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
const mockButtonStyle: React.CSSProperties = { padding: '12px', borderRadius: '6px', border: '1px solid #ffffff44', backgroundColor: '#ffffff1a', color: '#fff', fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' };