import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import Button from './ui/Button';

const ageGroups = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'];

export default function OnboardingModal() {
  const { completeOnboarding } = useAuth();
  const [ageGroup, setAgeGroup] = useState('');
  const [organization, setOrganization] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    completeOnboarding({ ageGroup, organization });
  };

  return (
    <Modal isOpen={true} title="Welcome to NueraLyn ✨" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-white/50">
          Let's personalize your experience. This information helps us provide better support.
        </p>

        {/* Age Group */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/60">Age Group</label>
          <div className="grid grid-cols-3 gap-2">
            {ageGroups.map((age) => (
              <motion.button
                key={age}
                type="button"
                onClick={() => setAgeGroup(age)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`py-2.5 rounded-xl text-xs font-medium transition-all duration-300 cursor-pointer
                  ${ageGroup === age
                    ? 'bg-accent/20 border border-accent/40 text-accent shadow-[0_0_12px_rgba(175,203,255,0.15)]'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70'
                  }`}
              >
                {age}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Organization */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/60">Organization (optional)</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="School, university, company..."
            className="glass-input w-full text-sm"
          />
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!ageGroup}
        >
          Continue
        </Button>
      </form>
    </Modal>
  );
}
