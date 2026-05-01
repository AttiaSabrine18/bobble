import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Camera } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
function getToken(): string | null {
  try { return JSON.parse(localStorage.getItem('authTokens') || '{}')?.access ?? null; }
  catch { return null; }
}
function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

interface Project {
  id: number;
  pattern: number | null;
  pattern_title: string | null;
  status: 'en_cours' | 'termine' | 'defait' | 'hibernation';
  start_date: string | null;
  end_date: string | null;
  notes: string;
  images: { id: number; image: string; caption: string; is_main: boolean }[];
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  en_cours:    { label: 'En cours',        bg: 'hsla(18,52%,51%,0.12)',  color: 'hsl(18,52%,40%)'   },
  termine:     { label: 'Terminé',         bg: 'hsla(105,28%,50%,0.12)', color: 'hsl(105,35%,38%)'  },
  defait:      { label: 'Défait',          bg: 'hsla(0,60%,52%,0.12)',   color: 'hsl(0,60%,40%)'    },
  hibernation: { label: 'En hibernation',  bg: 'hsla(45,70%,50%,0.12)',  color: 'hsl(45,70%,38%)'   },
};

const Sk: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ background: 'linear-gradient(90deg,var(--color-muted) 25%,var(--color-surface) 50%,var(--color-muted) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: '0.5rem', ...style }} />
);

// ── Create project modal ───────────────────────────────────────────────────────
const CreateModal: React.FC<{ onClose: () => void; onCreated: (p: Project) => void }> = ({ onClose, onCreated }) => {
  const [patternTitle, setPatternTitle] = useState('');
  const [status, setStatus] = useState<Project['status']>('en_cours');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true); setErr('');
    try {
      const res = await fetch(`${API}/api/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status, notes, start_date: startDate || null }),
      });
      if (!res.ok) throw new Error();
      const created: Project = await res.json();
      onCreated(created);
      onClose();
    } catch { setErr('Impossible de créer le projet.'); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <div style={{ background: 'var(--color-background)', borderRadius: '1.5rem', padding: '2rem', maxWidth: '28rem', width: '100%', boxShadow: 'var(--shadow-warm-lg)' }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '1.5rem' }}>
          Nouveau projet
        </h2>
        {err && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'hsl(0,60%,45%)', marginBottom: '1rem' }}>{err}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-foreground)', marginBottom: '0.375rem' }}>Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value as Project['status'])} style={inp}>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-foreground)', marginBottom: '0.375rem' }}>Date de début</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-foreground)', marginBottom: '0.375rem' }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Matériaux, modifications, impressions…"
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-body)', cursor: 'pointer', color: 'var(--color-foreground)' }}>Annuler</button>
            <button onClick={save} disabled={saving} style={{ padding: '0.75rem 1.75rem', borderRadius: '999px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Enregistrement…' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
const ProjectJournal: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/projects/`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data.results ?? data);
    } catch { setError('Impossible de charger les projets.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = projects.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch = !search || (p.pattern_title || '').toLowerCase().includes(search.toLowerCase()) || p.notes.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const mainImg = (p: Project) => p.images.find(i => i.is_main) || p.images[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={p => setProjects(prev => [p, ...prev])} />}
      <Navbar />
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '7rem 1.5rem 5rem' }}>

        {/* Back */}
        <button onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2rem', padding: 0 }}>
          <ArrowLeft size={16} /> Retour à l'accueil
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Mes créations
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
              Journal de projets
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)', marginTop: '0.5rem' }}>
              {projects.length} projet{projects.length !== 1 ? 's' : ''} enregistré{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '999px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-warm)' }}>
            <Plus size={16} /> Ajouter un projet
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)' }} />
            <input type="text" placeholder="Rechercher un projet…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.7rem 1rem 0.7rem 2.5rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-foreground)', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Status filters */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {[['all', 'Tous'], ...Object.entries(STATUS_CONFIG).map(([v, c]) => [v, c.label])].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 500, background: filter === v ? 'var(--color-primary)' : 'var(--color-surface)', color: filter === v ? '#fff' : 'var(--color-muted-foreground)', transition: 'all 0.15s' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '2rem', background: 'var(--color-card)', borderRadius: '1rem', marginBottom: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'hsl(0,60%,45%)' }}>
            {error} <button onClick={load} style={{ marginLeft: '0.5rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontFamily: 'var(--font-body)' }}>Réessayer</button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--color-card)', borderRadius: '1.25rem', overflow: 'hidden' }}>
                <Sk style={{ height: '11rem', borderRadius: 0 }} />
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Sk style={{ height: '1.1rem', width: '70%' }} />
                  <Sk style={{ height: '0.875rem', width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.5rem' }}>
              {projects.length === 0 ? 'Aucun projet pour l\'instant' : 'Aucun résultat'}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)', marginBottom: '1.5rem' }}>
              {projects.length === 0 ? 'Créez votre premier projet pour commencer.' : 'Modifiez vos filtres.'}
            </p>
            {projects.length === 0 && (
              <button onClick={() => setShowCreate(true)} style={{ padding: '0.75rem 1.75rem', borderRadius: '999px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Ajouter un projet
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem' }}>
            {displayed.map(p => {
              const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.en_cours;
              const img = mainImg(p);
              return (
                <div key={p.id} className="card-hover" style={{ background: 'var(--color-card)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: 'var(--shadow-warm)', cursor: 'pointer', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                  {/* Image / placeholder */}
                  <div style={{ height: '11rem', background: 'var(--color-muted)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {img
                      ? <img src={imgUrl(img.image)} alt={img.caption || p.pattern_title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Camera size={32} style={{ color: 'var(--color-muted-foreground)', opacity: 0.4 }} />
                    }
                    <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: st.bg, color: st.color, padding: '0.25rem 0.625rem', borderRadius: '999px' }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0, lineHeight: 1.3 }}>
                      {p.pattern_title || 'Projet sans patron'}
                    </h3>
                    {p.notes && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-muted-foreground)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.notes}
                      </p>
                    )}
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      {p.start_date ? `Commencé le ${new Date(p.start_date).toLocaleDateString('fr-FR')}` : `Créé le ${new Date(p.created_at).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProjectJournal;