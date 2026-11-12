import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || '';

export default function SetName() {
  const { session, updateName } = useAuth();
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/api/me/name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      updateName(data.name);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboard">
      <div className="onboard__card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <h1 className="t-h2">Bem-vindo ao Alfred!</h1>
          <p className="t-body" style={{ color: 'var(--text-2)', marginTop: 8 }}>
            Como posso te chamar?
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 20 }}>
            <label className="field__label">Seu nome</label>
            <div className="input">
              <input
                type="text"
                placeholder="Ex: João"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            className="btn btn--primary btn--block btn--lg"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Salvando...' : 'Começar →'}
          </button>
        </form>
      </div>
    </div>
  );
}
