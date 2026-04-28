// src/pages/MarketplaceCheckout.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Shield, ShoppingBag, Package, Minus, Plus, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { marketplaceService } from '../services/marketplace';
import Swal from 'sweetalert2';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface CartItem {
  type: string;
  listingId: number;
  title: string;
  price: string;
  quantity: number;
  maxQuantity: number;
  sellerId: number;
  sellerUsername: string;
  image: string | null;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const MarketplaceCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('marketplace_cart') || '[]');
    // Ajouter maxQuantity si non défini
    const updatedCart = cart.map((item: CartItem) => ({
      ...item,
      maxQuantity: item.maxQuantity || item.quantity || 1,
      quantity: item.quantity || 1,
    }));
    setCartItems(updatedCart);
    setLoading(false);
  };

  // ====================== GESTION QUANTITÉ ======================
  const increaseQuantity = (index: number) => {
    setCartItems(prev => prev.map((item, i) => {
      if (i === index && item.quantity < item.maxQuantity) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    }));
  };

  const decreaseQuantity = (index: number) => {
    setCartItems(prev => prev.map((item, i) => {
      if (i === index && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  const updateQuantity = (index: number, value: number) => {
    const qty = Math.max(1, Math.min(value, cartItems[index]?.maxQuantity || 99));
    setCartItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  const removeItem = (index: number) => {
    const newItems = cartItems.filter((_, i) => i !== index);
    setCartItems(newItems);
    localStorage.setItem('marketplace_cart', JSON.stringify(newItems));
    
    if (newItems.length === 0) {
      navigate('/marketplace');
    }
  };

  // ====================== CALCULS ======================
  const calculateSubtotal = (): number => {
    return cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  };

  const calculateTotalItems = (): number => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // ====================== CHECKOUT ======================
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Votre panier est vide');
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Veuillez entrer une adresse de livraison');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await marketplaceService.createOrder({
        items: cartItems.map(item => ({
          listing_type: item.type,
          listing_id: item.listingId,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        message: contactMessage,
      });

      if (response.success) {
        localStorage.removeItem('marketplace_cart');
        
        Swal.fire({
          title: 'Commande confirmée !',
          text: 'Le vendeur a été notifié de votre achat.',
          icon: 'success',
          confirmButtonText: 'Voir mes commandes',
        }).then((result) => {
          if (response.orders && response.orders.length > 0) {
            navigate(`/marketplace/orders/${response.orders[0].id}`);
          } else {
            navigate('/marketplace/orders');
          }
        });
      }
    } catch (err: any) {
      console.error('Erreur checkout marketplace:', err);
      setError(err.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setProcessing(false);
    }
  };

  // ====================== RENDER ======================
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

  const typeLabels: Record<string, { label: string; icon: string }> = {
    yarn: { label: 'Laine', icon: '🧶' },
    needle: { label: 'Aiguille/Crochet', icon: '🪡' },
    accessory: { label: 'Accessoire', icon: '✂️' },
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      
      <div style={{maxWidth:'56rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={() => navigate(-1)} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'2rem',background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}>
          <ChevronLeft size={16}/> Retour
        </button>

        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,2.5rem)',fontWeight:600,marginBottom:'0.5rem'}}>
          Finaliser votre commande
        </h1>
        <p style={{color:'var(--color-muted-foreground)',marginBottom:'2rem'}}>
          Vérifiez votre commande avant de contacter le vendeur
        </p>

        {error && (
          <div style={{padding:'1rem',background:'hsla(0,65%,52%,0.1)',border:'1px solid hsla(0,65%,52%,0.3)',borderRadius:'0.75rem',marginBottom:'1rem',color:'hsl(0,65%,52%)'}}>
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem',background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)'}}>
            <Package size={48} style={{marginBottom:'1rem',opacity:0.5}}/>
            <h3>Panier vide</h3>
            <p style={{color:'var(--color-muted-foreground)',marginBottom:'1.5rem'}}>Ajoutez des articles depuis la Marketplace</p>
            <button onClick={() => navigate('/marketplace')} className="btn-craft"
              style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600}}>
              Parcourir la Marketplace
            </button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'2rem',alignItems:'start'}}>
            {/* Articles */}
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {/* Résumé articles */}
              <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1rem 1.25rem',border:'1px solid var(--color-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:500}}>
                  {cartItems.length} article{cartItems.length > 1 ? 's' : ''} • {calculateTotalItems()} unité{calculateTotalItems() > 1 ? 's' : ''} au total
                </span>
              </div>

              {cartItems.map((item, index) => {
                const typeInfo = typeLabels[item.type] || { label: 'Article', icon: '📦' };
                const itemTotal = parseFloat(item.price) * item.quantity;
                
                return (
                  <div key={index} style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
                    <div style={{display:'flex',gap:'1rem'}}>
                      {/* Image */}
                      <div style={{width:'5rem',height:'5rem',borderRadius:'0.75rem',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
                        {item.image ? (
                          <img src={imgUrl(item.image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem'}}>{typeInfo.icon}</div>
                        )}
                      </div>
                      
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <span style={{
                              display:'inline-block',
                              padding:'0.125rem 0.5rem',
                              borderRadius:'999px',
                              fontSize:'0.6875rem',
                              fontWeight:500,
                              background:'var(--color-surface)',
                              color:'var(--color-muted-foreground)',
                              marginBottom:'0.25rem',
                            }}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                            <h4 style={{fontWeight:600,margin:'0.25rem 0',fontSize:'1rem'}}>{item.title}</h4>
                            <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:0}}>
                              Vendeur : {item.sellerUsername}
                            </p>
                            <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:'0.125rem 0 0'}}>
                              Prix unitaire : {parseFloat(item.price).toFixed(2)} DT
                            </p>
                          </div>
                          <button onClick={() => removeItem(index)} 
                            style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer',opacity:0.5}}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                        
                        {/* Contrôle de quantité */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'0.75rem',paddingTop:'0.75rem',borderTop:'1px solid var(--color-border)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                            <span style={{fontSize:'0.8125rem',color:'var(--color-muted-foreground)'}}>Quantité :</span>
                            <div style={{display:'flex',alignItems:'center',border:'1.5px solid var(--color-border)',borderRadius:'999px',overflow:'hidden'}}>
                              <button onClick={() => decreaseQuantity(index)}
                                style={{padding:'0.375rem 0.625rem',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',color:'var(--color-foreground)'}}>
                                <Minus size={14}/>
                              </button>
                              <input 
                                type="number" 
                                value={item.quantity}
                                onChange={e => updateQuantity(index, parseInt(e.target.value) || 1)}
                                min="1"
                                max={item.maxQuantity}
                                style={{width:'2.5rem',textAlign:'center',border:'none',borderLeft:'1.5px solid var(--color-border)',borderRight:'1.5px solid var(--color-border)',padding:'0.375rem',fontSize:'0.875rem',fontWeight:500,background:'transparent',outline:'none'}}
                              />
                              <button onClick={() => increaseQuantity(index)}
                                style={{padding:'0.375rem 0.625rem',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',color:'var(--color-foreground)'}}>
                                <Plus size={14}/>
                              </button>
                            </div>
                            <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>
                              (max {item.maxQuantity})
                            </span>
                          </div>
                          <span style={{fontWeight:600,color:'var(--color-primary)',fontSize:'1.125rem'}}>
                            {itemTotal.toFixed(2)} DT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Adresse de livraison */}
              <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
                <label style={{fontWeight:600,display:'block',marginBottom:'0.5rem'}}>
                  📍 Adresse de livraison <span style={{color:'hsl(0,65%,52%)'}}>*</span>
                </label>
                <textarea 
                  value={shippingAddress} 
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="Votre adresse complète..."
                  rows={3}
                  style={{width:'100%',padding:'0.75rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',resize:'vertical',outline:'none',fontFamily:'var(--font-body)'}}
                />
              </div>

              {/* Message au vendeur */}
              <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
                <label style={{fontWeight:600,display:'block',marginBottom:'0.5rem'}}>💬 Message au vendeur (optionnel)</label>
                <textarea 
                  value={contactMessage} 
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Bonjour, je suis intéressé(e) par cet article..."
                  rows={3}
                  style={{width:'100%',padding:'0.75rem',borderRadius:'0.75rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',resize:'vertical',outline:'none',fontFamily:'var(--font-body)'}}
                />
              </div>
            </div>

            {/* Résumé */}
            <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.5rem',border:'1px solid var(--color-border)',position:'sticky',top:'6rem'}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',marginBottom:'1.25rem'}}>Résumé</h2>
              
              {/* Liste des articles dans le résumé */}
              <div style={{marginBottom:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                {cartItems.map((item, index) => (
                  <div key={index} style={{display:'flex',justifyContent:'space-between',fontSize:'0.8125rem'}}>
                    <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:'0.5rem'}}>
                      {item.quantity}x {item.title}
                    </span>
                    <span>{(parseFloat(item.price) * item.quantity).toFixed(2)} DT</span>
                  </div>
                ))}
              </div>
              
              <div style={{borderTop:'1px solid var(--color-border)',paddingTop:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                  <span>Sous-total ({calculateTotalItems()} article{calculateTotalItems()>1?'s':''})</span>
                  <span>{calculateSubtotal().toFixed(2)} DT</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',paddingBottom:'1rem',borderBottom:'1px solid var(--color-border)',marginBottom:'1rem',fontSize:'0.8125rem',color:'var(--color-muted-foreground)'}}>
                  <span>Frais de port</span>
                  <span>À convenir avec le vendeur</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:600,fontSize:'1.125rem',marginBottom:'1.5rem'}}>
                  <span>Total</span>
                  <span style={{color:'var(--color-primary)'}}>{calculateSubtotal().toFixed(2)} DT</span>
                </div>
              </div>

              <button onClick={handleCheckout} disabled={processing || !shippingAddress.trim() || cartItems.length === 0} className="btn-craft"
                style={{
                  width:'100%',padding:'0.875rem',borderRadius:'999px',border:'none',
                  background:'var(--color-primary)',color:'#fff',fontWeight:600,
                  display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',
                  opacity:!shippingAddress.trim()?0.6:1,cursor:!shippingAddress.trim()?'not-allowed':'pointer',
                  fontSize:'0.9375rem',
                }}>
                {processing ? 'Traitement...' : <><ShoppingBag size={18}/> Confirmer la commande</>}
              </button>

              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',marginTop:'1rem',fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>
                <Shield size={12}/> Paiement sécurisé
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MarketplaceCheckout;