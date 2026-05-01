// src/pages/Community.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Search, Plus, UserPlus, LogOut, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { groupService, forumService } from '../services/community';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Group {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  admin: number | { id: number; username: string };
  admin_username?: string;
  members_count: number;
  is_member: boolean;
  is_admin: boolean;
  created_at: string;
}

interface Thread {
  id: number;
  title: string;
  content: string;
  author: { id: number; username: string };
  category: string;
  views_count: number;
  replies_count: number;
  created_at: string;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'forums' | 'groups'>('forums');
  const [groups, setGroups] = useState<Group[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'general' });

  const categories = ['general', 'help', 'showcase', 'technique', 'yarn', 'pattern'];
  const categoryLabels: Record<string,string> = {
    general:'Général', help:'Aide', showcase:'Vitrine', technique:'Technique', yarn:'Laine', pattern:'Patron'
  };

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'groups') {
        const data = await groupService.getAll({ search: searchQuery });
        setGroups(Array.isArray(data) ? data : data.results || []);
      } else {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;
        if (categoryFilter) params.category = categoryFilter;
        const data = await forumService.getThreads(params);
        setThreads(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

 // Dans Community.tsx, avant d'appeler l'API
const handleCreateGroup = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Vérifier le token avant l'appel
  const tokens = localStorage.getItem('authTokens');
  console.log('Auth tokens:', tokens); // Debug
  
  try {
    const created = await groupService.create(newGroup);
    setGroups([created, ...groups]);
    setShowCreateGroup(false);
    setNewGroup({ name: '', description: '' });
  } catch (error) {
    console.error('Erreur création groupe:', error);
  }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await forumService.createThread(newThread);
      setThreads([created, ...threads]);
      setShowCreateThread(false);
      setNewThread({ title: '', content: '', category: 'general' });
    } catch (error) {
      console.error('Erreur création discussion:', error);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      await groupService.join(groupId);
      setGroups(groups.map(g => g.id === groupId ? { ...g, is_member: true, members_count: g.members_count + 1 } : g));
    } catch (error) { console.error('Erreur rejoindre groupe:', error); }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      await groupService.leave(groupId);
      setGroups(groups.map(g => g.id === groupId ? { ...g, is_member: false, members_count: g.members_count - 1 } : g));
    } catch (error) { console.error('Erreur quitter groupe:', error); }
  };

  const getAdminName = (group: Group): string => {
    if (typeof group.admin === 'object' && group.admin !== null) return group.admin.username;
    return group.admin_username || 'Admin';
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar/>
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:600,color:'var(--color-foreground)',letterSpacing:'-0.02em',marginBottom:'0.25rem'}}>Communauté</h1>
        <p style={{fontFamily:'var(--font-body)',fontSize:'1rem',color:'var(--color-muted-foreground)',marginBottom:'2rem'}}>Échangez avec d'autres passionnés de tricot et crochet</p>

        {/* Tabs */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'2rem',borderBottom:'1.5px solid var(--color-border)',paddingBottom:'0.5rem'}}>
          {[
            {id:'forums',label:'Forums',icon:MessageSquare},
            {id:'groups',label:'Groupes',icon:Users}
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)}
              style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab===tab.id?'var(--color-primary)':'transparent',color:activeTab===tab.id?'#fff':'var(--color-muted-foreground)',fontFamily:'var(--font-body)',fontWeight:500,fontSize:'0.9375rem',cursor:'pointer',transition:'all 0.2s'}}>
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>

        {/* Barre d'actions */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'1rem',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
          <div style={{position:'relative',flex:1,minWidth:'240px'}}>
            <Search size={16} style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--color-muted-foreground)'}}/>
            <input type="text" placeholder={`Rechercher ${activeTab==='forums'?'des discussions':'des groupes'}...`} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              style={{width:'100%',padding:'0.75rem 1rem 0.75rem 2.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontSize:'0.875rem',outline:'none',color:'var(--color-foreground)'}}/>
          </div>
          <div style={{display:'flex',gap:'0.75rem'}}>
            {activeTab==='forums'&&(
              <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}
                style={{padding:'0.75rem 1.25rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-foreground)',cursor:'pointer'}}>
                <option value="">Toutes catégories</option>
                {categories.map(cat=><option key={cat} value={cat}>{categoryLabels[cat]||cat}</option>)}
              </select>
            )}
            <button onClick={()=>activeTab==='forums'?setShowCreateThread(true):setShowCreateGroup(true)} className="btn-craft"
              style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.875rem'}}>
              <Plus size={16}/> {activeTab==='forums'?'Nouvelle discussion':'Créer un groupe'}
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <>
            {activeTab === 'forums' ? (
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {threads.map(thread=>(
                  <div key={thread.id} onClick={()=>navigate(`/forums/thread/${thread.id}`)}
                    style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.5rem',border:'1px solid var(--color-border)',cursor:'pointer',transition:'all 0.2s'}}
                    className="card-hover">
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                          <span style={{padding:'0.25rem 0.75rem',borderRadius:'999px',fontSize:'0.6875rem',fontWeight:500,background:'hsla(35,70%,50%,0.12)',color:'hsl(35,70%,40%)'}}>{categoryLabels[thread.category]||thread.category}</span>
                          <span style={{fontFamily:'var(--font-body)',fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Par {thread.author.username} • {new Date(thread.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.125rem',fontWeight:600,color:'var(--color-foreground)',margin:'0 0 0.375rem'}}>{thread.title}</h3>
                        <p style={{fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)',margin:0,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{thread.content}</p>
                      </div>
                      <div style={{display:'flex',gap:'1rem'}}>
                        <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.8125rem',color:'var(--color-muted-foreground)'}}>👁️ {thread.views_count}</span>
                        <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.8125rem',color:'var(--color-muted-foreground)'}}>💬 {thread.replies_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {threads.length===0&&<div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted-foreground)'}}>Aucune discussion trouvée.</div>}
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1.5rem'}}>
                {groups.map(group=>(
                  <div key={group.id} style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.5rem',border:'1px solid var(--color-border)'}} className="card-hover">
                    <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
                      <div style={{width:'3rem',height:'3rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
                        {group.image ? <img src={imgUrl(group.image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-primary)',color:'#fff',fontWeight:600,fontSize:'1.25rem'}}>{group.name[0]?.toUpperCase()}</div>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <h3 style={{fontFamily:'var(--font-body)',fontWeight:600,fontSize:'1rem',color:'var(--color-foreground)',margin:'0 0 0.125rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{group.name}</h3>
                        <p style={{fontFamily:'var(--font-body)',fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:0}}>👑 {getAdminName(group)}</p>
                      </div>
                    </div>
                    {group.description&&<p style={{fontFamily:'var(--font-body)',fontSize:'0.8125rem',color:'var(--color-muted-foreground)',margin:'0 0 1rem',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{group.description}</p>}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
                      <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>👥 {group.members_count} membres</span>
                    </div>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      <button onClick={()=>navigate(`/groups/${group.id}`)}
                        style={{flex:1,padding:'0.625rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',fontFamily:'var(--font-body)',fontSize:'0.8125rem',fontWeight:500,color:'var(--color-foreground)',cursor:'pointer'}}>Voir</button>
                      {group.is_member ? (
                        !group.is_admin && <button onClick={()=>handleLeaveGroup(group.id)} style={{padding:'0.625rem 1rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',fontSize:'0.8125rem',color:'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem'}}><LogOut size={12}/> Quitter</button>
                      ) : (
                        <button onClick={()=>handleJoinGroup(group.id)} style={{padding:'0.625rem 1rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontSize:'0.8125rem',fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem'}}><UserPlus size={12}/> Rejoindre</button>
                      )}
                    </div>
                  </div>
                ))}
                {groups.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'3rem',color:'var(--color-muted-foreground)'}}>Aucun groupe trouvé.</div>}
              </div>
            )}
          </>
        )}

        {/* Modal Créer Groupe */}
        {showCreateGroup && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem'}} onClick={()=>setShowCreateGroup(false)}>
            <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',maxWidth:'28rem',width:'100%',border:'1px solid var(--color-border)'}} onClick={e=>e.stopPropagation()}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:600,margin:'0 0 1.5rem'}}>Créer un groupe</h2>
              <form onSubmit={handleCreateGroup}>
                <input type="text" placeholder="Nom du groupe" value={newGroup.name} onChange={e=>setNewGroup({...newGroup,name:e.target.value})} required
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none'}}/>
                <textarea placeholder="Description (optionnel)" value={newGroup.description} onChange={e=>setNewGroup({...newGroup,description:e.target.value})} rows={3}
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1.5rem',outline:'none',resize:'vertical'}}/>
                <div style={{display:'flex',gap:'0.75rem'}}>
                  <button type="button" onClick={()=>setShowCreateGroup(false)} style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',fontFamily:'var(--font-body)'}}>Annuler</button>
                  <button type="submit" className="btn-craft" style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>Créer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Créer Discussion */}
        {showCreateThread && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem'}} onClick={()=>setShowCreateThread(false)}>
            <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',maxWidth:'36rem',width:'100%',border:'1px solid var(--color-border)'}} onClick={e=>e.stopPropagation()}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:600,margin:'0 0 1.5rem'}}>Nouvelle discussion</h2>
              <form onSubmit={handleCreateThread}>
                <input type="text" placeholder="Titre" value={newThread.title} onChange={e=>setNewThread({...newThread,title:e.target.value})} required
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none'}}/>
                <select value={newThread.category} onChange={e=>setNewThread({...newThread,category:e.target.value})}
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none'}}>
                  {categories.map(cat=><option key={cat} value={cat}>{categoryLabels[cat]||cat}</option>)}
                </select>
                <textarea placeholder="Contenu" value={newThread.content} onChange={e=>setNewThread({...newThread,content:e.target.value})} rows={5} required
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1.5rem',outline:'none',resize:'vertical'}}/>
                <div style={{display:'flex',gap:'0.75rem'}}>
                  <button type="button" onClick={()=>setShowCreateThread(false)} style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',fontFamily:'var(--font-body)'}}>Annuler</button>
                  <button type="submit" className="btn-craft" style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>Publier</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
};

export default Community;