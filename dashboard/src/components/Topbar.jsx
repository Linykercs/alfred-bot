import { monthLong } from '../utils/format.js';

export default function Topbar({ month, onPrevMonth, onNextMonth, onToggleTheme, userName }) {
  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <header className="topbar">
      <div className="topbar__greet">
        <span className="t-label">{greet()}</span>
        <h1 className="t-h1">Olá, {userName || 'Alfred'} 👋</h1>
      </div>
      <div className="topbar__actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn--secondary btn--icon" onClick={onPrevMonth} aria-label="Mês anterior" style={{ padding: '8px 10px', width: 'auto', height: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button className="month-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="17" rx="2"/>
              <path d="M3 9h18M8 2v4M16 2v4"/>
            </svg>
            {monthLong(month)}
          </button>
          <button className="btn btn--secondary btn--icon" onClick={onNextMonth} aria-label="Próximo mês" style={{ padding: '8px 10px', width: 'auto', height: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
        <button className="theme-toggle" onClick={onToggleTheme} aria-label="Alternar tema">
          <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
          </svg>
          <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
