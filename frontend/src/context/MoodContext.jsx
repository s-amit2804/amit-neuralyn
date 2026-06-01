import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredMoodEntries } from '../services/moodService';

const MoodContext = createContext(null);

const MOOD_LEVELS = {
  happy: { emoji: '😃', label: 'Happy', value: 5 },
  neutral: { emoji: '😐', label: 'Neutral', value: 3 },
  sad: { emoji: '😞', label: 'Sad', value: 1 },
};

function getCurrentMoodFromEntries(entries) {
  const today = new Date().toISOString().split('T')[0];
  return entries[today]?.mood || 'neutral';
}

export function MoodProvider({ children }) {
  const [moodEntries, setMoodEntries] = useState(() => getStoredMoodEntries());
  const [currentMood, setCurrentMood] = useState(() => getCurrentMoodFromEntries(getStoredMoodEntries()));
  const [moodNote, setMoodNote] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-mood', currentMood);
  }, [currentMood]);

  const updateMood = (mood, note = '') => {
    const today = new Date().toISOString().split('T')[0];
    const nextEntries = {
      ...moodEntries,
      [today]: {
        mood,
        note,
        timestamp: new Date().toISOString(),
      },
    };

    setMoodEntries(nextEntries);
    setCurrentMood(mood);
    setMoodNote(note);
  };

  return (
    <MoodContext.Provider
      value={{
        currentMood,
        moodNote,
        moodEntries,
        updateMood,
        setMoodNote,
        MOOD_LEVELS,
        moodInfo: MOOD_LEVELS[currentMood],
      }}
    >
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within MoodProvider');
  }
  return context;
}
