// src/pages/MarketplaceCreate.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, X, Package, Ruler, Scissors } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { marketplaceService } from '../services/marketplace';
import Swal from 'sweetalert2';

const MarketplaceCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<'yarn' | 'needle' | 'accessory'>('yarn');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<any>({
    // Commun
    price: '',
    quantity: '1',
    condition: 'new',
    description: '',
    shipping_available: true,
    shipping_cost: '0.00',
    pickup_location: '',
    // Yarn
    name: '',
    brand: '',
    colorway: '',
    weight: '',
    grams: '',
    meterage: '',
    dye_lot: '',
    // Needle
    type: '',
    size_mm: '',
    material: '',
    length_cm: '',
    // Accessory
    title: '',
    category: 'other',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      alert('Maximum 3 images');
      return;
    }
    setImages([...images, ...files]);
    setImagePreviews([...imagePreviews, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataObj.append(key, String(value));
      });
      images.forEach((img, i) => {
        formDataObj.append(`image${i + 1}`, img);
      });
      
      await marketplaceService.create(activeType, formDataObj);
      
      Swal.fire({
        title: 'Annonce publiée !',
        text: 'Votre annonce est maintenant en ligne',
        icon: 'success',
      });
      
      navigate('/marketplace');
    } catch (error) {
      console.error('Erreur création annonce:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de publier l\'annonce',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
  };

  const types = [
    { id: 'yarn', label: 'Laine', icon: Package },
    { id: 'needle', label: 'Aiguille / Crochet', icon: Ruler },
    { id: 'accessory', label: 'Accessoire', icon: Scissors },
  ] as const;

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <Navbar />
      
      <div style={{maxWidth:'48rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        <button onClick={() => navigate(-1)} style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',background:'none',border:'none',cursor:'pointer',color:'var(--color-muted-foreground)'}}>
          <ChevronLeft size={16}/> Retour
        </button>

        <h1 style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:600,marginBottom:'2rem'}}>
          Publier une annonce
        </h1>

        {/* Type selector */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'2rem'}}>
          {types.map(t => (
            <button key={t.id} onClick={() => setActiveType(t.id)}
              style={{flex:1,padding:'1rem',borderRadius:'0.75rem',border:activeType===t.id?'2px solid var(--color-primary)':'1.5px solid var(--color-border)',background:activeType===t.id?'hsla(18,52%,51%,0.1)':'var(--color-surface)',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',cursor:'pointer'}}>
              <t.icon size={24} style={{color:activeType===t.id?'var(--color-primary)':'var(--color-muted-foreground)'}}/>
              <span style={{fontWeight:500}}>{t.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {/* Images */}
          <div>
            <label style={{display:'block',marginBottom:'0.5rem',fontWeight:500}}>Photos (max 3)</label>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
              {imagePreviews.map((preview, i) => (
                <div key={i} style={{position:'relative',width:'100px',height:'100px',borderRadius:'0.5rem',overflow:'hidden'}}>
                  <img src={preview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  <button type="button" onClick={() => removeImage(i)} style={{position:'absolute',top:'0.25rem',right:'0.25rem',background:'rgba(0,0,0,0.5)',border:'none',borderRadius:'999px',width:'1.5rem',height:'1.5rem',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',cursor:'pointer'}}>
                    <X size={12}/>
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label style={{width:'100px',height:'100px',borderRadius:'0.5rem',border:'2px dashed var(--color-border)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.25rem',cursor:'pointer'}}>
                  <Upload size={20} style={{color:'var(--color-muted-foreground)'}}/>
                  <span style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Ajouter</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}}/>
                </label>
              )}
            </div>
          </div>

          {/* Prix et Quantité (commun) */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <input type="number" step="0.01" placeholder="Prix (dt) *" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={inputStyle}/>
            <input type="number" placeholder="Quantité" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} style={inputStyle}/>
          </div>

          {/* Yarn specific */}
          {activeType === 'yarn' && (
            <>
              <input type="text" placeholder="Nom de la laine *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <input type="text" placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={inputStyle}/>
                <input type="text" placeholder="Couleur" value={formData.colorway} onChange={e => setFormData({...formData, colorway: e.target.value})} style={inputStyle}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem'}}>
                <select value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={inputStyle}>
                  <option value="">Poids</option>
                  <option value="lace">Lace</option><option value="fingering">Fingering</option><option value="sport">Sport</option>
                  <option value="dk">DK</option><option value="worsted">Worsted</option><option value="aran">Aran</option>
                  <option value="bulky">Bulky</option><option value="super_bulky">Super Bulky</option>
                </select>
                <input type="number" placeholder="Grammes" value={formData.grams} onChange={e => setFormData({...formData, grams: e.target.value})} style={inputStyle}/>
                <input type="number" placeholder="Métrage (m)" value={formData.meterage} onChange={e => setFormData({...formData, meterage: e.target.value})} style={inputStyle}/>
              </div>
              <input type="text" placeholder="N° de bain (optionnel)" value={formData.dye_lot} onChange={e => setFormData({...formData, dye_lot: e.target.value})} style={inputStyle}/>
            </>
          )}

          {/* Needle specific */}
          {activeType === 'needle' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required style={inputStyle}>
                  <option value="">Type *</option>
                  <option value="aiguille_droite">Aiguille droite</option>
                  <option value="aiguille_circulaire">Aiguille circulaire</option>
                  <option value="dpn">DPN</option>
                  <option value="crochet">Crochet</option>
                  <option value="tunisien">Crochet Tunisien</option>
                </select>
                <input type="number" step="0.01" placeholder="Taille (mm) *" value={formData.size_mm} onChange={e => setFormData({...formData, size_mm: e.target.value})} required style={inputStyle}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <select value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} style={inputStyle}>
                  <option value="">Matériau</option>
                  <option value="bambou">Bambou</option><option value="metal">Métal</option><option value="plastique">Plastique</option>
                  <option value="bois">Bois</option><option value="acrylique">Acrylique</option>
                </select>
                <input type="text" placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={inputStyle}/>
              </div>
              <input type="number" placeholder="Longueur (cm)" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: e.target.value})} style={inputStyle}/>
            </>
          )}

          {/* Accessory specific */}
          {activeType === 'accessory' && (
            <>
              <input type="text" placeholder="Titre *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={inputStyle}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required style={inputStyle}>
                  <option value="">Catégorie *</option>
                  <option value="markers">Marqueurs de mailles</option><option value="scissors">Ciseaux</option>
                  <option value="tape">Mètre ruban</option><option value="bag">Sac à projet</option>
                  <option value="blocking">Matériel de blocage</option><option value="buttons">Boutons</option>
                  <option value="other">Autre</option>
                </select>
                <input type="text" placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={inputStyle}/>
              </div>
            </>
          )}

          {/* Commun */}
          <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} style={inputStyle}>
            <option value="new">Neuf</option>
            <option value="like_new">Comme neuf</option>
            <option value="used">Utilisé</option>
          </select>
          <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} style={inputStyle}/>
          
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer'}}>
              <input type="checkbox" checked={formData.shipping_available} onChange={e => setFormData({...formData, shipping_available: e.target.checked})}/>
              Envoi disponible
            </label>
            {formData.shipping_available && (
              <input type="number" step="0.01" placeholder="Frais de port (DT)" value={formData.shipping_cost} onChange={e => setFormData({...formData, shipping_cost: e.target.value})} style={{...inputStyle, width:'150px'}}/>
            )}
          </div>
          <input type="text" placeholder="Lieu de retrait (optionnel)" value={formData.pickup_location} onChange={e => setFormData({...formData, pickup_location: e.target.value})} style={inputStyle}/>

          <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}>
            <button type="button" onClick={() => navigate(-1)} style={{flex:1,padding:'0.875rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent',fontWeight:500}}>
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-craft" style={{flex:1,padding:'0.875rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600,opacity:loading?0.7:1}}>
              {loading ? 'Publication...' : 'Publier l\'annonce'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default MarketplaceCreate;