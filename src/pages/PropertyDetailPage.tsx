import { useState, useEffect } from 'react';
import { Bed, Bath, Maximize, MapPin, Check, Calendar, Phone, Mail, Heart, ArrowLeft, Pencil, Trash2, Calculator, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, Profile } from '@/types';
import { useHashRoute } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, statusLabel, typeLabel } from '@/lib/format';
import { PropertyFormModal } from '@/components/PropertyFormModal';
import { Reveal } from '@/components/Reveal';

export function PropertyDetailPage({ id }: { id: string }) {
  const { navigate } = useHashRoute();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isStaff = profile?.role === 'agent' || profile?.role === 'admin';

  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Inquiry form
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tour form
  const [tourDate, setTourDate] = useState('');
  const [tourName, setTourName] = useState('');
  const [tourEmail, setTourEmail] = useState('');
  const [tourPhone, setTourPhone] = useState('');
  const [tourNotes, setTourNotes] = useState('');
  const [bookingTour, setBookingTour] = useState(false);

  // Mortgage calculator
  const [downPayment, setDownPayment] = useState('20');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('*, property_images(*)')
        .eq('id', id)
        .maybeSingle();
      setProperty(data as Property | null);

      if (data?.agent_id) {
        const { data: agentData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.agent_id)
          .maybeSingle();
        setAgent(agentData as Profile | null);
      }

      if (user && data) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', id)
          .maybeSingle();
        setIsFavorited(!!fav);

        setInquiryName(profile?.full_name ?? '');
        setInquiryEmail(user.email ?? '');
        setInquiryPhone(profile?.phone ?? '');
        setTourName(profile?.full_name ?? '');
        setTourEmail(user.email ?? '');
        setTourPhone(profile?.phone ?? '');
      }

      setLoading(false);
    })();
  }, [id, user, profile]);

  const handleFavorite = async () => {
    if (!user) {
      toast('Please sign in to save favorites', 'info');
      navigate('/login');
      return;
    }
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', id);
      setIsFavorited(false);
      toast('Removed from favorites');
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, property_id: id });
      setIsFavorited(true);
      toast('Added to favorites!');
    }
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please sign in to send an inquiry', 'info');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('inquiries').insert({
      property_id: id,
      user_id: user.id,
      agent_id: property?.agent_id ?? null,
      name: inquiryName,
      email: inquiryEmail,
      phone: inquiryPhone,
      message: inquiryMessage,
    });
    if (error) {
      toast('Failed to send inquiry', 'error');
    } else {
      toast('Inquiry sent! The agent will contact you soon.');
      setInquiryMessage('');
    }
    setSubmitting(false);
  };

  const handleTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please sign in to book a tour', 'info');
      navigate('/login');
      return;
    }
    setBookingTour(true);
    const { error } = await supabase.from('tours').insert({
      property_id: id,
      user_id: user.id,
      agent_id: property?.agent_id ?? null,
      name: tourName,
      email: tourEmail,
      phone: tourPhone,
      scheduled_at: tourDate,
      notes: tourNotes,
    });
    if (error) {
      toast('Failed to book tour', 'error');
    } else {
      toast('Tour booked! The agent will confirm shortly.');
      setTourDate('');
      setTourNotes('');
    }
    setBookingTour(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      toast('Failed to delete property', 'error');
    } else {
      toast('Property deleted');
      navigate('/properties');
    }
  };

  // Mortgage calculation
  const principal = property ? property.price * (1 - parseFloat(downPayment) / 100) : 0;
  const monthlyRate = parseFloat(interestRate) / 100 / 12;
  const numPayments = parseFloat(loanTerm) * 12;
  const monthlyPayment = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : principal / numPayments;

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 pt-24 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-ink-950 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream-100 text-xl mb-4">Property not found</p>
          <button onClick={() => navigate('/properties')} className="btn-gold">
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const images = property.property_images?.length
    ? property.property_images.sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className="min-h-screen bg-ink-950 pt-20">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => navigate('/properties')} className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Properties
        </button>
      </div>

      {/* Image gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[400px] md:h-[500px]">
          {/* Main image */}
          <div className="lg:col-span-3 relative rounded-lg overflow-hidden group">
            {images[activeImage] ? (
              <img src={images[activeImage].image_url} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-ink-800 flex items-center justify-center">
                <p className="text-ink-500">No images available</p>
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-sm ${
                property.status === 'sold' ? 'bg-red-500/90 text-white' :
                property.status === 'for_rent' ? 'bg-blue-500/90 text-white' :
                'bg-gold-400 text-ink-950'
              }`}>{statusLabel(property.status)}</span>
              <span className="px-3 py-1 text-xs font-medium rounded-sm glass text-cream-100">{typeLabel(property.type)}</span>
            </div>
            {isStaff && (
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setShowForm(true)} className="w-10 h-10 rounded-full glass-dark flex items-center justify-center text-gold-400 hover:bg-gold-400 hover:text-ink-950 transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} className="w-10 h-10 rounded-full glass-dark flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {/* Thumbnails */}
          <div className="hidden lg:flex flex-col gap-4">
            {images.slice(0, 3).map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(i)}
                className={`flex-1 rounded-lg overflow-hidden border-2 transition-all ${
                  activeImage === i ? 'border-gold-400' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        {/* Mobile thumbnails */}
        <div className="flex gap-2 mt-3 lg:hidden overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveImage(i)}
              className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                activeImage === i ? 'border-gold-400' : 'border-transparent opacity-60'
              }`}
            >
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & price */}
            <Reveal>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl font-light text-cream-50 mb-2">{property.title}</h1>
                  <div className="flex items-center gap-1 text-ink-500">
                    <MapPin className="w-4 h-4 text-gold-400" />
                    <span>{property.address}, {property.city}, {property.state} {property.zip}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl text-gradient-gold font-semibold">
                    {formatPrice(property.price, property.status)}
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Stats */}
            <Reveal delay={100}>
              <div className="grid grid-cols-3 gap-4 glass-dark border border-ink-700 rounded-lg p-6">
                <div className="text-center">
                  <Bed className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                  <p className="font-serif text-2xl text-cream-50">{property.beds}</p>
                  <p className="text-xs text-ink-500">Bedrooms</p>
                </div>
                <div className="text-center border-x border-ink-700">
                  <Bath className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                  <p className="font-serif text-2xl text-cream-50">{property.baths}</p>
                  <p className="text-xs text-ink-500">Bathrooms</p>
                </div>
                <div className="text-center">
                  <Maximize className="w-6 h-6 text-gold-400 mx-auto mb-2" />
                  <p className="font-serif text-2xl text-cream-50">{property.area.toLocaleString()}</p>
                  <p className="text-xs text-ink-500">Sq Ft</p>
                </div>
              </div>
            </Reveal>

            {/* Description */}
            <Reveal delay={200}>
              <div>
                <h3 className="font-serif text-2xl text-cream-50 mb-4">About This Property</h3>
                <p className="text-cream-200 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            </Reveal>

            {/* Features */}
            {property.features.length > 0 && (
              <Reveal delay={300}>
                <div>
                  <h3 className="font-serif text-2xl text-cream-50 mb-4">Features & Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-cream-200">
                        <div className="w-6 h-6 rounded-full bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-gold-400" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Map placeholder */}
            {property.lat && property.lng && (
              <Reveal delay={400}>
                <div>
                  <h3 className="font-serif text-2xl text-cream-50 mb-4">Location</h3>
                  <div className="rounded-lg overflow-hidden border border-ink-700 h-64 bg-ink-800 relative">
                    <iframe
                      title="Property location"
                      width="100%"
                      height="100%"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.lng - 0.01}%2C${property.lat - 0.01}%2C${property.lng + 0.01}%2C${property.lat + 0.01}&layer=mapnik&marker=${property.lat}%2C${property.lng}`}
                      className="grayscale opacity-80"
                    />
                  </div>
                </div>
              </Reveal>
            )}

            {/* Mortgage calculator */}
            <Reveal delay={500}>
              <div className="glass-dark border border-ink-700 rounded-lg p-6">
                <h3 className="font-serif text-2xl text-cream-50 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-gold-400" />
                  Mortgage Calculator
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="label-luxury">Down Payment (%)</label>
                    <input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="input-luxury" />
                  </div>
                  <div>
                    <label className="label-luxury">Interest Rate (%)</label>
                    <input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="input-luxury" />
                  </div>
                  <div>
                    <label className="label-luxury">Loan Term (years)</label>
                    <input type="number" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)} className="input-luxury" />
                  </div>
                </div>
                <div className="text-center bg-ink-800 rounded-lg p-6">
                  <p className="text-sm text-ink-500 mb-1">Estimated Monthly Payment</p>
                  <p className="font-serif text-4xl text-gradient-gold font-semibold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(monthlyPayment || 0)}
                    <span className="text-lg text-ink-500">/mo</span>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-6">
            {/* Favorite button — only for regular clients, not staff */}
            {!isStaff && (
              <button
                onClick={handleFavorite}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-sm font-medium tracking-wide transition-all duration-300 ${
                  isFavorited
                    ? 'bg-gold-400/10 border border-gold-400/30 text-gold-400'
                    : 'border border-ink-600 text-cream-100 hover:border-gold-400 hover:text-gold-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-gold-400' : ''}`} />
                {isFavorited ? 'Saved to Favorites' : 'Save to Favorites'}
              </button>
            )}

            {/* Agent card */}
            {agent && (
              <div className="glass-dark border border-ink-700 rounded-lg p-6">
                <h3 className="text-sm font-medium text-ink-500 tracking-wide uppercase mb-4">Listed By</h3>
                <div className="flex items-center gap-4 mb-4">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt={agent.full_name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-400 text-xl font-semibold">
                      {agent.full_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <div>
                    <p className="font-serif text-lg text-cream-50">{agent.full_name}</p>
                    <p className="text-sm text-gold-400 capitalize">{agent.role}</p>
                  </div>
                </div>
                {agent.bio && <p className="text-sm text-ink-500 mb-4">{agent.bio}</p>}
                <div className="space-y-2">
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-sm text-cream-200">
                      <Phone className="w-4 h-4 text-gold-400" />
                      {agent.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-cream-200">
                    <Mail className="w-4 h-4 text-gold-400" />
                    {agent.email}
                  </div>
                </div>
              </div>
            )}

            {/* Inquiry form */}
            <div className="glass-dark border border-ink-700 rounded-lg p-6">
              <h3 className="font-serif text-xl text-cream-50 mb-4">Send an Inquiry</h3>
              <form onSubmit={handleInquiry} className="space-y-3">
                <input type="text" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} placeholder="Your name" className="input-luxury text-sm" required />
                <input type="email" value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} placeholder="Your email" className="input-luxury text-sm" required />
                <input type="tel" value={inquiryPhone} onChange={(e) => setInquiryPhone(e.target.value)} placeholder="Phone (optional)" className="input-luxury text-sm" />
                <textarea value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} placeholder="I'm interested in this property..." rows={3} className="input-luxury text-sm resize-none" required />
                <button type="submit" disabled={submitting} className="btn-gold w-full text-sm">
                  {submitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            </div>

            {/* Tour booking */}
            <div className="glass-dark border border-ink-700 rounded-lg p-6">
              <h3 className="font-serif text-xl text-cream-50 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold-400" />
                Book a Tour
              </h3>
              <form onSubmit={handleTour} className="space-y-3">
                <input type="text" value={tourName} onChange={(e) => setTourName(e.target.value)} placeholder="Your name" className="input-luxury text-sm" required />
                <input type="email" value={tourEmail} onChange={(e) => setTourEmail(e.target.value)} placeholder="Your email" className="input-luxury text-sm" required />
                <input type="tel" value={tourPhone} onChange={(e) => setTourPhone(e.target.value)} placeholder="Phone (optional)" className="input-luxury text-sm" />
                <input type="datetime-local" value={tourDate} onChange={(e) => setTourDate(e.target.value)} className="input-luxury text-sm" required />
                <textarea value={tourNotes} onChange={(e) => setTourNotes(e.target.value)} placeholder="Any notes (optional)" rows={2} className="input-luxury text-sm resize-none" />
                <button type="submit" disabled={bookingTour} className="btn-outline w-full text-sm">
                  {bookingTour ? 'Booking...' : 'Schedule Tour'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showForm && (
        <PropertyFormModal
          property={property}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
