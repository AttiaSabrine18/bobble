// src/pages/SkillBadges.tsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'knitting' | 'crochet' | 'community' | 'special';
  earned: boolean;
  earned_date?: string;
  progress?: number;
  required_count?: number;
  current_count?: number;
}

const SkillBadges: React.FC = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState({
    total_badges: 0,
    earned_badges: 0,
    knitting_level: 1,
    crochet_level: 1,
  });

  // Simulation des badges (à remplacer par un vrai appel API)
  const mockBadges: Badge[] = [
    { id: '1', name: 'Premier rang', description: 'Terminez votre premier projet', icon: '🧶', category: 'knitting', earned: true, earned_date: '2024-01-15' },
    { id: '2', name: 'Maître des mailles', description: 'Terminez 10 projets', icon: '🏆', category: 'knitting', earned: false, progress: 70, required_count: 10, current_count: 7 },
    { id: '3', name: 'Crocheteur débutant', description: 'Maîtrisez la maille en l\'air', icon: '🪡', category: 'crochet', earned: true, earned_date: '2024-02-01' },
    { id: '4', name: 'Créateur de patrons', description: 'Publiez votre premier patron', icon: '📝', category: 'special', earned: true, earned_date: '2024-03-10' },
    { id: '5', name: 'Esprit communautaire', description: 'Participez à 5 discussions', icon: '💬', category: 'community', earned: false, progress: 60, required_count: 5, current_count: 3 },
    { id: '6', name: 'Expert en torsades', description: 'Réalisez un projet avec torsades', icon: '🌀', category: 'knitting', earned: false, progress: 0 },
    { id: '7', name: 'Amigurumi master', description: 'Créez 3 amigurumis', icon: '🧸', category: 'crochet', earned: false, progress: 33, required_count: 3, current_count: 1 },
    { id: '8', name: 'Collectionneur de laines', description: 'Ajoutez 20 pelotes à votre stash', icon: '🧵', category: 'special', earned: false, progress: 45, required_count: 20, current_count: 9 },
    { id: '9', name: 'Premier Craft-Along', description: 'Participez à un Craft-Along', icon: '👥', category: 'community', earned: true, earned_date: '2024-04-01' },
    { id: '10', name: 'Designer pro', description: 'Vendez 10 patrons', icon: '💎', category: 'special', earned: false, progress: 30, required_count: 10, current_count: 3 },
  ];

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setLoading(true);
    try {
      // Remplacer par un vrai appel API quand disponible
      // const data = await api.get('/badges/');
      setBadges(mockBadges);
      
      const earned = mockBadges.filter(b => b.earned).length;
      setStats({
        total_badges: mockBadges.length,
        earned_badges: earned,
        knitting_level: Math.floor(mockBadges.filter(b => b.category === 'knitting' && b.earned).length / 3) + 1,
        crochet_level: Math.floor(mockBadges.filter(b => b.category === 'crochet' && b.earned).length / 3) + 1,
      });
    } catch (error) {
      console.error('Erreur chargement badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(b => b.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Tous', icon: '🏅' },
    { id: 'knitting', name: 'Tricot', icon: '🧶' },
    { id: 'crochet', name: 'Crochet', icon: '🪡' },
    { id: 'community', name: 'Communauté', icon: '👥' },
    { id: 'special', name: 'Spécial', icon: '✨' },
  ];

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      knitting: 'from-blue-400 to-blue-600',
      crochet: 'from-green-400 to-green-600',
      community: 'from-purple-400 to-purple-600',
      special: 'from-amber-400 to-amber-600',
    };
    return colors[category] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Badges de Compétences</h1>
          <p className="text-gray-600">Débloquez des badges en progressant dans votre pratique</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-gray-900">{stats.earned_badges}/{stats.total_badges}</div>
            <div className="text-gray-600">Badges obtenus</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-2">🧶</div>
            <div className="text-2xl font-bold text-gray-900">Niveau {stats.knitting_level}</div>
            <div className="text-gray-600">Tricot</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-2">🪡</div>
            <div className="text-2xl font-bold text-gray-900">Niveau {stats.crochet_level}</div>
            <div className="text-gray-600">Crochet</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((stats.earned_badges / stats.total_badges) * 100)}%
            </div>
            <div className="text-gray-600">Complétion</div>
          </div>
        </div>

        {/* Catégories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grille de badges */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBadges.map(badge => (
              <div
                key={badge.id}
                className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${
                  badge.earned 
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white' 
                    : 'border-gray-200 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCategoryColor(badge.category)} flex items-center justify-center text-2xl shadow-md`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{badge.category}</p>
                  </div>
                  {badge.earned && (
                    <span className="text-amber-500 text-xl">⭐</span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                
                {badge.earned ? (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <span>✅</span>
                    <span>Obtenu le {new Date(badge.earned_date!).toLocaleDateString()}</span>
                  </div>
                ) : badge.progress !== undefined ? (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span>{badge.current_count}/{badge.required_count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full transition-all"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span>🔒</span>
                    <span>À débloquer</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Section progression */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Votre progression</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">🧶 Tricot</span>
                <span className="text-gray-600">
                  {badges.filter(b => b.category === 'knitting' && b.earned).length} / {badges.filter(b => b.category === 'knitting').length} badges
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                  style={{ 
                    width: `${(badges.filter(b => b.category === 'knitting' && b.earned).length / badges.filter(b => b.category === 'knitting').length) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">🪡 Crochet</span>
                <span className="text-gray-600">
                  {badges.filter(b => b.category === 'crochet' && b.earned).length} / {badges.filter(b => b.category === 'crochet').length} badges
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                  style={{ 
                    width: `${(badges.filter(b => b.category === 'crochet' && b.earned).length / badges.filter(b => b.category === 'crochet').length) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">👥 Communauté</span>
                <span className="text-gray-600">
                  {badges.filter(b => b.category === 'community' && b.earned).length} / {badges.filter(b => b.category === 'community').length} badges
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                  style={{ 
                    width: `${(badges.filter(b => b.category === 'community' && b.earned).length / badges.filter(b => b.category === 'community').length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillBadges;