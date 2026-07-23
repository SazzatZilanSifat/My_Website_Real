import { useState, useEffect } from 'react';
import { Search, MapPin, Home, DollarSign, Bed, Bath, Maximize, ArrowRight, Building2, TrendingUp, Users, Award, Star, Quote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, Testimonial } from '@/types';
import { PropertyCard } from '@/components/PropertyCard';
import { Reveal } from '@/components/Reveal';
import { useHashRoute } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { formatPriceShort, typeLabel } from '@/lib/format';

export function HomePage() {
  const { navigate } = useHashRoute();
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [latest, setLatest] = useState<Property[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [{ data: featuredData }, { data: latestData }, { data: testimonialData }] = await Promise.all([
        supabase.from('properties').select('*, property_images(*)').eq('featured', true).order('created_at', { ascending: false }).limit(6),
        supabase.from('properties').select('*, property_images(*)').order('created_at', { ascending: false }).limit(3),
        supabase.from('testimonials').select('*').eq('published', true).limit(3),
      ]);
      setFeatured((featuredData as Property[]) || []);
      setLatest((latestData as Property[]) || []);
      setTestimonials((testimonialData as Testimonial[]) || []);
      setLoading(false);
    })();

    if (user) {
      supabase.from('favorites').select('property_id').eq('user_id', user.id).then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((d) => d.property_id)));
      });
    }
  }, [user]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Luxury home"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/50 to-ink-950" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="animate-fade-down">
            <p className="text-gold-400 text-sm font-medium tracking-[0.3em] uppercase mb-4">
              Welcome to LuxEstate
            </p>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light text-cream-50 leading-tight mb-6 animate-fade-up text-balance">
            Find Your <em className="text-gradient-gold font-medium">Dream</em> Home
          </h1>
          <p className="text-lg text-cream-200 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            Discover exceptional properties curated for those who appreciate the extraordinary. From waterfront estates to urban penthouses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '400ms' }}>
            <button onClick={() => navigate('/properties')} className="btn-gold">
              Browse Properties
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/about')} className="btn-outline">
              Learn More
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-cream-100/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-gold-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-ink-900 border-y border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Home, value: '500+', label: 'Properties Listed' },
              { icon: Users, value: '250+', label: 'Happy Clients' },
              { icon: Award, value: '15+', label: 'Years Experience' },
              { icon: TrendingUp, value: '$2B+', label: 'In Sales' },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100} className="text-center">
                <div className="inline-flex w-14 h-14 rounded-full bg-gold-400/10 items-center justify-center mb-4">
                  <stat.icon className="w-6 h-6 text-gold-400" />
                </div>
                <p className="font-serif text-3xl md:text-4xl font-semibold text-cream-50 mb-1">{stat.value}</p>
                <p className="text-sm text-ink-500 tracking-wide">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Reveal>
              <p className="section-subtitle">Handpicked for you</p>
              <h2 className="section-title mb-4">Featured Properties</h2>
              <div className="gold-divider mx-auto" />
            </Reveal>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-luxury h-96 animate-pulse">
                  <div className="h-64 bg-ink-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-ink-800 rounded w-3/4" />
                    <div className="h-4 bg-ink-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map((property, i) => (
                <Reveal key={property.id} delay={i * 100}>
                  <PropertyCard
                    property={property}
                    favoriteIds={favoriteIds}
                    onFavoriteToggle={toggleFavorite}
                  />
                </Reveal>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button onClick={() => navigate('/properties')} className="btn-outline">
              View All Properties
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="py-20 bg-ink-900 border-y border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal animation="slide-in-left">
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Luxury interior"
                  className="rounded-lg w-full h-[500px] object-cover"
                />
                <div className="absolute -bottom-6 -right-6 glass-dark border border-gold-400/30 rounded-lg p-6 hidden md:block">
                  <p className="font-serif text-4xl text-gradient-gold font-semibold">15+</p>
                  <p className="text-sm text-cream-200">Years of Excellence</p>
                </div>
              </div>
            </Reveal>
            <Reveal animation="slide-in-right">
              <p className="section-subtitle">Who We Are</p>
              <h2 className="section-title mb-6">
                Redefining Luxury Real Estate
              </h2>
              <p className="text-cream-200 leading-relaxed mb-6">
                For over 15 years, LuxEstate has been at the forefront of luxury real estate, connecting discerning clients with extraordinary properties. Our team of experienced agents brings unparalleled market knowledge and a commitment to excellence.
              </p>
              <p className="text-ink-500 leading-relaxed mb-8">
                From waterfront estates to urban penthouses, we curate the finest properties and provide a seamless experience from first viewing to final signature.
              </p>
              <button onClick={() => navigate('/about')} className="btn-gold">
                Discover Our Story
                <ArrowRight className="w-4 h-4" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Latest Properties */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Reveal>
              <p className="section-subtitle">Just Listed</p>
              <h2 className="section-title mb-4">New on the Market</h2>
              <div className="gold-divider mx-auto" />
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latest.map((property, i) => (
              <Reveal key={property.id} delay={i * 100}>
                <PropertyCard
                  property={property}
                  favoriteIds={favoriteIds}
                  onFavoriteToggle={toggleFavorite}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-ink-900 border-y border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Reveal>
              <p className="section-subtitle">Client Stories</p>
              <h2 className="section-title mb-4">What Our Clients Say</h2>
              <div className="gold-divider mx-auto" />
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <Reveal key={testimonial.id} delay={i * 100}>
                <div className="card-luxury p-8 h-full flex flex-col">
                  <Quote className="w-10 h-10 text-gold-400/30 mb-4" />
                  <p className="text-cream-200 leading-relaxed mb-6 flex-1 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4 mt-auto pt-6 border-t border-ink-700">
                    {testimonial.avatar_url ? (
                      <img src={testimonial.avatar_url} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-400 font-semibold">
                        {testimonial.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-cream-100 font-medium">{testimonial.name}</p>
                      <p className="text-xs text-ink-500">{testimonial.role}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(testimonial.rating)].map((_, j) => (
                          <Star key={j} className="w-3 h-3 fill-gold-400 text-gold-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="https://images.pexels.com/photos/210258/pexels-photo-210258.jpeg?auto=compress&cs=tinysrgb&w=1920"
                alt="Luxury home"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 to-ink-950/60 flex items-center">
                <div className="px-8 md:px-16 max-w-2xl">
                  <h2 className="font-serif text-3xl md:text-5xl font-light text-cream-50 mb-4">
                    Ready to Find Your <em className="text-gradient-gold">Perfect</em> Home?
                  </h2>
                  <p className="text-cream-200 mb-8">
                    Let our expert agents guide you through every step of your real estate journey.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/contact')} className="btn-gold">
                      Contact Us
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate('/properties')} className="btn-outline">
                      Browse Properties
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
