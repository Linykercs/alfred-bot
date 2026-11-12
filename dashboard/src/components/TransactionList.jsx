import { currency } from '../utils/format.js';
import { catKey } from '../utils/categories.js';

const CAT_ICONS = {
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M15 3c-1.5 1-2 3-2 5s.5 3 2 3h1V3z"/>
    </svg>
  ),
  transport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 16 6.5 8.5A2 2 0 0 1 8.5 7h7a2 2 0 0 1 2 1.5L19 16M5 16h14M5 16v3M19 16v3"/>
      <circle cx="8" cy="16" r="0.1"/><circle cx="16" cy="16" r="0.1"/>
    </svg>
  ),
  housing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-7 9 7M5 10v10h14V10"/>
    </svg>
  ),
  health: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2 5 4-11 2 6h6"/>
    </svg>
  ),
  leisure: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>
    </svg>
  ),
  education: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10 12 4l10 6-10 6Z"/><path d="M6 12v5a6 6 0 0 0 12 0v-5"/>
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9.5c2-1.3 4.5-1 6 .5M9 12.5c1.5-1 3.5-.7 4.8.5M9 15c1-.6 2.3-.5 3.3.3"/>
    </svg>
  ),
};

function formatDate(dateStr) {
  const [d, m] = dateStr.split('/');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d} ${months[parseInt(m, 10) - 1]}`;
}

export default function TransactionList({ transactions, limit = 8 }) {
  const items = transactions.slice(0, limit);

  return (
    <article className="card" id="transacoes">
      <div className="card__head">
        <h2 className="card__title">Transações recentes</h2>
        <span className="t-caption" style={{ color: 'var(--text-3)' }}>
          {transactions.length} registros
        </span>
      </div>
      <div className="transaction-list">
        {!items.length && (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>
            Nenhuma transação neste período
          </div>
        )}
        {items.map((t) => {
          const key = catKey(t.categoria);
          return (
            <div key={t.id} className="transaction">
              <span className="transaction__icon" data-cat={key}>
                {CAT_ICONS[key] || CAT_ICONS.other}
              </span>
              <div className="transaction__main">
                <span className="transaction__desc">{t.descricao}</span>
                <span className="transaction__sub">
                  <span className="category-pill" data-cat={key}>
                    <span className="dot"></span>{t.categoria}
                  </span>
                  <span>{formatDate(t.data)}</span>
                </span>
              </div>
              <span className="transaction__amount num">−{currency(t.valor)}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
