import { shortCurrency, monthLabel } from '../utils/format.js';

const W = 320;
const H = 140;
const PAD_X = 20;
const PAD_Y = 15;

function toPoints(trends) {
  if (!trends?.length) return [];
  const values = trends.map(t => t.total);
  const max = Math.max(...values) || 1;
  const min = Math.min(...values);
  const range = max - min || 1;

  return trends.map((t, i) => {
    const x = PAD_X + (i / (trends.length - 1)) * (W - PAD_X * 2);
    const y = PAD_Y + (1 - (t.total - min) / range) * (H - PAD_Y * 2 - 10);
    return { x, y, ...t };
  });
}

export default function TrendChart({ trends }) {
  const pts = toPoints(trends);

  if (!pts.length) {
    return (
      <article className="card card--pad-lg">
        <div className="card__head">
          <h2 className="card__title">Evolução · últimos 6 meses</h2>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>Sem histórico</div>
      </article>
    );
  }

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last  = pts[pts.length - 1];
  const first = pts[0];
  const going = last.total <= first.total;
  const fillPath = pathD + ` L${last.x.toFixed(1)} ${H} L${pts[0].x.toFixed(1)} ${H} Z`;

  return (
    <article className="card card--pad-lg">
      <div className="card__head">
        <h2 className="card__title">Evolução · últimos 6 meses</h2>
        <span className={`delta delta--${going ? 'up' : 'down'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {going
              ? <path d="M12 19V5M5 12l7-7 7 7"/>
              : <path d="M12 5v14M5 12l7 7 7-7"/>
            }
          </svg>
          {going ? 'gastando menos' : 'gastando mais'}
        </span>
      </div>
      <div className="trend-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--green)" stopOpacity=".22"/>
              <stop offset="100%" stopColor="var(--green)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {[0.15, 0.5, 0.85].map((f, i) => {
            const y = (PAD_Y + f * (H - PAD_Y * 2)).toFixed(1);
            return <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4"/>;
          })}
          <path d={fillPath} fill="url(#trendFill)"/>
          <path d={pathD} fill="none" stroke="var(--green)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x.toFixed(1)}
              cy={p.y.toFixed(1)}
              r={i === pts.length - 1 ? 4.2 : 2.6}
              fill="var(--green)"
              stroke={i === pts.length - 1 ? 'var(--surface)' : 'none'}
              strokeWidth={i === pts.length - 1 ? 2.5 : 0}
            >
              <title>{monthLabel(p.month)}: {shortCurrency(p.total)}</title>
            </circle>
          ))}
        </svg>
        <div className="trend-axis">
          {pts.map(p => <span key={p.month}>{monthLabel(p.month)}</span>)}
        </div>
      </div>
    </article>
  );
}
