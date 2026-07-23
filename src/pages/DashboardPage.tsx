import { useState, useEffect } from 'react';
import { Heart, Mail, Calendar, User, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useHashRoute } from '@/lib/router';
import type { Favorite, Inquiry, Tour, Property } from '@/types';
import { formatPrice, formatDate, formatDateTime, statusLabel } from '@/lib/format';
import { Reveal } from '@/components/Reveal';
import { ImageUploader } from '@/components/ImageUploader';

type Tab = 'favorites' | 'inquiries' | 'tours' | 'profile';

export function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { navigate } = useHashRoute();
  const [tab, setTab] = useState<Tab>('favorites');
  const [loading, setLoading] = useState(true);

  const [favorites, setFavorites] = useState<(Favorite & { property?: Property })[]>([]);
  const [inquiries, setInquiries] = useState<(Inquiry & { property?: Property })[]>([]);
  const [tours, setTours] = useState<(Tour & { property?: Property })[]>([]);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    (async () => {
      const [favRes, inqRes, tourRes] = await Promise.all([
        supabase.from('favorites').select('*, property:properties(*, property_images(*))').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('inquiries').select('*, property:properties(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tours').select('*, property:properties(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setFavorites((favRes.data as (Favorite & { property?: Property })[]) || []);
      setInquiries((inqRes.data as (Inquiry & { property?: Property })[]) || []);
      setTours((tourRes.data as (Tour & { property?: Property })[]) || []);

      setFullName(profile?.full_name ?? '');
      setPhone(profile?.phone ?? '');
      setAvatarUrl(profile?.avatar_url ?? '');
      setBio(profile?.bio ?? '');

      setLoading(false);
    })();
  }, [user, profile, navigate]);

  const removeFavorite = async (id: string, propertyId: string) => {
    if (!user) return;
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      toast('Removed from favorites');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, phone, avatar_url: avatarUrl, bio,
    }).eq('id', user?.id);
    if (error) {
      toast('Failed to update profile', 'error');
    } else {
      toast('Profile updated successfully');
      refreshProfile();
    }
    setSavingProfile(false);
  };

  if (!user) return null;

  const tabs: { key: Tab; label: string; icon: typeof Heart; count: number }[] = [
    { key: 'favorites', label: 'Favorites', icon: Heart, count: favorites.length },
    { key: 'inquiries', label: 'Inquiries', icon: Mail, count: inquiries.length },
    { key: 'tours', label: 'Tours', icon: Calendar, count: tours.length },
    { key: 'profile', label: 'Profile', icon: User, count: 0 },
  ];

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Welcome back, {profile?.full_name || 'User'}</p>
          <h1 className="section-title mb-4">My Dashboard</h1>
          <div className="gold-divider" />
        </Reveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide border-b border-ink-700 pb-px">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium tracking-wide transition-all relative whitespace-nowrap ${
                tab === t.key ? 'text-gold-400' : 'text-cream-200 hover:text-gold-300'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-ink-700 text-cream-200">{t.count}</span>
              )}
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Favorites tab */}
            {tab === 'favorites' && (
              <div>
                {favorites.length === 0 ? (
                  <EmptyState icon={Heart} title="No favorites yet" desc="Save properties by clicking the heart icon on any listing." action={() => navigate('/properties')} actionLabel="Browse Properties" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="card-luxury group cursor-pointer relative">
                        <div onClick={() => navigate(`/properties/${fav.property_id}`)}>
                          <div className="relative h-48 overflow-hidden">
                            {fav.property?.property_images?.[0]?.image_url ? (
                              <img src={fav.property.property_images[0].image_url} alt={fav.property?.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full bg-ink-800" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-transparent" />
                            <p className="absolute bottom-3 left-3 font-serif text-xl text-cream-50">{formatPrice(fav.property?.price ?? 0, fav.property?.status ?? 'for_sale')}</p>
                          </div>
                          <div className="p-4">
                            <h3 className="font-serif text-lg text-cream-50 mb-1 group-hover:text-gold-300 transition-colors">{fav.property?.title}</h3>
                            <p className="text-sm text-ink-500">{fav.property?.city}, {fav.property?.state}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFavorite(fav.id, fav.property_id)}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full glass-dark flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inquiries tab */}
            {tab === 'inquiries' && (
              <div>
                {inquiries.length === 0 ? (
                  <EmptyState icon={Mail} title="No inquiries yet" desc="Send a message from any property detail page to contact an agent." action={() => navigate('/properties')} actionLabel="Browse Properties" />
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => (
                      <div key={inq.id} className="glass-dark border border-ink-700 rounded-lg p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <button onClick={() => navigate(`/properties/${inq.property_id}`)} className="font-serif text-lg text-cream-50 hover:text-gold-300 transition-colors">
                              {inq.property?.title ?? 'Property'}
                            </button>
                            <p className="text-sm text-ink-500">{formatDate(inq.created_at)}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs rounded-sm ${
                            inq.status === 'new' ? 'bg-gold-400/20 text-gold-300' :
                            inq.status === 'replied' ? 'bg-blue-400/20 text-blue-300' :
                            inq.status === 'closed' ? 'bg-ink-700 text-ink-500' :
                            'bg-ink-700 text-cream-200'
                          }`}>{statusLabel(inq.status)}</span>
                        </div>
                        <p className="text-cream-200 text-sm leading-relaxed">{inq.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tours tab */}
            {tab === 'tours' && (
              <div>
                {tours.length === 0 ? (
                  <EmptyState icon={Calendar} title="No tours scheduled" desc="Book a tour from any property detail page to visit in person." action={() => navigate('/properties')} actionLabel="Browse Properties" />
                ) : (
                  <div className="space-y-4">
                    {tours.map((tour) => (
                      <div key={tour.id} className="glass-dark border border-ink-700 rounded-lg p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <button onClick={() => navigate(`/properties/${tour.property_id}`)} className="font-serif text-lg text-cream-50 hover:text-gold-300 transition-colors">
                              {tour.property?.title ?? 'Property'}
                            </button>
                            <p className="text-sm text-ink-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gold-400" />
                              {formatDateTime(tour.scheduled_at)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs rounded-sm ${
                            tour.status === 'pending' ? 'bg-gold-400/20 text-gold-300' :
                            tour.status === 'confirmed' ? 'bg-green-400/20 text-green-300' :
                            tour.status === 'cancelled' ? 'bg-red-400/20 text-red-300' :
                            'bg-ink-700 text-cream-200'
                          }`}>{statusLabel(tour.status)}</span>
                        </div>
                        {tour.notes && <p className="text-cream-200 text-sm">{tour.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile tab */}
            {tab === 'profile' && (
              <div className="max-w-2xl">
                <div className="glass-dark border border-ink-700 rounded-xl p-8">
                  <h2 className="font-serif text-2xl text-cream-50 mb-6">Edit Profile</h2>
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div>
                      <label className="label-luxury">Full Name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-luxury" required />
                    </div>
                    <div>
                      <label className="label-luxury">Email</label>
                      <input type="email" value={user.email ?? ''} disabled className="input-luxury opacity-50" />
                    </div>
                    <div>
                      <label className="label-luxury">Phone</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-luxury" placeholder="(555) 123-4567" />
                    </div>
                    <ImageUploader
                      value={avatarUrl}
                      onChange={setAvatarUrl}
                      aspect={1}
                      label="Profile Photo"
                      folder="avatars"
                    />
                    <div>
                      <label className="label-luxury">Bio</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-luxury resize-none" placeholder="Tell us about yourself..." />
                    </div>
                    <button type="submit" disabled={savingProfile} className="btn-gold">
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                      {!savingProfile && <Save className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action, actionLabel }: {
  icon: typeof Heart;
  title: string;
  desc: string;
  action: () => void;
  actionLabel: string;
}) {
  return (
    <div className="text-center py-20">
      <Icon className="w-16 h-16 text-ink-600 mx-auto mb-4" />
      <p className="text-cream-200 text-lg mb-2">{title}</p>
      <p className="text-ink-500 text-sm mb-6">{desc}</p>
      <button onClick={action} className="btn-gold">{actionLabel}</button>
    </div>
  );
}
