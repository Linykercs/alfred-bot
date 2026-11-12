import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import SetName from './pages/SetName.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import CategoryChart from './components/CategoryChart.jsx';
import TrendChart from './components/TrendChart.jsx';
import TransactionList from './components/TransactionList.jsx';
import BudgetPanel from './components/BudgetPanel.jsx';
import { useData, formatMonth } from './hooks/useData.js';

function prevMonthStr(m) {
  const [y, mo] = m.split('-').map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;
}

function nextMonthStr(m) {
  const [y, mo] = m.split('-').map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
}

function Dashboard() {
  const { session, logout } = useAuth();
  const [month, setMonth] = useState(() => formatMonth(new Date()));

  const { summary, transactions, trends, loading, error } = useData(month, session.token);
  const { summary: prevSummary } = useData(prevMonthStr(month), session.token);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('alfred-theme', next); } catch(e) {}
  }, []);

  return (
    <div className="app">
      <Sidebar userName={session.name} onLogout={logout} />

      <main className="main">
        <Topbar
          month={month}
          onPrevMonth={() => setMonth(prevMonthStr(month))}
          onNextMonth={() => setMonth(nextMonthStr(month))}
          onToggleTheme={toggleTheme}
          userName={session.name}
        />

        {error && (
          <div style={{
            background: 'var(--red-soft)', color: 'var(--red)',
            border: '1px solid var(--red)', borderRadius: 'var(--r-md)',
            padding: '12px 16px', marginBottom: 24, fontSize: 13,
          }}>
            Erro ao carregar dados: {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '60px 0' }}>
            Carregando...
          </div>
        ) : (
          <>
            <SummaryCards summary={summary} prevSummary={prevSummary} />
            <section className="grid-charts fade-in">
              <CategoryChart summary={summary} month={month} />
              <TrendChart trends={trends} />
            </section>
            <section className="grid-bottom fade-in">
              <TransactionList transactions={transactions} />
              <BudgetPanel summary={summary} />
            </section>
          </>
        )}
      </main>

      <nav className="mobile-bar">
        <a href="#" className="is-active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5"/>
            <rect x="14" y="3" width="7" height="5" rx="1.5"/>
            <rect x="14" y="12" width="7" height="9" rx="1.5"/>
            <rect x="3" y="16" width="7" height="5" rx="1.5"/>
          </svg>
          Início
        </a>
        <a href="#transacoes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14a1 1 0 0 1 1 1v17l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 0 1 1-1Z"/>
            <path d="M9 8h6M9 12h6"/>
          </svg>
          Extrato
        </a>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 540, cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sair
        </button>
      </nav>
    </div>
  );
}

function AppRouter() {
  const { session } = useAuth();
  if (!session) return <Login />;
  if (!session.name) return <SetName />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
