// src/pages/GroupDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, LogOut, Settings, MessageSquare, Plus, Trash2, Edit2, User, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { groupService, forumService, Member } from '../services/community';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Group {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  admin: { id: number; username: string; profile_image?: string | null } | number;
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
  group?: number;
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

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, authTokens } = useAuth();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussions' | 'members'>('discussions');
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'general' });
  const [editGroupForm, setEditGroupForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (id) {
      loadGroup();
      loadThreads();
    }
  }, [id]);

  useEffect(() => {
    if (group && activeTab === 'members' && group.is_member) {
      loadMembers();
    }
  }, [activeTab, group]);

  const loadGroup = async () => {
    try {
      const data = await groupService.getById(Number(id));
      setGroup(data);
      setEditGroupForm({ 
        name: data.name, 
        description: data.description || '' 
      });
    } catch (err) {
      console.error('Erreur chargement groupe:', err);
      setError('Impossible de charger ce groupe');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await groupService.getMembers(Number(id));
      setMembers(data.members || []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log('Utilisateur non membre, impossible de voir les membres');
      } else {
        console.error('Erreur chargement membres:', err);
      }
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadThreads = async () => {
    try {
      const data = await forumService.getThreads();
      const allThreads = Array.isArray(data) ? data : data.results || [];
      const groupThreads = allThreads.filter((t: any) => t.group === Number(id));
      setThreads(groupThreads);
    } catch (err) {
      console.error('Erreur chargement discussions:', err);
    }
  };

  const handleJoinGroup = async () => {
    if (!group) return;
    try {
      await groupService.join(group.id);
      setGroup({ ...group, is_member: true, members_count: group.members_count + 1 });
    } catch (err) {
      console.error('Erreur rejoindre groupe:', err);
      alert('Erreur lors de l\'adhésion au groupe');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    if (group.is_admin) {
      alert('En tant qu\'admin, vous ne pouvez pas quitter le groupe. Transférez les droits ou supprimez le groupe.');
      return;
    }
    if (!window.confirm('Quitter ce groupe ?')) return;
    
    try {
      await groupService.leave(group.id);
      setGroup({ ...group, is_member: false, members_count: group.members_count - 1 });
      setMembers([]);
    } catch (err) {
      console.error('Erreur quitter groupe:', err);
      alert('Erreur lors du départ du groupe');
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThread.title.trim() || !newThread.content.trim()) return;
    
    try {
      const created = await forumService.createThread({
        ...newThread,
        group: Number(id),
      });
      setThreads([created, ...threads]);
      setShowCreateThread(false);
      setNewThread({ title: '', content: '', category: 'general' });
    } catch (err) {
      console.error('Erreur création discussion:', err);
      alert('Erreur lors de la création de la discussion');
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    
    try {
      const updated = await groupService.update(group.id, editGroupForm);
      setGroup({ ...group, ...updated });
      setShowEditGroup(false);
    } catch (err) {
      console.error('Erreur mise à jour groupe:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    if (!window.confirm('Supprimer définitivement ce groupe ? Cette action est irréversible.')) return;
    
    try {
      await groupService.delete(group.id);
      navigate('/community');
    } catch (err) {
      console.error('Erreur suppression groupe:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDeleteThread = async (threadId: number) => {
    if (!window.confirm('Supprimer cette discussion ?')) return;
    try {
      await forumService.deleteThread(threadId);
      setThreads(threads.filter(t => t.id !== threadId));
    } catch (err) {
      console.error('Erreur suppression discussion:', err);
    }
  };

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!group) return;
    if (!window.confirm(`Retirer ${username} du groupe ?`)) return;
    
    try {
      await groupService.removeMember(group.id, userId);
      setMembers(members.filter(m => m.user.id !== userId));
      setGroup({ ...group, members_count: group.members_count - 1 });
    } catch (err) {
      console.error('Erreur suppression membre:', err);
      alert('Erreur lors de la suppression du membre');
    }
  };

  const getAdminName = (): string => {
    if (!group) return '';
    if (typeof group.admin === 'object' && group.admin !== null) {
      return group.admin.username;
    }
    return group.admin_username || 'Admin';
  };

  const getAdminId = (): number | null => {
    if (!group) return null;
    if (typeof group.admin === 'object' && group.admin !== null) {
      return group.admin.id;
    }
    return typeof group.admin === 'number' ? group.admin : null;
  };

  const isAdmin = group ? (
    group.is_admin || 
    String(user?.user_id) === String(getAdminId()) ||
    user?.username === getAdminName()
  ) : false;

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

  if (error || !group) {
    return (
      <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
        <Navbar />
        <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem',textAlign:'center'}}>
          <div style={{fontSize:'5rem',marginBottom:'1rem'}}>🧶</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',marginBottom:'1rem'}}>404</h1>
          <p style={{color:'var(--color-muted-foreground)',marginBottom:'2rem'}}>Ce groupe n'existe pas ou a été supprimé.</p>
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
      
      <div style={{maxWidth:'64rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        {/* Navigation */}
        <button onClick={()=>navigate('/community')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)',padding:0}}>
          <ArrowLeft size={16}/> Retour à la communauté
        </button>

        {/* En-tête du groupe */}
        <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',marginBottom:'2rem',border:'1px solid var(--color-border)'}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:'1.5rem',flexWrap:'wrap'}}>
            <div style={{width:'6rem',height:'6rem',borderRadius:'1.5rem',overflow:'hidden',background:'linear-gradient(135deg,hsla(18,52%,51%,0.2),hsla(35,70%,50%,0.15))',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {group.image ? (
                <img src={imgUrl(group.image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              ) : (
                <span style={{fontSize:'3rem'}}>👥</span>
              )}
            </div>
            
            <div style={{flex:1,minWidth:'250px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
                <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:600,color:'var(--color-foreground)',margin:0}}>
                  {group.name}
                </h1>
                {isAdmin && (
                  <button onClick={()=>setShowEditGroup(true)} style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer',padding:'0.25rem'}}>
                    <Edit2 size={16}/>
                  </button>
                )}
              </div>
              
              <div style={{display:'flex',alignItems:'center',gap:'1.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>
                  <Users size={14}/> {group.members_count} membre{group.members_count > 1 ? 's' : ''}
                </span>
                <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>
                  👑 Admin : {getAdminName()}
                </span>
                <span style={{fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>
                  Créé le {formatDate(group.created_at)}
                </span>
              </div>
              
              {group.description && (
                <p style={{fontFamily:'var(--font-body)',fontSize:'0.9375rem',lineHeight:1.6,color:'var(--color-foreground)',margin:0}}>
                  {group.description}
                </p>
              )}
            </div>
            
            <div style={{display:'flex',gap:'0.75rem'}}>
              {!group.is_member ? (
                <button onClick={handleJoinGroup} className="btn-craft"
                  style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.875rem'}}>
                  <UserPlus size={16}/> Rejoindre
                </button>
              ) : !isAdmin && (
                <button onClick={handleLeaveGroup}
                  style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',color:'var(--color-muted-foreground)',fontFamily:'var(--font-body)',fontWeight:500,fontSize:'0.875rem'}}>
                  <LogOut size={16}/> Quitter
                </button>
              )}
              
              {isAdmin && (
                <button onClick={handleDeleteGroup}
                  style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.5rem',borderRadius:'999px',border:'1.5px solid hsla(0,65%,52%,0.3)',background:'transparent',color:'hsl(0,65%,52%)',fontFamily:'var(--font-body)',fontWeight:500,fontSize:'0.875rem'}}>
                  <Trash2 size={16}/> Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',borderBottom:'1.5px solid var(--color-border)',paddingBottom:'0.5rem'}}>
          <button onClick={()=>setActiveTab('discussions')}
            style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='discussions'?'var(--color-primary)':'transparent',color:activeTab==='discussions'?'#fff':'var(--color-muted-foreground)',fontFamily:'var(--font-body)',fontWeight:500,cursor:'pointer',transition:'all 0.2s'}}>
            <MessageSquare size={14} style={{marginRight:'0.5rem',display:'inline'}}/>
            Discussions ({threads.length})
          </button>
          <button onClick={()=>setActiveTab('members')}
            style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='members'?'var(--color-primary)':'transparent',color:activeTab==='members'?'#fff':'var(--color-muted-foreground)',fontFamily:'var(--font-body)',fontWeight:500,cursor:'pointer',transition:'all 0.2s'}}>
            <Users size={14} style={{marginRight:'0.5rem',display:'inline'}}/>
            Membres ({group.members_count})
          </button>
        </div>

        {/* Contenu */}
        {activeTab === 'discussions' ? (
          <div>
            {group.is_member && (
              <div style={{marginBottom:'1.5rem'}}>
                <button onClick={()=>setShowCreateThread(true)} className="btn-craft"
                  style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.75rem 1.5rem',borderRadius:'999px',border:'1.5px solid var(--color-primary)',background:'transparent',color:'var(--color-primary)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.875rem'}}>
                  <Plus size={16}/> Nouvelle discussion
                </button>
              </div>
            )}
            
            {threads.length === 0 ? (
              <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'3rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
                <MessageSquare size={48} style={{color:'var(--color-muted-foreground)',marginBottom:'1rem',opacity:0.5}}/>
                <p style={{color:'var(--color-muted-foreground)',marginBottom:'1rem'}}>Aucune discussion dans ce groupe pour le moment.</p>
                {group.is_member && (
                  <button onClick={()=>setShowCreateThread(true)} className="btn-craft" style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff'}}>
                    Créer la première discussion
                  </button>
                )}
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {threads.map(thread => (
                  <div key={thread.id} style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.5rem',border:'1px solid var(--color-border)',cursor:'pointer'}} className="card-hover" onClick={()=>navigate(`/forums/thread/${thread.id}`)}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem',flexWrap:'wrap'}}>
                          <span style={{padding:'0.25rem 0.75rem',borderRadius:'999px',fontSize:'0.6875rem',fontWeight:500,background:'hsla(35,70%,50%,0.12)',color:'hsl(35,70%,40%)'}}>
                            {categoryLabels[thread.category] || thread.category}
                          </span>
                          <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>
                            Par {thread.author.username} • {formatDate(thread.created_at)}
                          </span>
                        </div>
                        <h3 style={{fontFamily:'var(--font-body)',fontSize:'1rem',fontWeight:600,color:'var(--color-foreground)',margin:'0 0 0.25rem'}}>{thread.title}</h3>
                        <p style={{fontSize:'0.8125rem',color:'var(--color-muted-foreground)',margin:'0.5rem 0 0',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                          {thread.content}
                        </p>
                        <div style={{display:'flex',gap:'1rem',marginTop:'0.75rem'}}>
                          <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',display:'flex',alignItems:'center',gap:'0.25rem'}}>👁️ {thread.views_count}</span>
                          <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',display:'flex',alignItems:'center',gap:'0.25rem'}}>💬 {thread.replies_count}</span>
                        </div>
                      </div>
                      {(isAdmin || String(user?.user_id) === String(thread.author.id)) && (
                        <button onClick={(e)=>{e.stopPropagation();handleDeleteThread(thread.id);}} style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer',opacity:0.5,padding:'0.5rem'}}>
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {!group.is_member ? (
              <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'3rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
                <Users size={48} style={{color:'var(--color-muted-foreground)',marginBottom:'1rem',opacity:0.5}}/>
                <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',marginBottom:'0.5rem'}}>
                  {group.members_count} membre{group.members_count > 1 ? 's' : ''}
                </h3>
                <p style={{color:'var(--color-muted-foreground)',marginBottom:'1.5rem'}}>
                  Rejoignez le groupe pour voir la liste des membres
                </p>
                <button onClick={handleJoinGroup} className="btn-craft"
                  style={{padding:'0.75rem 2rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>
                  <UserPlus size={16} style={{marginRight:'0.5rem'}}/> Rejoindre le groupe
                </button>
              </div>
            ) : loadingMembers ? (
              <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'3rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
                <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite',margin:'0 auto 1rem'}}/>
                <p style={{color:'var(--color-muted-foreground)'}}>Chargement des membres...</p>
              </div>
            ) : members.length === 0 ? (
              <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'3rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
                <p style={{color:'var(--color-muted-foreground)'}}>Aucun membre à afficher.</p>
              </div>
            ) : (
              <>
                <div style={{marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <p style={{color:'var(--color-muted-foreground)',fontSize:'0.875rem'}}>
                    {members.length} membre{members.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1rem'}}>
                  {members.map(member => (
                    <div key={member.id} style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1rem',border:'1px solid var(--color-border)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                        <div 
                          onClick={() => navigate(`/profile/${member.user.username}`)}
                          style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'0.75rem',flex:1}}
                        >
                          <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {member.user.profile_image ? (
                              <img src={imgUrl(member.user.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            ) : (
                              <User size={16} style={{color:'var(--color-muted-foreground)'}}/>
                            )}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontFamily:'var(--font-body)',fontWeight:500,fontSize:'0.875rem',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {member.user.username}
                            </p>
                            <span style={{fontSize:'0.6875rem',color:member.role==='admin'?'var(--color-primary)':member.role==='moderator'?'hsl(35,70%,50%)':'var(--color-muted-foreground)'}}>
                              {member.role === 'admin' ? '👑 Admin' : member.role === 'moderator' ? '⭐ Modérateur' : 'Membre'}
                            </span>
                          </div>
                        </div>
                        
                        {isAdmin && member.role !== 'admin' && (
                          <button 
                            onClick={() => handleRemoveMember(member.user.id, member.user.username)}
                            style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer',padding:'0.25rem',opacity:0.5}}
                            title="Retirer du groupe"
                          >
                            <X size={14}/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal Créer Discussion */}
        {showCreateThread && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem'}} onClick={()=>setShowCreateThread(false)}>
            <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',maxWidth:'36rem',width:'100%',maxHeight:'90vh',overflow:'auto',border:'1px solid var(--color-border)'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:600,margin:0}}>Nouvelle discussion</h2>
                <button onClick={()=>setShowCreateThread(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateThread}>
                <input type="text" placeholder="Titre" value={newThread.title} onChange={e=>setNewThread({...newThread,title:e.target.value})} required
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none'}}/>
                <select value={newThread.category} onChange={e=>setNewThread({...newThread,category:e.target.value})}
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none'}}>
                  {Object.entries(categoryLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
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

        {/* Modal Éditer Groupe */}
        {showEditGroup && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem'}} onClick={()=>setShowEditGroup(false)}>
            <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',maxWidth:'32rem',width:'100%',border:'1px solid var(--color-border)'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:600,margin:0}}>Modifier le groupe</h2>
                <button onClick={()=>setShowEditGroup(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}><X size={20}/></button>
              </div>
              <form onSubmit={handleUpdateGroup}>
                <input type="text" placeholder="Nom du groupe" value={editGroupForm.name} onChange={e=>setEditGroupForm({...editGroupForm,name:e.target.value})} required
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1rem',outline:'none'}}/>
                <textarea placeholder="Description" value={editGroupForm.description} onChange={e=>setEditGroupForm({...editGroupForm,description:e.target.value})} rows={3}
                  style={{width:'100%',padding:'0.875rem 1rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontFamily:'var(--font-body)',marginBottom:'1.5rem',outline:'none',resize:'vertical'}}/>
                <div style={{display:'flex',gap:'0.75rem'}}>
                  <button type="button" onClick={()=>setShowEditGroup(false)} style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',fontFamily:'var(--font-body)'}}>Annuler</button>
                  <button type="submit" className="btn-craft" style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>Enregistrer</button>
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

export default GroupDetail;