import React from 'react';
import { ArrowDown } from 'lucide-react';
import heroImg from '../assets/hero-crochet.jpg';

const Hero: React.FC = () => (
  <section
    id="top"
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '8rem',
      paddingBottom: '6rem',
      paddingLeft: 'clamp(1.5rem, 5vw, 4rem)',
      paddingRight: 'clamp(1.5rem, 5vw, 4rem)',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--color-background)',
    }}
  >
    {/* Decorative blobs */}
    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, hsla(18,52%,51%,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: 0, left: '-8%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, hsla(105,14%,58%,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

    <div className="container-craft" style={{ width: '100%' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '3rem',
        alignItems: 'center',
      }}
        className="hero-grid"
      >
        {/* ── Text ── */}
        <div className="animate-unfurl" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            margin: 0,
          }}>
            Une communauté pour les créateurs
          </p>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            color: 'var(--color-foreground)',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
            margin: 0,
          }}>
            Créez quelque chose de<br />
            <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>tactile.</span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.125rem',
            color: 'var(--color-muted-foreground)',
            maxWidth: '32rem',
            lineHeight: 1.7,
            margin: 0,
          }}>
            Découvrez 142 000+ patrons de crochet et de tricot, suivez vos projets,
            et connectez-vous avec des artistes de la fibre du monde entier.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <a
              href="#patterns"
              className="btn-craft"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--color-primary)',
                color: '#fff',
                padding: '1rem 2rem',
                borderRadius: '999px',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                boxShadow: 'var(--shadow-warm)',
                textDecoration: 'none',
              }}
            >
              Parcourir les patrons
            </a>
            <a
              href="#community"
              className="btn-craft"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '2px solid var(--color-border)',
                color: 'var(--color-foreground)',
                padding: '1rem 2rem',
                borderRadius: '999px',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Rejoindre la communauté
            </a>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingTop: '1rem' }}>
            {[['142k+', 'Patrons'], ['89k', 'Créateurs'], ['2.3M', 'Projets']].map(([num, label], i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ width: 1, height: '2.5rem', background: 'var(--color-border)' }} />}
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>{num}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', margin: 0 }}>{label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Image ── */}
        <div className="animate-unfurl" style={{ animationDelay: '200ms', position: 'relative' }}>
          <div style={{ borderRadius: '2.5rem', overflow: 'hidden', boxShadow: 'var(--shadow-warm-lg)' }}>
            <img
              src={heroImg}
              alt="Vue rapprochée de magnifiques points de crochet aux couleurs terre cuite et crème"
              className="img-ken-burns"
              style={{ width: '100%', height: '560px', objectFit: 'cover', display: 'block' }}
              loading="eager"
            />
          </div>
          {/* Floating badge */}
          <div
            className="animate-unfurl"
            style={{
              animationDelay: '600ms',
              position: 'absolute',
              bottom: '-1.5rem',
              left: '-1.5rem',
              background: 'var(--color-secondary)',
              color: '#fff',
              padding: '1rem 1.5rem',
              borderRadius: '1rem',
              boxShadow: 'var(--shadow-warm)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Gratuit</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.8, margin: 0 }}>Sans carte bancaire</p>
          </div>
        </div>
      </div>
    </div>

    {/* Scroll indicator */}
    <div style={{
      position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
      color: 'var(--color-muted-foreground)',
    }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Explorer</span>
      <ArrowDown size={16} className="animate-bounce-y" />
    </div>
  </section>
);

export default Hero;