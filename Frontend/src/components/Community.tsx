import React from 'react';
import { MessageCircle, Users, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';

const features = [
  {
    icon: MessageCircle,
    title: 'Forums & Groupes',
    description: 'Participez aux discussions sur les techniques, partagez vos projets en cours et obtenez de l\'aide de créateurs expérimentés.',
    route: '/forums',
    color: 'hsl(18,52%,51%)',
    emoji: '💬',
  },
  {
    icon: Users,
    title: 'Tricot-Thons',
    description: 'Participez à des événements communautaires où tout le monde réalise le même patron ensemble.',
    route: '/craft-alongs',
    color: 'hsl(105,14%,50%)',
    emoji: '🧶',
  },
  {
    icon: Trophy,
    title: 'Badges de Compétence',
    description: 'Suivez vos progrès et gagnez des badges en maîtrisant de nouveaux points et techniques.',
    route: '/badges',
    color: 'hsl(48,80%,48%)',
    emoji: '🏅',
  },
  {
    icon: Sparkles,
    title: 'Journal de Projets',
    description: 'Documentez votre parcours créatif avec des photos, des notes et les détails des laines pour chaque projet.',
    route: '/projects',
    color: 'hsl(280,38%,55%)',
    emoji: '✨',
  },
];

const testimonials = [
  { name: 'Amara Osei',      role: 'Créatrice Amigurumi',  initials: 'AO', text: 'Bobble a changé ma façon de partager mes créations. Les retours de la communauté sont tellement bienveillants et encourageants.' },
  { name: 'Élise Johansson', role: 'Crocheteuse Débutante',  initials: 'ÉJ', text: 'J\'ai appris à crocheter entièrement grâce à cette plateforme. Les instructions des patrons sont tellement claires !' },
];

const Community: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="community" className="section-padding" style={{ paddingTop: '6rem', paddingBottom: '8rem' }}>
      <div className="container-craft">

        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              Communauté
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Ensemble, c'est mieux
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--color-muted-foreground)', marginTop: '1rem', maxWidth: '36rem', marginLeft: 'auto', marginRight: 'auto' }}>
              Rejoignez une communauté chaleureuse et bienveillante d'artistes de la fibre qui s'entraident.
            </p>
          </div>
        </ScrollReveal>

        {/* Clickable feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1.5rem', marginBottom: '5rem' }}>
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 80}>
              <div
                onClick={() => navigate(feature.route)}
                className="card-hover"
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-warm)',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = feature.color + '66';
                  (e.currentTarget as HTMLDivElement).style.background = feature.color + '08';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '0.875rem',
                  background: feature.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.5rem' }}>
                  {feature.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  {feature.description}
                </p>

                {/* CTA */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                  color: feature.color,
                }}>
                  Explorer <ArrowRight size={14} />
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '2rem' }}>
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '2rem', boxShadow: 'var(--shadow-warm)' }}>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-foreground)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '1.125rem', fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '999px', background: 'hsla(18,52%,51%,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>{t.initials}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>{t.name}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Community;