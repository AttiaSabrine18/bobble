import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Message {
  id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Order {
  id: number;
  title: string;
  buyer: string;
  seller: string;
  total_price: string;
  quantity: number;
  status: string;
  status_display: string;
  shipping_address: string;
  messages: Message[];
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: 'hsl(35,70%,50%)', icon: <Package size={14}/> },
  confirmed: { color: 'hsl(210,40%,50%)', icon: <CheckCircle size={14}/> },
  shipped: { color: 'hsl(260,40%,50%)', icon: <Truck size={14}/> },
  delivered: { color: 'hsl(105,28%,50%)', icon: <CheckCircle size={14}/> },
  cancelled: { color: 'hsl(0,65%,52%)', icon: <XCircle size={14}/> },
};

const MarketplaceOrderChat: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (orderId) loadOrder();
    const interval = setInterval(() => orderId && loadOrder(), 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [order?.messages]);

  const loadOrder = async () => {
    try {
      const response = await api.get(`/marketplace/orders/${orderId}/`);
      setOrder(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !orderId) return;
    setSending(true);
    try {
      await api.post(`/marketplace/orders/${orderId}/message/`, { content: newMessage });
      setNewMessage('');
      loadOrder();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status: string) => {
    try {
      await api.patch(`/marketplace/orders/${orderId}/`, { status });
      loadOrder();
    } catch (error) {
      console.error('Erreur:', error);
    }
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

  if (!order) return null;

  const isSeller = user?.username === order.seller;
  const config = statusConfig[order.status] || statusConfig.pending;

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      
      <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={() => navigate(-1)} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1rem',background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}>
          <ChevronLeft size={16}/> Retour
        </button>

        {/* Infos commande */}
        <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',marginBottom:'1rem',border:'1px solid var(--color-border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
            <div>
              <h3 style={{fontWeight:600,margin:'0 0 0.25rem'}}>{order.title}</h3>
              <p style={{fontSize:'0.875rem',color:'var(--color-muted-foreground)',margin:0}}>
                {order.total_price} DT • Qté: {order.quantity}
              </p>
            </div>
            <span style={{padding:'0.25rem 0.75rem',borderRadius:'999px',fontSize:'0.8125rem',fontWeight:600,background:config.color+'22',color:config.color,display:'flex',alignItems:'center',gap:'0.25rem'}}>
              {config.icon} {order.status_display}
            </span>
          </div>
          
          <div style={{display:'flex',gap:'1.5rem',marginTop:'0.75rem',fontSize:'0.8125rem',color:'var(--color-muted-foreground)'}}>
            <span>👤 {order.buyer}</span>
            <span>🏪 {order.seller}</span>
          </div>
          
          {/* Boutons vendeur */}
          {isSeller && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem',flexWrap:'wrap'}}>
              {order.status === 'pending' && (
                <button onClick={() => handleStatus('confirmed')} className="btn-craft"
                  style={{padding:'0.5rem 1rem',borderRadius:'999px',border:'none',background:'hsl(210,40%,50%)',color:'#fff',fontSize:'0.8125rem',cursor:'pointer'}}>
                  ✅ Confirmer
                </button>
              )}
              {order.status === 'confirmed' && (
                <button onClick={() => handleStatus('shipped')} className="btn-craft"
                  style={{padding:'0.5rem 1rem',borderRadius:'999px',border:'none',background:'hsl(260,40%,50%)',color:'#fff',fontSize:'0.8125rem',cursor:'pointer'}}>
                  🚚 Expédié
                </button>
              )}
              {order.status === 'shipped' && (
                <button onClick={() => handleStatus('delivered')} className="btn-craft"
                  style={{padding:'0.5rem 1rem',borderRadius:'999px',border:'none',background:'hsl(105,28%,50%)',color:'#fff',fontSize:'0.8125rem',cursor:'pointer'}}>
                  ✅ Livré
                </button>
              )}
              <button onClick={() => handleStatus('cancelled')}
                style={{padding:'0.5rem 1rem',borderRadius:'999px',border:'1.5px solid hsl(0,65%,52%)',background:'transparent',color:'hsl(0,65%,52%)',fontSize:'0.8125rem',cursor:'pointer'}}>
                ❌ Annuler
              </button>
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={{background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)',overflow:'hidden'}}>
          <div style={{padding:'1rem',maxHeight:'400px',overflow:'auto',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {order.messages.map(msg => {
              const isMe = msg.sender_username === user?.username;
              return (
                <div key={msg.id} style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start'}}>
                  <div style={{
                    maxWidth:'80%',padding:'0.75rem 1rem',borderRadius:'1rem',
                    background:isMe?'var(--color-primary)':'var(--color-surface)',
                    color:isMe?'#fff':'var(--color-foreground)',
                    borderBottomRightRadius:isMe?'0.25rem':'1rem',
                    borderBottomLeftRadius:isMe?'1rem':'0.25rem',
                  }}>
                    <p style={{margin:0,fontSize:'0.875rem',lineHeight:1.5}}>{msg.content}</p>
                  </div>
                  <span style={{fontSize:'0.6875rem',color:'var(--color-muted-foreground)',marginTop:'0.25rem'}}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef}/>
          </div>

          <form onSubmit={handleSend} style={{display:'flex',gap:'0.5rem',padding:'1rem',borderTop:'1px solid var(--color-border)'}}>
            <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Votre message..."
              style={{flex:1,padding:'0.75rem 1rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',outline:'none',fontSize:'0.875rem'}}/>
            <button type="submit" disabled={sending||!newMessage.trim()}
              style={{padding:'0.75rem 1.25rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',cursor:'pointer',opacity:!newMessage.trim()?0.5:1}}>
              <Send size={16}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceOrderChat;