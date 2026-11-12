function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  const t = today();
  if (isoDate === t) return 'hoje';
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (isoDate === yesterday) return 'ontem';
  return `${d}/${m}`;
}

// DD/MM/YYYY → YYYY-MM-DD
function fromDisplayDate(brDate) {
  const [d, m, y] = brDate.split('/');
  return `${y}-${m}-${d}`;
}

function formatDatetime(isoString) {
  const d = new Date(isoString);
  const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const h    = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  const time = min === '00' ? `${h}h` : `${h}h${min}`;
  return `${days[d.getDay()]} às ${time}`;
}

module.exports = { today, formatDate, fromDisplayDate, formatDatetime };
