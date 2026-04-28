import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-background)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🧶</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: 600, color: 'var(--color-foreground)', lineHeight: 1, marginBottom: '1rem' }}>
        404
      </h1>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.75rem' }}>
        This stitch got dropped.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--color-muted-foreground)', maxWidth: '28rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <button
        onClick={() => navigate('/home')}
        className="btn-craft rounded-pill"
        style={{
          background: 'var(--color-primary)', color: '#fff',
          padding: '1rem 2rem', fontFamily: 'var(--font-body)',
          fontSize: '1rem', fontWeight: 600, border: 'none',
          cursor: 'pointer', boxShadow: 'var(--shadow-warm)',
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default NotFound;
