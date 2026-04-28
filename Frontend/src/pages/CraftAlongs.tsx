// src/pages/CraftAlongs.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Search, Plus, LogOut, UserPlus, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { craftAlongService } from '../services/community';
import { projectService } from '../services/projects';
import { useAuth } from '../context/AuthContext';

interface CraftAlong {
  id: number;
  title: string;
  description: string;
  official_pattern?: { id: number; title: string } | null;
  creator: { id: number; username: string };
  status: 'a_venir' | 'en_cours' | 'termine';
  start_date: string;
  end_date: string;
  participants_count: number;
  is_participant: boolean;
  participant_project_id?: number;
  banner_image?: string | null;
}

interface Project {
  id: number;
  pattern_title: string;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  a_venir: 'À venir',
  en_cours: 'En cours',
  termine: 'Terminé',
};

const STATUS_COLORS: Record<string, string> = {
  a_venir: 'hsl(210,40%,50%)',
  en_cours: 'hsl(105,28%,50%)',
  termine: 'var(--color-muted-foreground)',
};

const CraftAlongs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [craftAlongs, setCraftAlongs] = useState<CraftAlong[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  
  const [newCraftAlong, setNewCraftAlong] = useState({
    title: '',
    description: '',
    rules: '',
    start_date: '',
    end_date: '',
    official_pattern: null as number | null,
  });

  useEffect(() => {
    loadData();
    loadMyProjects();
  }, [statusFilter, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await craftAlongService.getAll(params);
      setCraftAlongs(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyProjects = async () => {
    try {
      const projects = await projectService.getAll();
      const projectList = Array.isArray(projects) ? projects : projects.results || [];
      setMyProjects(projectList.filter((p: Project) => p.status !== 'completed'));
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await craftAlongService.create(newCraftAlong);
      setCraftAlongs([created, ...craftAlongs]);
      setShowCreate(false);
      setNewCraftAlong({ title: '', description: '', rules: '', start_date: '', end_date: '', official_pattern: null });
    } catch (error) {
      console.error('Erreur création:', error);
    }
  };

  const handleJoin = async (craftAlongId: number) => {
    try {
      await craftAlongService.join(craftAlongId, selectedProject || undefined);
      setCraftAlongs(craftAlongs.map(ca => 
        ca.id === craftAlongId ? { ...ca, is_participant: true, participants_count: ca.participants_count + 1 } : ca
      ));
      setSelectedProject(null);
    } catch (error) {
      console.error('Erreur rejoindre:', error);
    }
  };

  const handleLeave = async (craftAlongId: number) => {
    try {
      await craftAlongService.leave(craftAlongId);
      setCraftAlongs(craftAlongs.map(ca => 
        ca.id === craftAlongId ? { ...ca, is_participant: false, participants_count: ca.participants_count - 1 } : ca
      ));
    } catch (error) {
      console.error('Erreur quitter:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar />
      
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'2rem'}}>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:600,color:'var(--color-foreground)',letterSpacing:'-0.02em',marginBottom:'0.25rem'}}>Craft-Alongs</h1>
            <p style={{fontFamily:'var(--font-body)',fontSize:'1rem',color:'var(--color-muted-foreground)'}}>Tricotez et crochetez ensemble sur des projets communs</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-craft"
            style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem'}}>
            <Plus size={16}/> Organiser un Craft-Along
          </button>
        </div>

        {/* Filtres */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'1rem',marginBottom:'2rem'}}>
          <div style={{position:'relative',flex:1,minWidth:'240px'}}>
            <Search size={16} style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--color-muted-foreground)'}}/>
            <input type="text" placeholder="Rechercher un Craft-Along..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              style={{width:'100%',padding:'0.75rem 1rem 0.75rem 2.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontSize:'0.875rem',outline:'none',color:'var(--color-foreground)'}}/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-foreground)',cursor:'pointer'}}>
            <option value="">Tous les statuts</option>
            <option value="a_venir">À venir</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminés</option>
          </select>
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1.5rem'}}>
            {craftAlongs.map(ca => (
              <div key={ca.id} style={{background:'var(--color-card)',borderRadius:'1.25rem',overflow:'hidden',border:'1px solid var(--color-border)'}} className="card-hover">
                <div style={{height:'8rem',background:'linear-gradient(135deg,hsla(18,52%,51%,0.2),hsla(35,70%,50%,0.15))',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                  <span style={{fontSize:'3rem'}}>🧶</span>
                  <span style={{position:'absolute',top:'0.75rem',right:'0.75rem',padding:'0.25rem 0.75rem',borderRadius:'999px',fontSize:'0.6875rem',fontWeight:600,background:STATUS_COLORS[ca.status]+'22',color:STATUS_COLORS[ca.status]}}>
                    {STATUS_LABELS[ca.status]}
                  </span>
                </div>
                <div style={{padding:'1.5rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                    <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.125rem',fontWeight:600,color:'var(--color-foreground)',margin:0}}>{ca.title}</h3>
                    <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}><Users size={12}/> {ca.participants_count}</span>
                  </div>
                  {ca.description && <p style={{fontFamily:'var(--font-body)',fontSize:'0.8125rem',color:'var(--color-muted-foreground)',margin:'0 0 0.75rem',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ca.description}</p>}
                  {ca.official_pattern && (
                    <p style={{fontSize:'0.75rem',color:'var(--color-primary)',margin:'0 0 0.75rem',display:'flex',alignItems:'center',gap:'0.25rem'}}>📋 {ca.official_pattern.title}</p>
                  )}
                  <div style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',marginBottom:'1rem'}}>
                    <p style={{margin:'0.125rem 0'}}>📅 Début: {formatDate(ca.start_date)}</p>
                    <p style={{margin:'0.125rem 0'}}>📅 Fin: {formatDate(ca.end_date)}</p>
                    <p style={{margin:'0.125rem 0'}}>👑 {ca.creator.username}</p>
                  </div>
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button onClick={() => navigate(`/craft-alongs/${ca.id}`)}
                      style={{flex:1,padding:'0.625rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',fontFamily:'var(--font-body)',fontSize:'0.8125rem',fontWeight:500,color:'var(--color-foreground)',cursor:'pointer'}}>
                      Voir détails
                    </button>
                    {ca.is_participant ? (
                      <button onClick={() => handleLeave(ca.id)}
                        style={{padding:'0.625rem 1rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontSize:'0.8125rem',color:'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem'}}>
                        <LogOut size={12}/> Quitter
                      </button>
                    ) : (
                      <button onClick={() => handleJoin(ca.id)}
                        style={{padding:'0.625rem 1rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontSize:'0.8125rem',fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem'}}>
                        <UserPlus size={12}/> Participer
                      </button>
                    )}
                  </div>
                  {!ca.is_participant && myProjects.length > 0 && (
                    <select value={selectedProject || ''} onChange={e=>setSelectedProject(Number(e.target.value))}
                      style={{width:'100%',marginTop:'0.75rem',padding:'0.5rem',borderRadius:'0.5rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.75rem'}}>
                      <option value="">Sans projet lié</option>
                      {myProjects.map(p=><option key={p.id} value={p.id}>{p.pattern_title}</option>)}
                    </select>
                  )}
                </div>
              </div>
            ))}
            {craftAlongs.length===0 && (
              <div style={{gridColumn:'1/-1',textAlign:'center',padding:'4rem',background:'var(--color-card)',borderRadius:'1.5rem',border:'1px solid var(--color-border)'}}>
                <p style={{fontSize:'3rem',marginBottom:'0.5rem'}}>🧶</p>
                <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',marginBottom:'0.5rem'}}>Aucun Craft-Along trouvé</h3>
                <p style={{color:'var(--color-muted-foreground)',marginBottom:'1.5rem'}}>Organisez le vôtre !</p>
                <button onClick={()=>setShowCreate(true)} className="btn-craft" style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff'}}>+ Créer un Craft-Along</button>
              </div>
            )}
          </div>
        )}

        {/* Modal Création */}
        {showCreate && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem'}} onClick={()=>setShowCreate(false)}>
            <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',maxWidth:'36rem',width:'100%',maxHeight:'90vh',overflow:'auto',border:'1px solid var(--color-border)'}} onClick={e=>e.stopPropagation()}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:600,margin:'0 0 1.5rem'}}>Organiser un Craft-Along</h2>
              <form onSubmit={handleCreate}>
                <input type="text" placeholder="Titre" value={newCraftAlong.title} onChange={e=>setNewCraftAlong({...newCraftAlong,title:e.target.value})} required
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none'}}/>
                <textarea placeholder="Description" value={newCraftAlong.description} onChange={e=>setNewCraftAlong({...newCraftAlong,description:e.target.value})} rows={3}
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div><label style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Début</label><input type="date" value={newCraftAlong.start_date} onChange={e=>setNewCraftAlong({...newCraftAlong,start_date:e.target.value})} required
                    style={{width:'100%',padding:'0.75rem',borderRadius:'0.5rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)'}}/></div>
                  <div><label style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Fin</label><input type="date" value={newCraftAlong.end_date} onChange={e=>setNewCraftAlong({...newCraftAlong,end_date:e.target.value})} required
                    style={{width:'100%',padding:'0.75rem',borderRadius:'0.5rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)'}}/></div>
                </div>
                <div style={{display:'flex',gap:'0.75rem'}}>
                  <button type="button" onClick={()=>setShowCreate(false)} style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',fontFamily:'var(--font-body)'}}>Annuler</button>
                  <button type="submit" className="btn-craft" style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>Créer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CraftAlongs;