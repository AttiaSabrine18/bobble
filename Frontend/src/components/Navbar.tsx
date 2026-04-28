// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Search, Heart, Menu, X, LogOut, User, Plus, Users, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { label: 'Patrons',     href: '/patterns'  },
    { label: 'Forums',      href: '/community'     },
    { label: 'Craft-Alongs', href: '/craft-alongs' },
    { label: 'Marketplace', href: '/marketplace' },
  ];

  const isActive = (href: string) => location.pathname.startsWith(href);

  const handleLogout = () => { logout(); navigate('/'); };

  const linkStyle = (href: string): React.CSSProperties => ({
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    fontWeight: isActive(href) ? 600 : 500,
    color: isActive(href) ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
    textDecoration: 'none',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  });

  return (
    <nav style={{
      position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, width: 'calc(100% - 2rem)', maxWidth: '56rem',
    }}>
      <div
        className="nav-glass"
        style={{
          borderRadius: '999px', padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: 'var(--shadow-warm)', border: '1px solid var(--color-border)', gap: '1rem',
          background: 'rgba(250,247,242,0.88)', backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <button onClick={() => navigate(user ? '/home' : '/')} style={{
          fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600,
          letterSpacing: '-0.02em', color: 'var(--color-foreground)', background: 'none',
          border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, padding: 0,
        }}>
          Bobble
        </button>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, justifyContent: 'center' }} className="desktop-links">
          {links.map(link => (
            <button 
              key={link.label} 
              onClick={() => user ? navigate(link.href) : navigate('/login')} 
              style={linkStyle(link.href)}
              onMouseEnter={e => { if (!isActive(link.href)) (e.currentTarget as HTMLElement).style.color = 'var(--color-foreground)'; }}
              onMouseLeave={e => { if (!isActive(link.href)) (e.currentTarget as HTMLElement).style.color = 'var(--color-muted-foreground)'; }}>
              {link.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          
          {user ? (
            // Logged-in user actions
            <>
              <button onClick={() => navigate('/search')} title="Rechercher"
                style={{ padding: '0.5rem', color: 'var(--color-muted-foreground)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', borderRadius: '999px', cursor: 'pointer' }}>
                <Search size={16} />
              </button>

              <button onClick={() => navigate('/search/users')} title="Découvrir des créateurs"
                style={{ padding: '0.5rem', color: 'var(--color-muted-foreground)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', borderRadius: '999px', cursor: 'pointer' }}>
                <Users size={16} />
              </button>

              <button onClick={() => navigate('/notebook')} title="Favoris"
                style={{ padding: '0.5rem', color: 'var(--color-muted-foreground)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', borderRadius: '999px', cursor: 'pointer' }}>
                <Heart size={16} />
              </button>

              <button
                onClick={() => navigate('/patterns/create')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '999px', background: 'var(--color-primary)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-warm)' }}
                title="Publier un patron"
              >
                <Plus size={14} /> Publier
              </button>
              
              <button onClick={() => navigate('/mon-profil')} title="Mon profil"
                style={{ padding: '0.5rem', color: 'var(--color-muted-foreground)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', borderRadius: '999px', cursor: 'pointer' }}>
                <User size={16} />
              </button>
              
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', borderRadius: '999px',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500,
                  color: 'var(--color-foreground)', whiteSpace: 'nowrap', cursor: 'pointer',
                }}
              >
                <LogOut size={14} /> Déconnexion
              </button>
            </>
          ) : (
            // Non-logged user actions
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', borderRadius: '999px',
                  background: 'var(--color-primary)', border: 'none',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                  color: '#fff', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: 'var(--shadow-warm)'
                }}
              >
                <LogIn size={14} /> Se connecter
              </button>
            </>
          )}

          <button
            style={{ padding: '0.5rem', background: 'none', border: 'none', color: 'var(--color-muted-foreground)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-btn"
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div
          className="nav-glass"
          style={{
            marginTop: '0.5rem', borderRadius: '1.25rem', padding: '1rem 1.5rem',
            boxShadow: 'var(--shadow-warm)', border: '1px solid var(--color-border)',
            background: 'rgba(34, 26, 12, 0.95)', backdropFilter: 'blur(12px)',
          }}
        >
          {links.map(link => (
            <button
              key={link.label}
              onClick={() => { 
                if (user) {
                  navigate(link.href);
                } else {
                  navigate('/login');
                }
                setIsOpen(false); 
              }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.75rem 0', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: isActive(link.href) ? 'var(--color-primary)' : 'var(--color-muted-foreground)', borderBottom: '1px solid var(--color-border)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {link.label}
            </button>
          ))}
          
          {user ? (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
              <button onClick={() => { navigate('/search/users'); setIsOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '999px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-foreground)' }}>
                <Users size={14} /> Créateurs
              </button>
              <button onClick={() => { navigate('/mon-profil'); setIsOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '999px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-foreground)' }}>
                <User size={14} /> Mon profil
              </button>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '999px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-foreground)' }}>
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
              <button onClick={() => { navigate('/login'); setIsOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '999px', background: 'var(--color-primary)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.875rem', cursor: 'pointer', color: '#fff' }}>
                <LogIn size={14} /> Se connecter
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;