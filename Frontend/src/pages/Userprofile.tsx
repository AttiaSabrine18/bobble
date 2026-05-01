// src/pages/Userprofile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Package, Heart, ShoppingBag, DollarSign, TrendingUp, ChevronRight, Truck, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { marketplaceService } from '../services/marketplace';
import { followService } from '../services/follow';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  try {
    const tokens = localStorage.getItem('authTokens');
    if (!tokens) return null;
    const parsed = JSON.parse(tokens);
    return parsed?.access || null;
  } catch { return null; }
}

function getUsernameFromToken(): string | null {
  try {
    const tokens = localStorage.getItem('authTokens');
    if (!tokens) return null;
    const { access } = JSON.parse(tokens);
    const payload = JSON.parse(atob(access.split('.')[1]));
    return payload.username || null;
  } catch { return null; }
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
}

// ====================== TYPES ======================
type Tab = 'projects' | 'publications' | 'favorites' | 'stash' | 'dashboard' | 'marketplace';
type PublicationsSubTab = 'all' | 'patterns' | 'yarn' | 'needles' | 'accessories';

const STATUS_LABELS: Record<string, string> = {
  en_cours: 'En cours', termine: 'Terminé', defait: 'Défait', hibernation: 'En hibernation',
  planning: 'Planifié', in_progress: 'En cours', completed: 'Terminé', frogged: 'Détricoté',
};

const orderStatusColors: Record<string, string> = {
  pending: 'hsl(35,70%,50%)', confirmed: 'hsl(210,40%,50%)',
  shipped: 'hsl(260,40%,50%)', delivered: 'hsl(105,28%,50%)', cancelled: 'hsl(0,65%,52%)',
};

const orderStatusIcons: Record<string, React.ReactNode> = {
  pending: <Package size={14}/>, confirmed: <CheckCircle size={14}/>,
  shipped: <Truck size={14}/>, delivered: <CheckCircle size={14}/>, cancelled: <XCircle size={14}/>,
};

