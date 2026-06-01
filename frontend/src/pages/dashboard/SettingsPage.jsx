import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Building, Save, Bell, Shield, Languages, BriefcaseMedical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlassPanel from '../../components/ui/GlassPanel';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getOrganizations } from '../../services/authService';
import { extractApiError } from '../../services/api';
import toast from 'react-hot-toast';

const ageGroups = ['13-15', '16-18', '19-21', '22-25'];
const genders = ['male', 'female', 'non-binary', 'prefer_not_to_say'];
const languages = ['en', 'hi', 'ta', 'te', 'kn'];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    organizationId: user?.organization?._id || '',
    ageGroup: user?.ageGroup || '19-21',
    gender: user?.gender || 'prefer_not_to_say',
    language: user?.language || 'en',
    mentorType: user?.mentorType || 'peer',
    specialization: user?.specialization || '',
  });
  const [organizations, setOrganizations] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      organizationId: user?.organization?._id || '',
      ageGroup: user?.ageGroup || '19-21',
      gender: user?.gender || 'prefer_not_to_say',
      language: user?.language || 'en',
      mentorType: user?.mentorType || 'peer',
      specialization: user?.specialization || '',
    });
  }, [user]);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const data = await getOrganizations();
        setOrganizations(data);
      } catch {
        setOrganizations([]);
      }
    };

    loadOrganizations();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateUser(form);
      toast.success('Settings saved to the backend.', {
        style: {
          background: 'rgba(30, 30, 30, 0.95)',
          color: '#fff',
          border: '1px solid rgba(175, 203, 255, 0.2)',
        },
      });
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to save your settings.'));
    } finally {
      setSaving(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: i * 0.1 },
    }),
  };

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Manage the profile stored on your MindBridge account</p>
      </div>

      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <GlassPanel>
          <div className="flex items-center gap-2 mb-6">
            <User size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                icon={User}
              />
              <Input label="Email" type="email" value={user?.email || ''} icon={Mail} disabled />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/60">Organization</label>
                <div className="relative">
                  <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <select
                    value={form.organizationId}
                    onChange={(e) => setForm((current) => ({ ...current, organizationId: e.target.value }))}
                    className="glass-input w-full pl-11 cursor-pointer"
                  >
                    {organizations.map((organization) => (
                      <option key={organization._id} value={organization._id} className="bg-[#111]">
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/60">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))}
                  className="glass-input w-full cursor-pointer"
                >
                  {genders.map((gender) => (
                    <option key={gender} value={gender} className="bg-[#111]">
                      {gender.replaceAll('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/60">Language</label>
                <div className="relative">
                  <Languages size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <select
                    value={form.language}
                    onChange={(e) => setForm((current) => ({ ...current, language: e.target.value }))}
                    className="glass-input w-full pl-11 cursor-pointer"
                  >
                    {languages.map((language) => (
                      <option key={language} value={language} className="bg-[#111]">
                        {language.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {user?.role === 'mentor' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/60">Mentor Type</label>
                  <select
                    value={form.mentorType}
                    onChange={(e) => setForm((current) => ({ ...current, mentorType: e.target.value }))}
                    className="glass-input w-full cursor-pointer"
                  >
                    <option value="peer" className="bg-[#111]">Peer</option>
                    <option value="professional" className="bg-[#111]">Professional</option>
                  </select>
                </div>

                <Input
                  label="Specialization"
                  value={form.specialization}
                  onChange={(e) => setForm((current) => ({ ...current, specialization: e.target.value }))}
                  placeholder="Academic stress, crisis support..."
                  icon={BriefcaseMedical}
                />
              </div>
            )}
          </div>
        </GlassPanel>
      </motion.div>

      <motion.div custom={1} variants={fadeInUp} initial="hidden" animate="visible">
        <GlassPanel>
          <div className="flex items-center gap-2 mb-6">
            <Bell size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Preferences</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">In-app notifications</p>
              <p className="text-xs text-white/30">UI-only for now, while backend notification channels are being finalized</p>
            </div>
            <button
              onClick={() => setNotifications((current) => !current)}
              className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${
                notifications ? 'bg-accent/30' : 'bg-white/10'
              }`}
            >
              <motion.div
                animate={{ x: notifications ? 24 : 2 }}
                className={`absolute top-1 w-4 h-4 rounded-full ${
                  notifications ? 'bg-accent' : 'bg-white/30'
                }`}
              />
            </button>
          </div>
        </GlassPanel>
      </motion.div>

      <motion.div custom={2} variants={fadeInUp} initial="hidden" animate="visible">
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Privacy</h2>
          </div>
          <p className="text-xs text-white/30 leading-relaxed">
            Profile updates now persist through the backend API. Sensitive assessment data stays on protected routes and is scoped by role.
          </p>
        </GlassPanel>
      </motion.div>

      <motion.div custom={3} variants={fadeInUp} initial="hidden" animate="visible">
        <Button variant="accent" size="lg" icon={Save} onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </motion.div>
    </div>
  );
}
