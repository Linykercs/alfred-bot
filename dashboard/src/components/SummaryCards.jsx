import { currency } from '../utils/format.js';
import { catKey } from '../utils/categories.js';

function SummaryCard({ label, icon, children, meta }) {
  return (
    <article className="summary-card">
      <div className="summary-card__top">
        <span className="summary-card__label">{label}</span>
        <span className="summary-card__icon">{icon}</span>
      </div>
      {children}
      {meta && <div className="summary-card__meta">{meta}</div>}
    </article>
  );
}

function Delta({ value, suffix }) {
  const up = value >= 0;
  return (
    <span className={`delta delta--${up ? 'up' : 'down'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {up
          ? <path d="M12 19V5M5 12l7-7 7 7"/>
          : <path d="M12 5v14M5 12l7 7 7-7"/>
        }
      </svg>
      {up ? '+' : ''}{value}{suffix}
    </span>
  );
}

export default function SummaryCards({ summary, prevSummary }) {
  if (!summary) {
    return (
      <section className="summary-grid fade-in">
        {[1,2,3,4].map(i => (
          <article key={i} className="summary-card" style={{ minHeight: 120 }}>
            <div style={{ background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', height: 12, width: '60%', marginTop: 8 }}/>
            <div style={{ background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', height: 28, width: '80%', marginTop: 12 }}/>
          </article>
        ))}
      </section>
    );
  }

  const { total, categories = [], count } = summary;
  const topCat = categories[0];

  const diff = prevSummary ? total - prevSummary.total : null;
  const pct  = prevSummary && prevSummary.total > 0 ? ((diff / prevSummary.total) * 100).toFixed(1) : null;

  const score = Math.min(100, Math.max(0, Math.round(100 - (total / 3000) * 100)));

  return (
    <section className="summary-grid fade-in">
      {/* Total do mês */}
      <SummaryCard
        label="Total do mês"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>
            <path d="M3 7V5a1 1 0 0 1 1-1h13l4 3"/>
            <circle cx="17" cy="13.5" r="1.4" fill="currentColor"/>
          </svg>
        }
        meta={<span>{categories.length} categoria{categories.length !== 1 ? 's' : ''} · {count} transaç{count !== 1 ? 'ões' : 'ão'}</span>}
      >
        <div className="summary-card__value num">
          {currency(total).replace('R$ ', 'R$ ').split(',')[0]}
          <small>,{currency(total).split(',')[1]}</small>
        </div>
      </SummaryCard>

      {/* Maior categoria */}
      <SummaryCard
        label="Maior categoria"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a9 9 0 1 0 9 9h-9Z"/>
            <path d="M12 3v9h9A9 9 0 0 0 12 3Z" opacity=".4"/>
          </svg>
        }
        meta={topCat ? <span className="num"><b style={{ color: 'var(--text)', fontSize: 15 }}>{currency(topCat.total)}</b>&nbsp;·&nbsp;{topCat.percent}% do total</span> : null}
      >
        {topCat ? (
          <div className="row gap-2" style={{ marginTop: 2 }}>
            <span className={`category-pill`} data-cat={catKey(topCat.name)}>
              <span className="dot"></span>{topCat.name}
            </span>
          </div>
        ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Sem dados</div>}
      </SummaryCard>

      {/* vs mês anterior */}
      <SummaryCard
        label="vs. mês anterior"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 7 6 6 4-4 8 8"/>
            <path d="M21 17v-6h-6"/>
          </svg>
        }
        meta={
          pct !== null ? (
            <span className="row gap-2">
              <Delta value={parseFloat(pct)} suffix="%" />
              <span>{parseFloat(pct) <= 0 ? 'gastou menos 👏' : 'gastou mais'}</span>
            </span>
          ) : <span style={{ color: 'var(--text-3)' }}>Sem histórico</span>
        }
      >
        {pct !== null ? (
          <div className={`summary-card__value num ${parseFloat(pct) <= 0 ? 'text-green' : 'text-red'}`} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            {parseFloat(pct) <= 0 ? '−' : '+'}{Math.abs(parseFloat(pct)).toFixed(1).replace('.', ',')}
            <small style={{ color: parseFloat(pct) <= 0 ? 'var(--green)' : 'var(--red)' }}>%</small>
          </div>
        ) : (
          <div className="summary-card__value num text-green">—</div>
        )}
      </SummaryCard>

      {/* Saúde financeira */}
      <SummaryCard
        label="Saúde financeira"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l2 5 4-11 2 6h6"/>
          </svg>
        }
      >
        <div className="score-gauge" style={{ marginTop: 2 }}>
          <div className="gauge">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--surface-3)" strokeWidth="3.4"/>
              <circle
                cx="18" cy="18" r="15.9155" fill="none"
                stroke="var(--green)" strokeWidth="3.4" strokeLinecap="round"
                strokeDasharray={`${score} ${100 - score}`}
                strokeDashoffset="25"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="gauge__center">
              <span className="v num">{score}</span>
              <span className="l">/100</span>
            </div>
          </div>
          <div className="stack gap-1">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {score >= 70 ? 'Ótimo! 🎉' : score >= 50 ? 'Razoável' : 'Atenção ⚠️'}
            </span>
          </div>
        </div>
      </SummaryCard>
    </section>
  );
}
