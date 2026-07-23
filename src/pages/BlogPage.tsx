import { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Plus, Pencil, Trash2, Newspaper } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/types';
import { useHashRoute } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Reveal } from '@/components/Reveal';
import { Modal } from '@/components/Modal';
import { ImageUploader } from '@/components/ImageUploader';
import { formatDate, slugify } from '@/lib/format';

export function BlogPage() {
  const { navigate } = useHashRoute();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isStaff = profile?.role === 'agent' || profile?.role === 'admin';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPosts = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const openForm = (post: BlogPost | null) => {
    setEditingPost(post);
    setTitle(post?.title ?? '');
    setExcerpt(post?.excerpt ?? '');
    setContent(post?.content ?? '');
    setCoverUrl(post?.cover_url ?? '');
    setPublished(post?.published ?? true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPost) {
        const { error } = await supabase.from('blog_posts').update({
          title, excerpt, content, cover_url: coverUrl, published,
        }).eq('id', editingPost.id);
        if (error) throw error;
        toast('Blog post updated');
      } else {
        const { error } = await supabase.from('blog_posts').insert({
          title, slug: slugify(title), excerpt, content, cover_url: coverUrl, published,
          author_id: profile?.id ?? null,
        });
        if (error) throw error;
        toast('Blog post created');
      }
      setShowForm(false);
      fetchPosts();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save post', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast('Failed to delete post', 'error');
    } else {
      toast('Post deleted');
      fetchPosts();
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Insights & Articles</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="section-title mb-4">LuxEstate Blog</h1>
              <div className="gold-divider" />
            </div>
            {isStaff && (
              <button onClick={() => openForm(null)} className="btn-gold">
                <Plus className="w-4 h-4" />
                Add Post
              </button>
            )}
          </div>
        </Reveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-luxury h-80 animate-pulse">
                <div className="h-48 bg-ink-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-ink-800 rounded w-3/4" />
                  <div className="h-4 bg-ink-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-ink-600 mx-auto mb-4" />
            <p className="text-cream-200 text-lg">No blog posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={(i % 3) * 100}>
                <article className="card-luxury group cursor-pointer h-full flex flex-col">
                  <div className="relative h-56 overflow-hidden" onClick={() => navigate(`/blog/${post.slug}`)}>
                    {post.cover_url && (
                      <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    )}
                    {!post.published && (
                      <span className="absolute top-4 left-4 px-3 py-1 text-xs bg-ink-700 text-cream-100 rounded-sm">Draft</span>
                    )}
                    {isStaff && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openForm(post); }} className="w-9 h-9 rounded-full glass-dark flex items-center justify-center text-gold-400 hover:bg-gold-400 hover:text-ink-950 transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} className="w-9 h-9 rounded-full glass-dark flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col" onClick={() => navigate(`/blog/${post.slug}`)}>
                    <div className="flex items-center gap-2 text-xs text-ink-500 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-gold-400" />
                      {formatDate(post.created_at)}
                    </div>
                    <h3 className="font-serif text-xl font-medium text-cream-50 mb-3 group-hover:text-gold-300 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-ink-500 leading-relaxed mb-4 flex-1">{post.excerpt}</p>
                    <button className="text-sm text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1 mt-auto">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editingPost ? 'Edit Post' : 'Add New Post'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-luxury">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-luxury" required />
            </div>
            <div>
              <label className="label-luxury">Excerpt</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="input-luxury resize-none" />
            </div>
            <div>
              <label className="label-luxury">Content (HTML allowed)</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="input-luxury resize-none font-mono text-sm" />
            </div>
            <div>
              <ImageUploader
                value={coverUrl}
                onChange={setCoverUrl}
                aspect={16 / 9}
                label="Cover Image"
                folder="blog"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-5 h-5 accent-gold-400" />
              <span className="text-sm text-cream-200">Published</span>
            </label>
            <div className="flex gap-3 pt-4 border-t border-ink-700">
              <button type="submit" disabled={saving} className="btn-gold flex-1">
                {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Add Post'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
