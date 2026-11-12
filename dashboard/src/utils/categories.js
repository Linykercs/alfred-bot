export const CAT_MAP = {
  'Alimentação': { key: 'food',      swatch: 'sw-food',      icon: 'food' },
  'Transporte':  { key: 'transport', swatch: 'sw-transport', icon: 'transport' },
  'Moradia':     { key: 'housing',   swatch: 'sw-housing',   icon: 'housing' },
  'Saúde':       { key: 'health',    swatch: 'sw-health',    icon: 'health' },
  'Lazer':       { key: 'leisure',   swatch: 'sw-leisure',   icon: 'leisure' },
  'Educação':    { key: 'education', swatch: 'sw-education', icon: 'education' },
};

export function catKey(name) {
  return CAT_MAP[name]?.key || 'other';
}

export function catSwatch(name) {
  return CAT_MAP[name]?.swatch || 'sw-other';
}
