import React from 'react';
import ScrollReveal from './ScrollReveal';
import yarnImg from '../assets/yarn-collection.jpg';

const yarnTypes = [
  { name: 'Laine Mérinos',    weight: 'DK',       fiber: '100% Laine',           colors: 48, popular: true  },
  { name: 'Coton Bio',        weight: 'Worsted',   fiber: '100% Coton',         colors: 32, popular: true  },
  { name: 'Mélange Alpaga',   weight: 'Fingering', fiber: '80% Alpaga 20% Soie', colors: 24, popular: false },
  { name: 'Soie de Bambou',    weight: 'Sport',     fiber: '70% Bambou 30% Soie', colors: 18, popular: false },
];

const YarnExplorer: React.FC = () => (
  <section id="yarn" className="section-padding" style={{ paddingTop: '6rem', paddingBottom: '8rem', background: 'var(--color-surface)' }}>
    <div className="container-craft">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>

        {/* Image */}
        <ScrollReveal>
          <div className="rounded-container" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-warm-lg)' }}>
            <img
              src={yarnImg}
              alt="Collection de pelotes de laine colorées en terre cuite, vert sauge et crème"
              className="img-ken-burns"
              style={{ width: '100%', height: '460px', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
          </div>
        </ScrollReveal>

        {/* Content */}
        <div>
          <ScrollReveal>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              Mon Stash de Laine
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Explorez des fibres<br />
              <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>que vous allez adorer</span>
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--color-muted-foreground)', maxWidth: '32rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
              Recherchez par poids, composition ou couleur. Trouvez la laine parfaite pour votre prochaine création et découvrez ce que d'autres ont réalisé avec.
            </p>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {yarnTypes.map((yarn, i) => (
              <ScrollReveal key={yarn.name} delay={i * 80}>
                <div
                  className="card-hover"
                  style={{ background: 'var(--color-background)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-warm)', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>
                        {yarn.name}
                      </h4>
                      {yarn.popular && (
                        <span
                          className="rounded-pill"
                          style={{ padding: '0.125rem 0.625rem', background: 'hsla(18,52%,51%,0.1)', color: 'var(--color-primary)', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}
                        >
                          Populaire
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted-foreground)', margin: 0 }}>
                      {yarn.fiber} · {yarn.weight}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>{yarn.colors}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-foreground)', margin: 0 }}>Couleurs</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default YarnExplorer;