// ====================== COMPOSANT ======================
const UserProfile: React.FC = () => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tokenUsername = getUsernameFromToken();
  const usernameToFetch = paramUsername || user?.username || tokenUsername;

  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('projects');
  const [tabItems, setTabItems] = useState<Record<string, any[] | null>>({
    projects: null, favorites: null, stash: null, dashboard: null, marketplace: null,
  });
  const [tabLoading, setTabLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // ====================== ÉTATS FOLLOW ======================
  const [followers, setFollowers] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // ====================== ÉTATS MARKETPLACE ======================
  const [marketplaceOrders, setMarketplaceOrders] = useState<{ buys: any[]; sales: any[] }>({ buys: [], sales: [] });
  const [marketplaceUnreadCount, setMarketplaceUnreadCount] = useState(0);
  const [marketplaceSubTab, setMarketplaceSubTab] = useState<'buys' | 'sales'>('buys');

  // ====================== ÉTATS PUBLICATIONS ======================
  const [publications, setPublications] = useState<any>(null);
  const [publicationsSubTab, setPublicationsSubTab] = useState<PublicationsSubTab>('all');
  const [publicationsLoading, setPublicationsLoading] = useState(false);

  const isMe = !paramUsername || paramUsername === user?.username || paramUsername === tokenUsername;

  // Fetch profile data
  useEffect(() => {
    if (!usernameToFetch) { setProfileError('Utilisateur non trouvé'); setProfileLoading(false); return; }
    const token = getToken(); if (!token) { setProfileError('Veuillez vous connecter'); setProfileLoading(false); return; }
    fetch(`${API}/api/profile/${usernameToFetch}/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(async response => { if (!response.ok) throw new Error(response.status === 404 ? 'Utilisateur non trouvé' : `HTTP ${response.status}`); return response.json(); })
      .then(data => { setProfileData(data); setIsFollowing(data?.is_following || false); setProfileLoading(false); })
      .catch(err => { setProfileError(err.message); setProfileLoading(false); });
  }, [usernameToFetch]);

  // Fetch dashboard stats
  useEffect(() => {
    if (!isMe || !profileData) return;
    const token = getToken(); if (!token) return;
    fetch(`${API}/api/creator/dashboard/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null).then(data => setDashboardStats(data))
      .catch(err => console.error('Dashboard error:', err));
  }, [isMe, profileData]);

  // Charger commandes marketplace
  useEffect(() => {
    if (!isMe || !profileData) return;
    (async () => {
      try {
        const response = await marketplaceService.getOrders();
        setMarketplaceOrders(response);
        const buysUnread = response.buys.reduce((sum: number, o: any) => sum + (o.unread_messages || 0), 0);
        const salesUnread = response.sales.reduce((sum: number, o: any) => sum + (o.unread_messages || 0), 0);
        setMarketplaceUnreadCount(buysUnread + salesUnread);
      } catch (error) { console.error('Erreur chargement commandes:', error); }
    })();
  }, [isMe, profileData]);

  // Charger publications
  useEffect(() => {
    if (!usernameToFetch || !profileData) return;
    if (tab !== 'publications') return;
    if (publications !== null) return;
    (async () => {
      setPublicationsLoading(true);
      try {
        const token = getToken();
        const response = await fetch(`${API}/api/profile/${usernameToFetch}/publications/`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
        if (response.ok) { const data = await response.json(); setPublications(data); }
      } catch (error) { console.error('Erreur chargement publications:', error); }
      finally { setPublicationsLoading(false); }
    })();
  }, [tab, usernameToFetch, profileData, publications]);

  // Fetch tab data
  useEffect(() => {
    if (!usernameToFetch || !profileData) return;
    if (tab === 'dashboard' && !isMe) return;
    if (tab === 'marketplace' || tab === 'publications') return;
    if (tabItems[tab] !== null) return;
    const token = getToken(); if (!token) return;
    if (tab === 'dashboard') { setTabItems(prev => ({ ...prev, dashboard: [] })); return; }
    const endpoints: Record<string, string> = { projects: `/api/projects/`, favorites: `/api/favorites/`, stash: `/api/yarn-stash/` };
    setTabLoading(true);
    fetch(`${API}${endpoints[tab]}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) return [];
        const data = await response.json();
        let items = [];
        if (tab === 'favorites') { const fl = data.results || data; items = fl.map((fav: any) => fav.pattern || fav).filter(Boolean); }
        else if (tab === 'projects') { const pl = data.results || data; items = pl.filter((p: any) => p.user?.username === usernameToFetch); }
        else { items = data.results || data || []; }
        return items;
      })
      .then(items => { setTabItems(prev => ({ ...prev, [tab]: Array.isArray(items) ? items : [] })); })
      .catch(err => { console.error(`Error loading ${tab}:`, err); setTabItems(prev => ({ ...prev, [tab]: [] })); })
      .finally(() => setTabLoading(false));
  }, [tab, usernameToFetch, profileData, isMe]);

  // ====================== FOLLOW ======================
  useEffect(() => {
    if (!usernameToFetch) return;
    followService.getFollowers(usernameToFetch).then(data => setFollowers(data)).catch(() => {});
  }, [usernameToFetch]);

  useEffect(() => {
    if (!isMe && usernameToFetch) {
      followService.getFollowing().then(data => {
        setIsFollowing(data.some((f: any) => f.username === usernameToFetch));
      }).catch(() => {});
    }
  }, [isMe, usernameToFetch]);

  const handleFollow = async () => {
    if (!usernameToFetch) return;
    setFollowLoading(true);
    try {
      if (isFollowing) { await followService.unfollow(usernameToFetch); setIsFollowing(false); }
      else { await followService.toggle(usernameToFetch); setIsFollowing(true); }
      const data = await followService.getFollowers(usernameToFetch);
      setFollowers(data);
    } catch (error) { console.error('Erreur follow/unfollow:', error); }
    finally { setFollowLoading(false); }
  };

  // ====================== RENDER ======================
  if (profileLoading) {
    return (<div style={{ minHeight: '100vh', background: 'var(--color-background)' }}><Navbar /><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div style={{ width: '3rem', height: '3rem', borderRadius: '999px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} /></div><Footer /></div>);
  }

  if (profileError || !profileData) {
    return (<div style={{ minHeight: '100vh', background: 'var(--color-background)' }}><Navbar /><div style={{ maxWidth: '48rem', margin: '0 auto', padding: '7rem 1.5rem 5rem', textAlign: 'center' }}><div style={{ fontSize: '5rem', marginBottom: '1rem' }}>👤</div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>Profil introuvable</h1><p style={{ color: 'var(--color-muted-foreground)', marginBottom: '2rem' }}>{profileError}</p><button onClick={() => navigate('/patterns')} className="btn-craft" style={{ padding: '0.875rem 2rem', borderRadius: '999px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}>Retour au catalogue</button></div><Footer /></div>);
  }

  const profile = profileData.profile || {};
  const displayName = profile.full_name || profileData.username || 'Utilisateur';
  const avatarUrl = imgUrl(profile.image);
  const bio = profile.bio || '';
  const dateJoined = profileData.date_joined || '';
  const projectsCount = profileData.projects_count || 0;
  const patternsCount = profileData.patterns_count || 0;
  const followersCount = profileData.followers_count || 0;
  const followingCount = profileData.following_count || 0;
  const items = tabItems[tab] || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '7rem 1.5rem 5rem' }}>
        {/* Profile Header */}
        <div style={{ background: 'var(--color-card)', borderRadius: '1.5rem', padding: '2rem', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: '6rem', height: '6rem', borderRadius: '999px', overflow: 'hidden', background: 'var(--color-muted)', flexShrink: 0 }}>
              {avatarUrl ? (<img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', color: '#fff', fontSize: '2rem' }}>{profileData.username?.[0]?.toUpperCase()}</div>)}
            </div>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 600, margin: 0 }}>{displayName}</h1>
                <span style={{ color: 'var(--color-muted-foreground)', fontSize: '0.875rem' }}>@{profileData.username}</span>
              </div>
              {bio && <p style={{ color: 'var(--color-muted-foreground)', marginBottom: '1rem', lineHeight: 1.6 }}>{bio}</p>}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={14} style={{ color: 'var(--color-muted-foreground)' }} /><span style={{ fontSize: '0.875rem' }}>Membre depuis {new Date(dateJoined).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span></div>
              </div>
            </div>
            {!isMe && (<button onClick={handleFollow} disabled={followLoading} className="btn-craft" style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', background: isFollowing ? 'var(--color-surface)' : 'var(--color-primary)', color: isFollowing ? 'var(--color-foreground)' : '#fff', fontWeight: 600, border: isFollowing ? '1.5px solid var(--color-border)' : 'none', cursor: 'pointer', opacity: followLoading ? 0.7 : 1 }}>{isFollowing ? 'Abonné' : 'S\'abonner'}</button>)}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Stat n={projectsCount} label="Projets" />
            <Stat n={patternsCount} label="Patrons créés" />
            <button onClick={() => setShowFollowers(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>{followers.length}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: 0 }}>Abonnés</p>
            </button>
            {isMe ? (
              <button onClick={() => setShowFollowing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>{followingCount}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: 0 }}>Abonnements</p>
              </button>
            ) : (
              <Stat n={followingCount} label="Abonnements" />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <TabBtn active={tab === 'projects'} onClick={() => setTab('projects')} label="Projets" />
          <TabBtn active={tab === 'publications'} onClick={() => { setTab('publications'); setPublications(null); }} label="Publications" />
          {isMe && <TabBtn active={tab === 'favorites'} onClick={() => setTab('favorites')} label="Favoris" />}
          {isMe && <TabBtn active={tab === 'stash'} onClick={() => setTab('stash')} label="Stash" />}
          {isMe && <TabBtn active={tab === 'dashboard'} onClick={() => setTab('dashboard')} label="Dashboard" />}
          {isMe && (<TabBtn active={tab === 'marketplace'} onClick={() => setTab('marketplace')} label="Commandes" badge={marketplaceUnreadCount > 0 ? marketplaceUnreadCount : undefined} />)}
        </div>

        {/* ====================== DASHBOARD ====================== */}
        {tab === 'dashboard' && isMe && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)' }}><DollarSign size={24} style={{ color: 'hsl(105,28%,50%)', marginBottom: '0.5rem' }} /><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dashboardStats?.total_revenue?.toFixed(2) || '0.00'} DT</div><div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>Revenus totaux</div></div>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)' }}><ShoppingBag size={24} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} /><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dashboardStats?.total_sales || 0}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>Ventes totales</div></div>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)' }}><Package size={24} style={{ color: 'hsl(210,40%,50%)', marginBottom: '0.5rem' }} /><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dashboardStats?.total_active_listings || 0}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>Annonces actives</div></div>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)' }}><TrendingUp size={24} style={{ color: 'hsl(35,70%,50%)', marginBottom: '0.5rem' }} /><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(dashboardStats?.patterns_count || 0) + (dashboardStats?.yarn_count || 0) + (dashboardStats?.needle_count || 0) + (dashboardStats?.accessory_count || 0)}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>Total publications</div></div>
            </div>
            {/* Détail par catégorie */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid var(--color-border)' }}><h4>📚 Patrons</h4><p>{dashboardStats?.patterns_count || 0} publiés • {dashboardStats?.patterns_sold || 0} vendus</p><p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{dashboardStats?.patterns_revenue?.toFixed(2) || '0.00'} DT</p></div>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid var(--color-border)' }}><h4>🧶 Laines</h4><p>{dashboardStats?.yarn_count || 0} annonces • {dashboardStats?.yarn_sold || 0} vendues</p><p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{dashboardStats?.yarn_revenue?.toFixed(2) || '0.00'} DT</p></div>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid var(--color-border)' }}><h4>🪡 Aiguilles</h4><p>{dashboardStats?.needle_count || 0} annonces • {dashboardStats?.needle_sold || 0} vendues</p><p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{dashboardStats?.needle_revenue?.toFixed(2) || '0.00'} DT</p></div>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid var(--color-border)' }}><h4>✂️ Accessoires</h4><p>{dashboardStats?.accessory_count || 0} annonces • {dashboardStats?.accessory_sold || 0} vendus</p><p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{dashboardStats?.accessory_revenue?.toFixed(2) || '0.00'} DT</p></div>
            </div>
          </div>
        )}

        {/* ====================== PUBLICATIONS ====================== */}
       {tab === 'publications' && (
  <div>
    <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
      <SubTabBtn active={publicationsSubTab==='all'} onClick={()=>setPublicationsSubTab('all')} label="Tout" count={publications?.stats?.total_all||0} />
      <SubTabBtn active={publicationsSubTab==='patterns'} onClick={()=>setPublicationsSubTab('patterns')} label="Patrons" count={publications?.stats?.total_patterns||0} icon="📚" />
      <SubTabBtn active={publicationsSubTab==='yarn'} onClick={()=>setPublicationsSubTab('yarn')} label="Laines" count={publications?.publications?.yarn_listings?.length||0} icon="🧶" />
      <SubTabBtn active={publicationsSubTab==='needles'} onClick={()=>setPublicationsSubTab('needles')} label="Aiguilles" count={publications?.publications?.needle_listings?.length||0} icon="🪡" />
      <SubTabBtn active={publicationsSubTab==='accessories'} onClick={()=>setPublicationsSubTab('accessories')} label="Accessoires" count={publications?.publications?.accessory_listings?.length||0} icon="✂️" />
    </div>
    
    {/* Loading state */}
    {publicationsLoading && (
      <div style={{textAlign:'center',padding:'4rem'}}>
        <div style={{width:'2rem',height:'2rem',borderRadius:'999px',border:'2px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
      </div>
    )}
    
    {/* Display items */}
    {!publicationsLoading && publications && (
      <>
        {/* All items */}
        {publicationsSubTab === 'all' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1.25rem'}}>
            {/* Patterns */}
            {publications.publications?.patterns?.map((item: any) => (
              <PublicationCard key={`pattern-${item.id}`} item={item} type="pattern" navigate={navigate} imgUrl={imgUrl} />
            ))}
            {/* Yarn listings */}
            {publications.publications?.yarn_listings?.map((item: any) => (
              <PublicationCard key={`yarn-${item.id}`} item={item} type="yarn" navigate={navigate} imgUrl={imgUrl} />
            ))}
            {/* Needle listings */}
            {publications.publications?.needle_listings?.map((item: any) => (
              <PublicationCard key={`needle-${item.id}`} item={item} type="needle" navigate={navigate} imgUrl={imgUrl} />
            ))}
            {/* Accessory listings */}
            {publications.publications?.accessory_listings?.map((item: any) => (
              <PublicationCard key={`accessory-${item.id}`} item={item} type="accessory" navigate={navigate} imgUrl={imgUrl} />
            ))}
          </div>
        )}
        
        {/* Patterns only */}
        {publicationsSubTab === 'patterns' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1.25rem'}}>
            {publications.publications?.patterns?.map((item: any) => (
              <PublicationCard key={`pattern-${item.id}`} item={item} type="pattern" navigate={navigate} imgUrl={imgUrl} />
            ))}
          </div>
        )}
        
        {/* Yarn only */}
        {publicationsSubTab === 'yarn' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1.25rem'}}>
            {publications.publications?.yarn_listings?.map((item: any) => (
              <PublicationCard key={`yarn-${item.id}`} item={item} type="yarn" navigate={navigate} imgUrl={imgUrl} />
            ))}
          </div>
        )}
        
        {/* Needles only */}
        {publicationsSubTab === 'needles' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1.25rem'}}>
            {publications.publications?.needle_listings?.map((item: any) => (
              <PublicationCard key={`needle-${item.id}`} item={item} type="needle" navigate={navigate} imgUrl={imgUrl} />
            ))}
          </div>
        )}
        
        {/* Accessories only */}
        {publicationsSubTab === 'accessories' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1.25rem'}}>
            {publications.publications?.accessory_listings?.map((item: any) => (
              <PublicationCard key={`accessory-${item.id}`} item={item} type="accessory" navigate={navigate} imgUrl={imgUrl} />
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {publicationsSubTab === 'all' && publications.stats?.total_all === 0 && (
          <div style={{textAlign:'center',padding:'4rem',background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)'}}>
            <p style={{fontSize:'3rem',marginBottom:'1rem'}}>📭</p>
            <h3 style={{fontFamily:'var(--font-display)',marginBottom:'0.5rem'}}>Aucune publication</h3>
            <p style={{color:'var(--color-muted-foreground)'}}>Cet utilisateur n'a encore rien publié.</p>
          </div>
        )}
      </>
    )}
  </div>
)}

        {/* ====================== MODAL ABONNEMENTS ====================== */}
        {showFollowing && isMe && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem'}} onClick={()=>setShowFollowing(false)}>
            <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',maxWidth:'24rem',width:'100%',maxHeight:'80vh',overflow:'auto',border:'1px solid var(--color-border)'}} onClick={e=>e.stopPropagation()}>
              <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',marginBottom:'1rem'}}>Abonnements ({followingCount})</h3>
              <FollowingListModal onClose={()=>setShowFollowing(false)} />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// ====================== COMPOSANTS UTILITAIRES ======================
const TabBtn: React.FC<{ active: boolean; onClick: () => void; label: string; badge?: number }> = ({ active, onClick, label, badge }) => (
  <button onClick={onClick} style={{ padding: '0.625rem 1.25rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem', background: active ? 'var(--color-primary)' : 'transparent', color: active ? '#fff' : 'var(--color-muted-foreground)', position: 'relative' }}>
    {label}
    {badge && badge > 0 && (<span style={{ position: 'absolute', top: '-0.25rem', right: '-0.5rem', background: 'hsl(0,65%,52%)', color: '#fff', fontSize: '0.625rem', fontWeight: 700, padding: '0.125rem 0.375rem', borderRadius: '999px', minWidth: '1.25rem', textAlign: 'center' }}>{badge > 99 ? '99+' : badge}</span>)}
  </button>
);

const SubTabBtn: React.FC<{ active: boolean; onClick: () => void; label: string; count: number; icon?: string }> = ({ active, onClick, label, count, icon }) => (
  <button onClick={onClick} style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, background: active ? 'var(--color-primary)' : 'var(--color-surface)', color: active ? '#fff' : 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
    {icon && <span>{icon}</span>} {label} ({count})
  </button>
);

const PublicationCard: React.FC<{ item: any; type: string; navigate: any; imgUrl: (path: string | null) => string }> = ({ item, type, navigate, imgUrl }) => {
  const getLink = () => { if (type === 'pattern') return `/patterns/${item.id}`; if (type === 'yarn') return `/marketplace/yarn/${item.id}`; if (type === 'needle') return `/marketplace/needle/${item.id}`; return `/marketplace/accessory/${item.id}`; };
  const getTitle = () => { if (type === 'pattern') return item.title; if (type === 'yarn') return item.name; if (type === 'needle') return `${item.type_display || ''} ${item.size_mm || ''}mm`; return item.title; };
  const getSubtitle = () => { if (type === 'pattern') return `${item.is_free ? 'Gratuit' : item.price + ' DT'}`; return `${item.price} DT`; };
  const coverImage = item.cover_image || item.image1 || null;
  return (
    <div onClick={() => navigate(getLink())} style={{ cursor: 'pointer', borderRadius: '0.75rem', overflow: 'hidden', backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="card-hover">
      <div style={{ aspectRatio: '1', position: 'relative', backgroundColor: 'var(--color-muted)' }}>
        {coverImage ? (<img src={imgUrl(coverImage)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />) : (<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{type === 'pattern' ? '📚' : type === 'yarn' ? '🧶' : type === 'needle' ? '🪡' : '✂️'}</div>)}
      </div>
      <div style={{ padding: '0.75rem' }}><p style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTitle()}</p><p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', marginTop: '0.25rem' }}>{getSubtitle()}</p></div>
    </div>
  );
};

const Stat: React.FC<{ n: number; label: string }> = ({ n, label }) => (
  <div style={{ textAlign: 'center' }}><p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>{n}</p><p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: 0 }}>{label}</p></div>
);

const FollowingListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { followService.getFollowing().then(data => setFollowingList(data)).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <div style={{textAlign:'center',padding:'2rem'}}><div style={{width:'2rem',height:'2rem',borderRadius:'999px',border:'2px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/></div>;
  if (followingList.length===0) return <p style={{color:'var(--color-muted-foreground)',textAlign:'center',padding:'2rem'}}>Aucun abonnement</p>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      {followingList.map(f=>(<div key={f.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.5rem',borderRadius:'0.75rem',cursor:'pointer'}} onClick={()=>{onClose();navigate(`/profile/${f.username}`);}}><div style={{width:'2.5rem',height:'2.5rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>{f.profile_image?<img src={imgUrl(f.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-primary)',color:'#fff',fontSize:'0.75rem'}}>{f.username?.[0]?.toUpperCase()}</div>}</div><div style={{flex:1}}><p style={{fontWeight:500,margin:0}}>{f.username}</p>{f.full_name&&<p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:0}}>{f.full_name}</p>}</div></div>))}
    </div>
  );
};

export default UserProfile;