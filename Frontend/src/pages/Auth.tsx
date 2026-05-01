import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import heroImg from '../assets/hero-crochet.jpg';
import Swal from 'sweetalert2';

// ─── Fingerprint icon ──────────────────
const FingerprintIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 17.5a14.5 14.5 0 0 0 4.24 5.12" />
    <path d="M20 17.5a14.5 14.5 0 0 1-4.24 5.12" />
    <path d="M4.19 9.84A10.01 10.01 0 0 0 2 12" />
    <path d="M12 8a4 4 0 0 1 4 4" />
    <path d="M6.36 18.78A9 9 0 0 1 5.07 15" />
    <path d="M20.93 15a9 9 0 0 1-1.29 3.78" />
    <path d="M7.13 10.47A6 6 0 0 0 6 14" />
    <path d="M19 14a7 7 0 0 0-7-7" />
  </svg>
);

// ─── Main Auth Component ─────────────────────────────────────────────────────
const Auth: React.FC = () => {
  const { registerPasskey, loginWithPasskey } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      Swal.fire({
        title: 'Email requis',
        icon: 'error',
        toast: true,
        position: 'top-right',
        timer: 3000,
      });
      return;
    }

    if (!isLogin && !username.trim()) {
      Swal.fire({
        title: "Nom d'utilisateur requis",
        icon: 'error',
        toast: true,
        position: 'top-right',
        timer: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await loginWithPasskey(email.trim());
      } else {
        await registerPasskey(email.trim(), username.trim());
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setUsername('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: 'var(--color-background)' 
    }}>

      {/* Left decorative panel - hidden on mobile */}
      <div 
        style={{
          width: '50%',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          display: 'none', 
        }} 
        className="auth-left-panel"
      >
        <img
          src={heroImg}
          alt="Texture crochet"
          style={{ 
            position: 'absolute', 
            inset: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
        />
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'rgba(35, 22, 14, 0.42)' 
        }} />
        
        <div style={{ position: 'relative', zIndex: 10, padding: '3rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', 
            fontWeight: 600, 
            color: '#fff',
            lineHeight: 1.0, 
            letterSpacing: '-0.02em',
            fontSize: 'clamp(2.5rem, 4vw, 4rem)', 
            margin: '0 0 1rem 0',
          }}>
            Votre prochain chef-d'œuvre<br />
            commence par une <span style={{ fontStyle: 'italic' }}>simple boucle.</span>
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', 
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.72)', 
            maxWidth: '28rem', 
            lineHeight: 1.7, 
            margin: 0,
          }}>
            Rejoignez 89 000+ créateurs qui partagent des patrons, suivent leurs projets et apprennent ensemble.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center',
        padding: 'clamp(1.5rem, 5vw, 4rem)', 
        overflowY: 'auto', 
        minHeight: '100vh',
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '26rem', 
          paddingTop: '2rem', 
          paddingBottom: '2rem' 
        }}>

          {/* Logo */}
          <a 
            href="/" 
            style={{
              fontFamily: 'var(--font-display)', 
              fontSize: '1.5rem', 
              fontWeight: 600,
              letterSpacing: '-0.02em', 
              color: 'var(--color-foreground)',
              textDecoration: 'none', 
              display: 'block', 
              marginBottom: '2rem',
            }}
          >
            Bobble
          </a>

          {/* Heading */}
          <h1 style={{
            fontFamily: 'var(--font-display)', 
            fontSize: '1.875rem', 
            fontWeight: 600,
            color: 'var(--color-foreground)', 
            margin: '0 0 0.5rem 0', 
            letterSpacing: '-0.01em',
          }}>
            {isLogin ? 'Bon retour' : 'Créez votre compte'}
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)', 
            color: 'var(--color-muted-foreground)',
            margin: '0 0 2rem 0', 
            fontSize: '0.9375rem',
          }}>
            {isLogin
              ? 'Utilisez votre passkey pour vous connecter — pas de mot de passe nécessaire.'
              : "Choisissez un nom d'utilisateur et enregistrez votre passkey — c'est gratuit."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.25rem' 
          }}>

            {/* Username - only for registration */}
            {!isLogin && (
              <div>
                <label style={labelStyle}>Nom d'utilisateur</label>
                <input
                  type="text"
                  placeholder="yarnlover42"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={inputStyle}
                  disabled={loading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="bonjour@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                disabled={loading}
              />
            </div>

            {/* Passkey info box */}
            <div style={{
              display: 'flex', 
              gap: '0.75rem', 
              alignItems: 'flex-start',
              background: 'hsla(262,60%,56%,0.07)',
              border: '1px solid hsla(262,60%,56%,0.2)',
              borderRadius: '0.625rem', 
              padding: '0.875rem 1rem',
            }}>
              <span style={{ 
                color: 'var(--color-primary)', 
                flexShrink: 0, 
                marginTop: '1px' 
              }}>
                <FingerprintIcon />
              </span>
              <p style={{
                fontFamily: 'var(--font-body)', 
                fontSize: '0.8125rem', 
                lineHeight: 1.6,
                color: 'var(--color-muted-foreground)', 
                margin: 0,
              }}>
                {isLogin
                  ? 'Votre appareil demandera Face ID, empreinte digitale ou code PIN pour vous identifier.'
                  : "Vous configurerez une passkey avec les données biométriques ou le code PIN de votre appareil. Aucun mot de passe n'est stocké."}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                background: 'var(--color-primary)', 
                color: '#fff',
                padding: '0.9375rem', 
                borderRadius: '999px',
                fontFamily: 'var(--font-body)', 
                fontSize: '0.9375rem', 
                fontWeight: 600,
                border: 'none', 
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: 'var(--shadow-warm)',
                opacity: loading ? 0.75 : 1, 
                transition: 'opacity 0.2s',
                marginTop: '0.25rem',
              }}
            >
              {!loading && <FingerprintIcon />}
              {loading ? 'Traitement...' : isLogin ? 'Se connecter avec passkey' : 'Enregistrer la passkey'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ 
            margin: '1.75rem 0', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          {/* Toggle between Login and Register */}
          <p style={{
            textAlign: 'center', 
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem', 
            color: 'var(--color-muted-foreground)', 
            margin: 0,
          }}>
            {isLogin ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              style={{
                fontFamily: 'var(--font-body)', 
                fontWeight: 600, 
                color: 'var(--color-primary)',
                background: 'none', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: 0,
              }}
            >
              {isLogin ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>

          {/* Support note */}
          <p style={{
            textAlign: 'center', 
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem', 
            color: 'var(--color-muted-foreground)',
            marginTop: '1.5rem', 
            lineHeight: 1.6, 
            opacity: 0.7,
          }}>
            Les passkeys fonctionnent sur Chrome, Safari, Edge et Firefox sur les appareils avec données biométriques ou code PIN.
          </p>

        </div>
      </div>
    </div>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-foreground)',
  marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.625rem',
  padding: '0.8125rem 1rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9375rem',
  color: 'var(--color-foreground)',
  transition: 'all 0.2s',
  display: 'block',
};

export default Auth;