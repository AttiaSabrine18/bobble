import React, { useState, useEffect } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HISTORY_KEY = 'bobble_search_history';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<{ patterns: any[]; users: any[] }>({ patterns: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'patterns' | 'users'>('patterns');
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced.trim()) { setResults({ patterns: [], users: [] }); return; }
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/search/?q=${encodeURIComponent(debounced)}`, {
      headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('authTokens')||'{}')?.access}` },
    })
      .then(r => r.json())
      .then(d => { setResults(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debounced]);

  const saveHistory = (q: string) => {
    const updated = [q, ...history.filter(h => h !== q)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(HISTORY_KEY); };

  const Tab: React.FC<{ id: typeof tab; label: string; count: number }> = ({ id, label, count }) => (
    <button onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, background: tab === id ? 'var(--color-primary)' : 'transparent', color: tab === id ? '#fff' : 'var(--color-muted-foreground)', transition: 'all 0.2s' }}>
      {label}
      <span style={{ padding: '0.1rem 0.5rem', borderRadius: '999px', background: tab === id ? 'rgba(255,255,255,0.25)' : 'var(--color-muted)', fontSize: '0.75rem' }}>{count}</span>
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '7rem 1.5rem 5rem' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em', marginBottom: '2rem' }}>Recherche</h1>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)' }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && query.trim() && saveHistory(query.trim())}
            placeholder="Patrons, créateurs, laines…"
            style={{ width: '100%', padding: '1rem 3rem 1rem 3.25rem', borderRadius: '999px', border: '2px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search history */}
        {!query && history.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)' }}>Recherches récentes</p>
              <button onClick={clearHistory} style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Effacer</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {history.map(h => (
                <button key={h} onClick={() => setQuery(h)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '999px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-foreground)', cursor: 'pointer' }}>
                  <Clock size={12} style={{ color: 'var(--color-muted-foreground)' }} />{h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)' }}>Recherche en cours…</div>
        )}

        {/* Results */}
        {!loading && debounced && (
          <>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.75rem', background: 'var(--color-card)', padding: '0.375rem', borderRadius: '999px', border: '1px solid var(--color-border)', width: 'fit-content' }}>
              <Tab id="patterns" label="Patrons" count={results.patterns.length} />
              <Tab id="users" label="Créateurs" count={results.users.length} />
            </div>

            {tab === 'patterns' && (
              results.patterns.length === 0
                ? <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)', textAlign: 'center', padding: '3rem' }}>Aucun patron trouvé pour "{debounced}"</p>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem' }}>
                    {results.patterns.map((p: any) => (
                      <div key={p.id} onClick={() => { saveHistory(debounced); navigate(`/patterns/${p.id}`); }} style={{ cursor: 'pointer', borderRadius: '0.875rem', overflow: 'hidden', background: 'var(--color-card)', boxShadow: 'var(--shadow-warm)' }}>
                        <div style={{ paddingBottom: '100%', position: 'relative' }}><img src={p.image} alt={p.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                        <div style={{ padding: '0.75rem' }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-foreground)' }}>{p.title}</p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>par {p.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
            )}

            {tab === 'users' && (
              results.users.length === 0
                ? <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)', textAlign: 'center', padding: '3rem' }}>Aucun créateur trouvé pour "{debounced}"</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {results.users.map((u: any) => (
                      <div key={u.id} onClick={() => { saveHistory(debounced); navigate(`/profile/${u.username}`); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--color-card)', borderRadius: '0.875rem', border: '1px solid var(--color-border)', transition: 'box-shadow 0.2s' }}>
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '999px', overflow: 'hidden', background: 'var(--color-muted)', flexShrink: 0 }}>
                          {u.image ? <img src={u.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', color: 'var(--color-muted-foreground)' }}>{u.username[0].toUpperCase()}</div>}
                        </div>
                        <div>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-foreground)', fontSize: '0.9375rem' }}>{u.full_name || u.username}</p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-muted-foreground)' }}>@{u.username} · {u.patterns_count ?? 0} patrons</p>
                        </div>
                      </div>
                    ))}
                  </div>
            )}
          </>
        )}

        {/* Empty initial state */}
        {!query && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-body)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-foreground)', marginBottom: '0.5rem' }}>Que cherchez-vous ?</p>
            <p>Tapez le nom d'un patron, d'un créateur ou d'une laine.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;