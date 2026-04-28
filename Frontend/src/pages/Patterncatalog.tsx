// src/pages/Patterncatalog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Bookmark, SlidersHorizontal, Search, X, ChevronLeft, ChevronRight ,Camera  } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { favoriteService } from '../services/favorites';
import Swal from 'sweetalert2';
// ── Types ──────────────────────────────────────────────────────────────────────
interface Pattern {
  id: number;
  title: string;
  author: {id:number; username:string; profile_image:string|null} | string;
  author_username: string;
  cover_image: string | null;
  level: string;
  type: string;
  is_free: boolean;
  price?: string;
  favorites_count: number;
  tags: string[];
}

const LEVEL_LABELS: Record<string,string> = {
  debutant:'Débutant',
  intermediaire:'Intermédiaire',
  avance:'Avancé',
  expert:'Expert'
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{
    background: 'linear-gradient(90deg, var(--color-muted) 25%, var(--color-surface-alt) 50%, var(--color-muted) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: '0.5rem',
    ...style,
  }} />
);

const CardSkeleton: React.FC = () => (
  <div style={{ background: 'var(--color-card)', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-warm)' }}>
    <Skeleton style={{ paddingBottom: '125%', display: 'block', borderRadius: 0 }} />
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Skeleton style={{ height: '1.125rem', width: '75%' }} />
      <Skeleton style={{ height: '0.875rem', width: '50%' }} />
      <Skeleton style={{ height: '0.75rem', width: '60%', marginTop: '0.25rem' }} />
    </div>
  </div>
);

// ── Difficulty badge ──────────────────────────────────────────────────────────
const difficultyColor = (d: string) => {
  if (d === 'debutant') return { bg: 'var(--color-secondary)', color: '#fff' };
  if (d === 'intermediaire') return { bg: 'var(--color-primary)', color: '#fff' };
  if (d === 'avance') return { bg: 'hsl(35,70%,50%)', color: '#fff' };
  return { bg: 'hsl(0,70%,55%)', color: '#fff' };
};

// ─── Helper pour récupérer l'URL de l'image ───────────────────────────────────
const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
function getToken(): string | null {
  try {
    const tokens = localStorage.getItem('authTokens');
    if (!tokens) return null;
    const parsed = JSON.parse(tokens);
    return parsed?.access || null;
  } catch {
    return null;
  }
}
function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const PatternCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [craftType, setCraftType] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [favoritesLoading, setFavoritesLoading] = useState<Record<number, boolean>>({});

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Charger les favoris de l'utilisateur
const loadFavorites = useCallback(async () => {
  // Only load favorites if user is logged in
  const token = getToken();
  if (!token) return;
  
  try {
    const data = await favoriteService.getAll();
    const favIds = data.map((fav: any) => fav.pattern?.id).filter(Boolean);
    setFavorites(favIds);
  } catch (error) {
    console.error('Erreur chargement favoris:', error);
  }
}, []);

const fetchPatterns = useCallback(async () => {
  setLoading(true);
  setError('');
  try {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (difficulty) params.set('level', difficulty);
    if (craftType) params.set('type', craftType);
    if (priceFilter === 'free') params.set('is_free', 'true');
    if (priceFilter === 'paid') params.set('is_free', 'false');
    
    let ordering = '-created_at';
    if (sortBy === 'price_asc') ordering = 'price';
    else if (sortBy === 'price_desc') ordering = '-price';
    else if (sortBy === 'popular') ordering = '-favorites_count';
    params.set('ordering', ordering);
    
    params.set('page', String(page));

    const token = getToken(); // Use the function
    const res = await fetch(`${API}/api/patterns/?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!res.ok) throw new Error('Erreur lors du chargement');
    const data = await res.json();
    setPatterns(data.results ?? data);
    setTotalPages(Math.ceil((data.count ?? data.length) / 20));
  } catch {
    setError('Impossible de charger les patrons. Vérifiez votre connexion.');
  } finally {
    setLoading(false);
  }
}, [debouncedSearch, difficulty, craftType, priceFilter, sortBy, page]);
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, difficulty, craftType, priceFilter, sortBy]);

  // ====================== GESTION DES FAVORIS (CONNECTÉE AU BACKEND) ======================
 const toggleFav = async (patternId: number, e: React.MouseEvent) => {
  e.stopPropagation();
  
  // Check if user is logged in
  const token = getToken();
  if (!token) {
    Swal.fire({
      title: 'Connexion requise',
      text: 'Connectez-vous pour ajouter des favoris',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Se connecter',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/login');
      }
    });
    return;
  }
  
  // Rest of your existing toggleFav logic...
  if (favoritesLoading[patternId]) return;
  
  setFavoritesLoading(prev => ({ ...prev, [patternId]: true }));
  
  const isCurrentlyFav = favorites.includes(patternId);
  
  setFavorites(prev => 
    isCurrentlyFav 
      ? prev.filter(id => id !== patternId)
      : [...prev, patternId]
  );
  
  setPatterns(prev => prev.map(p => 
    p.id === patternId 
      ? { ...p, favorites_count: isCurrentlyFav ? p.favorites_count - 1 : p.favorites_count + 1 }
      : p
  ));
  
  try {
    if (isCurrentlyFav) {
      await favoriteService.remove(patternId);
    } else {
      await favoriteService.toggle(patternId);
    }
  } catch (error) {
    console.error('Erreur toggle favori:', error);
    setFavorites(prev => 
      isCurrentlyFav 
        ? [...prev, patternId]
        : prev.filter(id => id !== patternId)
    );
    setPatterns(prev => prev.map(p => 
      p.id === patternId 
        ? { ...p, favorites_count: isCurrentlyFav ? p.favorites_count + 1 : p.favorites_count - 1 }
        : p
    ));
  } finally {
    setFavoritesLoading(prev => ({ ...prev, [patternId]: false }));
  }
};
  const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500,
      background: active ? 'var(--color-primary)' : 'var(--color-surface)',
      color: active ? '#fff' : 'var(--color-muted-foreground)',
      transition: 'all 0.2s',
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
      <Navbar />
      <div style={{ paddingTop: '7rem', paddingBottom: '6rem', maxWidth: '80rem', margin: '0 auto', padding: '7rem 1.5rem 6rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Bibliothèque
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            Catalogue de Patrons
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)', fontSize: '1rem' }}>
            Des milliers de patrons gratuits et premium créés par notre communauté.
          </p>
        </div>

        {/* Search + controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un patron, un auteur…"
              style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '999px', border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)', fontFamily: 'var(--font-body)',
                fontSize: '0.875rem', color: 'var(--color-foreground)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '0.75rem 1.25rem', borderRadius: '999px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-foreground)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="created_at">Plus récents</option>
            <option value="popular">Plus populaires</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '999px', border: '1.5px solid var(--color-border)', background: showFilters ? 'var(--color-primary)' : 'var(--color-surface)', color: showFilters ? '#fff' : 'var(--color-foreground)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
          >
            <SlidersHorizontal size={15} /> Filtres
          </button>

          {/* Bouton Recherche Visuelle AI - Même hauteur que la search bar */}
<button
  onClick={() => navigate('/visual-search')}
  title="Rechercher des patrons similaires avec l'IA"
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '999px',
    border: 'none',
    background: 'linear-gradient(135deg, hsl(280,50%,55%), hsl(200,50%,55%))',
    color: '#fff',
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px hsla(260,40%,50%,0.3)',
    minWidth: '140px',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = '0 4px 16px hsla(260,40%,50%,0.4)';
    e.currentTarget.style.background = 'linear-gradient(135deg, hsl(280,55%,60%), hsl(200,55%,60%))';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 2px 8px hsla(260,40%,50%,0.3)';
    e.currentTarget.style.background = 'linear-gradient(135deg, hsl(280,50%,55%), hsl(200,50%,55%))';
  }}
>
  <Camera size={16} />
  <span>AI Search</span>
</button>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', marginBottom: '0.625rem' }}>Niveau</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['', 'debutant', 'intermediaire', 'avance', 'expert'].map(v => (
                  <FilterPill key={v} label={v ? LEVEL_LABELS[v] : 'Tous'} active={difficulty === v} onClick={() => setDifficulty(v)} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', marginBottom: '0.625rem' }}>Type</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['', 'tricot', 'crochet', 'tissage'].map(v => (
                  <FilterPill key={v} label={v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Tous'} active={craftType === v} onClick={() => setCraftType(v)} />
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', marginBottom: '0.625rem' }}>Prix</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[['', 'Tous'], ['free', 'Gratuit'], ['paid', 'Payant']].map(([v, l]) => (
                  <FilterPill key={v} label={l} active={priceFilter === v} onClick={() => setPriceFilter(v)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-card)', borderRadius: '1rem', marginBottom: '1.5rem', color: 'hsl(0,70%,50%)', fontFamily: 'var(--font-body)' }}>
            {error} <button onClick={fetchPatterns} style={{ marginLeft: '0.5rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontFamily: 'var(--font-body)' }}>Réessayer</button>
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
            : patterns.map(p => {
                const liked = favorites.includes(p.id);
                const dc = difficultyColor(p.level);
                const isLoadingFav = favoritesLoading[p.id] || false;
                
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/patterns/${p.id}`)}
                    onMouseEnter={() => setHoveredCard(p.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{ background: 'var(--color-card)', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-warm)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', transform: hoveredCard === p.id ? 'translateY(-4px)' : 'none'}}
                  >
                    <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: '125%' }}>
                      {p.cover_image ? (
                        <img 
                          src={imgUrl(p.cover_image)} 
                          alt={p.title} 
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: hoveredCard === p.id ? 'scale(1.04)' : 'scale(1)' }} 
                          loading="lazy" 
                        />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-muted)', fontSize: '3rem' }}>
                          🧶
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '0.875rem', left: '0.875rem' }}>
                        <span style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600, background: p.is_free ? 'var(--color-secondary)' : 'var(--color-primary)', color: '#fff' }}>
                          {p.is_free ? 'Gratuit' : `${p.price} DT`}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', display: 'flex', gap: '0.375rem', opacity: hoveredCard === p.id ? 1 : 0, transition: 'opacity 0.25s' }}>
                        <button 
                          onClick={e => toggleFav(p.id, e)} 
                          disabled={isLoadingFav}
                          style={{ padding: '0.5rem', background: 'rgba(250,247,242,0.92)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '999px', cursor: isLoadingFav ? 'wait' : 'pointer', display: 'flex', opacity: isLoadingFav ? 0.7 : 1 }}
                        >
                          <Heart size={15} style={{ fill: liked ? 'hsl(0,65%,52%)' : 'none', color: liked ? 'hsl(0,65%,52%)' : 'var(--color-foreground)', strokeWidth: liked ? 0 : 2 }} />
                        </button>
                        <button onClick={e => e.stopPropagation()} style={{ padding: '0.5rem', background: 'rgba(250,247,242,0.92)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '999px', cursor: 'pointer', display: 'flex' }}>
                          <Bookmark size={15} style={{ color: 'var(--color-foreground)' }} />
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: '1.125rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.25rem', lineHeight: 1.3 }}>{p.title}</h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-muted-foreground)', marginBottom: '0.75rem' }}>
                        par {typeof p.author === 'object' ? p.author?.username : p.author_username}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>
                          <Heart size={13} style={{ fill: liked ? 'hsl(0,65%,52%)' : 'none', color: liked ? 'hsl(0,65%,52%)' : 'var(--color-muted-foreground)' }} /> 
                          {p.favorites_count}
                        </span>
                        <span style={{ padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: dc.bg, color: dc.color, fontFamily: 'var(--font-body)' }}>
                          {LEVEL_LABELS[p.level] || p.level}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Empty state */}
        {!loading && !error && patterns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-body)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧶</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-foreground)', marginBottom: '0.5rem' }}>Aucun patron trouvé</p>
            <p>Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.125rem', borderRadius: '999px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: 'var(--color-foreground)' }}>
              <ChevronLeft size={15} /> Précédent
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.125rem', borderRadius: '999px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: 'var(--color-foreground)' }}>
              Suivant <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PatternCatalog;