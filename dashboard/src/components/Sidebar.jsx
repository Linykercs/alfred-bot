export default function Sidebar({ userName, userPhone, onLogout }) {
  return (
    <aside className="sidebar">
      <a className="logo sidebar__brand" href="#">
        <span className="logo__mark">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5.5 19 12 4.5 18.5 19" stroke="#07140E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.7 13.4H15.3" stroke="#07140E" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="logo__word">Alfred</span>
      </a>

      <nav className="sidebar__nav">
        <a className="nav-item is-active" href="#">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5"/>
            <rect x="14" y="3" width="7" height="5" rx="1.5"/>
            <rect x="14" y="12" width="7" height="9" rx="1.5"/>
            <rect x="3" y="16" width="7" height="5" rx="1.5"/>
          </svg>
          Dashboard
        </a>
        <a className="nav-item" href="#transacoes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14a1 1 0 0 1 1 1v17l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 0 1 1-1Z"/>
            <path d="M9 8h6M9 12h6"/>
          </svg>
          Transações
        </a>
      </nav>

      <div className="sidebar__foot">
        <div className="status-chip" style={{ marginBottom: 12 }}>
          <span className="dot"></span>WhatsApp conectado
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.4 }}>
          Desenvolvido por<br/>Linyker Mendes &amp; Felipe Gandour
        </div>
        <div className="user-chip" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="avatar">{(userName || 'U')[0].toUpperCase()}</span>
            <span style={{ fontSize: 13, fontWeight: 560 }}>{userName || 'Usuário'}</span>
          </div>
          {onLogout && (
            <button onClick={onLogout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4, borderRadius: 'var(--r-sm)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
