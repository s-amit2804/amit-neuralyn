import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Brain, ArrowRight, Shield, Building2, Globe2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassPanel from '../components/ui/GlassPanel';

import { createOrganization, getOrganizations } from '../services/authService';
import { extractApiError } from '../services/api';
import bgImage from '../assets/lr-bg.png';

const ageGroups = ['13-15', '16-18', '19-21', '22-25'];
const genderOptions = ['male', 'female', 'non-binary', 'prefer_not_to_say'];
const languageOptions = ['en', 'hi', 'ta', 'te', 'kn'];

const initialOrgForm = {
  name: '',
  type: 'school',
  contactEmail: '',
  location: '',
};

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationId: '',
    ageGroup: '19-21',
    gender: 'prefer_not_to_say',
    language: 'en',
  });
  const [organizationForm, setOrganizationForm] = useState(initialOrgForm);
  const [organizations, setOrganizations] = useState([]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  const loadOrganizations = async () => {
    setLoadingOrganizations(true);
    try {
      const data = await getOrganizations();
      setOrganizations(data);
      setForm((current) => ({
        ...current,
        organizationId: current.organizationId || data[0]?._id || '',
      }));
    } catch (err) {
      setError(extractApiError(err, 'Failed to load organizations.'));
    } finally {
      setLoadingOrganizations(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.organizationId) {
      setError('Please complete all required fields.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(form);
      navigate('/dashboard/chat');
    } catch (err) {
      setError(extractApiError(err, 'Failed to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!organizationForm.name || !organizationForm.contactEmail) {
      setError('Organization name and contact email are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const organization = await createOrganization(organizationForm);
      setOrganizations((current) => [organization, ...current]);
      setForm((current) => ({ ...current, organizationId: organization._id }));
      setOrganizationForm(initialOrgForm);
      setShowCreateOrg(false);
    } catch (err) {
      setError(extractApiError(err, 'Failed to create the organization.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative bg-[#050505] overflow-hidden">
      <img
        src={bgImage}
        alt="Background Pattern"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      />

      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none mix-blend-screen">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gold/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gold/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
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
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Create youth account</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => {
                    setForm((current) => ({ ...current, name: e.target.value }));
                    setError('');
                  }}
                  placeholder="John Doe"
                  icon={User}
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((current) => ({ ...current, email: e.target.value }));
                    setError('');
                  }}
                  placeholder="you@example.com"
                  icon={Mail}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => {
                    setForm((current) => ({ ...current, password: e.target.value }));
                    setError('');
                  }}
                  placeholder="••••••••"
                  icon={Lock}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/60">Organization</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <select
                        value={form.organizationId}
                        onChange={(e) => setForm((current) => ({ ...current, organizationId: e.target.value }))}
                        className="glass-input w-full pl-11 text-sm appearance-none cursor-pointer"
                        disabled={loadingOrganizations}
                      >
                        <option value="">Select organization</option>
                        {organizations.map((organization) => (
                          <option key={organization._id} value={organization._id} className="bg-[#111]">
                            {organization.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateOrg((current) => !current)}
                      className="px-4 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      New
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/60">Age Group</label>
                  <select
                    value={form.ageGroup}
                    onChange={(e) => setForm((current) => ({ ...current, ageGroup: e.target.value }))}
                    className="glass-input w-full cursor-pointer"
                  >
                    {ageGroups.map((ageGroup) => (
                      <option key={ageGroup} value={ageGroup} className="bg-[#111]">
                        {ageGroup}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/60">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))}
                    className="glass-input w-full cursor-pointer"
                  >
                    {genderOptions.map((gender) => (
                      <option key={gender} value={gender} className="bg-[#111]">
                        {gender.replaceAll('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/60">Language</label>
                  <div className="relative">
                    <Globe2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <select
                      value={form.language}
                      onChange={(e) => setForm((current) => ({ ...current, language: e.target.value }))}
                      className="glass-input w-full pl-11 cursor-pointer"
                    >
                      {languageOptions.map((language) => (
                        <option key={language} value={language} className="bg-[#111]">
                          {language.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {showCreateOrg && (
                <div className="glass-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Create an organization</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateOrg(false)}
                      className="text-xs text-white/35 hover:text-white/70 cursor-pointer"
                    >
                      Hide
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Organization Name"
                      value={organizationForm.name}
                      onChange={(e) =>
                        setOrganizationForm((current) => ({ ...current, name: e.target.value }))
                      }
                      placeholder="Hope Foundation"
                    />
                    <Input
                      label="Contact Email"
                      value={organizationForm.contactEmail}
                      onChange={(e) =>
                        setOrganizationForm((current) => ({ ...current, contactEmail: e.target.value }))
                      }
                      placeholder="team@example.org"
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white/60">Type</label>
                      <select
                        value={organizationForm.type}
                        onChange={(e) =>
                          setOrganizationForm((current) => ({ ...current, type: e.target.value }))
                        }
                        className="glass-input w-full cursor-pointer"
                      >
                        {['ngo', 'school', 'clinic', 'community'].map((type) => (
                          <option key={type} value={type} className="bg-[#111]">
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Location"
                      value={organizationForm.location}
                      onChange={(e) =>
                        setOrganizationForm((current) => ({ ...current, location: e.target.value }))
                      }
                      placeholder="Bangalore"
                    />
                  </div>

                  <Button type="button" variant="secondary" size="sm" onClick={handleCreateOrganization} disabled={loading}>
                    Create Organization
                  </Button>
                </div>
              )}

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
                {loading ? 'Creating Account…' : 'Create Account'}
              </Button>

              <div className="flex items-center gap-2 text-[10px] text-white/20">
                <Shield size={10} />
                <span>Your registration now goes directly into the backend API.</span>
              </div>
            </form>

            <p className="text-center text-sm text-white/30 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-gold hover:text-gold-light transition-colors">
                Sign in
              </Link>
            </p>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
