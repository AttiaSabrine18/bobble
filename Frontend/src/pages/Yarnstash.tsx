// src/pages/Yarnstash.tsx - Version corrigée
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit3, Filter, X, Package, CheckCircle, Scale, Ruler } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { yarnService, YarnStashData } from '../services/yarn';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface YarnStash extends YarnStashData {
  id: number;
  user_username: string;
  total_grams: number | null;
  total_meterage: number | null;
  weight_display: string;
  status_display: string;
  created_at: string;
  updated_at: string;
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  return path.startsWith('http') ? path : `${API}${path}`;
}

const weightLabels: Record<string, string> = {
  lace: 'Lace', fingering: 'Fingering', sport: 'Sport', dk: 'DK',
  worsted: 'Worsted', aran: 'Aran', bulky: 'Bulky', super_bulky: 'Super Bulky',
};

const statusColors: Record<string, string> = {
  disponible: 'hsl(105,28%,50%)',
  utilise: 'var(--color-muted-foreground)',
  reserve: 'hsl(35,70%,50%)',
  epuise: 'hsl(0,65%,52%)',
};

const YarnStash: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [yarns, setYarns] = useState<YarnStash[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<YarnStash | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [weightFilter, setWeightFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', brand: '', colorway: '', color_code: '', weight: '',
    grams: '', meterage: '', quantity: '1', dye_lot: '',
    purchase_date: '', purchase_price: '', store: '',
    status: 'disponible', notes: '',
  });

  useEffect(() => {
    loadYarns();
    loadStats();
  }, [statusFilter, weightFilter]);

  const loadYarns = async () => {
    setLoading(true);
    try {
      const data = await yarnService.getAll();
      let filtered: YarnStash[] = Array.isArray(data) ? data : data.results || [];
      
      if (statusFilter) {
        filtered = filtered.filter((y: YarnStash) => y.status === statusFilter);
      }
      if (weightFilter) {
        filtered = filtered.filter((y: YarnStash) => y.weight === weightFilter);
      }
      
      setYarns(filtered);
    } catch (error) {
      console.error('Erreur chargement stash:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await yarnService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', brand: '', colorway: '', color_code: '', weight: '',
      grams: '', meterage: '', quantity: '1', dye_lot: '',
      purchase_date: '', purchase_price: '', store: '',
      status: 'disponible', notes: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleAddYarn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) formDataObj.append(key, value);
    });
    if (selectedImage) formDataObj.append('image', selectedImage);
    
    try {
      const created = await yarnService.create(formDataObj);
      setYarns([created, ...yarns]);
      setShowAdd(false);
      resetForm();
      loadStats();
      
      Swal.fire({
        title: 'Ajouté !',
        text: `${created.name} a été ajouté à votre stash`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Erreur ajout:', error);
      Swal.fire({ title: 'Erreur', text: 'Impossible d\'ajouter cette laine', icon: 'error' });
    }
  };

  const handleUpdateYarn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) formDataObj.append(key, value);
    });
    if (selectedImage) formDataObj.append('image', selectedImage);
    
    try {
      const updated = await yarnService.update(showEdit.id, formDataObj);
      setYarns(yarns.map(y => y.id === showEdit.id ? updated : y));
      setShowEdit(null);
      resetForm();
      loadStats();
      
      Swal.fire({
        title: 'Mis à jour !',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const handleDeleteYarn = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Supprimer ?',
      text: `Retirer "${name}" de votre stash ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'hsl(0,65%,52%)',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    });
    
    if (result.isConfirmed) {
      try {
        await yarnService.delete(id);
        setYarns(yarns.filter(y => y.id !== id));
        loadStats();
        Swal.fire({ title: 'Supprimé', icon: 'success', toast: true, timer: 2000, showConfirmButton: false });
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const handleEditClick = (yarn: YarnStash) => {
    setShowEdit(yarn);
    setFormData({
      name: yarn.name || '',
      brand: yarn.brand || '',
      colorway: yarn.colorway || '',
      color_code: yarn.color_code || '',
      weight: yarn.weight || '',
      grams: yarn.grams?.toString() || '',
      meterage: yarn.meterage?.toString() || '',
      quantity: yarn.quantity?.toString() || '1',
      dye_lot: yarn.dye_lot || '',
      purchase_date: yarn.purchase_date || '',
      purchase_price: yarn.purchase_price?.toString() || '',
      store: yarn.store || '',
      status: yarn.status || 'disponible',
      notes: yarn.notes || '',
    });
    // ✅ Correction : yarn.image est string | File | undefined
    const imagePath = typeof yarn.image === 'string' ? yarn.image : null;
    setImagePreview(imagePath ? imgUrl(imagePath) : null);
    setSelectedImage(null);
  };

  const filteredYarns = yarns.filter(y => {
    const q = searchQuery.toLowerCase();
    return y.name.toLowerCase().includes(q) || 
           (y.brand && y.brand.toLowerCase().includes(q)) ||
           (y.colorway && y.colorway.toLowerCase().includes(q));
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
    fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--color-background)'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Navbar />
      
      <div style={{maxWidth:'80rem',margin:'0 auto',padding:'7rem 1.5rem 5rem'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'2rem'}}>
          <div>
            <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(2rem,4vw,2.75rem)',fontWeight:600,color:'var(--color-foreground)',letterSpacing:'-0.02em',marginBottom:'0.25rem'}}>
              Mon Stash de Laine
            </h1>
            <p style={{fontFamily:'var(--font-body)',fontSize:'1rem',color:'var(--color-muted-foreground)'}}>
              Gérez votre collection de laines
            </p>
          </div>
          <button onClick={() => { resetForm(); setShowAdd(true); }} className="btn-craft"
            style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.875rem 1.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontFamily:'var(--font-body)',fontWeight:600}}>
            <Plus size={16}/> Ajouter une laine
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
            <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
              <Package size={24} style={{color:'var(--color-primary)',marginBottom:'0.5rem'}}/>
              <div style={{fontSize:'1.5rem',fontWeight:700}}>{stats.total_yarns}</div>
              <div style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Total laines</div>
            </div>
            <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
              <CheckCircle size={24} style={{color:'hsl(105,28%,50%)',marginBottom:'0.5rem'}}/>
              <div style={{fontSize:'1.5rem',fontWeight:700}}>{stats.available_yarns}</div>
              <div style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Disponibles</div>
            </div>
            <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
              <Scale size={24} style={{color:'hsl(35,70%,50%)',marginBottom:'0.5rem'}}/>
              <div style={{fontSize:'1.5rem',fontWeight:700}}>{stats.total_grams || 0}g</div>
              <div style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Grammes</div>
            </div>
            <div style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}}>
              <Ruler size={24} style={{color:'hsl(210,40%,50%)',marginBottom:'0.5rem'}}/>
              <div style={{fontSize:'1.5rem',fontWeight:700}}>{stats.total_meters || 0}m</div>
              <div style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)'}}>Mètres</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:1}}>
            <Search size={16} style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:'var(--color-muted-foreground)'}}/>
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{width:'100%',padding:'0.75rem 1rem 0.75rem 2.5rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)',fontSize:'0.875rem',outline:'none'}}/>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{padding:'0.75rem 1.25rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:showFilters?'var(--color-primary)':'var(--color-surface)',color:showFilters?'#fff':'var(--color-foreground)',display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer'}}>
            <Filter size={14}/> Filtres
          </button>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1.5rem'}}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{padding:'0.5rem 1rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)'}}>
              <option value="">Tous statuts</option>
              <option value="disponible">Disponible</option>
              <option value="utilise">Utilisé</option>
              <option value="reserve">Réservé</option>
              <option value="epuise">Épuisé</option>
            </select>
            <select value={weightFilter} onChange={e => setWeightFilter(e.target.value)} style={{padding:'0.5rem 1rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'var(--color-surface)'}}>
              <option value="">Tous poids</option>
              {Object.entries(weightLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}>
            <div style={{width:'3rem',height:'3rem',borderRadius:'999px',border:'3px solid var(--color-border)',borderTopColor:'var(--color-primary)',animation:'spin 0.8s linear infinite'}}/>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1.25rem'}}>
            {filteredYarns.map(yarn => {
              const yarnImage = typeof yarn.image === 'string' ? yarn.image : null;
              const statusColor = statusColors[yarn.status || 'disponible'] || statusColors.disponible;
              
              return (
                <div key={yarn.id} style={{background:'var(--color-card)',borderRadius:'1rem',padding:'1.25rem',border:'1px solid var(--color-border)'}} className="card-hover">
                  <div style={{display:'flex',gap:'0.75rem',marginBottom:'0.75rem'}}>
                    <div style={{width:'4rem',height:'4rem',borderRadius:'0.75rem',overflow:'hidden',background:'var(--color-muted)',flexShrink:0}}>
                      {yarnImage ? <img src={imgUrl(yarnImage)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.75rem'}}>🧶</div>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <h3 style={{fontWeight:600,fontSize:'0.9375rem',margin:0}}>{yarn.name}</h3>
                        <span style={{fontSize:'0.625rem',padding:'0.125rem 0.5rem',borderRadius:'999px',background:statusColor + '22',color:statusColor}}>{yarn.status_display}</span>
                      </div>
                      {yarn.brand && <p style={{fontSize:'0.75rem',color:'var(--color-muted-foreground)',margin:'0.125rem 0'}}>{yarn.brand}</p>}
                      {yarn.colorway && <p style={{fontSize:'0.6875rem',color:'var(--color-muted-foreground)'}}>{yarn.colorway}</p>}
                    </div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'0.75rem',borderTop:'1px solid var(--color-border)'}}>
                    <div style={{display:'flex',gap:'0.75rem',fontSize:'0.75rem'}}>
                      {yarn.weight_display && <span>{yarn.weight_display}</span>}
                      {yarn.total_grams && <span>{yarn.total_grams}g</span>}
                      {yarn.total_meterage && <span>{yarn.total_meterage}m</span>}
                      {(yarn.quantity ?? 0) > 1 && <span>x{yarn.quantity}</span>}
                    </div>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      <button onClick={() => handleEditClick(yarn)} style={{background:'none',border:'none',color:'var(--color-muted-foreground)',cursor:'pointer'}}><Edit3 size={14}/></button>
                      <button onClick={() => handleDeleteYarn(yarn.id, yarn.name)} style={{background:'none',border:'none',color:'hsl(0,65%,52%)',cursor:'pointer'}}><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {(showAdd || showEdit) && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'1rem'}} onClick={() => { setShowAdd(false); setShowEdit(null); }}>
            <div style={{background:'var(--color-card)',borderRadius:'1.5rem',padding:'2rem',maxWidth:'40rem',width:'100%',maxHeight:'85vh',overflow:'auto',border:'1px solid var(--color-border)'}} onClick={e => e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.5rem'}}>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.5rem',margin:0}}>{showEdit ? 'Modifier' : 'Ajouter'} une laine</h2>
                <button onClick={() => { setShowAdd(false); setShowEdit(null); }} style={{background:'none',border:'none',cursor:'pointer'}}><X size={20}/></button>
              </div>
              
              <form onSubmit={showEdit ? handleUpdateYarn : handleAddYarn} style={{display:'grid',gap:'1rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <input type="text" placeholder="Nom *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle}/>
                  <input type="text" placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} style={inputStyle}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <input type="text" placeholder="Couleur" value={formData.colorway} onChange={e => setFormData({...formData, colorway: e.target.value})} style={inputStyle}/>
                  <input type="text" placeholder="Code couleur" value={formData.color_code} onChange={e => setFormData({...formData, color_code: e.target.value})} style={inputStyle}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
                  <select value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={inputStyle}>
                    <option value="">Poids</option>
                    {Object.entries(weightLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input type="number" placeholder="Grammes" value={formData.grams} onChange={e => setFormData({...formData, grams: e.target.value})} style={inputStyle}/>
                  <input type="number" placeholder="Métrage" value={formData.meterage} onChange={e => setFormData({...formData, meterage: e.target.value})} style={inputStyle}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <input type="number" placeholder="Quantité" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} style={inputStyle}/>
                  <input type="text" placeholder="N° de bain" value={formData.dye_lot} onChange={e => setFormData({...formData, dye_lot: e.target.value})} style={inputStyle}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <input type="date" placeholder="Date d'achat" value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} style={inputStyle}/>
                  <input type="number" step="0.01" placeholder="Prix" value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: e.target.value})} style={inputStyle}/>
                </div>
                <input type="text" placeholder="Magasin" value={formData.store} onChange={e => setFormData({...formData, store: e.target.value})} style={inputStyle}/>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={inputStyle}>
                  <option value="disponible">Disponible</option>
                  <option value="utilise">Utilisé</option>
                  <option value="reserve">Réservé</option>
                  <option value="epuise">Épuisé</option>
                </select>
                <textarea placeholder="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} style={inputStyle}/>
                
                <div>
                  <label style={{display:'block',marginBottom:'0.5rem',fontSize:'0.875rem'}}>Photo</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {imagePreview && <img src={imagePreview} alt="Preview" style={{width:'100px',height:'100px',objectFit:'cover',borderRadius:'0.5rem',marginTop:'0.5rem'}}/>}
                </div>
                
                <div style={{display:'flex',gap:'0.75rem',marginTop:'1rem'}}>
                  <button type="button" onClick={() => { setShowAdd(false); setShowEdit(null); }} style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'1.5px solid var(--color-border)',background:'transparent'}}>Annuler</button>
                  <button type="submit" className="btn-craft" style={{flex:1,padding:'0.75rem',borderRadius:'999px',border:'none',background:'var(--color-primary)',color:'#fff',fontWeight:600}}>{showEdit ? 'Mettre à jour' : 'Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default YarnStash;