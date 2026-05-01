// src/pages/MarketplaceOrders.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { marketplaceService } from '../services/marketplace';

interface Order {
  id: number;
  title: string;
  buyer: string;
  seller: string;
  total_price: string;
  quantity: number;
  status: string;
  status_display: string;
  unread_messages: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'hsl(35,70%,50%)',
  confirmed: 'hsl(210,40%,50%)',
  shipped: 'hsl(260,40%,50%)',
  delivered: 'hsl(105,28%,50%)',
  cancelled: 'hsl(0,65%,52%)',
};

const MarketplaceOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<{ buys: Order[]; sales: Order[] }>({ buys: [], sales: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'buys' | 'sales'>('buys');

  useEffect(() => { loadOrders(); }, []);

 const loadOrders = async () => {
  try {
    // ✅ Utiliser le service
    const response = await marketplaceService.getOrders();
    setOrders(response);
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    setLoading(false);
  }
};

  const currentOrders = tab === 'buys' ? orders.buys : orders.sales;

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar />
      <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:600,marginBottom:'1.5rem'}}>Mes Commandes</h1>

        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem'}}>
          <button onClick={()=>setTab('buys')} style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:tab==='buys'?'var(--color-primary)':'transparent',color:tab==='buys'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <ShoppingBag size={16}/> Achats ({orders.buys.length})
          </button>
          <button onClick={()=>setTab('sales')} style={{padding:'0.75rem 1.5rem',borderRadius:'999px',border:'none',background:tab==='sales'?'var(--color-primary)':'transparent',color:tab==='sales'?'#fff':'var(--color-muted-foreground)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <Package size={16}/> Ventes ({orders.sales.length})
          </button>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'3rem'}}>
            <div style={{width:'2rem',height:'2rem',borderRadius:'999px',border:'2px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/>
          </div>
        ) : currentOrders.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted-foreground)'}}>
            Aucune commande
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {currentOrders.map(order => (
              <div key={order.id} onClick={()=>navigate(`/marketplace/orders/${order.id}`)}
                style={{background:'var(--color-card)',borderRadius:'0.75rem',padding:'1rem',border:'1px solid var(--color-border)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.25rem'}}>
                    <h4 style={{fontWeight:600,margin:0,fontSize:'0.9375rem'}}>{order.title}</h4>
                    {order.unread_messages > 0 && (
                      <span style={{background:'hsl(0,65%,52%)',color:'#fff',fontSize:'0.6875rem',padding:'0.125rem 0.5rem',borderRadius:'999px'}}>
                        {order.unread_messages}
                      </span>
                    )}
                  </div>
                  <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:0}}>
                    {order.total_price} DT • {tab==='buys'?order.seller:order.buyer}
                  </p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  <span style={{padding:'0.2rem 0.6rem',borderRadius:'999px',fontSize:'0.75rem',background:statusColors[order.status]+'22',color:statusColors[order.status]}}>
                    {order.status_display}
                  </span>
                  <ChevronRight size={16} style={{color:'var(--color-muted-foreground)'}}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceOrders;