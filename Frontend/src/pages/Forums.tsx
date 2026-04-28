import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, Plus, Search, X, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api';

// Helpers
const authHeaders = () => {
  const tokens = localStorage.getItem('authTokens');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (tokens) {
    const { access } = JSON.parse(tokens);
    headers['Authorization'] = `Bearer ${access}`;
  }
  
  return headers;
};

// Avatar Component
const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const initial = name?.[0]?.toUpperCase() || '?';
  const bgColor = `hsl(${initial.charCodeAt(0) * 10 % 360}, 60%, 55%)`;
  
  return (
    <div style={{
      width: size, height: size, borderRadius: '999px',
      background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 600, fontSize: size * 0.4, flexShrink: 0
    }}>
      {initial}
    </div>
  );
};

// Thread Detail Modal
const ThreadDetailModal: React.FC<{ 
  threadId: number | null; 
  onClose: () => void;
  onUpdate: () => void;
}> = ({ threadId, onClose, onUpdate }) => {
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (threadId) {
      fetchThread();
      fetchReplies();
    }
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const res = await fetch(`${API}/forum-threads/${threadId}/`);
      const data = await res.json();
      setThread(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReplies = async () => {
    try {
      const res = await fetch(`${API}/forum-threads/${threadId}/replies/`);
      const data = await res.json();
      setReplies(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      await fetch(`${API}/forum-threads/${threadId}/like/`, {
        method: 'POST',
        headers: authHeaders(),
      });
      fetchThread();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async () => {
    if (!newReply.trim() || !user) return;
    setLoading(true);
    try {
      await fetch(`${API}/forum-threads/${threadId}/replies/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content: newReply }),
      });
      setNewReply('');
      fetchReplies();
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    if (!user) return;
    try {
      await fetch(`${API}/replies/${replyId}/like/`, {
        method: 'POST',
        headers: authHeaders(),
      });
      fetchReplies();
    } catch (e) {
      console.error(e);
    }
  };

  if (!thread) return null;

  const tagColors: Record<string, string> = {
    Techniques: 'hsl(18,52%,51%)',
    Patterns: 'hsl(35,70%,55%)',
    Yarn: 'hsl(105,28%,50%)',
    Help: 'hsl(200,45%,52%)',
    Showcase: 'hsl(280,38%,55%)',
    Events: 'hsl(48,80%,48%)',
  };
  const tc = tagColors[thread.category] || 'var(--color-primary)';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-foreground)' }}>{thread.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Avatar name={thread.author_username} size={36} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{thread.author_username}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>
                {new Date(thread.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <p style={{ color: 'var(--color-foreground)', lineHeight: 1.6, marginBottom: '1rem' }}>{thread.content}</p>
          <button
            onClick={handleLike}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: thread.is_liked ? 'var(--color-primary)' : 'var(--color-muted-foreground)' }}
          >
            <Heart size={16} fill={thread.is_liked ? 'var(--color-primary)' : 'none'} />
            {thread.likes_count || 0}
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '1rem' }}>
            Réponses ({replies.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {replies.map((reply: any) => (
              <div key={reply.id} style={{ padding: '0.75rem', background: 'var(--color-surface)', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Avatar name={reply.author_username} size={28} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-foreground)' }}>{reply.author_username}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-muted-foreground)' }}>
                      {new Date(reply.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLikeReply(reply.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: reply.is_liked ? 'var(--color-primary)' : 'var(--color-muted-foreground)', fontSize: '0.75rem' }}
                  >
                    <Heart size={12} fill={reply.is_liked ? 'var(--color-primary)' : 'none'} />
                    {reply.likes_count || 0}
                  </button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-foreground)', marginLeft: '2.25rem' }}>{reply.content}</p>
              </div>
            ))}
          </div>
        </div>

        {user && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <Avatar name={user.username} size={32} />
            <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
              <input
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                placeholder="Écrire une réponse..."
                style={{ flex: 1, padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none' }}
              />
              <button
                onClick={handleReply}
                disabled={loading || !newReply.trim()}
                style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// New Thread Modal
const NewThreadModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Techniques');
  const [loading, setLoading] = useState(false);
  const categories = ['Techniques', 'Patterns', 'Yarn', 'Help', 'Showcase', 'Events'];

  const handleSubmit = async () => {
    if (!title || !content) return;
    setLoading(true);
    try {
      await fetch(`${API}/forum-threads/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, content, category }),
      });
      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--color-card)', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-foreground)' }}>Nouvelle discussion</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre"
          style={{ width: '100%', padding: '0.625rem', marginBottom: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box' }}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ width: '100%', padding: '0.625rem', marginBottom: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Contenu de votre message..."
          rows={5}
          style={{ width: '100%', padding: '0.625rem', marginBottom: '1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '0.5rem 1.5rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Publier
          </button>
        </div>
      </div>
    </div>
  );
};

// Post Card Component
const PostCard: React.FC<{ post: any; onLike: (id: number) => void; onClick: () => void }> = ({ post, onLike, onClick }) => {
  const tagColors: Record<string, string> = {
    Techniques: 'hsl(18,52%,51%)',
    Patterns: 'hsl(35,70%,55%)',
    Yarn: 'hsl(105,28%,50%)',
    Help: 'hsl(200,45%,52%)',
    Showcase: 'hsl(280,38%,55%)',
    Events: 'hsl(48,80%,48%)',
  };
  const tagColor = tagColors[post.category] || 'var(--color-primary)';

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        background: 'var(--color-card)',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-warm)',
        cursor: 'pointer',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Avatar name={post.author_username} size={40} />
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-foreground)', margin: 0 }}>
              {post.author_username}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-muted-foreground)', margin: 0 }}>
              Member · {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          background: tagColor + '1a', color: tagColor,
          padding: '0.25rem 0.75rem', borderRadius: '999px',
        }}>
          {post.category}
        </span>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        {post.title}
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--color-muted-foreground)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        {post.content?.slice(0, 150)}...
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          onClick={e => { e.stopPropagation(); onLike(post.id); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            fontFamily: 'var(--font-body)', fontSize: '0.8rem',
            color: post.is_liked ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            transition: 'color 0.2s',
          }}
        >
          <Heart size={14} style={{ fill: post.is_liked ? 'var(--color-primary)' : 'none' }} />
          {post.likes_count || 0}
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-muted-foreground)' }}>
          <MessageCircle size={14} /> {post.replies_count || 0} replies
        </span>
      </div>
    </div>
  );
};

// Main Forums Component
const Forums: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTag, setActiveTag] = useState('All');
  const [search, setSearch] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tags = ['All', 'Techniques', 'Patterns', 'Yarn', 'Help', 'Showcase', 'Events'];

  const fetchForums = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTag !== 'All') params.append('category', activeTag);
      if (search) params.append('search', search);
      const res = await fetch(`${API}/forum-threads/?${params}`);
      const data = await res.json();
      setForumPosts(data.results || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTag, search]);

  useEffect(() => {
    fetchForums();
  }, [fetchForums]);

  const handleLike = async (threadId: number) => {
    if (!user) {
      navigate('/');
      return;
    }
    try {
      await fetch(`${API}/forum-threads/${threadId}/like/`, {
        method: 'POST',
        headers: authHeaders(),
      });
      fetchForums();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />
      
      {showNewThread && (
        <NewThreadModal
          onClose={() => setShowNewThread(false)}
          onCreated={fetchForums}
        />
      )}
      
      {selectedThreadId && (
        <ThreadDetailModal
          threadId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
          onUpdate={fetchForums}
        />
      )}

      <div style={{ paddingTop: '7rem', paddingBottom: '6rem', paddingLeft: 'clamp(1.5rem,5vw,4rem)', paddingRight: 'clamp(1.5rem,5vw,4rem)' }}>
        <div className="container-craft">
          <button
            onClick={() => navigate('/home')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2rem', padding: 0 }}
          >
            <ArrowLeft size={16} /> Back to Home
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Community
              </p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 600, color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
                Forums & Groups
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-muted-foreground)', marginTop: '0.5rem', fontSize: '1rem' }}>
                {forumPosts.length} discussions · Join the conversation
              </p>
            </div>
            <button 
              onClick={() => user ? setShowNewThread(true) : navigate('/')}
              className="btn-craft" 
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--color-primary)', color: '#fff',
                padding: '0.75rem 1.5rem', borderRadius: '999px',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600,
                border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-warm)',
            }}>
              <Plus size={16} /> New Post
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search discussions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', maxWidth: '28rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '999px',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                color: 'var(--color-foreground)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginBottom: '2.5rem' }}>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className="btn-craft"
                style={{
                  padding: '0.5rem 1.125rem', borderRadius: '999px',
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                  background: activeTag === tag ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: activeTag === tag ? '#fff' : 'var(--color-muted-foreground)',
                  boxShadow: activeTag === tag ? 'var(--shadow-warm)' : 'none',
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted-foreground)' }}>Chargement...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {forumPosts.map((post: any) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLike={handleLike}
                  onClick={() => setSelectedThreadId(post.id)}
                />
              ))}
            </div>
          )}

          {!loading && forumPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted-foreground)' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-foreground)' }}>No posts found</p>
              <p style={{ fontFamily: 'var(--font-body)' }}>Try a different search or tag.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forums;