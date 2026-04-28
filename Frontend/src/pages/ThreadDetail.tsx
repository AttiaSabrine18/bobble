// src/pages/ThreadDetail.tsx - Version corrigée
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Send, Trash2, Eye, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { forumService } from '../services/community';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Thread {
  id: number;
  title: string;
  content: string;
  author: { id: number; username: string; profile_image?: string | null };
  category: string;
  views_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: number;
  content: string;
  author: { id: number; username: string; profile_image?: string | null };
  created_at: string;
  updated_at: string;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const categoryLabels: Record<string, string> = {
  general: 'Général',
  help: 'Aide',
  showcase: 'Vitrine',
  technique: 'Technique',
  yarn: 'Laine',
  pattern: 'Patron',
  aide_technique: 'Aide technique',
  presentation_projets: 'Présentation de projets',
  achats_ventes: 'Achats/Ventes',
};

const ThreadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, authTokens } = useAuth();
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadThread();
      loadReplies();
    }
  }, [id]);

  const loadThread = async () => {
    try {
      const data = await forumService.getThread(Number(id));
      setThread(data);
    } catch (err) {
      console.error('Erreur chargement thread:', err);
      setError('Impossible de charger cette discussion');
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async () => {
    try {
      const data = await forumService.getReplies(Number(id));
      setReplies(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Erreur chargement réponses:', err);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !authTokens) return;

    setSubmitting(true);
    try {
      const reply = await forumService.createReply({
        thread: Number(id),
        content: newReply,
      });
      setReplies([...replies, reply]);
      setNewReply('');
      if (thread) {
        setThread({ ...thread, replies_count: thread.replies_count + 1 });
      }
    } catch (err) {
      console.error('Erreur envoi réponse:', err);
      alert('Erreur lors de l\'envoi de la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!window.confirm('Supprimer cette réponse ?')) return;
    try {
      await forumService.deleteReply(replyId);
      setReplies(replies.filter(r => r.id !== replyId));
      if (thread) {
        setThread({ ...thread, replies_count: thread.replies_count - 1 });
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleDeleteThread = async () => {
    if (!window.confirm('Supprimer cette discussion ?')) return;
    try {
      await forumService.deleteThread(Number(id));
      navigate('/community');
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Vérifier si l'utilisateur est l'auteur (utilise user_id du contexte)
  const isAuthor = thread && user ? (
    String(user.user_id) === String(thread.author.id) || 
    user.username === thread.author.username
  ) : false;

  // Vérifier si l'utilisateur est l'auteur d'une réponse
  const isReplyAuthor = (reply: Reply) => {
    return user ? (
      String(user.user_id) === String(reply.author.id) || 
      user.username === reply.author.username
    ) : false;
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

  if (error || !thread) {
    return (
      <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
        <Navbar />
        <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem',textAlign:'center'}}>
          <div style={{fontSize:'5rem',marginBottom:'1rem'}}>🧶</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',marginBottom:'1rem'}}>404</h1>
          <p style={{color:'var(--color-muted-foreground)',marginBottom:'2rem'}}>Cette discussion n'existe pas ou a été supprimée.</p>
          <button onClick={()=>navigate('/community')} className="btn-craft"
            style={{padding:'0.875rem 2rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>
            Retour à la communauté
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      
      <div style={{maxWidth:'56rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        {/* Navigation */}
        <button onClick={()=>navigate('/community')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)',padding:0}}>
          <ArrowLeft size={16}/> Retour à la communauté
        </button>

        {/* Thread principal */}
        <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',marginBottom:'2rem',border:'1px solid var(--color-border)'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:'1rem',marginBottom:'1.5rem'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {thread.author.profile_image ? (
                <img src={imgUrl(thread.author.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              ) : (
                <User size={20} style={{color:'var(--color-muted-foreground)'}}/>
              )}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
                <span style={{padding:'0.25rem 0.75rem',borderRadius:'999px',fontSize:'0.6875rem',fontWeight:500,background:'hsla(35,70%,50%,0.12)',color:'hsl(35,70%,40%)'}}>
                  {categoryLabels[thread.category] || thread.category}
                </span>
                <span style={{fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>
                  Publié par <span style={{color:'var(--color-foreground)',fontWeight:500}}>{thread.author.username}</span> • {formatDate(thread.created_at)}
                </span>
              </div>
              <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:600,color:'var(--color-foreground)',margin:'0 0 0.5rem',letterSpacing:'-0.01em'}}>
                {thread.title}
              </h1>
              <div style={{display:'flex',gap:'1.5rem',marginTop:'0.5rem'}}>
                <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.8125rem',color:'var(--color-muted-foreground)'}}>
                  <Eye size={14}/> {thread.views_count} vues
                </span>
                <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.8125rem',color:'var(--color-muted-foreground)'}}>
                  <MessageCircle size={14}/> {thread.replies_count} réponses
                </span>
              </div>
            </div>
            {isAuthor && (
              <button onClick={handleDeleteThread} style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer',padding:'0.5rem',opacity:0.6}}>
                <Trash2 size={16}/>
              </button>
            )}
          </div>

          <div style={{fontFamily:'var(--font-body)',fontSize:'0.9375rem',lineHeight:1.7,color:'var(--color-foreground)',whiteSpace:'pre-wrap',paddingLeft:'4rem'}}>
            {thread.content}
          </div>
        </div>

        {/* Réponses */}
        <div style={{marginBottom:'2rem'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',fontWeight:600,color:'var(--color-foreground)',marginBottom:'1.5rem'}}>
            Réponses ({replies.length})
          </h2>

          {replies.length === 0 ? (
            <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'3rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
              <p style={{color:'var(--color-muted-foreground)'}}>Aucune réponse pour le moment. Soyez le premier à répondre !</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {replies.map(reply => (
                <div key={reply.id} style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.5rem',border:'1px solid var(--color-border)'}}>
                  <div style={{display:'flex',gap:'1rem'}}>
                    <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {reply.author.profile_image ? (
                        <img src={imgUrl(reply.author.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      ) : (
                        <User size={16} style={{color:'var(--color-muted-foreground)'}}/>
                      )}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                        <div>
                          <span style={{fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.875rem',color:'var(--color-foreground)'}}>{reply.author.username}</span>
                          <span style={{marginLeft:'0.75rem',fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>{formatDate(reply.created_at)}</span>
                        </div>
                        {isReplyAuthor(reply) && (
                          <button onClick={()=>handleDeleteReply(reply.id)} style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer',opacity:0.5}}>
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                      <p style={{fontFamily:'var(--font-body)',fontSize:'0.875rem',lineHeight:1.6,color:'var(--color-foreground)',margin:0,whiteSpace:'pre-wrap'}}>
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulaire de réponse */}
        {authTokens && (
          <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.5rem',border:'1px solid var(--color-border)'}}>
            <h3 style={{fontFamily:'var(--font-body)',fontWeight:600,fontSize:'1rem',color:'var(--color-foreground)',marginBottom:'1rem'}}>Ajouter une réponse</h3>
            <form onSubmit={handleSubmitReply}>
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Écrivez votre réponse..."
                rows={4}
                style={{width:'100%',padding:'1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontSize:'0.875rem',resize:'vertical',outline:'none',color:'var(--color-foreground)',marginBottom:'1rem'}}
              />
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button
                  type="submit"
                  disabled={submitting || !newReply.trim()}
                  className="btn-craft"
                  style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.875rem',opacity:!newReply.trim()?0.5:1,cursor:!newReply.trim()?'not-allowed':'pointer'}}
                >
                  <Send size={14}/> {submitting ? 'Envoi...' : 'Publier la réponse'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ThreadDetail;