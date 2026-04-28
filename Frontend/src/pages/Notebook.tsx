// src/pages/Notebook.tsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  related_pattern?: { id: number; title: string };
  related_project?: { id: number; title: string };
}

const Notebook: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    tags: '',
  });

  // Notes mockées (à remplacer par API)
  const mockNotes: Note[] = [
    {
      id: '1',
      title: 'Astuce pour les côtes',
      content: 'Pour des côtes plus élastiques, utiliser des aiguilles une taille en dessous.',
      tags: ['tricot', 'technique'],
      created_at: '2024-03-01T10:00:00Z',
      updated_at: '2024-03-01T10:00:00Z',
    },
    {
      id: '2',
      title: 'Pull Autumn - Modifications',
      content: 'Ajouter 5cm de longueur au corps. Changer la couleur des manches pour du vert forêt.',
      tags: ['projet', 'modification'],
      created_at: '2024-02-15T14:30:00Z',
      updated_at: '2024-03-10T09:15:00Z',
      related_project: { id: 1, title: 'Pull Autumn' },
    },
    {
      id: '3',
      title: 'Fournisseurs de laine',
      content: 'Liste des sites avec bons prix :\n- Laine et Tricot\n- Bergère de France\n- Phildar',
      tags: ['ressources', 'shopping'],
      created_at: '2024-01-20T08:00:00Z',
      updated_at: '2024-01-20T08:00:00Z',
    },
    {
      id: '4',
      title: 'Idée cadeau - Écharpe',
      content: 'Faire une écharpe en point de riz avec la laine alpaga bleue. Pour Noël.',
      tags: ['idée', 'cadeau'],
      created_at: '2024-03-12T16:45:00Z',
      updated_at: '2024-03-12T16:45:00Z',
    },
  ];

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    // Simuler un délai API
    setTimeout(() => {
      setNotes(mockNotes);
      setLoading(false);
    }, 500);
  };

  const handleSaveNote = () => {
    const tagsArray = noteForm.tags.split(',').map(t => t.trim()).filter(t => t);
    
    const newNote: Note = {
      id: editingNote?.id || Date.now().toString(),
      title: noteForm.title,
      content: noteForm.content,
      tags: tagsArray,
      created_at: editingNote?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(editingNote?.related_pattern && { related_pattern: editingNote.related_pattern }),
      ...(editingNote?.related_project && { related_project: editingNote.related_project }),
    };

    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? newNote : n));
    } else {
      setNotes([newNote, ...notes]);
    }

    setShowEditor(false);
    setEditingNote(null);
    setNoteForm({ title: '', content: '', tags: '' });
  };

  const handleDeleteNote = (id: string) => {
    if (!window.confirm('Supprimer cette note ?')) return;
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
    });
    setShowEditor(true);
  };

  // Correction : utiliser Array.from() au lieu du spread operator
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Carnet de Notes</h1>
            <p className="text-gray-600">Vos idées, astuces et réflexions</p>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setNoteForm({ title: '', content: '', tags: '' });
              setShowEditor(true);
            }}
            className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2"
          >
            <span>📝</span>
            Nouvelle note
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher dans vos notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  !selectedTag 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Tous
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedTag === tag 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grille de notes */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-4 whitespace-pre-line">
                  {note.content}
                </p>
                
                {note.related_project && (
                  <div className="mb-2 text-sm">
                    <span className="text-rose-600">🧶 Projet: </span>
                    <span className="text-gray-700">{note.related_project.title}</span>
                  </div>
                )}
                
                {note.related_pattern && (
                  <div className="mb-2 text-sm">
                    <span className="text-rose-600">📋 Patron: </span>
                    <span className="text-gray-700">{note.related_pattern.title}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-gray-400">
                  Modifié le {formatDate(note.updated_at)}
                </div>
              </div>
            ))}
            
            {filteredNotes.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Aucune note</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || selectedTag ? 'Aucun résultat trouvé' : 'Créez votre première note !'}
                </p>
                {!searchQuery && !selectedTag && (
                  <button
                    onClick={() => {
                      setEditingNote(null);
                      setNoteForm({ title: '', content: '', tags: '' });
                      setShowEditor(true);
                    }}
                    className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    + Nouvelle note
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Éditeur */}
        {showEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingNote ? 'Modifier la note' : 'Nouvelle note'}
              </h2>
              
              <input
                type="text"
                placeholder="Titre"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-rose-500"
                required
              />
              
              <textarea
                placeholder="Contenu de votre note..."
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-rose-500"
                rows={10}
                required
              />
              
              <input
                type="text"
                placeholder="Tags (séparés par des virgules)"
                value={noteForm.tags}
                onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-rose-500"
              />
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingNote(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteForm.title || !noteForm.content}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {editingNote ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notebook;