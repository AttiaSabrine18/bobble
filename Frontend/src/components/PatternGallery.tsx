// src/components/PatternGallery.tsx
import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import { patternService } from '../services/patterns';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Pattern {
  id: number;
  title: string;
  author: { id: number; username: string } | string;
  cover_image: string | null;
  level: string;
  is_free: boolean;
  price?: string;
  favorites_count: number;
  created_at: string;
  type: string;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const difficultyLabels: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert'
};

const PatternGallery: React.FC = () => {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPatterns, setLikedPatterns] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const data = await patternService.getAll({ ordering: '-created_at' });
        const results = data.results || data;
        setPatterns(results.slice(0, 6)); // Show only 6 on home page
      } catch (error) {
        console.error('Erreur lors du chargement des patrons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatterns();
  }, []);

  const toggleLike = async (patternId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setLikedPatterns(prev => 
      prev.includes(patternId) 
        ? prev.filter(id => id !== patternId)
        : [...prev, patternId]
    );
    // TODO: Appeler l'API des favoris ici
  };

  if (loading) {
    return (
      <section style={{ padding: '6rem 0 8rem' }}>
        <div className="container-craft" style={{ textAlign: 'center' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '999px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      </section>
    );
  }

  return (
    <section id="patterns" className="section-padding" style={{ paddingTop: '6rem', paddingBottom: '8rem' }}>
      <div className="container-craft">
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              Bibliothèque de Patrons
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Trouvez votre prochain projet
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--color-muted-foreground)', marginTop: '1rem', maxWidth: '36rem', marginLeft: 'auto', marginRight: 'auto' }}>
              Parcourez des milliers de patrons gratuits et premium créés par des designers talentueux du monde entier.
            </p>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {patterns.map((pattern, i) => {
            const authorName = typeof pattern.author === 'object' ? pattern.author?.username : pattern.author;
            const liked = likedPatterns.includes(pattern.id);
            const difficulty = difficultyLabels[pattern.level] || pattern.level;
            
            return (
              <ScrollReveal key={pattern.id} delay={i * 80}>
                <div
                  className="card-hover"
                  onClick={() => navigate(`/patterns/${pattern.id}`)}
                  style={{ background: 'var(--color-card)', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-warm)', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredCard(pattern.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: '125%' }}>
                    {pattern.cover_image ? (
                      <img
                        src={imgUrl(pattern.cover_image)}
                        alt={pattern.title}
                        className="img-ken-burns"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-muted)', fontSize: '3rem' }}>
                        🧶
                      </div>
                    )}
                    
                    {/* Hover actions */}
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', opacity: hoveredCard === pattern.id ? 1 : 0, transition: 'opacity 0.3s' }}>
                      <button
                        onClick={e => toggleLike(pattern.id, e)}
                        className="btn-craft rounded-pill"
                        style={{ padding: '0.625rem', background: 'rgba(250,247,242,0.9)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-warm)', display: 'flex', alignItems: 'center' }}
                      >
                        <Heart size={16} style={{ fill: liked ? 'var(--color-primary)' : 'none', color: liked ? 'var(--color-primary)' : 'var(--color-foreground)', strokeWidth: liked ? 0 : 2 }} />
                      </button>
                      <button
                        onClick={e => e.stopPropagation()}
                        className="btn-craft rounded-pill"
                        style={{ padding: '0.625rem', background: 'rgba(250,247,242,0.9)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-warm)', display: 'flex', alignItems: 'center' }}
                      >
                        <Bookmark size={16} style={{ color: 'var(--color-foreground)' }} />
                      </button>
                    </div>
                    
                    {/* Price badge */}
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                      <span
                        className="rounded-pill"
                        style={{
                          padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600,
                          background: pattern.is_free ? 'var(--color-secondary)' : 'var(--color-primary)',
                          color: '#fff',
                        }}
                      >
                        {pattern.is_free ? 'Gratuit' : `${pattern.price} €`}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-foreground)', lineHeight: 1.3, marginBottom: '0.25rem' }}>
                      {pattern.title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted-foreground)', marginBottom: '0.75rem' }}>
                      par {authorName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-muted-foreground)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
                          <Heart size={14} /> {pattern.favorites_count}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
                          <Clock size={14} /> {new Date(pattern.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <span
                        className="rounded-pill"
                        style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 500, padding: '0.25rem 0.75rem', background: 'var(--color-surface)', color: 'var(--color-muted-foreground)' }}
                      >
                        {difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={200}>
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <button
              onClick={() => navigate('/patterns')}
              className="btn-craft rounded-pill"
              style={{ display: 'inline-flex', border: '2px solid var(--color-border)', color: 'var(--color-foreground)', padding: '1rem 2rem', fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600, background: 'transparent', cursor: 'pointer' }}
            >
              Voir tous les patrons
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default PatternGallery;