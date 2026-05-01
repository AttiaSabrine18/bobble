// src/pages/Patterncreate.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, X, Plus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  try { return JSON.parse(localStorage.getItem('authTokens') || '{}')?.access ?? null; }
  catch { return null; }
}

const LEVELS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

const TYPES = [
  { value: 'tricot', label: 'Tricot' },
  { value: 'crochet', label: 'Crochet' },
  { value: 'tissage', label: 'Tissage' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
  border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
  fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-foreground)',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

const PatternCreate: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('debutant');
  const [type, setType] = useState('tricot');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('0.00');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Le titre est obligatoire.';
    if (!pdfFile) errs.pdf = 'Le fichier PDF est obligatoire.';
    if (!isFree && (parseFloat(price) <= 0 || isNaN(parseFloat(price)))) errs.price = 'Entrez un prix valide.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError('');

    try {
      const token = getToken();
      if (!token) { navigate('/'); return; }

      // ✅ Envoyer toutes les données en une seule requête avec FormData
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('level', level);
      fd.append('type', type);
      fd.append('is_free', String(isFree));
      fd.append('price', isFree ? '0.00' : parseFloat(price).toFixed(2));
      fd.append('unlimited_stock', 'true');
      fd.append('stock_quantity', '0');
      fd.append('pdf', pdfFile!);  // ← PDF obligatoire

      if (coverImage) {
        fd.append('cover_image', coverImage);
      }

      const res = await fetch(`${API}/api/patterns/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const firstErr = Object.values(errData)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] as string : 'Erreur lors de la création du patron.');
        return;
      }

      const created = await res.json();
      const patternId = created.id;

      // Tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          await fetch(`${API}/api/tags/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: tagName }),
          }).catch(() => {});
        }
      }

      navigate(`/patterns/${patternId}`);

    } catch {
      setError('Une erreur est survenue. Vérifiez votre connexion et réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const Label: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-foreground)', marginBottom: '0.375rem' }}>
      {text}{required && <span style={{ color: 'hsl(0,65%,52%)', marginLeft: '0.25rem' }}>*</span>}
    </label>
  );

  const FieldError: React.FC<{ name: string }> = ({ name }) =>
    fieldErrors[name] ? <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'hsl(0,65%,52%)', marginTop: '0.25rem' }}>{fieldErrors[name]}</p> : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '7rem 1.5rem 5rem' }}>

        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted-foreground)', padding: 0 }}>
          <ChevronLeft size={16} /> Retour
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.375rem' }}>Créer</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em' }}>
            Publier un patron
          </h1>
        </div>

        {error && (
          <div style={{ background: 'hsl(0,65%,97%)', border: '1.5px solid hsl(0,65%,85%)', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'hsl(0,60%,40%)', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Cover image */}
          <div>
            <Label text="Image de couverture" />
            <div onClick={() => coverRef.current?.click()} style={{ cursor: 'pointer', borderRadius: '1rem', border: `2px dashed ${coverPreview ? 'var(--color-primary)' : 'var(--color-border)'}`, overflow: 'hidden', background: 'var(--color-surface)', transition: 'border-color 0.15s', position: 'relative' }}>
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Aperçu" style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={e => { e.stopPropagation(); setCoverImage(null); setCoverPreview(null); }} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '2rem', height: '2rem', borderRadius: '999px', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><X size={14} /></button>
                </>
              ) : (
                <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--color-muted-foreground)' }}>
                  <Upload size={28} />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', margin: 0 }}>Cliquer pour ajouter une photo</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', margin: 0, opacity: 0.7 }}>JPG, PNG, WebP — max 5 Mo</p>
                </div>
              )}
            </div>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleCoverChange} />
          </div>

          {/* Title */}
          <div>
            <Label text="Titre" required />
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Bonnet torsadé hiver" style={{ ...inputStyle, borderColor: fieldErrors.title ? 'hsl(0,65%,52%)' : 'var(--color-border)' }} />
            <FieldError name="title" />
          </div>

          {/* Description */}
          <div>
            <Label text="Description" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez votre patron : matériaux, dimensions, points utilisés…" rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Level + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><Label text="Niveau" required /><select value={level} onChange={e => setLevel(e.target.value)} style={{ ...inputStyle }}>{LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}</select></div>
            <div><Label text="Type" required /><select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle }}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          </div>

          {/* Price */}
          <div>
            <Label text="Prix" />
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setIsFree(true)} style={{ padding: '0.625rem 1.25rem', borderRadius: '999px', border: '1.5px solid', borderColor: isFree ? 'var(--color-primary)' : 'var(--color-border)', background: isFree ? 'var(--color-primary)' : 'var(--color-surface)', color: isFree ? '#fff' : 'var(--color-foreground)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>Gratuit</button>
              <button type="button" onClick={() => setIsFree(false)} style={{ padding: '0.625rem 1.25rem', borderRadius: '999px', border: '1.5px solid', borderColor: !isFree ? 'var(--color-primary)' : 'var(--color-border)', background: !isFree ? 'var(--color-primary)' : 'var(--color-surface)', color: !isFree ? '#fff' : 'var(--color-foreground)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>Payant</button>
              {!isFree && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)' }}>DT</span>
                  <input type="number" min="0.50" step="0.50" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inputStyle, width: '140px', borderColor: fieldErrors.price ? 'hsl(0,65%,52%)' : 'var(--color-border)' }} />
                  <FieldError name="price" />
                </div>
              )}
            </div>
          </div>

          {/* PDF upload - OBLIGATOIRE */}
          <div>
            <Label text="Fichier PDF du patron" required />
            <div onClick={() => pdfRef.current?.click()} style={{ cursor: 'pointer', borderRadius: '0.875rem', border: `2px dashed ${pdfFile ? 'var(--color-primary)' : fieldErrors.pdf ? 'hsl(0,65%,52%)' : 'var(--color-border)'}`, padding: '1.25rem', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'border-color 0.15s' }}>
              <Upload size={20} style={{ color: 'var(--color-muted-foreground)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                {pdfFile ? (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500, margin: 0 }}>{pdfFile.name}</p>
                ) : (
                  <>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-foreground)', margin: 0 }}>
                      Ajouter le PDF de votre patron <span style={{ color: 'hsl(0,65%,52%)' }}>*</span>
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: '0.125rem 0 0' }}>Fichier PDF — max 20 Mo</p>
                  </>
                )}
              </div>
              {pdfFile && (
                <button type="button" onClick={e => { e.stopPropagation(); setPdfFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)', display: 'flex' }}><X size={16} /></button>
              )}
            </div>
            <input ref={pdfRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => setPdfFile(e.target.files?.[0] || null)} />
            <FieldError name="pdf" />
          </div>

          {/* Tags */}
          <div>
            <Label text="Étiquettes" />
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {tags.map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'var(--color-primary)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}>
                  {t}
                  <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', padding: 0 }}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Ex: châle, débutant, mohair" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={addTag} style={{ padding: '0.75rem 1.125rem', borderRadius: '0.75rem', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}><Plus size={15} /> Ajouter</button>
            </div>
          </div>

          {/* Submit */}
          <div style={{ paddingTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="submit" disabled={submitting} style={{ padding: '0.9375rem 2.5rem', borderRadius: '999px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, opacity: submitting ? 0.7 : 1, transition: 'opacity 0.15s', boxShadow: 'var(--shadow-warm)' }}>
              {submitting ? 'Publication en cours…' : 'Publier le patron'}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: '0.9375rem 1.75rem', borderRadius: '999px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-foreground)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 500 }}>Annuler</button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default PatternCreate;