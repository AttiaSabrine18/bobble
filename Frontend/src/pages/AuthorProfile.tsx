// src/pages/AuthorProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Package, Heart, Star, ExternalLink, Mail, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Author {
  id: number;
  username: string;
  email?: string;
  profile?: {
    full_name: string;
    bio: string;
    image: string | null;
  };
  date_joined?: string;
}

interface Pattern {
  id: number;
  title: string;
  description: string;
  price: string;
  is_free: boolean;
  cover_image: string | null;
  level: string;
  type: string;
  favorites_count: number;
  created_at: string;
}

interface Stats {
  total_patterns: number;
  total_sales: number;
  total_favorites: number;
  average_rating: number;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
};

const TYPE_LABELS: Record<string, string> = {
  tricot: 'Tricot',
  crochet: 'Crochet',
  tissage: 'Tissage',
};

const AuthorProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_patterns: 0,
    total_sales: 0,
    total_favorites: 0,
    average_rating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'patterns' | 'about'>('patterns');

  useEffect(() => {
    if (username) {
      loadAuthorProfile();
      loadAuthorPatterns();
      checkIfFollowing();
    }
  }, [username]);

  const loadAuthorProfile = async () => {
    try {
      const response = await api.get(`/profile/${username}/`);
      setAuthor(response.data);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };

  const loadAuthorPatterns = async () => {
    try {
      const response = await api.get(`/patterns/?author=${username}`);
      const patternsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setPatterns(patternsData);
      
      // Calculer les stats
      const totalFavorites = patternsData.reduce((sum: number, p: Pattern) => sum + (p.favorites_count || 0), 0);
      setStats({
        total_patterns: patternsData.length,
        total_sales: 0, // À récupérer si disponible
        total_favorites: totalFavorites,
        average_rating: 0, // À récupérer si disponible
      });
    } catch (error) {
      console.error('Erreur chargement patrons:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFollowing = async () => {
    try {
      const response = await api.get('/following/');
      const following = response.data;
      setIsFollowing(following.some((f: any) => f.username === username));
    } catch (error) {
      console.error('Erreur vérification follow:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    
    try {
      if (isFollowing) {
        await api.delete(`/follow/${username}/`);
        setIsFollowing(false);
      } else {
        await api.post(`/follow/${username}/`);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Erreur follow/unfollow:', error);
    }
  };

  const handleContact = () => {
    if (!user) {
      navigate('/');
      return;
    }
    navigate(`/messages/new/${username}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
        <Navbar />
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}>
          <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite'}}/>
        </div>
        <Footer />
      </div>
    );
  }

  if (!author) {
    return (
      <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
        <Navbar />
        <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem',textAlign:'center'}}>
          <div style={{fontSize:'5rem',marginBottom:'1rem'}}>👤</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',marginBottom:'1rem'}}>Auteur introuvable</h1>
          <p style={{color:'var(--color-muted-foreground)',marginBottom:'2rem'}}>Cet auteur n'existe pas ou a été supprimé.</p>
          <button onClick={() => navigate('/patterns')} className="btn-craft"
            style={{padding:'0.875rem 2rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600}}>
            Retour au catalogue
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = user?.username === username;

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      
      <div style={{maxWidth:'64rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        {/* Navigation */}
        <button onClick={() => navigate(-1)} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}>
          <ChevronLeft size={16}/> Retour
        </button>

        {/* Header Profil */}
        <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',marginBottom:'2rem',border:'1px solid var(--color-border)'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:'1.5rem',flexWrap:'wrap'}}>
            {/* Avatar */}
            <div style={{width:'6rem',height:'6rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
              {author.profile?.image ? (
                <img src={imgUrl(author.profile.image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-primary)',color:'#fff',fontSize:'2rem'}}>
                  {author.username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Infos */}
            <div style={{flex:1,minWidth:'250px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
                <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:600,margin:0}}>
                  {author.profile?.full_name || author.username}
                </h1>
                <span style={{color:'var(--color-muted-foreground)',fontSize:'0.875rem'}}>@{author.username}</span>
              </div>
              
              {author.profile?.bio && (
                <p style={{color:'var(--color-muted-foreground)',marginBottom:'1rem',lineHeight:1.6}}>
                  {author.profile.bio}
                </p>
              )}
              
              <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                  <Package size={14} style={{color:'var(--color-muted-foreground)'}}/>
                  <span style={{fontSize:'0.875rem'}}><strong>{stats.total_patterns}</strong> patrons</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                  <Heart size={14} style={{color:'hsl(0,65%,52%)'}}/>
                  <span style={{fontSize:'0.875rem'}}><strong>{stats.total_favorites}</strong> favoris</span>
                </div>
                {author.date_joined && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                    <Calendar size={14} style={{color:'var(--color-muted-foreground)'}}/>
                    <span style={{fontSize:'0.875rem'}}>Membre depuis {formatDate(author.date_joined)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div style={{display:'flex',gap:'0.75rem'}}>
              {!isOwnProfile && (
                <>
                 <button onClick={handleFollow} className="btn-craft"
  style={{
    padding: '0.75rem 1.5rem',
    borderRadius: '999px',
    background: isFollowing ? 'var(--color-surface)' : 'var(--color-primary)',
    color: isFollowing ? 'var(--color-foreground)' : '#fff',
    fontWeight: 600,
    border: isFollowing ? '1.5px solid var(--color-border)' : 'none',
    cursor: 'pointer'
  }}>
  {isFollowing ? 'Abonné' : 'S\'abonner'}
</button>
                  <button onClick={handleContact}
                    style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',color:'var(--color-foreground)',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <Mail size={16}/> Contacter
                  </button>
                </>
              )}
              {isOwnProfile && (
                <button onClick={() => navigate('/mon-profil')}
                  style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',color:'var(--color-foreground)'}}>
                  Modifier le profil
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',borderBottom:'1.5px solid var(--color-border)',paddingBottom:'0.5rem'}}>
          <button onClick={() => setActiveTab('patterns')}
            style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='patterns'?'var(--color-primary)':'transparent',color:activeTab==='patterns'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',fontWeight:500}}>
            <Package size={14} style={{marginRight:'0.5rem',display:'inline'}}/>
            Patrons ({patterns.length})
          </button>
          <button onClick={() => setActiveTab('about')}
            style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='about'?'var(--color-primary)':'transparent',color:activeTab==='about'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',fontWeight:500}}>
            <User size={14} style={{marginRight:'0.5rem',display:'inline'}}/>
            À propos
          </button>
        </div>

        {/* Contenu */}
        {activeTab === 'patterns' && (
          <div>
            {patterns.length === 0 ? (
              <div style={{textAlign:'center',padding:'3rem',background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)'}}>
                <Package size={48} style={{marginBottom:'1rem',opacity:0.5}}/>
                <p style={{color:'var(--color-muted-foreground)'}}>Cet auteur n'a pas encore publié de patron.</p>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'1.5rem'}}>
                {patterns.map(pattern => (
                  <div key={pattern.id} onClick={() => navigate(`/patterns/${pattern.id}`)}
                    style={{background:'var(--color-card)',borderRadius:'1rem',overflow:'hidden',border:'1px solid var(--color-border)',cursor:'pointer'}} className="card-hover">
                    
                    {/* Cover */}
                    <div style={{aspectRatio:'4/5',background:'var(--color-muted)',position:'relative'}}>
                      {pattern.cover_image ? (
                        <img src={imgUrl(pattern.cover_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      ) : (
                        <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.5rem'}}>🧶</div>
                      )}
                      
                      {/* Price badge */}
                      <div style={{position:'absolute',top:'0.5rem',left:'0.5rem',padding:'0.2rem 0.6rem',borderRadius:'999px',background:pattern.is_free?'hsl(105,28%,50%)':'var(--color-primary)',color:'#fff',fontSize:'0.75rem',fontWeight:600}}>
                        {pattern.is_free ? 'Gratuit' : `${pattern.price} €`}
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div style={{padding:'1rem'}}>
                      <h3 style={{fontWeight:600,fontSize:'0.9375rem',margin:'0 0 0.25rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {pattern.title}
                      </h3>
                      <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.5rem'}}>
                        <span style={{fontSize:'0.6875rem',padding:'0.125rem 0.5rem',borderRadius:'999px',background:'var(--color-surface)',color:'var(--color-muted-foreground)'}}>
                          {TYPE_LABELS[pattern.type] || pattern.type}
                        </span>
                        <span style={{fontSize:'0.6875rem',padding:'0.125rem 0.5rem',borderRadius:'999px',background:'var(--color-surface)',color:'var(--color-muted-foreground)'}}>
                          {LEVEL_LABELS[pattern.level] || pattern.level}
                        </span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>
                        <Heart size={12} style={{fill:'hsl(0,65%,52%)',color:'hsl(0,65%,52%)'}}/>
                        <span>{pattern.favorites_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'2rem',border:'1px solid var(--color-border)'}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',marginBottom:'1rem'}}>À propos de {author.username}</h2>
            
            {author.profile?.bio ? (
              <p style={{lineHeight:1.7,whiteSpace:'pre-wrap',marginBottom:'1.5rem'}}>{author.profile.bio}</p>
            ) : (
              <p style={{color:'var(--color-muted-foreground)',marginBottom:'1.5rem'}}>Aucune biographie renseignée.</p>
            )}
            
            <div style={{display:'grid',gap:'1rem'}}>
              <div>
                <p style={{fontWeight:600,marginBottom:'0.25rem'}}>Statistiques</p>
                <div style={{display:'flex',gap:'2rem'}}>
                  <div>
                    <p style={{fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>Patrons publiés</p>
                    <p style={{fontSize:'1.5rem',fontWeight:600}}>{stats.total_patterns}</p>
                  </div>
                  <div>
                    <p style={{fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>Favoris reçus</p>
                    <p style={{fontSize:'1.5rem',fontWeight:600}}>{stats.total_favorites}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p style={{fontWeight:600,marginBottom:'0.25rem'}}>Contact</p>
                {!isOwnProfile && (
                  <button onClick={handleContact} className="btn-craft"
                    style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <Mail size={16}/> Envoyer un message
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AuthorProfile;