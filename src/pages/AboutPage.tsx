import { Building2, Award, Users, TrendingUp, Target, Eye, Heart } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useHashRoute } from '@/lib/router';

export function AboutPage() {
  const { navigate } = useHashRoute();

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Our Story</p>
          <h1 className="font-serif text-5xl md:text-6xl font-light text-cream-50 mb-6 text-balance">
            Redefining Luxury Real Estate
          </h1>
          <div className="gold-divider mb-8" />
          <p className="text-lg text-cream-200 max-w-3xl leading-relaxed">
            For over 15 years, LuxEstate has been at the forefront of luxury real estate, connecting discerning clients with extraordinary properties. We believe that finding the perfect home is not just about square footage and price points — it is about discovering a place that reflects who you are.
          </p>
        </Reveal>
      </section>

      {/* Image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <Reveal>
          <div className="rounded-2xl overflow-hidden h-[400px]">
            <img
              src="https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1920"
              alt="Luxury interior"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Reveal>
            <p className="section-subtitle">What Drives Us</p>
            <h2 className="section-title mb-4">Our Core Values</h2>
            <div className="gold-divider mx-auto" />
          </Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Target, title: 'Precision', desc: 'We match the right property to the right client, every time. Our curated approach means we only show you homes that truly fit.' },
            { icon: Eye, title: 'Excellence', desc: 'From the first viewing to the final signature, we hold every detail to the highest standard of quality and service.' },
            { icon: Heart, title: 'Relationships', desc: 'We build lasting connections with our clients. Many of our buyers return for their second, third, and fourth homes.' },
          ].map((value, i) => (
            <Reveal key={value.title} delay={i * 100}>
              <div className="card-luxury p-8 h-full">
                <div className="inline-flex w-14 h-14 rounded-full bg-gold-400/10 items-center justify-center mb-6">
                  <value.icon className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="font-serif text-2xl text-cream-50 mb-3">{value.title}</h3>
                <p className="text-cream-200 leading-relaxed">{value.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-ink-900 border-y border-ink-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Building2, value: '500+', label: 'Properties Sold' },
              { icon: Users, value: '250+', label: 'Happy Clients' },
              { icon: Award, value: '15+', label: 'Years Experience' },
              { icon: TrendingUp, value: '$2B+', label: 'In Total Sales' },
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

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-cream-50 mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-cream-200 mb-8 max-w-2xl mx-auto">
              Whether you are buying, selling, or simply exploring, our team is here to guide you every step of the way.
            </p>
            <button onClick={() => navigate('/contact')} className="btn-gold">
              Get in Touch
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
