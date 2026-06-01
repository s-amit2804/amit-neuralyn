import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Brain, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassPanel from '../components/ui/GlassPanel';

import { getDefaultRouteForUser } from '../utils/navigation';
import { extractApiError } from '../services/api';
import bgImage from '../assets/lr-bg.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      navigate(getDefaultRouteForUser(user));
    } catch (err) {
      setError(extractApiError(err, 'Failed to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative bg-[#050505] overflow-hidden">
      <img
        src={bgImage}
        alt="Background Pattern"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      />

      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none mix-blend-screen">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <GlassPanel className="p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <Brain size={22} className="text-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif italic text-white">
                  NeuraLyn.<span className="text-gold">.</span>
                </h1>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Backend connected</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@example.com"
                icon={Mail}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                icon={Lock}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" variant="accent" size="lg" className="w-full" icon={ArrowRight} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 glass-card p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-gold mt-0.5" />
                <div>
                  <p className="text-sm text-white/75">JWT-based backend auth is active.</p>
                  <p className="text-xs text-white/35 mt-1">
                    Youth, mentor, and NGO logins now route into their real backend dashboards.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-white/30 mt-6">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-gold hover:text-gold-light transition-colors">
                Sign up
              </Link>
            </p>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
