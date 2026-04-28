// src/pages/SearchUsers.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, UserPlus, UserCheck, Users, Package } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { followService } from '../services/follow';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

interface SearchUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  profile_image: string | null;
  followers_count: number;
  patterns_count: number;
  is_following: boolean;
}

const SearchUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (query.length < 2) { setUsers([]); return; }
    const timer = setTimeout(() => searchUsers(), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const searchUsers = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await api.get(`/search/users/?q=${encodeURIComponent(query)}`);
      setUsers(response.data.users || []);
    } catch (error) { console.error('Erreur recherche:', error); }
    finally { setLoading(false); }
  };

  const handleFollow = async (username: string, index: number) => {
    setFollowLoading(prev => ({ ...prev, [index]: true }));
    try {
      const targetUser = users[index];
      if (targetUser.is_following) {
        await followService.unfollow(username);
      } else {
        await followService.toggle(username);
      }
      setUsers(prev => prev.map((u, i) => i === index ? { ...u, is_following: !u.is_following, followers_count: u.is_following ? u.followers_count - 1 : u.followers_count + 1 } : u));
    } catch (error) { console.error('Erreur follow:', error); }
    finally { setFollowLoading(prev => ({ ...prev, [index]: false })); }
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar />
      <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:600,marginBottom:'0.5rem'}}>
          <Users size={28} style={{marginRight:'0.75rem',display:'inline',verticalAlign:'middle'}}/>
          Découvrir des créateurs
        </h1>
        <p style={{color:'var(--color-muted-foreground)',marginBottom:'2rem'}}>
          Trouvez des créateurs de patrons et abonnez-vous à leur profil
        </p>

        {/* Barre de recherche */}
        <div style={{position:'relative',marginBottom:'2rem'}}>
          <Search size={18} style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--color-muted-foreground)'}}/>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par nom, username ou email..."
            style={{
              width:'100%',padding:'1rem 1rem 1rem 3rem',
              borderRadius:'999px',border:'1.5px solid var(--color-border)',
              background:'var(--color-surface)',fontSize:'1rem',outline:'none',
            }}
          />
        </div>

        {/* Résultats */}
        {loading ? (
          <div style={{textAlign:'center',padding:'3rem'}}>
            <div style={{width:'2rem',height:'2rem',borderRadius:'999px',border:'2px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
          </div>
        ) : query.length < 2 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted-foreground)'}}>
            <Users size={48} style={{marginBottom:'1rem',opacity:0.5}}/>
            <p>Tapez au moins 2 caractères pour rechercher</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted-foreground)'}}>
            <User size={48} style={{marginBottom:'1rem',opacity:0.5}}/>
            <p>Aucun utilisateur trouvé pour "{query}"</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {users.map((u, i) => (
              <div key={u.id} style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)',display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer'}}
                onClick={() => navigate(`/profile/${u.username}`)}>
                <div style={{width:'3.5rem',height:'3.5rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
                  {u.profile_image ? <img src={imgUrl(u.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-primary)',color:'#fff',fontSize:'1.25rem',fontWeight:600}}>{u.username?.[0]?.toUpperCase()}</div>}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:600,margin:'0 0 0.125rem'}}>{u.full_name || u.username}</p>
                  <p style={{fontSize:'0.8125rem',color:'var(--color-muted-foreground)',margin:0}}>@{u.username}</p>
                  <div style={{display:'flex',gap:'1rem',marginTop:'0.375rem',fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>
                    <span>👥 {u.followers_count} abonnés</span>
                    <span>📚 {u.patterns_count} patrons</span>
                  </div>
                </div>
                {user?.username !== u.username && (
                  <button onClick={e => { e.stopPropagation(); handleFollow(u.username, i); }}
                    disabled={followLoading[i]}
                    style={{
                      padding:'0.625rem 1.25rem',borderRadius:'999px',border:u.is_following?'1.5px solid var(--color-border)':'none',
                      background:u.is_following?'transparent':'var(--color-primary)',
                      color:u.is_following?'var(--color-foreground)':'#fff',
                      fontWeight:500,fontSize:'0.8125rem',cursor:'pointer',
                      display:'flex',alignItems:'center',gap:'0.375rem',
                      opacity:followLoading[i]?0.7:1,
                    }}>
                    {u.is_following ? <><UserCheck size={14}/> Abonné</> : <><UserPlus size={14}/> S'abonner</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchUsers;