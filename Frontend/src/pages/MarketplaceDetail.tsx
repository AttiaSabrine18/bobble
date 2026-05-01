// src/pages/MarketplaceDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, ShoppingBag, MapPin, Truck, Eye, User, Calendar, Tag, Camera } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { marketplaceService } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

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
  material_display?: string;
  grams?: number;
  meterage?: number;
  dye_lot?: string;
  quantity: number;
  condition_display: string;
  description: string;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  seller_username: string;
  seller_id: number;
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

const MarketplaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const type = window.location.pathname.includes('/yarn/') ? 'yarn' : 
               window.location.pathname.includes('/needle/') ? 'needle' : 'accessory';

  useEffect(() => {
    if (id) loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      const data = await marketplaceService.getById(type, Number(id));
      setListing(data);
      setIsFavorited(data.is_favorited);
    } catch (error) {
      console.error('Erreur chargement annonce:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!listing) return;
    
    try {
      if (isFavorited) {
        await marketplaceService.removeFavorite(type, listing.id);
      } else {
        await marketplaceService.addFavorite(type, listing.id);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Erreur favori:', error);
    }
  };

  // ====================== ACHETER (CORRIGÉ) ======================
  const handleBuyNow = () => {
    if (!listing) return;
    
    // Vérifier le stock
    if (listing.quantity < 1) {
      Swal.fire({
        title: 'Rupture de stock',
        text: 'Cet article n\'est plus disponible.',
        icon: 'error',
      });
      return;
    }
    
    // ✅ Récupérer le stock RÉEL depuis listing.quantity
    const maxQuantity = listing.quantity;
    
    const cartItem = {
      type: type,
      listingId: listing.id,
      title: listing.name || listing.title,
      price: listing.price,
      quantity: 1,              // Quantité initiale = 1
      maxQuantity: maxQuantity, // ✅ Stock réel du vendeur
      sellerId: listing.seller_id,
      sellerUsername: listing.seller_username,
      image: listing.image1,
    };
    
    console.log('📦 Ajout au panier:', cartItem);
    
    // Vérifier si l'article est déjà dans le panier
    const existingCart = JSON.parse(localStorage.getItem('marketplace_cart') || '[]');
    const existingIndex = existingCart.findIndex((item: any) => 
      item.listingId === listing.id && item.type === type
    );
    
    if (existingIndex >= 0) {
      // Mettre à jour la quantité si déjà dans le panier
      const newQty = Math.min(existingCart[existingIndex].quantity + 1, maxQuantity);
      existingCart[existingIndex].quantity = newQty;
      existingCart[existingIndex].maxQuantity = maxQuantity; // Mettre à jour le max
      localStorage.setItem('marketplace_cart', JSON.stringify(existingCart));
      
      Swal.fire({
        title: 'Quantité mise à jour',
        text: `Quantité : ${newQty} (max ${maxQuantity} disponible${maxQuantity > 1 ? 's' : ''})`,
        icon: 'info',
        toast: true,
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false,
      });
    } else {
      // Ajouter au panier
      existingCart.push(cartItem);
      localStorage.setItem('marketplace_cart', JSON.stringify(existingCart));
      
      Swal.fire({
        title: 'Ajouté au panier !',
        text: `${cartItem.title} ajouté au panier`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
      });
    }
    
    // Rediriger vers le checkout
    navigate('/marketplace/checkout');
  };

  const handleContact = () => {
    if (!user) {
      navigate('/');
      return;
    }
    navigate(`/messages/new/${listing?.seller_username}`);
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

  if (!listing) {
    return (
      <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
        <Navbar />
        <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem',textAlign:'center'}}>
          <div style={{fontSize:'5rem',marginBottom:'1rem'}}>🛍️</div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',marginBottom:'1rem'}}>Annonce introuvable</h1>
          <button onClick={() => navigate('/marketplace')} className="btn-craft"
            style={{padding:'0.875rem 2rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600}}>
            Retour à la Marketplace
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = [listing.image1, listing.image2, listing.image3].filter(Boolean);
  const isSeller = user?.user_id === String(listing.seller_id);

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      
      <div style={{maxWidth:'64rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={() => navigate('/marketplace')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}>
          <ChevronLeft size={16}/> Retour à la Marketplace
        </button>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'2rem'}}>
          {/* Images */}
          <div>
            <div style={{borderRadius:'1rem',overflow:'hidden',background:'var(--color-muted)',aspectRatio:'1'}}>
              {images.length > 0 ? (
                <img src={imgUrl(images[selectedImage])} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'4rem'}}>🛍️</div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem'}}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    style={{width:'4rem',height:'4rem',borderRadius:'0.5rem',overflow:'hidden',border:selectedImage===i?'2px solid var(--color-primary)':'1px solid var(--color-border)',opacity:selectedImage===i?1:0.6}}>
                    <img src={imgUrl(img)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
              <div>
                <h1 style={{fontFamily:'var(--font-display)',fontSize:'1.75rem',fontWeight:600,marginBottom:'0.25rem'}}>
                  {listing.name || listing.title}
                </h1>
                <p style={{color:'var(--color-muted-foreground)',marginBottom:'0.5rem'}}>
                  {type === 'yarn' && `${listing.brand || ''} ${listing.colorway || ''}`}
                  {type === 'needle' && `${listing.type_display} ${listing.size_mm}mm - ${listing.material_display || ''}`}
                  {type === 'accessory' && listing.category_display}
                </p>
              </div>
              <button onClick={toggleFavorite} style={{background:'none',border:'none',cursor:'pointer'}}>
                <Heart size={24} style={{fill:isFavorited?'hsl(0,65%,52%)':'none',color:isFavorited?'hsl(0,65%,52%)':'var(--color-muted-foreground)'}}/>
              </button>
            </div>

            <div style={{fontSize:'2rem',fontWeight:700,color:'var(--color-primary)',marginBottom:'1.5rem'}}>
              {parseFloat(listing.price).toFixed(2)} DT
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginBottom:'1.5rem',padding:'1rem',background:'var(--color-surface)',borderRadius:'0.75rem'}}>
              <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                <span style={{display:'flex',alignItems:'center',gap:'0.25rem'}}><Tag size={14}/> {listing.condition_display}</span>
                <span style={{display:'flex',alignItems:'center',gap:'0.25rem'}}><Eye size={14}/> {listing.views_count} vues</span>
                <span style={{display:'flex',alignItems:'center',gap:'0.25rem'}}><Calendar size={14}/> {new Date(listing.created_at).toLocaleDateString()}</span>
              </div>
              {type === 'yarn' && (
                <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                  {listing.weight_display && <span>🧶 {listing.weight_display}</span>}
                  {listing.grams && <span>⚖️ {listing.grams}g</span>}
                  {listing.meterage && <span>📏 {listing.meterage}m</span>}
                  {listing.dye_lot && <span>🏷️ Lot: {listing.dye_lot}</span>}
                </div>
              )}
              <span>📦 Quantité disponible: {listing.quantity}</span>
            </div>

            {/* ====================== BOUTON ACHETER ====================== */}
            {!isSeller ? (
              <>
                <button onClick={handleBuyNow} className="btn-craft"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    cursor: 'pointer'
                  }}>
                  <ShoppingBag size={18}/> Acheter - {parseFloat(listing.price).toFixed(2)} DT
                </button>
                <button onClick={handleContact}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '999px',
                    border: '1.5px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-foreground)',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    cursor: 'pointer'
                  }}>
                  💬 Contacter le vendeur
                </button>
              </>
            ) : (
              <div style={{
                padding: '1rem',
                background: 'hsla(18,52%,51%,0.1)',
                borderRadius: '0.75rem',
                textAlign: 'center',
                color: 'var(--color-primary)',
                marginBottom: '1rem'
              }}>
                👑 C'est votre annonce
              </div>
            )}

            {/* Seller info */}
            <div style={{display:'flex',alignItems:'center',gap:'1rem',padding:'1rem',background:'var(--color-card)',borderRadius:'0.75rem',border:'1px solid var(--color-border)',cursor:'pointer'}}
              onClick={() => navigate(`/marketplace/seller/${listing.seller_username}`)}>
              <div style={{width:'3rem',height:'3rem',borderRadius:'999px',overflow:'hidden',background:'var(--color-muted)'}}>
                {listing.seller_profile_image ? (
                  <img src={imgUrl(listing.seller_profile_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                ) : (
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><User size={20}/></div>
                )}
              </div>
              <div style={{flex:1}}>
                <p style={{fontWeight:600,margin:0}}>{listing.seller_username}</p>
                <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:0}}>Vendeur</p>
              </div>
            </div>

            {/* Shipping */}
            <div style={{marginTop:'1rem',padding:'1rem',background:'var(--color-surface)',borderRadius:'0.75rem'}}>
              {listing.shipping_available ? (
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',color:'hsl(105,28%,50%)'}}>
                  <Truck size={16}/> Envoi disponible - {parseFloat(listing.shipping_cost).toFixed(2)} DT
                </div>
              ) : (
                <div style={{color:'var(--color-muted-foreground)'}}>Envoi non disponible</div>
              )}
              {listing.pickup_location && (
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.5rem',color:'var(--color-muted-foreground)'}}>
                  <MapPin size={16}/> Retrait possible à {listing.pickup_location}
                </div>
              )}
            </div>

            {/* Recherche visuelle AI */}
            <button 
              onClick={() => navigate('/visual-search')}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '999px',
                border: '1.5px solid hsl(260,40%,50%)',
                background: 'hsla(260,40%,50%,0.06)',
                color: 'hsl(260,40%,50%)',
                fontWeight: 500,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'hsla(260,40%,50%,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'hsla(260,40%,50%,0.06)';
              }}
            >
              <Camera size={16}/> Rechercher des articles similaires avec AI
            </button>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div style={{marginTop:'2rem',padding:'1.5rem',background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)'}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',marginBottom:'1rem'}}>Description</h2>
            <p style={{lineHeight:1.7,whiteSpace:'pre-wrap'}}>{listing.description}</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MarketplaceDetail;