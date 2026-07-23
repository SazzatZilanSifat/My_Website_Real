import { Building2, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useHashRoute } from '@/lib/router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export function Footer() {
  const { navigate } = useHashRoute();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email });
    if (error) {
      if (error.code === '23505') {
        toast('You are already subscribed!', 'info');
      } else {
        toast('Something went wrong. Please try again.', 'error');
      }
    } else {
      toast('Successfully subscribed to our newsletter!');
      setEmail('');
    }
    setSubscribing(false);
  };

  return (
    <footer className="bg-ink-950 border-t border-ink-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-7 h-7 text-gold-400" />
              <span className="font-serif text-2xl font-semibold text-cream-50">
                Lux<span className="text-gradient-gold">Estate</span>
              </span>
            </div>
            <p className="text-sm text-ink-500 leading-relaxed mb-6">
              Discover exceptional properties with LuxEstate. We connect discerning buyers with the world's finest homes.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full border border-ink-700 flex items-center justify-center text-ink-500 hover:text-gold-400 hover:border-gold-400 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-cream-100 tracking-wide uppercase mb-4">Explore</h4>
            <ul className="space-y-3">
              {[
                { label: 'Properties', to: '/properties' },
                { label: 'Agents', to: '/agents' },
                { label: 'About Us', to: '/about' },
                { label: 'Blog', to: '/blog' },
                { label: 'Contact', to: '/contact' },
              ].map((link) => (
                <li key={link.to}>
                  <button
                    onClick={() => navigate(link.to)}
                    className="text-sm text-ink-500 hover:text-gold-300 transition-colors duration-300"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-cream-100 tracking-wide uppercase mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-ink-500">
                <MapPin className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <span>500 Fifth Avenue, New York, NY 10111</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-500">
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>+1 (212) 555-0100</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-500">
                <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>contact@luxestate.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-cream-100 tracking-wide uppercase mb-4">Newsletter</h4>
            <p className="text-sm text-ink-500 mb-4">
              Subscribe to receive the latest property listings and market insights.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="input-luxury text-sm"
                required
              />
              <button type="submit" disabled={subscribing} className="btn-gold text-sm">
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-ink-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} LuxEstate. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-ink-500 hover:text-gold-300 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-ink-500 hover:text-gold-300 transition-colors">Terms of Service</a>
            <a href="#" className="text-xs text-ink-500 hover:text-gold-300 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
