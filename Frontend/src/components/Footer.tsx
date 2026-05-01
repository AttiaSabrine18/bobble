import React from 'react';
import ScrollReveal from './ScrollReveal';

const cols = [
  { title: 'Découvrir',   items: ['Patrons', 'Base de laines', 'Créateurs', 'Collections'] },
  { title: 'Communauté',  items: ['Forums', 'Événements', 'Blog', 'Centre d\'aide'] },
  { title: 'Connecter',    items: ['Instagram', 'Pinterest', 'YouTube', 'Newsletter'] },
];

const Footer: React.FC = () => (
  <footer className="section-padding" style={{ background: 'var(--color-primary)', color: '#fff', paddingTop: '5rem', paddingBottom: '5rem' }}>
    <div className="container-craft">
      <ScrollReveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '3rem', marginBottom: '4rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Bobble</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', opacity: 0.8, lineHeight: 1.7 }}>
              Votre prochain chef-d'œuvre commence par une simple boucle.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', opacity: 0.6 }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {col.items.map(item => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: '#fff', opacity: 0.8, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>
          © 2026 Bobble. Fait avec de la laine et de l'amour.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Confidentialité', 'Conditions', 'Cookies'].map(item => (
            <a
              key={item}
              href="#"
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#fff', opacity: 0.6, transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;