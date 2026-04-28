// src/pages/MarketplaceFavorites.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Package, Ruler, Scissors } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { marketplaceService } from '../services/marketplace';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const MarketplaceFavorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any>({ yarn: [], needles: [], accessories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await marketplaceService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalFavorites = favorites.yarn.length + favorites.needles.length + favorites.accessories.length;

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar />
      
      <div style={{maxWidth:'80rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={() => navigate('/marketplace')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}>
          <ChevronLeft size={16}/> Retour à la Marketplace
        </button>

        <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:600,marginBottom:'2rem'}}>
          Mes Favoris ({totalFavorites})
        </h1>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : totalFavorites === 0 ? (
          <div style={{textAlign:'center',padding:'4rem',background:'var(--color-card)',borderRadius:'1rem'}}>
            <Heart size={48} style={{marginBottom:'1rem',opacity:0.5}}/>
            <h3 style={{fontFamily:'var(--font-display)',marginBottom:'0.5rem'}}>Aucun favori</h3>
            <p style={{color:'var(--color-muted-foreground)'}}>Ajoutez des annonces à vos favoris !</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>
            {favorites.yarn.length > 0 && (
              <div>
                <h2 style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem'}}><Package size={20}/> Laines</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
                  {favorites.yarn.map((item: any) => (
                    <div key={item.id} onClick={() => navigate(`/marketplace/yarn/${item.id}`)} style={{background:'var(--color-card)',borderRadius:'0.75rem',padding:'1rem',cursor:'pointer'}}>
                      <div style={{width:'100%',aspectRatio:'1',borderRadius:'0.5rem',overflow:'hidden',marginBottom:'0.5rem'}}>
                        {item.image1 ? <img src={imgUrl(item.image1)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-muted)',fontSize:'2rem'}}>🧶</div>}
                      </div>
                      <p style={{fontWeight:600,fontSize:'0.875rem'}}>{item.name}</p>
                      <p style={{color:'var(--color-primary)',fontWeight:600}}>{item.price} DT</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {favorites.needles.length > 0 && (
              <div>
                <h2 style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem'}}><Ruler size={20}/> Aiguilles & Crochets</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
                  {favorites.needles.map((item: any) => (
                    <div key={item.id} onClick={() => navigate(`/marketplace/needle/${item.id}`)} style={{background:'var(--color-card)',borderRadius:'0.75rem',padding:'1rem',cursor:'pointer'}}>
                      <div style={{width:'100%',aspectRatio:'1',borderRadius:'0.5rem',overflow:'hidden',marginBottom:'0.5rem'}}>
                        {item.image1 ? <img src={imgUrl(item.image1)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-muted)',fontSize:'2rem'}}>🪡</div>}
                      </div>
                      <p style={{fontWeight:600,fontSize:'0.875rem'}}>{item.type_display} {item.size_mm}mm</p>
                      <p style={{color:'var(--color-primary)',fontWeight:600}}>{item.price} DT</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {favorites.accessories.length > 0 && (
              <div>
                <h2 style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem'}}><Scissors size={20}/> Accessoires</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
                  {favorites.accessories.map((item: any) => (
                    <div key={item.id} onClick={() => navigate(`/marketplace/accessory/${item.id}`)} style={{background:'var(--color-card)',borderRadius:'0.75rem',padding:'1rem',cursor:'pointer'}}>
                      <div style={{width:'100%',aspectRatio:'1',borderRadius:'0.5rem',overflow:'hidden',marginBottom:'0.5rem'}}>
                        {item.image1 ? <img src={imgUrl(item.image1)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-muted)',fontSize:'2rem'}}>✂️</div>}
                      </div>
                      <p style={{fontWeight:600,fontSize:'0.875rem'}}>{item.title}</p>
                      <p style={{color:'var(--color-primary)',fontWeight:600}}>{item.price} DT</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MarketplaceFavorites;