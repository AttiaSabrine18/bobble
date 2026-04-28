// src/pages/Patterndetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Download, ShoppingBag, Star, ChevronLeft, User, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import { favoriteService } from '../services/favorites';
import { commentService } from '../services/comments';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  try { return JSON.parse(localStorage.getItem('authTokens') || '{}')?.access ?? null; }
  catch { return null; }
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

interface Tag { id: number; name: string; slug: string; }

interface Comment {
  id: number;
  user_id: number;
  username: string;
  profile_image?: string | null;
  text: string;
  rating: number;
  created_at: string;
}

interface Pattern {
  id: number; title: string; description: string;
  author: { id: number; username: string; profile_image: string | null };
  level: string; type: string; is_free: boolean; price: string;
  cover_image: string | null; pdf: string | null;
  favorites_count: number; tags: Tag[];
  created_at: string; updated_at: string;
}

const LEVEL_LABELS: Record<string,string> = { debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé', expert:'Expert' };
const LEVEL_COLORS: Record<string,string> = { debutant:'hsl(105,28%,50%)', intermediaire:'var(--color-primary)', avance:'hsl(35,70%,50%)', expert:'hsl(0,65%,52%)' };
const TYPE_LABELS:  Record<string,string> = { tricot:'Tricot', crochet:'Crochet', tissage:'Tissage' };

const Sk: React.FC<{style?:React.CSSProperties}> = ({style}) => (
  <div style={{background:'linear-gradient(90deg,var(--color-muted) 25%,var(--color-surface) 50%,var(--color-muted) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite',borderRadius:'0.5rem',...style}}/>
);

const PatternDetail: React.FC = () => {
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pattern, setPattern] = useState<Pattern|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPurchased, setIsPurchased] = useState(false);
  
  const [isFav, setIsFav] = useState(false);
  const [favCount, setFavCount] = useState(0);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userComment, setUserComment] = useState<Comment | null>(null);
  
  const [isInCart, setIsInCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
  const hdrs = {Authorization:`Bearer ${getToken()}`};

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    
    fetch(`${API}/api/patterns/${id}/`, {headers: hdrs})
      .then(r => { if(!r.ok) throw new Error(); return r.json(); })
      .then((d: Pattern) => {
        setPattern(d);
        setFavCount(d.favorites_count);
      })
      .catch(() => setError('Impossible de charger ce patron.'))
      .finally(() => setLoading(false));
    
    favoriteService.check(Number(id))
      .then(res => setIsFav(res.is_favorited))
      .catch(() => {});
    
    loadComments();
    checkPurchase();
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setIsInCart(cart.includes(Number(id)));
    updateCartCount();
  }, [id]);

  const checkPurchase = async () => {
    try {
      const token = getToken();
      if (!token || !id) return;
      const res = await fetch(`${API}/api/purchase/verify/?pattern_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsPurchased(data.purchased);
      }
    } catch (err) {}
  };

  const loadComments = () => {
    if (!id) return;
    commentService.getByPattern(Number(id))
      .then(res => {
        setComments(res.comments || []);
        setAvgRating(res.average_rating || 0);
        if (user) {
          const userComm = res.comments?.find((c: Comment) => c.user_id === Number(user.user_id));
          setUserComment(userComm || null);
        }
      })
      .catch(() => {});
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);
  };

  const handleAddToCart = () => {
    if (!pattern) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.includes(pattern.id)) {
      cart.push(pattern.id);
      localStorage.setItem('cart', JSON.stringify(cart));
      setIsInCart(true);
      updateCartCount();
      Swal.fire({ title: 'Ajouté au panier !', text: `${pattern.title}`, icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
    } else {
      Swal.fire({ title: 'Déjà dans le panier', text: `${pattern.title}`, icon: 'info', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }
  };

  const handleBuyNow = () => {
    if (!pattern || pattern.is_free) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.includes(pattern.id)) {
      cart.push(pattern.id);
      localStorage.setItem('cart', JSON.stringify(cart));
    }
    navigate('/checkout', { state: { patternIds: [pattern.id] } });
  };

  const handleDownloadPDF = async () => {
    if (!pattern) return;
    try {
      const response = await fetch(`${API}/api/patterns/${pattern.id}/pdf/`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        window.open(data.pdf_url, '_blank');
      } else {
        const data = await response.json();
        Swal.fire({ title: 'Accès refusé', text: data.error, icon: 'error' });
      }
    } catch (err) {
      Swal.fire({ title: 'Erreur', text: 'Impossible de télécharger le PDF', icon: 'error' });
    }
  };

  const toggleFav = async () => {
    const next = !isFav;
    setIsFav(next);
    setFavCount(prev => next ? prev + 1 : prev - 1);
    try {
      if (next) await favoriteService.toggle(Number(id));
      else await favoriteService.remove(Number(id));
    } catch (error) {
      setIsFav(!next);
      setFavCount(prev => !next ? prev + 1 : prev - 1);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || newRating === 0) return;
    setSubmitting(true);
    try {
      const created = await commentService.create({ pattern: Number(id), text: newComment, rating: newRating });
      setComments(prev => [created, ...prev]);
      setUserComment(created);
      setNewComment('');
      setNewRating(0);
      loadComments();
    } catch (error) {
      Swal.fire({ title: 'Erreur', text: 'Impossible de publier votre avis.', icon: 'error' });
    } finally { setSubmitting(false); }
  };

  const deleteComment = async () => {
    if (!userComment || !window.confirm('Supprimer votre avis ?')) return;
    try {
      await commentService.delete(userComment.id);
      setComments(prev => prev.filter(c => c.id !== userComment.id));
      setUserComment(null);
      loadComments();
    } catch (error) {}
  };

  if(error) return (
    <div style={{minHeight:'100vh',background:'var(--color-background)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'1rem'}}>
      <Navbar/>
      <p style={{fontFamily:'var(--font-body)',color:'var(--color-muted-foreground)'}}>{error}</p>
      <button onClick={()=>navigate('/patterns')} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.625rem 1.25rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',cursor:'pointer',fontFamily:'var(--font-body)',color:'var(--color-foreground)'}}>
        <ChevronLeft size={15}/> Retour au catalogue
      </button>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
      <Navbar/>
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>

        <button onClick={()=>navigate('/patterns')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'2rem',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)',padding:0}}>
          <ChevronLeft size={16}/> Retour au catalogue
        </button>

        <div style={{position:'fixed',top:'5rem',right:'2rem',zIndex:50}}>
          <button onClick={()=>navigate('/checkout')} style={{background:'var(--color-card)',border:'1.5px solid var(--color-border)',borderRadius:'999px',padding:'0.75rem',cursor:'pointer',position:'relative',boxShadow:'var(--shadow-warm)'}}>
            <ShoppingBag size={20} style={{color:'var(--color-foreground)'}}/>
            {cartCount > 0 && (
              <span style={{position:'absolute',top:'-0.25rem',right:'-0.25rem',background:'var(--color-primary)',color:'#fff',fontSize:'0.6875rem',fontWeight:600,padding:'0.125rem 0.375rem',borderRadius:'999px',minWidth:'1.25rem',textAlign:'center'}}>{cartCount}</span>
            )}
          </button>
        </div>

        {loading && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'3rem'}}>
            <Sk style={{paddingBottom:'120%'}}/>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <Sk style={{height:'2.5rem',width:'80%'}}/><Sk style={{height:'1rem',width:'40%'}}/><Sk style={{height:'6rem'}}/>
            </div>
          </div>
        )}

        {!loading && pattern && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'3rem',marginBottom:'4rem'}}>
              <div style={{borderRadius:'1.25rem',overflow:'hidden',aspectRatio:'4/5',background:'var(--color-muted)',boxShadow:'var(--shadow-warm-lg)'}}>
                {pattern.cover_image
                  ? <img src={imgUrl(pattern.cover_image)} alt={pattern.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'5rem'}}>🧶</div>}
              </div>

              <div>
                <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                  {pattern.type && <span style={{padding:'0.3rem 0.75rem',borderRadius:'999px',fontSize:'0.75rem',fontFamily:'var(--font-body)',fontWeight:500,background:'var(--color-surface)',color:'var(--color-muted-foreground)',border:'1px solid var(--color-border)'}}>{TYPE_LABELS[pattern.type]||pattern.type}</span>}
                  {pattern.level && <span style={{padding:'0.3rem 0.75rem',borderRadius:'999px',fontSize:'0.75rem',fontFamily:'var(--font-body)',fontWeight:600,background:(LEVEL_COLORS[pattern.level]||'var(--color-primary)')+'22',color:LEVEL_COLORS[pattern.level]||'var(--color-primary)',border:'1px solid transparent'}}>{LEVEL_LABELS[pattern.level]||pattern.level}</span>}
                  {pattern.tags?.map(t=><span key={t.id} style={{padding:'0.3rem 0.75rem',borderRadius:'999px',fontSize:'0.75rem',fontFamily:'var(--font-body)',fontWeight:500,background:'var(--color-surface)',color:'var(--color-muted-foreground)',border:'1px solid var(--color-border)'}}>{t.name}</span>)}
                </div>

                <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.75rem,4vw,2.5rem)',fontWeight:600,color:'var(--color-foreground)',letterSpacing:'-0.02em',lineHeight:1.15,marginBottom:'0.5rem'}}>{pattern.title}</h1>

                <button onClick={()=>navigate(`/profile/${pattern.author?.username}`)} style={{display:'flex',alignItems:'center',gap:'0.625rem',background:'none',border:'none',cursor:'pointer',padding:0,marginBottom:'1.5rem'}}>
                  <div style={{width:'1.75rem',height:'1.75rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {pattern.author?.profile_image ? <img src={imgUrl(pattern.author.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <User size={16} style={{color:'var(--color-muted-foreground)'}}/>}
                  </div>
                  <span style={{fontFamily:'var(--font-body)',fontSize:'0.9375rem',color:'var(--color-muted-foreground)'}}>par <span style={{color:'var(--color-primary)',fontWeight:500}}>{pattern.author?.username}</span></span>
                </button>

                {pattern.description && <p style={{fontFamily:'var(--font-body)',fontSize:'0.9375rem',color:'var(--color-foreground)',lineHeight:1.7,marginBottom:'1.75rem'}}>{pattern.description}</p>}

                <div style={{background:'var(--color-card)',borderRadius:'0.875rem',padding:'1rem 1.25rem',marginBottom:'1.75rem',border:'1px solid var(--color-border)',display:'flex',flexWrap:'wrap',gap:'1.5rem'}}>
                  {(['Type', 'Niveau', 'Publié'] as string[]).map((label, i) => (
                    <div key={label}>
                      <p style={{fontFamily:'var(--font-body)',fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--color-muted-foreground)',marginBottom:'0.25rem'}}>{label}</p>
                      <p style={{fontFamily:'var(--font-body)',fontSize:'0.9rem',color:'var(--color-foreground)',fontWeight:500}}>
                        {i===0 ? TYPE_LABELS[pattern.type]||pattern.type : i===1 ? LEVEL_LABELS[pattern.level]||pattern.level : new Date(pattern.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{display:'flex',alignItems:'center',gap:'1.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                  <p style={{fontFamily:'var(--font-display)',fontSize:'1.75rem',fontWeight:600,color:pattern.is_free?'hsl(105,28%,45%)':'var(--color-foreground)',margin:0}}>
                    {pattern.is_free ? 'Gratuit' : `${pattern.price} DT`}
                  </p>
                  <button onClick={toggleFav} style={{display:'flex',alignItems:'center',gap:'0.375rem',background:'none',border:'none',cursor:'pointer'}}>
                    <Heart size={20} style={{fill:isFav?'hsl(0,65%,52%)':'none',color:isFav?'hsl(0,65%,52%)':'var(--color-muted-foreground)'}}/>
                    <span style={{fontSize:'0.875rem',fontWeight:500,color:'var(--color-muted-foreground)'}}>{favCount}</span>
                  </button>
                  {avgRating > 0 && (
                    <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
                      <Star size={16} style={{fill:'hsl(35,70%,50%)',color:'hsl(35,70%,50%)'}}/>
                      <span style={{fontSize:'0.875rem',fontWeight:500,color:'var(--color-muted-foreground)'}}>{avgRating.toFixed(1)} ({comments.length} avis)</span>
                    </div>
                  )}
                </div>

                {/* Stock / Statut */}
                <div style={{marginBottom:'1rem'}}>
                  {isPurchased ? (
                    <span style={{color:'hsl(105,28%,50%)',fontSize:'0.875rem',display:'flex',alignItems:'center',gap:'0.375rem'}}>
                      <span>✅</span> Patron acheté - Téléchargement disponible
                    </span>
                  ) : pattern.is_free ? (
                    <span style={{color:'hsl(105,28%,50%)',fontSize:'0.875rem',display:'flex',alignItems:'center',gap:'0.375rem'}}>
                      <span>📥</span> Patron PDF gratuit - Téléchargement libre
                    </span>
                  ) : (
                    <span style={{color:'hsl(105,28%,50%)',fontSize:'0.875rem',display:'flex',alignItems:'center',gap:'0.375rem'}}>
                      <span>📥</span> Patron PDF - Disponible à l'achat
                    </span>
                  )}
                </div>

                {/* CTAs */}
                <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',marginBottom:'2rem'}}>
                  {pattern.is_free ? (
                    pattern.pdf ? (
                      <button onClick={handleDownloadPDF}
                        style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',background:'var(--color-secondary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem',border:'none',cursor:'pointer'}}>
                        <Download size={16}/> Télécharger le PDF
                      </button>
                    ) : (
                      <span style={{fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)',padding:'0.875rem 0'}}>Aucun PDF disponible</span>
                    )
                  ) : isPurchased ? (
                    <button onClick={handleDownloadPDF}
                      style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',background:'var(--color-secondary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem',border:'none',cursor:'pointer'}}>
                      <Download size={16}/> Télécharger le PDF
                    </button>
                  ) : (
                    <>
                      <button onClick={handleBuyNow} className="btn-craft"
                        style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem'}}>
                        <ShoppingBag size={16}/> Acheter maintenant - {pattern.price} DT
                      </button>
                      {isInCart ? (
                        <button onClick={()=>navigate('/checkout')}
                          style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',border:'1.5px solid var(--color-primary)',background:'transparent',color:'var(--color-primary)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem'}}>
                          <ShoppingBag size={16}/> Voir le panier {cartCount > 0 && `(${cartCount})`}
                        </button>
                      ) : (
                        <button onClick={handleAddToCart}
                          style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',color:'var(--color-foreground)',fontFamily:'var(--font-body)',fontWeight:500,fontSize:'0.9375rem'}}>
                          🛒 Ajouter au panier
                        </button>
                      )}
                    </>
                  )}
                  <button style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.25rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontWeight:500,fontSize:'0.9375rem',cursor:'pointer',color:'var(--color-foreground)'}}>
                    <Bookmark size={16}/> Ma queue
                  </button>
                </div>
              </div>
            </div>

            {/* Author card */}
            <div style={{background:'var(--color-card)',borderRadius:'1.25rem',padding:'1.75rem',marginBottom:'3rem',display:'flex',alignItems:'center',gap:'1.5rem',border:'1px solid var(--color-border)',flexWrap:'wrap'}}>
              <div style={{width:'4rem',height:'4rem',borderRadius:'999px',background:'var(--color-muted)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {pattern.author?.profile_image ? <img src={imgUrl(pattern.author.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <User size={28} style={{color:'var(--color-muted-foreground)'}}/>}
              </div>
              <div style={{flex:1,minWidth:'140px'}}>
                <p style={{fontFamily:'var(--font-display)',fontSize:'1.125rem',fontWeight:600,color:'var(--color-foreground)',marginBottom:'0.25rem'}}>{pattern.author?.username}</p>
                <p style={{fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>Créateur de patrons sur Bobble</p>
              </div>
              <button onClick={()=>navigate(`/profile/${pattern.author?.username}`)} style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',padding:'0.625rem 1.25rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontWeight:500,fontSize:'0.875rem',cursor:'pointer',color:'var(--color-foreground)'}}>
                Voir le profil <ExternalLink size={13}/>
              </button>
            </div>

            {/* Commentaires */}
            <div style={{marginTop:'2rem'}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:600,color:'var(--color-foreground)',marginBottom:'1.5rem'}}>
                Avis ({comments.length}) 
                {avgRating > 0 && <span style={{fontSize:'1rem',marginLeft:'0.75rem',color:'var(--color-muted-foreground)'}}>★ {avgRating.toFixed(1)}/5</span>}
              </h2>

              {!userComment && (
                <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.5rem',marginBottom:'1.5rem',border:'1px solid var(--color-border)'}}>
                  <p style={{fontWeight:600,marginBottom:'1rem'}}>Laisser un avis</p>
                  <div style={{marginBottom:'1rem'}}>
                    <p style={{fontSize:'0.875rem',marginBottom:'0.5rem'}}>Votre note</p>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      {[1,2,3,4,5].map(i => (
                        <button key={i} onClick={() => setNewRating(i)} style={{background:'none',border:'none',cursor:'pointer'}}>
                          <Star size={24} style={{fill:i <= newRating ? 'hsl(35,70%,50%)' : 'none',color:i <= newRating ? 'hsl(35,70%,50%)' : 'var(--color-muted-foreground)'}}/>
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Partagez votre expérience..." rows={3}
                    style={{width:'100%',padding:'0.75rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',marginBottom:'1rem',resize:'vertical',outline:'none',fontFamily:'var(--font-body)'}}/>
                  <button onClick={submitComment} disabled={submitting || !newComment.trim() || newRating === 0} className="btn-craft"
                    style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600,opacity:(!newComment.trim()||newRating===0)?0.5:1,cursor:(!newComment.trim()||newRating===0)?'not-allowed':'pointer'}}>
                    {submitting ? 'Publication...' : 'Publier l\'avis'}
                  </button>
                </div>
              )}

              {comments.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {comments.map(comment => (
                    <div key={comment.id} style={{background:'var(--color-card)',borderRadius:'0.875rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                        <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'999px',background:'hsla(18,52%,51%,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--color-primary)'}}>
                          {comment.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{flex:1}}>
                          <p style={{fontWeight:600,margin:0}}>{comment.username}</p>
                          <div style={{display:'flex',gap:'0.25rem'}}>
                            {[1,2,3,4,5].map(i => (<Star key={i} size={12} style={{fill:i <= comment.rating ? 'hsl(35,70%,50%)' : 'none',color:i <= comment.rating ? 'hsl(35,70%,50%)' : 'var(--color-muted-foreground)'}}/>))}
                          </div>
                        </div>
                        <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>{new Date(comment.created_at).toLocaleDateString('fr-FR', {day:'numeric', month:'short', year:'numeric'})}</span>
                        {comment.user_id === Number(user?.user_id) && (
                          <button onClick={deleteComment} style={{background:'none',border:'none',color:'hsl(0,65%,52%)',cursor:'pointer',fontSize:'1rem'}}>🗑️</button>
                        )}
                      </div>
                      <p style={{margin:'0.75rem 0 0',lineHeight:1.6}}>{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'3rem',background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)'}}>
                  <p style={{color:'var(--color-muted-foreground)'}}>Aucun avis pour le moment. Soyez le premier !</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer/>
    </div>
  );
};

export default PatternDetail;