import { useState, useEffect } from 'react';
import { Building2, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHashRoute } from '@/lib/router';
import { useToast } from '@/context/ToastContext';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp, user } = useAuth();
  const { navigate } = useHashRoute();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        toast('Invalid credentials', 'error');
      } else {
        toast('Welcome back!');
        navigate('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
        toast(error, 'error');
      } else {
        toast('Account created! You are now signed in.');
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-ink-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 mb-6">
            <Building2 className="w-8 h-8 text-gold-400" />
            <span className="font-serif text-3xl font-semibold text-cream-50">
              Lux<span className="text-gradient-gold">Estate</span>
            </span>
          </button>
          <h1 className="font-serif text-3xl font-light text-cream-50 mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-sm text-ink-500">
            {mode === 'login'
              ? 'Sign in to access your dashboard and saved properties'
              : 'Join LuxEstate to save properties and schedule tours'}
          </p>
        </div>

        <div className="glass-dark border border-ink-700 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="label-luxury">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="input-luxury pl-11"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label-luxury">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-luxury pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-luxury">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-luxury pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => navigate(mode === 'login' ? '/signup' : '/login')}
                className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-ink-500 mt-6">
          {mode === 'login'
            ? 'Use admin@luxestate.com to access admin features'
            : 'By signing up, you agree to our Terms and Privacy Policy'}
        </p>
      </div>
    </div>
  );
}
