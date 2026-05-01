// src/pages/VisualSearch.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Search, X, Camera, Filter, Heart, ChevronRight, SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { visualSearchService, VisualSearchResult } from '../services/visualSearch';
import Swal from 'sweetalert2';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
};

const TYPE_LABELS: Record<string, string> = {
  tricot: 'Tricot',
  crochet: 'Crochet',
  tissage: 'Tissage',
};

const VisualSearch: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<VisualSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Filtres
  const [typeFilter, setTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [freeFilter, setFreeFilter] = useState<string>('');
  const [topK, setTopK] = useState(10);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier le format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        title: 'Format non supporté',
        text: 'Utilisez une image JPG, PNG ou WebP.',
        icon: 'error',
      });
      return;
    }
    
    // Vérifier la taille (10 Mo max)
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        title: 'Image trop lourde',
        text: 'Maximum 10 Mo.',
        icon: 'error',
      });
      return;
    }
    
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setResults([]);
    setError(null);
    setSearched(false);
  };

  const handleSearch = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filters: any = { top_k: topK };
      if (typeFilter) filters.type = typeFilter;
      if (levelFilter) filters.level = levelFilter;
      if (freeFilter === 'free') filters.is_free = true;
      if (freeFilter === 'paid') filters.is_free = false;
      
      const data = await visualSearchService.search(selectedImage, filters);
      setResults(data.results || []);
      setSearched(true);
      
      if (data.count === 0) {
        Swal.fire({
          title: 'Aucun résultat',
          text: 'Aucun patron similaire trouvé. Essayez une autre image.',
          icon: 'info',
        });
      }
    } catch (err: any) {
      console.error('Erreur recherche visuelle:', err);
      setError(err.response?.data?.error || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResults([]);
      setError(null);
      setSearched(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults([]);
    setError(null);
    setSearched(false);
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 80) return 'hsl(105,28%,50%)';
    if (score >= 60) return 'hsl(35,70%,50%)';
    if (score >= 40) return 'hsl(18,52%,51%)';
    return 'var(--color-muted-foreground)';
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      
      <div style={{maxWidth:'80rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        {/* Header */}
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:600,color:'var(--color-foreground)',letterSpacing:'-0.02em',marginBottom:'0.5rem'}}>
            <Camera size={32} style={{marginRight:'1rem',display:'inline',verticalAlign:'middle'}}/>
            Recherche Visuelle
          </h1>
          <p style={{fontFamily:'var(--font-body)',fontSize:'1rem',color:'var(--color-muted-foreground)'}}>
            Téléchargez une photo et trouvez des patrons similaires grâce à l'IA
          </p>
        </div>

        {/* Zone d'upload */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'2rem',marginBottom:'2rem'}}>
          {/* Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${imagePreview ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '1.5rem',
              padding: imagePreview ? '0' : '3rem 2rem',
              textAlign: 'center',
              cursor: selectedImage ? 'default' : 'pointer',
              transition: 'all 0.3s',
              background: 'var(--color-surface)',
              overflow: 'hidden',
              position: 'relative',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imagePreview ? (
              <>
                <img 
                  src={imagePreview} 
                  alt="Aperçu" 
                  style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '999px',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <X size={14}/>
                </button>
              </>
            ) : (
              <div>
                <Upload size={48} style={{color:'var(--color-muted-foreground)',marginBottom:'1rem'}}/>
                <p style={{fontWeight:600,marginBottom:'0.5rem'}}>Glissez-déposez une image</p>
                <p style={{fontSize:'0.875rem',color:'var(--color-muted-foreground)'}}>ou cliquez pour parcourir</p>
                <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',marginTop:'1rem'}}>JPG, PNG, WebP — max 10 Mo</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{display:'none'}}
              onChange={handleImageSelect}
            />
          </div>

          {/* Actions */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem',justifyContent:'center'}}>
            <button
              onClick={handleSearch}
              disabled={!selectedImage || loading}
              className="btn-craft"
              style={{
                padding: '1rem 2rem',
                borderRadius: '999px',
                border: 'none',
                background: selectedImage && !loading ? 'var(--color-primary)' : 'var(--color-muted)',
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: selectedImage && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: selectedImage && !loading ? 1 : 0.6,
              }}
            >
              {loading ? (
                <>
                  <div style={{width:'1.25rem',height:'1.25rem',borderRadius:'999px',border:'2px solid #fff',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Search size={18}/> Rechercher des patrons similaires
                </>
              )}
            </button>

            {/* Filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: '1.5px solid var(--color-border)',
                background: showFilters ? 'var(--color-primary)' : 'transparent',
                color: showFilters ? '#fff' : 'var(--color-foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <SlidersHorizontal size={16}/> Filtres
            </button>

            {showFilters && (
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.75rem',padding:'1rem',background:'var(--color-card)',borderRadius:'0.75rem',border:'1px solid var(--color-border)'}}>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  style={{padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.875rem'}}>
                  <option value="">Tous types</option>
                  <option value="tricot">Tricot</option>
                  <option value="crochet">Crochet</option>
                  <option value="tissage">Tissage</option>
                </select>
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
                  style={{padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.875rem'}}>
                  <option value="">Tous niveaux</option>
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                  <option value="expert">Expert</option>
                </select>
                <select value={freeFilter} onChange={e => setFreeFilter(e.target.value)}
                  style={{padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.875rem'}}>
                  <option value="">Tous prix</option>
                  <option value="free">Gratuit</option>
                  <option value="paid">Payant</option>
                </select>
                <select value={topK} onChange={e => setTopK(Number(e.target.value))}
                  style={{padding:'0.5rem 0.75rem',borderRadius:'0.5rem',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.875rem'}}>
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{padding:'1rem',background:'hsla(0,65%,52%,0.1)',border:'1px solid hsla(0,65%,52%,0.3)',borderRadius:'0.75rem',marginBottom:'1.5rem',color:'hsl(0,65%,52%)'}}>
            {error}
          </div>
        )}

        {/* Résultats */}
        {loading && (
          <div style={{textAlign:'center',padding:'4rem'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite',margin:'0 auto 1rem'}}/>
            <p style={{color:'var(--color-muted-foreground)'}}>Analyse de l'image et recherche de patrons similaires...</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <div style={{textAlign:'center',padding:'4rem',background:'var(--color-card)',borderRadius:'1rem',border:'1px solid var(--color-border)'}}>
            <Camera size={48} style={{marginBottom:'1rem',opacity:0.5}}/>
            <h3 style={{fontFamily:'var(--font-display)',marginBottom:'0.5rem'}}>Aucun résultat</h3>
            <p style={{color:'var(--color-muted-foreground)'}}>Essayez avec une autre image ou modifiez les filtres.</p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div style={{marginBottom:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem'}}>
                {results.length} patron{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </h2>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1.5rem'}}>
              {results.map(result => (
                <div
                  key={result.id}
                  onClick={() => navigate(`/patterns/${result.id}`)}
                  style={{
                    background: 'var(--color-card)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                  className="card-hover"
                >
                  {/* Image */}
                  <div style={{position:'relative',paddingBottom:'125%',background:'var(--color-muted)'}}>
                    {result.cover_image ? (
                      <img src={imgUrl(result.cover_image)} alt={result.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                    ) : (
                      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.5rem'}}>🧶</div>
                    )}
                    
                    {/* Score de similarité */}
                    <div style={{
                      position:'absolute',
                      top:'0.75rem',
                      left:'0.75rem',
                      padding:'0.3rem 0.7rem',
                      borderRadius:'999px',
                      background: getSimilarityColor(result.similarity_score),
                      color:'#fff',
                      fontSize:'0.75rem',
                      fontWeight:600,
                    }}>
                      {result.similarity_score}% match
                    </div>
                    
                    {/* Badge prix */}
                    <div style={{
                      position:'absolute',
                      top:'0.75rem',
                      right:'0.75rem',
                      padding:'0.3rem 0.7rem',
                      borderRadius:'999px',
                      background: result.is_free ? 'hsl(105,28%,50%)' : 'var(--color-primary)',
                      color:'#fff',
                      fontSize:'0.75rem',
                      fontWeight:600,
                    }}>
                      {result.is_free ? 'Gratuit' : `${result.price} DT`}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{padding:'1rem'}}>
                    <h3 style={{fontWeight:600,fontSize:'0.9375rem',margin:'0 0 0.25rem'}}>{result.title}</h3>
                    <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:'0 0 0.5rem'}}>
                      par {typeof result.author === 'object' ? result.author?.username : result.author}
                    </p>
                    <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.6875rem',padding:'0.125rem 0.5rem',borderRadius:'999px',background:'var(--color-surface)'}}>
                        {TYPE_LABELS[result.type] || result.type}
                      </span>
                      <span style={{fontSize:'0.6875rem',padding:'0.125rem 0.5rem',borderRadius:'999px',background:'var(--color-surface)'}}>
                        {LEVEL_LABELS[result.level] || result.level}
                      </span>
                      <span style={{fontSize:'0.6875rem',padding:'0.125rem 0.5rem',borderRadius:'999px',display:'flex',alignItems:'center',gap:'0.25rem'}}>
                        <Heart size={10}/> {result.favorites_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default VisualSearch;