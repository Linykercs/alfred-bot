import { currency } from '../utils/format.js';
import { catKey, catSwatch } from '../utils/categories.js';
import { monthLabel } from '../utils/format.js';

const CAT_VARS = {
  food:      'var(--cat-food)',
  transport: 'var(--cat-transport)',
  housing:   'var(--cat-housing)',
  health:    'var(--cat-health)',
  leisure:   'var(--cat-leisure)',
  education: 'var(--cat-education)',
  other:     'var(--cat-other)',
};

function buildSegments(categories) {
  const total = categories.reduce((s, c) => s + c.total, 0);
  const segments = [];
  let offset = 25;
  for (const cat of categories) {
    const pct = (cat.total / total) * 100;
    segments.push({ ...cat, pct, offset });
    offset += pct;
    if (offset >= 100) offset -= 100;
  }
  return segments;
}

export default function CategoryChart({ summary, month }) {
  if (!summary || !summary.categories?.length) {
    return (
      <article className="card card--pad-lg">
        <div className="card__head">
          <h2 className="card__title">Gastos por categoria</h2>
          <span className="t-caption">{month ? monthLabel(month) : ''}</span>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>Sem dados</div>
      </article>
    );
  }

  const { categories, total } = summary;
  const segs = buildSegments(categories);

  return (
    <article className="card card--pad-lg">
      <div className="card__head">
        <h2 className="card__title">Gastos por categoria</h2>
        <span className="t-caption">{month ? monthLabel(month) : ''}</span>
      </div>
      <div className="category-chart">
        <div className="donut">
          <svg viewBox="0 0 36 36">
            {segs.map((seg) => {
              const key  = catKey(seg.name);
              const fill = CAT_VARS[key] || 'var(--cat-other)';
              return (
                <circle
                  key={seg.name}
                  className="donut__seg"
                  cx="18" cy="18" r="15.9155"
                  fill="none"
                  stroke={fill}
                  strokeWidth="4"
                  strokeDasharray={`${seg.pct.toFixed(2)} ${(100 - seg.pct).toFixed(2)}`}
                  strokeDashoffset={100 - seg.offset + 25}
                  transform="rotate(-90 18 18)"
                />
              );
            })}
          </svg>
          <div className="donut__center">
            <span className="v num">{currency(total)}</span>
            <span className="l">total</span>
          </div>
        </div>

        <div className="chart-legend">
          {segs.map((seg) => {
            const key = catKey(seg.name);
            return (
              <div key={seg.name} className="legend-row">
                <span className={`swatch ${catSwatch(seg.name)}`}></span>
                <span className="name">{seg.name}</span>
                <span className="pct num">{Math.round(seg.pct)}%</span>
                <span className="amt num">{currency(seg.total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
