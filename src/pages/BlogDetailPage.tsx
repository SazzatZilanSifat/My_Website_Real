import { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/types';
import { useHashRoute } from '@/lib/router';
import { formatDate } from '@/lib/format';
import { Reveal } from '@/components/Reveal';

export function BlogDetailPage({ slug }: { slug: string }) {
  const { navigate } = useHashRoute();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      setPost(data as BlogPost | null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 pt-24 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-ink-950 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream-100 text-xl mb-4">Article not found</p>
          <button onClick={() => navigate('/blog')} className="btn-gold">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 pt-20">
      {/* Hero image */}
      {post.cover_url && (
        <div className="relative h-[50vh] overflow-hidden">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
        <button onClick={() => navigate('/blog')} className="btn-ghost text-sm mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </button>

        <Reveal>
          <div className="flex items-center gap-3 text-sm text-ink-500 mb-4">
            <Calendar className="w-4 h-4 text-gold-400" />
            {formatDate(post.created_at)}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-cream-50 mb-6 text-balance">
            {post.title}
          </h1>
          <p className="text-lg text-cream-200 leading-relaxed mb-8">{post.excerpt}</p>
          <div className="gold-divider mb-8" />

          <div
            className="prose prose-invert max-w-none text-cream-200 leading-relaxed space-y-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-cream-50 [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-gold-300 [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_strong]:text-cream-50"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 pt-8 border-t border-ink-700 flex items-center justify-between">
            <button onClick={() => navigate('/blog')} className="btn-outline text-sm">
              <ArrowLeft className="w-4 h-4" />
              All Articles
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: post.title, url: window.location.href });
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                }
              }}
              className="btn-ghost text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
