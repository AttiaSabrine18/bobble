// src/pages/Marketplace.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Heart, ShoppingBag, Plus, Package, Ruler, Scissors, MapPin, Eye } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { marketplaceService } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Listing {
  id: number;
  name?: string;
  title?: string;
  price: string;
  brand?: string;
  colorway?: string;
  weight_display?: string;
  type_display?: string;
  category_display?: string;
  size_mm?: number;
  quantity: number;
  condition_display: string;
  image1: string | null;
  seller_username: string;
  seller_profile_image: string | null;
  views_count: number;
  is_favorited: boolean;
  created_at: string;
  shipping_available: boolean;
  shipping_cost: string;
  pickup_location?: string;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'yarn' | 'needles' | 'accessories'>('yarn');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('-created_at');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const tabs = [
    { id: 'yarn', label: 'Laines', icon: Package },
    { id: 'needles', label: 'Aiguilles & Crochets', icon: Ruler },
    { id: 'accessories', label: 'Accessoires', icon: Scissors },
  ] as const;

  useEffect(() => {
    loadListings();
  }, [activeTab, sortBy]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getAll(activeTab, { ordering: sortBy });
      setListings(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Erreur chargement marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (listingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isFav = favorites.has(listingId);
    
    try {
      if (isFav) {
        await marketplaceService.removeFavorite(activeTab, listingId);
        setFavorites(prev => { prev.delete(listingId); return new Set(prev); });
      } else {
        await marketplaceService.addFavorite(activeTab, listingId);
        setFavorites(prev => {
          const newFavs = new Set(prev);
          newFavs.add(listingId);
        return newFavs;
});
      }
      setListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, is_favorited: !isFav } : l
      ));
    } catch (error) {
      console.error('Erreur favori:', error);
    }
  };

  const filteredListings = listings.filter(l => {
    const q = searchQuery.toLowerCase();
    const name = l.name || l.title || '';
    return name.toLowerCase().includes(q) || 
           (l.brand && l.brand.toLowerCase().includes(q)) ||
           (l.colorway && l.colorway.toLowerCase().includes(q));
  });

  const getDetailUrl = (listing: Listing): string => {
    if (activeTab === 'yarn') return `/marketplace/yarn/${listing.id}`;
    if (activeTab === 'needles') return `/marketplace/needle/${listing.id}`;
    return `/marketplace/accessory/${listing.id}`;
  };

  const getListingTitle = (listing: Listing): string => {
    return listing.name || listing.title || 'Sans titre';
  };

  const getListingSubtitle = (listing: Listing): string => {
    if (activeTab === 'yarn') {
      return `${listing.brand || ''} ${listing.colorway || ''}`.trim() || '—';
    } else if (activeTab === 'needles') {
      return `${listing.type_display || ''} ${listing.size_mm || ''}mm ${listing.brand || ''}`.trim();
    } else {
      return `${listing.category_display || ''} ${listing.brand || ''}`.trim();
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar />
      
      <div style={{maxWidth:'80rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:600,marginBottom:'0.5rem'}}>
              Marketplace
            </h1>
            <p style={{color:'var(--color-muted-foreground)'}}>
              Achetez et vendez des laines, aiguilles et accessoires
            </p>
          </div>
          <button onClick={() => navigate('/marketplace/create')} className="btn-craft"
            style={{padding:'0.875rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600,display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <Plus size={16}/> Vendre un article
          </button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',borderBottom:'1.5px solid var(--color-border)',paddingBottom:'0.5rem'}}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:activeTab===tab.id?'var(--color-primary)':'transparent',color:activeTab===tab.id?'#fff':'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:500,fontFamily:'var(--font-body)'}}>
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:1}}>
            <Search size={16} style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--color-muted-foreground)'}}/>
            <input type="text" placeholder={`Rechercher ${activeTab === 'yarn' ? 'une laine' : activeTab === 'needles' ? 'une aiguille' : 'un accessoire'}...`} 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{width:'100%',padding:'0.75rem 1rem 0.75rem 2.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.875rem',outline:'none'}}/>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.875rem',cursor:'pointer'}}>
            <option value="-created_at">Plus récents</option>
            <option value="price">Prix croissant</option>
            <option value="-price">Prix décroissant</option>
            <option value="-views_count">Plus populaires</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{padding:'0.75rem 1.25rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:showFilters?'var(--color-primary)':'var(--color-surface)',color:showFilters?'#fff':'var(--color-foreground)',display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer'}}>
            <Filter size={14}/> Filtres
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1.5rem'}}>
            {filteredListings.map(listing => (
              <div key={listing.id} onClick={() => navigate(getDetailUrl(listing))}
                style={{background:'var(--color-card)',borderRadius:'1rem',overflow:'hidden',border:'1px solid var(--color-border)',cursor:'pointer'}} className="card-hover">
                
                {/* Image */}
                <div style={{position:'relative',paddingBottom:'100%',background:'var(--color-muted)'}}>
                  {listing.image1 ? (
                    <img src={imgUrl(listing.image1)} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                  ) : (
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.5rem'}}>
                      {activeTab === 'yarn' ? '🧶' : activeTab === 'needles' ? '🪡' : '✂️'}
                    </div>
                  )}
                  
                  {/* Price badge */}
                  <div style={{position:'absolute',top:'0.75rem',left:'0.75rem',padding:'0.25rem 0.75rem',borderRadius:'999px',background:'var(--color-primary)',color:'#fff',fontWeight:600,fontSize:'0.875rem'}}>
                    {parseFloat(listing.price).toFixed(2)} DT
                  </div>
                  
                  {/* Favorite button */}
                  <button onClick={e => toggleFavorite(listing.id, e)}
                    style={{position:'absolute',top:'0.75rem',right:'0.75rem',padding:'0.5rem',borderRadius:'999px',background:'rgba(255,255,255,0.9)',border:'none',cursor:'pointer',display:'flex'}}>
                    <Heart size={16} style={{fill:listing.is_favorited ? 'hsl(0,65%,52%)' : 'none',color:listing.is_favorited ? 'hsl(0,65%,52%)' : 'var(--color-foreground)'}}/>
                  </button>
                </div>
                
                {/* Info */}
                <div style={{padding:'1rem'}}>
                  <h3 style={{fontWeight:600,fontSize:'0.9375rem',margin:'0 0 0.25rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {getListingTitle(listing)}
                  </h3>
                  <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:'0 0 0.5rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {getListingSubtitle(listing)}
                  </p>
                  
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'0.5rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <div style={{width:'1.5rem',height:'1.5rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)'}}>
                        {listing.seller_profile_image ? (
                          <img src={imgUrl(listing.seller_profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.625rem'}}>👤</div>
                        )}
                      </div>
                      <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>{listing.seller_username}</span>
                    </div>
                    <span style={{display:'flex',alignItems:'center',gap:'0.25rem',fontSize:'0.6875rem',color:'var(--color-muted-foreground)'}}>
                      <Eye size={12}/> {listing.views_count}
                    </span>
                  </div>
                  
                  {listing.shipping_available && listing.pickup_location && (
                    <div style={{display:'flex',alignItems:'center',gap:'0.25rem',marginTop:'0.5rem',fontSize:'0.6875rem',color:'hsl(105,28%,50%)'}}>
                      <MapPin size={12}/> Retrait possible
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredListings.length === 0 && (
          <div style={{textAlign:'center',padding:'4rem',background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)'}}>
            <Package size={48} style={{marginBottom:'1rem',opacity:0.5}}/>
            <h3 style={{fontFamily:'var(--font-display)',marginBottom:'0.5rem'}}>Aucune annonce</h3>
            <p style={{color:'var(--color-muted-foreground)',marginBottom:'1.5rem'}}>Soyez le premier à vendre un article !</p>
            <button onClick={() => navigate('/marketplace/create')} className="btn-craft"
              style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600}}>
              + Vendre un article
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Marketplace;