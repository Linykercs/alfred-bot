import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export function formatMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function useData(month, token) {
  const [summary, setSummary]    = useState(null);
  const [transactions, setTrans] = useState([]);
  const [trends, setTrends]      = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [s, t, tr] = await Promise.all([
        fetch(`${API}/api/summary?month=${month}`, { headers }).then(r => r.json()),
        fetch(`${API}/api/transactions?month=${month}`, { headers }).then(r => r.json()),
        fetch(`${API}/api/trends?months=6`, { headers }).then(r => r.json()),
      ]);
      setSummary(s);
      setTrans(t);
      setTrends(tr);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month, token]);

  useEffect(() => { load(); }, [load]);

  return { summary, transactions, trends, loading, error, reload: load };
}
