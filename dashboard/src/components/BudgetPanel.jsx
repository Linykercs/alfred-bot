import { currency } from '../utils/format.js';
import { catSwatch } from '../utils/categories.js';

function budgetStatus(pct) {
  if (pct >= 50) return 'warn';
  return 'ok';
}

function statusLabel(pct) {
  if (pct >= 50) return 'Principal';
  return 'Secundário';
}

export default function BudgetPanel({ summary }) {
  const categories = summary?.categories || [];

  return (
    <article className="card">
      <div className="card__head">
        <h2 className="card__title">Distribuição</h2>
      </div>

      {!categories.length && (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>
          Sem dados
        </div>
      )}

      {categories.map((cat) => {
        const pct    = cat.percent;
        const status = budgetStatus(pct);
        const sw     = catSwatch(cat.name);

        return (
          <div key={cat.name} className="budget-bar" data-status={status}>
            <div className="budget-bar__head">
              <span className="budget-bar__name">
                <span className={`swatch ${sw}`}></span>
                {cat.name}
              </span>
              <span className={`budget-bar__pct ${pct >= 100 ? 'text-red' : 'text-2'}`}>{pct}%</span>
            </div>
            <div className="budget-bar__track">
              <div className="budget-bar__fill" style={{ width: `${Math.min(pct, 100)}%` }}></div>
            </div>
            <div className="budget-bar__foot">
              <span className="budget-bar__values">
                <b>{currency(cat.total)}</b>
              </span>
              <span className="budget-status" data-status={status}>{statusLabel(pct)}</span>
            </div>
          </div>
        );
      })}
    </article>
  );
}
