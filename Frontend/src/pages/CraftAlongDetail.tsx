// src/pages/CraftAlongDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, ChevronLeft, User, LogOut, UserPlus, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { craftAlongService } from '../services/community';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// src/pages/CraftAlongDetail.tsx

interface CraftAlong {
  id: number;
  title: string;
  description: string | null;
  rules: string | null;
  start_date: string;
  end_date: string;
  official_pattern: Pattern | null;
  creator: number | null;  // ← C'est juste un ID
  creator_id?: number;
  creator_username?: string;
  creator_email?: string;
  creator_profile_image?: string | null;
  banner_image: string | null;
  status: 'a_venir' | 'en_cours' | 'termine';
  participants_count: number;
  is_participant: boolean;
  created_at: string;
}
interface Pattern {
  id: number;
  title: string;
  cover_image: string | null;
  author: { id: number; username: string };
  price: string;
  is_free: boolean;
}

interface UserInfo {
  id: number;
  username: string;
  profile_image?: string | null;
}

interface Participant {
  id: number;
  user: UserInfo;
  project: { id: number; pattern_title: string } | null;
  joined_at: string;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  a_venir: { label: 'À venir', color: 'hsl(210,40%,50%)' },
  en_cours: { label: 'En cours', color: 'hsl(105,28%,50%)' },
  termine: { label: 'Terminé', color: 'var(--color-muted-foreground)' },
};

const CraftAlongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [craftAlong, setCraftAlong] = useState<CraftAlong | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'participants'>('info');

  useEffect(() => {
    if (id) loadCraftAlong();
  }, [id]);

  const loadCraftAlong = async () => {
    setLoading(true);
    try {
      const data = await craftAlongService.getById(Number(id));
      console.log('Craft-Along data:', data);
      setCraftAlong(data);
      if (data.participants) setParticipants(data.participants);
    } catch (err) {
      console.error('Erreur chargement Craft-Along:', err);
      setError('Impossible de charger ce Craft-Along');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!craftAlong) return;
    try {
      await craftAlongService.join(craftAlong.id);
      setCraftAlong({ ...craftAlong, is_participant: true, participants_count: craftAlong.participants_count + 1 });
      Swal.fire({ title: 'Inscription réussie !', text: `Vous participez maintenant à ${craftAlong.title}`, icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      loadCraftAlong();
    } catch (err) { console.error('Erreur rejoindre:', err); Swal.fire({ title: 'Erreur', text: 'Impossible de rejoindre ce Craft-Along', icon: 'error' }); }
  };

  const handleLeave = async () => {
    if (!craftAlong) return;
    const result = await Swal.fire({ title: 'Quitter le Craft-Along ?', text: 'Vous pourrez toujours rejoindre à nouveau plus tard.', icon: 'warning', showCancelButton: true, confirmButtonColor: 'hsl(0,65%,52%)', confirmButtonText: 'Oui, quitter', cancelButtonText: 'Annuler' });
    if (!result.isConfirmed) return;
    try {
      await craftAlongService.leave(craftAlong.id);
      setCraftAlong({ ...craftAlong, is_participant: false, participants_count: Math.max(0, craftAlong.participants_count - 1) });
      Swal.fire({ title: 'Vous avez quitté', text: `Vous ne participez plus à ${craftAlong.title}`, icon: 'info', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      loadCraftAlong();
    } catch (err) { console.error('Erreur quitter:', err); Swal.fire({ title: 'Erreur', text: 'Impossible de quitter ce Craft-Along', icon: 'error' }); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ====================== FONCTIONS SÉCURISÉES ======================
const getCreatorName = (): string => {
  if (craftAlong?.creator_username) return craftAlong.creator_username;
  if (craftAlong?.creator_email) return craftAlong.creator_email.split('@')[0];
  if (craftAlong?.creator_id) return `Utilisateur #${craftAlong.creator_id}`;
  return 'Anonyme';
}; 

  const getCreatorId = (): number | null => {
  return craftAlong?.creator_id || (typeof craftAlong?.creator === 'number' ? craftAlong.creator : null) || null;
};
  const getCreatorImage = (): string | null => {
  return craftAlong?.creator_profile_image || null;
};

const isCreator = craftAlong 
  ? (getCreatorId() === Number(user?.user_id) || getCreatorName() === user?.username)
  : false;

  // ====================== RENDER ======================
  if (loading) {
    return (<div style={{minHeight:'100vh',background:'var(--color-background)'}}><Navbar /><div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite'}}/></div><Footer /></div>);
  }

  if (error || !craftAlong) {
    return (<div style={{minHeight:'100vh',background:'var(--color-background)'}}><Navbar /><div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem',textAlign:'center'}}><div style={{fontSize:'5rem',marginBottom:'1rem'}}>🧶</div><h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',marginBottom:'1rem'}}>404</h1><p style={{color:'var(--color-muted-foreground)',marginBottom:'2rem'}}>Ce Craft-Along n'existe pas ou a été supprimé.</p><button onClick={()=>navigate('/craft-alongs')} className="btn-craft" style={{padding:'0.875rem 2rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>Retour aux Craft-Alongs</button></div><Footer /></div>);
  }

  const statusConfig = statusLabels[craftAlong.status];
  const isUpcoming = craftAlong?.status === 'a_venir';
  const isActive = craftAlong?.status === 'en_cours';
  const isFinished = craftAlong?.status === 'termine';
  const isParticipant = craftAlong?.is_participant || isCreator;
  const canJoin = !isParticipant && (isUpcoming || isActive) && !isFinished;
  const canLeave = isParticipant && !isCreator && !isFinished;

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      <div style={{maxWidth:'64rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={()=>navigate('/craft-alongs')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)',padding:0}}><ChevronLeft size={16}/> Retour aux Craft-Alongs</button>

        <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',marginBottom:'2rem',border:'1px solid var(--color-border)'}}>
          <div style={{height:'12rem',borderRadius:'1rem',overflow:'hidden',marginBottom:'1.5rem',background:'linear-gradient(135deg,hsla(18,52%,51%,0.2),hsla(35,70%,50%,0.15))',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {craftAlong.banner_image ? (<img src={imgUrl(craftAlong.banner_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>) : (<span style={{fontSize:'4rem'}}>🧶</span>)}
          </div>

          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
                <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.75rem,4vw,2.25rem)',fontWeight:600,color:'var(--color-foreground)',margin:0}}>{craftAlong.title}</h1>
                <span style={{padding:'0.25rem 0.875rem',borderRadius:'999px',fontSize:'0.8125rem',fontWeight:600,background:statusConfig.color+'22',color:statusConfig.color}}>{statusConfig.label}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
                <span style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}><Calendar size={14}/> {formatDate(craftAlong.start_date)} - {formatDate(craftAlong.end_date)}</span>
                <span style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}><Users size={14}/> {craftAlong.participants_count} participant{craftAlong.participants_count > 1 ? 's' : ''}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>
                👑 Organisé par {getCreatorName()}
                {isCreator && (<span style={{marginLeft:'0.5rem',padding:'0.125rem 0.5rem',borderRadius:'999px',fontSize:'0.6875rem',background:'var(--color-primary)',color:'#fff'}}>Vous</span>)}
              </div>
            </div>
            <div>
              {canJoin ? (<button onClick={handleJoin} className="btn-craft" style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,cursor:'pointer'}}><UserPlus size={16}/> Participer</button>)
              : canLeave ? (<button onClick={handleLeave} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',color:'var(--color-muted-foreground)',fontFamily:'var(--font-body)',fontWeight:500,cursor:'pointer'}}><LogOut size={16}/> Quitter</button>)
              : isCreator ? (<span style={{padding:'0.875rem 1.75rem',borderRadius:'999px',background:'hsla(18,52%,51%,0.1)',color:'var(--color-primary)',fontFamily:'var(--font-body)',fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem'}}>👑 Vous êtes l'organisateur</span>)
              : isParticipant ? (<span style={{padding:'0.875rem 1.75rem',borderRadius:'999px',background:'hsla(105,28%,50%,0.1)',color:'hsl(105,28%,50%)',fontFamily:'var(--font-body)',fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem'}}>✅ Vous participez</span>)
              : isFinished ? (<span style={{padding:'0.875rem 1.75rem',color:'var(--color-muted-foreground)'}}>Terminé</span>) : null}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',borderBottom:'1.5px solid var(--color-border)',paddingBottom:'0.5rem'}}>
          <button onClick={()=>setActiveTab('info')} style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='info'?'var(--color-primary)':'transparent',color:activeTab==='info'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:500}}>Informations</button>
          <button onClick={()=>setActiveTab('participants')} style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='participants'?'var(--color-primary)':'transparent',color:activeTab==='participants'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:500}}>Participants ({craftAlong.participants_count})</button>
        </div>

        {/* Contenu Info */}
        {activeTab === 'info' && (
          <div style={{background:'var(--color-card)',borderRadius:'1.25rem',padding:'2rem',border:'1px solid var(--color-border)'}}>
            <div style={{marginBottom:'2rem'}}><h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',fontWeight:600,marginBottom:'1rem'}}>Description</h2><p style={{fontFamily:'var(--font-body)',lineHeight:1.7,color:'var(--color-foreground)',margin:0,whiteSpace:'pre-wrap'}}>{craftAlong.description || 'Aucune description fournie.'}</p></div>
            {craftAlong.rules && (<div style={{marginBottom:'2rem'}}><h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',fontWeight:600,marginBottom:'1rem'}}>Règles</h2><p style={{fontFamily:'var(--font-body)',lineHeight:1.7,color:'var(--color-foreground)',margin:0,whiteSpace:'pre-wrap'}}>{craftAlong.rules}</p></div>)}
           {craftAlong.official_pattern && (
  <div>
    <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',fontWeight:600,marginBottom:'1rem'}}>Patron officiel</h2>
    <div style={{display:'flex',alignItems:'center',gap:'1rem',padding:'1rem',background:'var(--color-surface)',borderRadius:'0.75rem',cursor:'pointer'}} 
    onClick={() => {
  const pattern = craftAlong.official_pattern;
  if (!pattern) return;
  const patternId = typeof pattern === 'object' ? pattern.id : pattern;
  navigate(`/patterns/${patternId}`);
}}>
      <div style={{width:'4rem',height:'4rem',borderRadius:'0.5rem',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
        {(typeof craftAlong.official_pattern === 'object' && craftAlong.official_pattern.cover_image) ? (
          <img src={imgUrl(craftAlong.official_pattern.cover_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        ) : (
          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem'}}>🧶</div>
        )}
      </div>
      <div style={{flex:1}}>
        <p style={{fontWeight:600,margin:'0 0 0.25rem'}}>
          {typeof craftAlong.official_pattern === 'object' ? craftAlong.official_pattern.title : `Patron #${craftAlong.official_pattern}`}
        </p>
        <p style={{fontSize:'0.875rem',color:'var(--color-muted-foreground)',margin:0}}>
          {typeof craftAlong.official_pattern === 'object' && craftAlong.official_pattern.author 
            ? `par ${craftAlong.official_pattern.author.username} • ${craftAlong.official_pattern.is_free ? 'Gratuit' : `${craftAlong.official_pattern.price} DT`}`
            : ''}
        </p>
      </div>
      <ExternalLink size={16} style={{color:'var(--color-muted-foreground)'}}/>
    </div>
  </div>
)}
          </div>
        )}

        {/* Contenu Participants */}
        {activeTab === 'participants' && (
          <div style={{background:'var(--color-card)',borderRadius:'1.25rem',padding:'1.5rem',border:'1px solid var(--color-border)'}}>
            {participants.length === 0 && !isCreator ? (
              <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted-foreground)'}}><Users size={48} style={{marginBottom:'1rem',opacity:0.5}}/><p>Aucun participant pour le moment.</p>{canJoin && (<button onClick={handleJoin} className="btn-craft" style={{marginTop:'1rem',padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff'}}>Soyez le premier à participer !</button>)}</div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
                {isCreator && (
                  <div style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem',borderRadius:'0.75rem',background:'hsla(18,52%,51%,0.05)',border:'1px solid hsla(18,52%,51%,0.2)'}}>
                    <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
                      {getCreatorImage() ? (<img src={imgUrl(getCreatorImage())} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>) : (<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-primary)',color:'#fff'}}><User size={16}/></div>)}
                    </div>
                    <div><p style={{fontWeight:500,margin:0}}>{getCreatorName()}</p><span style={{fontSize:'0.6875rem',color:'var(--color-primary)'}}>👑 Organisateur</span></div>
                  </div>
                )}
               {participants.map(p => (
  <div key={p.id} onClick={()=> {
    if (p?.user?.username) navigate(`/profile/${p.user.username}`);
  }}>
    <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
      {p?.user?.profile_image ? (<img src={imgUrl(p.user.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>) : (<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><User size={16} style={{color:'var(--color-muted-foreground)'}}/></div>)}
    </div>
    <div>
      <p style={{fontWeight:500,margin:0}}>{p?.user?.username || 'Participant'}</p>
      {p?.project && (<p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:0}}>📋 {p.project.pattern_title}</p>)}
    </div>
  </div>
))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CraftAlongDetail;