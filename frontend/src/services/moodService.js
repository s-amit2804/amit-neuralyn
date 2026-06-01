const STORAGE_KEY = 'mindbridge_daily_moods';

export function getStoredMoodEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export async function submitMood(mood, note = '') {
  const today = new Date().toISOString().split('T')[0];
  const moods = getStoredMoodEntries();
  moods[today] = { mood, note, timestamp: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(moods));

  return {
    success: true,
    message: 'Mood recorded successfully.',
    data: moods[today],
  };
}
