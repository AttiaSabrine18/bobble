// src/pages/Checkout.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Trash2, ChevronLeft, ArrowRight, Shield, CreditCard } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { paymentService } from '../services/payment';
import { patternService } from '../services/patterns';
import api from '../services/api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface Pattern {
  id: number;
  title: string;
  description: string;
  price: string;
  is_free: boolean;
  cover_image: string | null;
  author: { id: number; username: string };
  type: string;
  level: string;
  stock_quantity?: number;
  unlimited_stock?: boolean;
  is_in_stock?: boolean;
}

interface CartItem {
  pattern: Pattern;
  quantity: number;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

// ====================== CHECKOUT PRINCIPAL ======================
const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCartItems();
  }, [location.state]);

  const loadCartItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let patternIds: number[] = [];
      
      if (location.state && (location.state as any).pattern) {
        const pattern = (location.state as any).pattern as Pattern;
        if (!pattern.is_free) {
          setCartItems([{ pattern, quantity: 1 }]);
          setLoading(false);
          return;
        }
      }
      
      if (location.state && (location.state as any).patternIds) {
        patternIds = (location.state as any).patternIds;
      } else {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) patternIds = JSON.parse(savedCart);
      }
      
      patternIds = Array.from(new Set(patternIds));
      
      if (patternIds.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }
      
      const patterns: Pattern[] = [];
      for (const id of patternIds) {
        try {
          const pattern = await patternService.getById(id);
          if (!pattern.is_free) patterns.push(pattern);
        } catch (err) {
          console.error(`Erreur chargement pattern ${id}:`, err);
        }
      }
      
      setCartItems(patterns.map(p => ({ pattern: p, quantity: 1 })));
    } catch (err) {
      console.error('Erreur chargement panier:', err);
      setError('Impossible de charger le panier');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (): number => {
    return cartItems.reduce((total, item) => total + parseFloat(item.pattern.price) * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Votre panier est vide');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const patternIds = cartItems.map(item => item.pattern.id);
      
      // Vérifier le stock avant paiement
      try {
        const stockCheck = await api.post('/patterns/check-stock/', { pattern_ids: patternIds });
        
        if (!stockCheck.data.can_checkout) {
          const outOfStock = stockCheck.data.out_of_stock.map((p: any) => p.title).join(', ');
          setError(`Les patrons suivants ne sont plus en stock : ${outOfStock}`);
          setProcessing(false);
          return;
        }
      } catch (stockErr: any) {
        console.warn('Endpoint check-stock non disponible, poursuite du paiement');
      }
      
      console.log('📦 Envoi des patterns au checkout:', patternIds);
      
      const response = await paymentService.createCheckout(patternIds);
      console.log('✅ Réponse Stripe:', response);
      
      if (response.url) {
        localStorage.setItem('cart', JSON.stringify(patternIds));
        localStorage.setItem('pending_purchase', 'true');
        window.location.href = response.url;
      } else {
        setError('URL de paiement non reçue du serveur');
      }
    } catch (err: any) {
      console.error('❌ Erreur création session de paiement:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création de la session de paiement');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveItem = (patternId: number) => {
    const newItems = cartItems.filter(item => item.pattern.id !== patternId);
    setCartItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems.map(item => item.pattern.id)));
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  if (loading) {
    return (
      <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
        <Navbar/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
          <div style={{textAlign:'center'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite',margin:'0 auto 1rem'}}/>
            <p style={{fontFamily:'var(--font-body)',color:'var(--color-muted-foreground)'}}>Chargement du panier...</p>
          </div>
        </div>
        <Footer/>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Navbar/>
      
      <div style={{maxWidth:'72rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={()=>navigate('/patterns')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'2rem',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-muted-foreground)',padding:0}}>
          <ChevronLeft size={16}/> Retour au catalogue
        </button>

        <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:600,color:'var(--color-foreground)',letterSpacing:'-0.02em',marginBottom:'0.5rem'}}>Finaliser votre commande</h1>
        <p style={{fontFamily:'var(--font-body)',fontSize:'1rem',color:'var(--color-muted-foreground)',marginBottom:'2.5rem'}}>Vérifiez votre panier avant de procéder au paiement</p>

        {error && (
          <div style={{marginBottom:'1.5rem',padding:'1rem 1.25rem',borderRadius:'0.75rem',background:'hsla(0,65%,52%,0.08)',border:'1px solid hsla(0,65%,52%,0.2)',display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span style={{fontSize:'1.25rem'}}>⚠️</span>
            <p style={{fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'hsl(0,65%,45%)',margin:0}}>{error}</p>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'4rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
            <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🛒</div>
            <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',fontWeight:600,color:'var(--color-foreground)',marginBottom:'0.5rem'}}>Votre panier est vide</h3>
            <p style={{fontFamily:'var(--font-body)',color:'var(--color-muted-foreground)',marginBottom:'1.5rem'}}>Découvrez nos patrons et ajoutez-les à votre panier !</p>
            <button onClick={()=>navigate('/patterns')} className="btn-craft" style={{padding:'0.875rem 2rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem'}}>
              Parcourir les patrons
            </button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'2rem',alignItems:'start'}}>
            <div>
              <div style={{background:'var(--color-card)',borderRadius:'1.25rem',padding:'1.5rem',border:'1px solid var(--color-border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
                  <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',fontWeight:600,color:'var(--color-foreground)',margin:0}}>Articles ({cartItems.length})</h2>
                  <button onClick={handleClearCart} style={{background:'none',border:'none',color:'hsl(0,65%,52%)',fontSize:'0.8125rem',fontFamily:'var(--font-body)',cursor:'pointer',padding:'0.25rem 0.5rem'}}>
                    Vider le panier
                  </button>
                </div>
                
                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {cartItems.map(item => (
                    <div key={item.pattern.id} style={{display:'flex',gap:'1rem',paddingBottom:'1rem',borderBottom:'1px solid var(--color-border)'}}>
                      <div style={{width:'5rem',height:'5rem',borderRadius:'0.75rem',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
                        {item.pattern.cover_image ? (
                          <img src={imgUrl(item.pattern.cover_image)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.75rem'}}>🧶</div>
                        )}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <h4 style={{fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem',color:'var(--color-foreground)',margin:'0 0 0.125rem'}}>{item.pattern.title}</h4>
                            <p style={{fontFamily:'var(--font-body)',fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:'0 0 0.375rem'}}>par {item.pattern.author.username}</p>
                            <div style={{display:'flex',gap:'0.375rem'}}>
                              <span style={{padding:'0.125rem 0.5rem',borderRadius:'999px',fontSize:'0.625rem',background:'var(--color-surface)',color:'var(--color-muted-foreground)'}}>{item.pattern.type}</span>
                              <span style={{padding:'0.125rem 0.5rem',borderRadius:'999px',fontSize:'0.625rem',background:'var(--color-surface)',color:'var(--color-muted-foreground)'}}>{item.pattern.level}</span>
                            </div>
                          </div>
                          <button onClick={()=>handleRemoveItem(item.pattern.id)} style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer',padding:'0.25rem'}}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <p style={{fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem',color:'var(--color-foreground)',margin:0}}>{parseFloat(item.pattern.price).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button onClick={()=>navigate('/patterns')} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginTop:'1rem',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontSize:'0.875rem',color:'var(--color-primary)',padding:0}}>
                <ChevronLeft size={14}/> Continuer mes achats
              </button>
            </div>
            
            <div>
              <div style={{background:'var(--color-card)',borderRadius:'1.25rem',padding:'1.5rem',border:'1px solid var(--color-border)',position:'sticky',top:'6rem'}}>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',fontWeight:600,color:'var(--color-foreground)',margin:'0 0 1.25rem'}}>Résumé</h2>
                
                <div style={{marginBottom:'1.5rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                    <span style={{fontFamily:'var(--font-body)',color:'var(--color-muted-foreground)'}}>Sous-total</span>
                    <span style={{fontFamily:'var(--font-body)',color:'var(--color-foreground)'}}>{calculateTotal().toFixed(2)} €</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',paddingBottom:'1rem',borderBottom:'1px solid var(--color-border)'}}>
                    <span style={{fontFamily:'var(--font-body)',color:'var(--color-muted-foreground)'}}>TVA (0%)</span>
                    <span style={{fontFamily:'var(--font-body)',color:'var(--color-foreground)'}}>0.00 €</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:'1rem'}}>
                    <span style={{fontFamily:'var(--font-body)',fontWeight:600,fontSize:'1.125rem',color:'var(--color-foreground)'}}>Total</span>
                    <span style={{fontFamily:'var(--font-display)',fontWeight:600,fontSize:'1.25rem',color:'var(--color-primary)'}}>{calculateTotal().toFixed(2)} €</span>
                  </div>
                </div>
                
                <button onClick={handleCheckout} disabled={processing} className="btn-craft"
                  style={{width:'100%',padding:'0.875rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600,fontSize:'0.9375rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',opacity:processing?0.7:1,cursor:processing?'wait':'pointer'}}>
                  {processing ? (
                    <>Redirection vers Stripe...</>
                  ) : (
                    <><CreditCard size={16}/> Payer {calculateTotal().toFixed(2)} € <ArrowRight size={16}/></>
                  )}
                </button>
                
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',marginTop:'1rem'}}>
                  <Shield size={12} style={{color:'var(--color-muted-foreground)'}}/>
                  <span style={{fontFamily:'var(--font-body)',fontSize:'0.6875rem',color:'var(--color-muted-foreground)'}}>Paiement sécurisé via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
};

// ====================== PAGE SUCCÈS ======================
export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  
  useEffect(() => {
    const checkPurchase = async () => {
      const pendingPurchase = localStorage.getItem('pending_purchase');
      
      if (pendingPurchase) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        localStorage.removeItem('pending_purchase');
      }
      
      localStorage.removeItem('cart');
      setVerifying(false);
    };
    
    checkPurchase();
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/patterns');
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar/>
      <div style={{maxWidth:'42rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'3rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
          <div style={{width:'5rem',height:'5rem',borderRadius:'999px',background:'hsla(105,28%,50%,0.12)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
            <span style={{fontSize:'2.5rem'}}>✅</span>
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:600,color:'var(--color-foreground)',marginBottom:'0.75rem'}}>Paiement réussi !</h1>
          <p style={{fontFamily:'var(--font-body)',color:'var(--color-muted-foreground)',marginBottom:'1.5rem',lineHeight:1.6}}>
            {verifying ? 'Vérification de votre achat...' : 'Merci pour votre achat ! Vous pouvez maintenant accéder à vos patrons dans votre bibliothèque.'}
          </p>
          <div style={{background:'hsla(35,70%,50%,0.08)',borderRadius:'0.75rem',padding:'1rem',marginBottom:'1.5rem'}}>
            <p style={{fontFamily:'var(--font-body)',fontSize:'0.8125rem',color:'hsl(35,70%,40%)',margin:0}}>📧 Un email de confirmation avec votre facture a été envoyé à votre adresse email.</p>
          </div>
          <p style={{fontFamily:'var(--font-body)',fontSize:'0.8125rem',color:'var(--color-muted-foreground)',marginBottom:'1.5rem'}}>Redirection automatique dans {countdown} seconde{countdown>1?'s':''}...</p>
          <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>navigate('/patterns')} className="btn-craft" style={{padding:'0.75rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>Voir mes patrons</button>
            <button onClick={()=>navigate('/mon-profil')} style={{padding:'0.75rem 1.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',color:'var(--color-foreground)',fontFamily:'var(--font-body)',fontWeight:500}}>Mon profil</button>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

// ====================== PAGE ANNULATION ======================
export const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    localStorage.removeItem('pending_purchase');
  }, []);
  
  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar/>
      <div style={{maxWidth:'42rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'3rem 2rem',textAlign:'center',border:'1px solid var(--color-border)'}}>
          <div style={{width:'5rem',height:'5rem',borderRadius:'999px',background:'hsla(0,65%,52%,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
            <span style={{fontSize:'2.5rem'}}>❌</span>
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:600,color:'var(--color-foreground)',marginBottom:'0.75rem'}}>Paiement annulé</h1>
          <p style={{fontFamily:'var(--font-body)',color:'var(--color-muted-foreground)',marginBottom:'1.5rem',lineHeight:1.6}}>Votre paiement a été annulé. Aucun montant n'a été débité.</p>
          <div style={{background:'var(--color-surface)',borderRadius:'0.75rem',padding:'1rem',marginBottom:'1.5rem'}}>
            <p style={{fontFamily:'var(--font-body)',fontSize:'0.8125rem',color:'var(--color-muted-foreground)',margin:0}}>Vous pouvez réessayer quand vous êtes prêt. Votre panier a été conservé.</p>
          </div>
          <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={()=>navigate('/checkout')} className="btn-craft" style={{padding:'0.75rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>Retour au panier</button>
            <button onClick={()=>navigate('/patterns')} style={{padding:'0.75rem 1.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',color:'var(--color-foreground)',fontFamily:'var(--font-body)',fontWeight:500}}>Continuer mes achats</button>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Checkout;