import { useState } from 'react';
import { motion } from 'framer-motion';
import { submitMood } from '../../services/moodService';
import { useMood } from '../../context/MoodContext';

const moods = [
  { key: 'happy', emoji: '😃', label: 'Happy' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'sad', emoji: '😞', label: 'Sad' },
];

export default function MoodSlider({ compact = false }) {
  const { currentMood, updateMood } = useMood();
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleMoodSelect = async (mood) => {
    updateMood(mood, note);
    await submitMood(mood, note);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium">How are you?</p>
        <div className="flex items-center gap-2">
          {moods.map((mood) => (
            <motion.button
              key={mood.key}
              onClick={() => handleMoodSelect(mood.key)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`flex-1 py-2 rounded-lg text-center transition-all duration-300 cursor-pointer
                ${currentMood === mood.key
                  ? 'bg-accent/20 border border-accent/30 shadow-[0_0_12px_rgba(175,203,255,0.15)]'
                  : 'hover:bg-white/5 border border-transparent'
                }`}
            >
              <span className="text-lg">{mood.emoji}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 space-y-4">
      <h3 className="text-sm font-semibold text-white/70">How are you feeling?</h3>
      <div className="flex items-center gap-3">
        {moods.map((mood) => (
          <motion.button
            key={mood.key}
            onClick={() => handleMoodSelect(mood.key)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-300 cursor-pointer
              ${currentMood === mood.key
                ? 'bg-accent/15 border border-accent/30 shadow-[0_0_20px_rgba(175,203,255,0.15)]'
                : 'hover:bg-white/5 border border-transparent'
              }`}
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span className="text-xs text-white/50">{mood.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Want to share more? (optional)"
          className="glass-input flex-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleMoodSelect(currentMood)}
        />
      </div>

      {submitted && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-accent/70"
        >
          ✓ Mood recorded
        </motion.p>
      )}
    </div>
  );
}
