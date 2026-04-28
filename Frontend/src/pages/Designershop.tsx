import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, Star, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DesignerShop: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [designer, setDesigner] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/profiles/${username}/`, { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('authTokens')||'{}')?.access}` } }).then(r => r.json()),
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/patterns/?author__username=${username}`, { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('authTokens')||'{}')?.access}` } }).then(r => r.json()),
    ]).then(([profile, pats]) => {
      setDesigner(profile);
      setPatterns(pats.results ?? pats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [username]);

  const filtered = filter ? patterns.filter(p => p.craft_type === filter || p.difficulty === filter || (filter === 'free' && p.is_free) || (filter === 'paid' && !p.is_free)) : patterns;

  const FilterPill: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <button onClick={() => setFilter(f => f === value ? '' : value)} style={{ padding: '0.45rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, background: filter === value ? 'var(--color-primary)' : 'var(--color-surface)', color: filter === value ? '#fff' : 'var(--color-muted-foreground)', transition: 'all 0.2s' }}>
      {label}
    </button>
  );

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}><Navbar /></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '7rem 1.5rem 5rem' }}>

        {/* Designer header */}
        <div style={{ background: 'var(--color-card)', borderRadius: '1.5rem', padding: '2.5rem', marginBottom: '2.5rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ width: '6rem', height: '6rem', borderRadius: '999px', overflow: 'hidden', background: 'var(--color-muted)', flexShrink: 0 }}>
              {designer?.image ? <img src={designer.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-muted-foreground)' }}>{designer?.username?.[0]?.toUpperCase()}</div>}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>Créateur</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.5rem' }}>{designer?.full_name || designer?.username}</h1>
              {designer?.bio && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-muted-foreground)', lineHeight: 1.6, marginBottom: '1rem' }}>{designer.bio}</p>}
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {[['Patrons', patterns.length], ['Abonnés', designer?.followers_count ?? 0], ['Note moy.', designer?.avg_rating ? `${designer.avg_rating}/5` : '—']].map(([l, v]) => (
                  <div key={l}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-foreground)' }}>{v}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setFollowing(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem', borderRadius: '999px', border: following ? '1.5px solid var(--color-border)' : 'none', background: following ? 'var(--color-surface)' : 'var(--color-primary)', color: following ? 'var(--color-foreground)' : '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>
              {following ? <><UserCheck size={16} /> Abonné</> : <><UserPlus size={16} /> Suivre</>}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <FilterPill value="Tricot" label="Tricot" />
          <FilterPill value="Crochet" label="Crochet" />
          <FilterPill value="Tissage" label="Tissage" />
          <FilterPill value="Débutant" label="Débutant" />
          <FilterPill value="Intermédiaire" label="Intermédiaire" />
          <FilterPill value="Expert" label="Expert" />
          <FilterPill value="free" label="Gratuit" />
          <FilterPill value="paid" label="Payant" />
        </div>

        {/* Patterns grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1.5rem' }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => navigate(`/patterns/${p.id}`)} style={{ cursor: 'pointer', background: 'var(--color-card)', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-warm)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-warm-lg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-warm)'; }}>
              <div style={{ paddingBottom: '120%', position: 'relative', overflow: 'hidden' }}>
                <img src={p.image} alt={p.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                  <span style={{ padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.7rem', fontFamily: 'var(--font-body)', fontWeight: 600, background: p.is_free ? 'var(--color-secondary)' : 'var(--color-primary)', color: '#fff' }}>
                    {p.is_free ? 'Gratuit' : p.price}
                  </span>
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.375rem' }}>{p.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{p.craft_type} · {p.difficulty}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>
                    <Heart size={12} /> {p.favorites_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)' }}>
            <p>Aucun patron dans cette catégorie.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default DesignerShop;