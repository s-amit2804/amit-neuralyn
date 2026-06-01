import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, ShieldAlert, CheckCircle2, Clock, BrainCircuit, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import MessageBubble from '../../components/chat/MessageBubble';
import SplineViewer from '../../components/spline/SplineViewer';
import GlassPanel from '../../components/ui/GlassPanel';
import { Wrapper3D } from '../../components/ui/Wrapper3D';
import { useMood } from '../../context/MoodContext';
import { useAuth } from '../../context/AuthContext';
import { submitMood } from '../../services/moodService';
import { extractApiError } from '../../services/api';
import { getOrCreateActiveChat, sendMessage, endChatSession, startChatSession } from '../../services/chatService';
import {
  bookMentorSession,
  flattenAvailability,
  getAvailableMentors,
} from '../../services/sessionService';
import { toSentenceCase } from '../../utils/formatters';
import toast from 'react-hot-toast';

const moodOptions = [
  { emoji: '😊', label: 'Great', key: 'happy', score: 5, bgHover: 'hover:bg-[#E8F5E9]', borderHover: 'hover:border-[#81C784]' },
  { emoji: '🙂', label: 'Good', key: 'happy', score: 4, bgHover: 'hover:bg-[#E0F2F1]', borderHover: 'hover:border-[#4DB6AC]' },
  { emoji: '😐', label: 'Okay', key: 'neutral', score: 3, bgHover: 'hover:bg-[#FFF8E1]', borderHover: 'hover:border-[#FFD54F]' },
  { emoji: '😔', label: 'Low', key: 'sad', score: 2, bgHover: 'hover:bg-[#FFF3E0]', borderHover: 'hover:border-[#FFB74D]' },
  { emoji: '😣', label: 'Struggling', key: 'sad', score: 1, bgHover: 'hover:bg-[#FFEBEE]', borderHover: 'hover:border-[#E57373]' },
];

const moodScoreMap = {
  happy: 5,
  neutral: 3,
  sad: 1,
};

const getDefaultScheduleDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

export default function ChatPage() {
  const { user } = useAuth();
  const { moodEntries, updateMood } = useMood();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const [showMoodOverlay, setShowMoodOverlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMountedFade, setIsMountedFade] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerDate, setSchedulerDate] = useState(getDefaultScheduleDate());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotKey, setSelectedSlotKey] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const bootstrapChat = async () => {
      setLoadingChat(true);

      try {
        const chat = await getOrCreateActiveChat();
        setChatId(chat._id);
        setMessages(
          chat.messages.map((message, index) => ({
            id: `${chat._id}-${index}-${message.timestamp}`,
            text: message.content,
            sender: message.sender,
            timestamp: message.timestamp,
          }))
        );
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to load your chat session.'));
      } finally {
        setLoadingChat(false);
      }
    };

    bootstrapChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!moodEntries[today]) {
      setShowMoodOverlay(true);
      setTimeout(() => setIsMountedFade(true), 50);
    }
  }, [moodEntries, today]);

  useEffect(() => {
    if (!showScheduler) {
      return;
    }

    const loadMentorSlots = async () => {
      setLoadingSlots(true);
      try {
        const data = await getAvailableMentors({
          date: schedulerDate,
          language: user?.language,
          gender: user?.gender && user.gender !== 'prefer_not_to_say' ? user.gender : undefined,
        });
        setAvailableSlots(flattenAvailability(data));
      } catch (error) {
        setAvailableSlots([]);
        toast.error(extractApiError(error, 'Failed to load mentor availability.'));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadMentorSlots();
  }, [schedulerDate, showScheduler, user?.gender, user?.language]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const entry = moodEntries[key];

      days.push({
        fullDate: key,
        displayDate: new Date(key).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        mood: entry ? moodScoreMap[entry.mood] || 0 : 0,
      });
    }

    return days;
  }, [moodEntries]);

  const handleMoodSelect = async (moodKey) => {
    setIsTransitioning(true);

    setTimeout(async () => {
      updateMood(moodKey);
      await submitMood(moodKey);
      setShowMoodOverlay(false);
      setIsTransitioning(false);
    }, 600);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping || !chatId) {
      return;
    }

    const messageText = input.trim();
    const optimisticMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendMessage(chatId, messageText);
      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          text: response.botReply.content,
          sender: 'bot',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `bot-error-${Date.now()}`,
          text: extractApiError(error, "I'm sorry, I'm having trouble responding right now."),
          sender: 'bot',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleEndChat = async () => {
    if (!chatId) {
      return;
    }

    try {
      const result = await endChatSession(chatId);
      setAnalysisResult(result);
      setShowSummary(true);
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to end and analyze the chat.'));
    }
  };

  const handleStartFreshChat = async () => {
    try {
      const chat = await startChatSession();
      setChatId(chat._id);
      setMessages(
        chat.messages.map((message, index) => ({
          id: `${chat._id}-${index}-${message.timestamp}`,
          text: message.content,
          sender: message.sender,
          timestamp: message.timestamp,
        }))
      );
      setAnalysisResult(null);
      setShowSummary(false);
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to start a new chat session.'));
    }
  };

  const handleScheduleSession = async (slot) => {
    const slotKey = `${slot.availabilityId}-${slot.slotIndex}`;
    setSelectedSlotKey(slotKey);

    try {
      await bookMentorSession({
        availabilityId: slot.availabilityId,
        slotIndex: slot.slotIndex,
        languagePreference: user?.language || 'en',
        genderPreference: user?.gender || 'no_preference',
      });
      toast.success(`Session booked with ${slot.mentorName}.`);
      setAvailableSlots((current) =>
        current.filter((currentSlot) => `${currentSlot.availabilityId}-${currentSlot.slotIndex}` !== slotKey)
      );
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to book the mentor session.'));
    } finally {
      setSelectedSlotKey('');
    }
  };

  const moodStyle = (value) => {
    const colors = {
      1: { bg: '#F87171' },
      2: { bg: '#FB923C' },
      3: { bg: '#FDE047' },
      4: { bg: '#86EFAC' },
      5: { bg: '#16A34A' },
      0: { bg: 'rgba(255,255,255,0.1)' },
    };

    return colors[value] || colors[0];
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const data = payload[0].payload;
    return (
      <div className="glass-panel p-2 text-xs">
        <p className="font-bold text-white mb-1">{data.displayDate}</p>
        <p className="text-white/70">Mood: {data.mood || 'N/A'}</p>
      </div>
    );
  };

  if (loadingChat) {
    return <div className="p-8 text-white font-semibold">Loading your support space...</div>;
  }

  if (showMoodOverlay) {
    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#FDFBF7] transition-all duration-[600ms] ease-out ${isMountedFade ? 'opacity-100 translate-x-0' : 'opacity-0'} ${isTransitioning ? '-translate-x-full opacity-0' : ''}`}>
        <div className="max-w-4xl w-full px-6 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-6 tracking-tight" style={{ fontFamily: 'var(--font-display, "Playfair Display")' }}>
            How has your day been?
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 mb-16 font-medium">
            Before we continue, tell us how you&apos;re feeling today.
          </p>

          <div className="flex justify-center flex-wrap gap-4 md:gap-8 w-full max-w-4xl">
            {moodOptions.map((mood) => (
              <button
                key={`${mood.label}-${mood.score}`}
                onClick={() => handleMoodSelect(mood.key)}
                disabled={isTransitioning}
                className={`group flex flex-col items-center justify-center w-32 h-40 md:w-44 md:h-52 rounded-[2rem] border-2 border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.05] active:scale-95 ${mood.bgHover} ${mood.borderHover} cursor-pointer`}
              >
                <span className="text-5xl md:text-7xl mb-4 transition-transform duration-300 group-hover:scale-110">{mood.emoji}</span>
                <span className="text-base md:text-xl font-bold text-gray-700 group-hover:text-gray-900">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex items-center justify-center overflow-hidden bg-transparent">
      {showScheduler && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-background-primary p-8 rounded-2xl border border-glass-border shadow-2xl max-w-2xl w-full relative">
            <button onClick={() => setShowScheduler(false)} className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-white mb-2">Schedule Mentor Session</h2>
            <p className="text-white/50 text-sm mb-6">Choose a real slot from the backend mentor calendar.</p>

            <div className="mb-5">
              <label className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2 block">Session Date</label>
              <input
                type="date"
                value={schedulerDate}
                onChange={(e) => setSchedulerDate(e.target.value)}
                className="glass-input w-full"
              />
            </div>

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto mb-6 pr-2">
              {loadingSlots && <p className="text-sm text-white/40">Loading mentor availability...</p>}

              {!loadingSlots && availableSlots.map((slot) => {
                const slotKey = `${slot.availabilityId}-${slot.slotIndex}`;
                return (
                  <button
                    key={slotKey}
                    onClick={() => handleScheduleSession(slot)}
                    className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer text-left"
                    disabled={Boolean(selectedSlotKey)}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Clock size={16} />
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <p className="text-xs text-white/40 mt-1">{slot.mentorName} • {slot.mentorLanguage.toUpperCase()}</p>
                    </div>
                    <span className="text-xs text-accent">
                      {selectedSlotKey === slotKey ? 'Booking...' : 'Select'}
                    </span>
                  </button>
                );
              })}

              {!loadingSlots && availableSlots.length === 0 && (
                <p className="p-4 bg-white/5 rounded-xl border border-white/10 text-center text-sm text-white/50">
                  No matching slots available for this date.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showSummary && analysisResult && (
        <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto pt-10">
            <GlassPanel className="p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-accent/60 mb-2">Session Analysis</p>
                  <h2 className="text-2xl font-bold text-white">{analysisResult.issueCategory ? toSentenceCase(analysisResult.issueCategory) : 'Conversation Summary'}</h2>
                </div>
                <button onClick={() => setShowSummary(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="glass-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">Intensity</p>
                  <p className="text-xl font-semibold text-white capitalize">{analysisResult.intensityLevel}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">Distress Score</p>
                  <p className="text-xl font-semibold text-white">{analysisResult.distressScore}/10</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2">Next Step</p>
                  <p className="text-sm font-semibold text-white">{analysisResult.triage?.label || analysisResult.nextStep}</p>
                </div>
              </div>

              <div className="mt-6 glass-card p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">Summary</p>
                <p className="text-sm text-white/75 leading-relaxed">{analysisResult.summary}</p>
              </div>

              {analysisResult.triage?.rationale && (
                <div className="mt-4 glass-card p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">Why This Route</p>
                  <p className="text-sm text-white/60 leading-relaxed">{analysisResult.triage.rationale}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {analysisResult.triage?.action === 'peer_mentor' && (
                  <button
                    onClick={() => setShowScheduler(true)}
                    className="px-4 py-3 rounded-xl bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    Schedule Mentor Support
                  </button>
                )}

                {analysisResult.triage?.action === 'alert_and_escalate' && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-2">
                    <ShieldAlert size={16} />
                    NGO escalation has been triggered automatically.
                  </div>
                )}

                {analysisResult.triage?.action === 'self_help' && (
                  <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    Self-help support is recommended for this session.
                  </div>
                )}

                <button
                  onClick={handleStartFreshChat}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Start Fresh Chat
                </button>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      <div className="w-full h-full grid xl:grid-cols-[1.2fr_0.8fr] gap-6 p-6">
        <GlassPanel className="relative overflow-hidden flex flex-col min-h-[70vh]">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent/8 to-transparent pointer-events-none" />

          <div className="px-6 py-5 border-b border-glass-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Live Companion</p>
              <h1 className="text-2xl font-bold text-white mt-2">Talk through what&apos;s on your mind</h1>
            </div>

            <button
              onClick={handleEndChat}
              className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/65 hover:bg-white/5 transition-colors cursor-pointer"
            >
              End & Analyze
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-white/40">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:100ms]" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:200ms]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-5 border-t border-glass-border">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSend();
                  }
                }}
                placeholder="Share what you’re feeling..."
                className="glass-input flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel className="overflow-hidden">
            <div className="h-56">
              <SplineViewer
                url="https://my.spline.design/voiceinteractionanimation-jBgLbgBJdNgfjwS8h1sKqFqB/"
                className="w-full h-full"
              />
            </div>
            <div className="px-5 pb-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Support Layer</p>
              <h2 className="text-lg font-semibold text-white mt-2">Every message now runs through the backend conversation and triage pipeline.</h2>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Mood Check-In</h2>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="displayDate" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 5]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.fullDate} fill={moodStyle(entry.mood).bg} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

        </div>
      </div>
    </div>
  );
}
