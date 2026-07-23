import { useState, useEffect } from 'react';
import { Building2, Menu, X, User, LogOut, Heart, LayoutDashboard, Users, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHashRoute } from '@/lib/router';

export function Navbar() {
  const { route, navigate } = useHashRoute();
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'agent' || profile?.role === 'admin';

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Properties', to: '/properties' },
    { label: 'Agents', to: '/agents' },
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', to: '/contact' },
  ];

  const isActive = (to: string) => route === to || (to !== '/' && route.startsWith(to));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-dark border-b border-ink-700 py-3' : 'bg-transparent py-5'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
          <Building2 className="w-7 h-7 text-gold-400 transition-transform group-hover:scale-110" />
          <span className="font-serif text-2xl font-semibold text-cream-50 tracking-tight">
            Lux<span className="text-gradient-gold">Estate</span>
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className={`text-sm font-medium tracking-wide transition-colors duration-300 relative group ${
                isActive(link.to) ? 'text-gold-400' : 'text-cream-200 hover:text-gold-300'
              }`}
            >
              {link.label}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-gold-400 transition-all duration-300 ${
                  isActive(link.to) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              {isStaff && (
                <button
                  onClick={() => navigate('/inquiries')}
                  className="btn-ghost relative"
                  title="Inquiries"
                >
                  <Mail className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-ghost"
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate('/organization')}
                  className="btn-ghost"
                  title="Organization"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Organization</span>
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-ink-800 transition-colors"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold-400 text-ink-950 flex items-center justify-center text-sm font-semibold">
                      {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm text-cream-200 max-w-[120px] truncate">
                    {profile?.full_name || 'User'}
                  </span>
                </button>
                {userMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 glass-dark border border-ink-600 rounded-lg overflow-hidden animate-scale-in"
                    onMouseLeave={() => setUserMenu(false)}
                  >
                    <div className="px-4 py-3 border-b border-ink-700">
                      <p className="text-sm text-cream-100 font-medium truncate">{profile?.full_name}</p>
                      <p className="text-xs text-ink-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-xs text-gold-400 capitalize">{profile?.role}</span>
                    </div>
                    <button
                      onClick={() => { navigate('/dashboard'); setUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-cream-200 hover:bg-ink-800 flex items-center gap-2 transition-colors"
                    >
                      <Heart className="w-4 h-4" /> My Favorites
                    </button>
                    <button
                      onClick={() => { signOut(); navigate('/'); setUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-cream-200 hover:bg-ink-800 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-ghost text-sm">
                <User className="w-4 h-4" />
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="btn-gold text-sm">
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-cream-100 p-2"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden glass-dark border-t border-ink-700 animate-fade-in">
          <div className="px-4 py-6 space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.to}
                onClick={() => { navigate(link.to); setMobileOpen(false); }}
                className={`block w-full text-left py-2 text-sm font-medium ${
                  isActive(link.to) ? 'text-gold-400' : 'text-cream-200'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-ink-700 space-y-3">
              {user ? (
                <>
                  <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }} className="flex items-center gap-2 text-sm text-cream-200 py-2">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </button>
                  {isAdmin && (
                    <button onClick={() => { navigate('/organization'); setMobileOpen(false); }} className="flex items-center gap-2 text-sm text-cream-200 py-2">
                      <Users className="w-4 h-4" /> Organization
                    </button>
                  )}
                  {isStaff && (
                    <button onClick={() => { navigate('/inquiries'); setMobileOpen(false); }} className="flex items-center gap-2 text-sm text-cream-200 py-2">
                      <Mail className="w-4 h-4" /> Inquiries
                    </button>
                  )}
                  <button onClick={() => { signOut(); navigate('/'); setMobileOpen(false); }} className="flex items-center gap-2 text-sm text-cream-200 py-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { navigate('/login'); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm text-cream-200">
                    Sign In
                  </button>
                  <button onClick={() => { navigate('/signup'); setMobileOpen(false); }} className="btn-gold w-full text-sm">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
