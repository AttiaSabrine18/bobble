import React from 'react';
import Navbar        from '../components/Navbar';
import Hero          from '../components/Hero';
import PatternGallery from '../components/PatternGallery';
import YarnExplorer  from '../components/YarnExplorer';
import Community     from '../components/Community';
import Footer        from '../components/Footer';

const Index: React.FC = () => (
  <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
    <Navbar />
    <Hero />
    <PatternGallery />
    <YarnExplorer />
    <Community />
    <Footer />
  </div>
);

export default Index;