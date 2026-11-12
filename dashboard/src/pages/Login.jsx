import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || '';

export default function Login() {
  const { login } = useAuth();
  const [step, setStep]       = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone]     = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSendCode(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao enviar código');
      setStep('code');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Código inválido');
      login(data.token, data.userId, data.name);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboard">
      <div className="onboard__card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <span className="logo__mark logo__mark--lg">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5.5 19 12 4.5 18.5 19" stroke="#07140E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.7 13.4H15.3" stroke="#07140E" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
          </span>
          <div style={{ textAlign: 'center' }}>
            <div className="logo__word logo__word--lg">Alfred</div>
            <div className="t-caption" style={{ marginTop: 4 }}>Assistente financeiro pessoal</div>
          </div>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendCode}>
            <div className="field" style={{ marginBottom: 20 }}>
              <label className="field__label">Seu número do WhatsApp</label>
              <div className="input">
                <span className="input__prefix">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  +55
                </span>
                <input
                  type="tel"
                  placeholder="34 9 9706-0732"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoFocus
                  inputMode="numeric"
                />
              </div>
              <span className="t-caption" style={{ color: 'var(--text-3)' }}>
                O mesmo número que você usa para mandar mensagem ao Alfred
              </span>
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button
              type="submit"
              className="btn btn--primary btn--block btn--lg"
              disabled={loading || !phone.trim()}
            >
              {loading ? 'Enviando...' : 'Enviar código via WhatsApp'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="t-body" style={{ color: 'var(--text-2)' }}>
                Enviamos um código de 6 dígitos para o WhatsApp
              </div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>+55 {phone}</div>
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label className="field__label">Código de verificação</label>
              <div className="input">
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                  inputMode="numeric"
                  style={{ letterSpacing: '0.25em', fontSize: 22, textAlign: 'center' }}
                />
              </div>
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button
              type="submit"
              className="btn btn--primary btn--block btn--lg"
              disabled={loading || code.length < 6}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--block"
              style={{ marginTop: 8 }}
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            >
              Trocar número
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
