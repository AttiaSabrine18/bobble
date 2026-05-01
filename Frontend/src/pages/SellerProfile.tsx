// src/pages/SellerProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Package, Ruler, Scissors, Mail, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { marketplaceService } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const SellerProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<any>({ yarn: [], needles: [], accessories: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'yarn' | 'needles' | 'accessories'>('yarn');

  useEffect(() => {
    if (username) loadSellerData();
  }, [username]);

  const loadSellerData = async () => {
    try {
      const data = await marketplaceService.getSellerProfile(username!);
      setSeller(data.seller);
      setListings(data.listings);
    } catch (error) {
      console.error('Erreur chargement vendeur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      navigate('/');
      return;
    }
    navigate(`/messages/new/${username}`);
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

  if (!seller) {
    return (
      <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
        <Navbar />
        <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem',textAlign:'center'}}>
          <h1>Vendeur introuvable</h1>
          <button onClick={() => navigate('/marketplace')} className="btn-craft">Retour</button>
        </div>
        <Footer />
      </div>
    );
  }

  const totalListings = listings.yarn.length + listings.needles.length + listings.accessories.length;

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar />
      
      <div style={{maxWidth:'64rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={() => navigate(-1)} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}>
          <ChevronLeft size={16}/> Retour
        </button>

        {/* Seller Header */}
        <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',marginBottom:'2rem',border:'1px solid var(--color-border)',display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap'}}>
          <div style={{width:'6rem',height:'6rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)'}}>
            {seller.profile_image ? (
              <img src={imgUrl(seller.profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ) : (
              <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><User size={32}/></div>
            )}
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'1.75rem',marginBottom:'0.25rem'}}>{seller.username}</h1>
            <p style={{color:'var(--color-muted-foreground)',marginBottom:'0.5rem'}}>{seller.bio || 'Membre de Bobble'}</p>
            <div style={{display:'flex',gap:'1rem',fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>
              <span>📦 {totalListings} annonces</span>
              <span>⭐ 0 avis</span>
            </div>
          </div>
          {user?.username !== username && (
            <button onClick={handleContact} className="btn-craft"
              style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <Mail size={16}/> Contacter
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',borderBottom:'1.5px solid var(--color-border)',paddingBottom:'0.5rem'}}>
          <button onClick={() => setActiveTab('yarn')} style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='yarn'?'var(--color-primary)':'transparent',color:activeTab==='yarn'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <Package size={16}/> Laines ({listings.yarn.length})
          </button>
          <button onClick={() => setActiveTab('needles')} style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='needles'?'var(--color-primary)':'transparent',color:activeTab==='needles'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <Ruler size={16}/> Aiguilles ({listings.needles.length})
          </button>
          <button onClick={() => setActiveTab('accessories')} style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab==='accessories'?'var(--color-primary)':'transparent',color:activeTab==='accessories'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <Scissors size={16}/> Accessoires ({listings.accessories.length})
          </button>
        </div>

        {/* Listings */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
          {listings[activeTab].map((item: any) => (
            <div key={item.id} onClick={() => navigate(`/marketplace/${activeTab === 'needles' ? 'needle' : activeTab === 'yarn' ? 'yarn' : 'accessory'}/${item.id}`)}
              style={{background:'var(--color-card)',borderRadius:'0.75rem',overflow:'hidden',border:'1px solid var(--color-border)',cursor:'pointer'}}>
              <div style={{aspectRatio:'1',background:'var(--color-muted)'}}>
                {item.image1 ? <img src={imgUrl(item.image1)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem'}}>🛍️</div>}
              </div>
              <div style={{padding:'0.75rem'}}>
                <p style={{fontWeight:600,fontSize:'0.875rem',marginBottom:'0.25rem'}}>{item.name || item.title}</p>
                <p style={{color:'var(--color-primary)',fontWeight:600}}>{item.price} DT</p>
              </div>
            </div>
          ))}
        </div>
        
        {listings[activeTab].length === 0 && (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted-foreground)'}}>
            Aucune annonce dans cette catégorie
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerProfile;