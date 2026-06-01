import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, History, Activity, Sparkles, TrendingUp, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import GlassPanel from '../../components/ui/GlassPanel';
import { Wrapper3D } from '../../components/ui/Wrapper3D';
import { AnimatedCard, CardVisual, CardBody, CardTitle, CardDescription } from '../../components/ui/animated-card';
import { Visual3 } from '../../components/ui/visual-3';
import { getAssignedSessions } from '../../services/sessionService';

// ── Sample fallback data ──────────────────────────────────────────────
const generateSampleMoodData = () => {
  const data = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    data[key] = Math.floor(Math.random() * 4) + 1; // 1-5
  }
  return data;
};

const SAMPLE_SLOTS = [
  'MON 10:00 AM',
  'WED 2:00 PM',
  'FRI 11:00 AM',
];

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userMoodData, setUserMoodData] = useState({});
  const [mentorSlots, setMentorSlots] = useState([]);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Try to get mood data from localStorage (logged by MoodContext)
        const storedMood = localStorage.getItem('mindbridge_mood_data');
        const moodData = storedMood ? JSON.parse(storedMood) : {};

        // Try to get upcoming sessions
        let slots = [];
        try {
          const sessions = await getAssignedSessions();
          slots = sessions.map(s => {
            const d = new Date(s.scheduledDate);
            const day = d.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
            return `${day} ${s.startTime}`;
          });
        } catch { /* ignore */ }

        const hasData = Object.keys(moodData).length > 0 || slots.length > 0;

        if (hasData) {
          setUserMoodData(moodData);
          setMentorSlots(slots);
        } else {
          setUsingSampleData(true);
          setUserMoodData(generateSampleMoodData());
          setMentorSlots(SAMPLE_SLOTS);
        }
      } catch {
        setUsingSampleData(true);
        setUserMoodData(generateSampleMoodData());
        setMentorSlots(SAMPLE_SLOTS);
      }
    };

    loadDashboardData();
  }, []);

  // Generate chart data
  const generateLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const moodStyle = (val) => {
    const colors = {
        1: { bg: '#F87171' },
        2: { bg: '#FB923C' },
        3: { bg: '#FDE047' },
        4: { bg: '#86EFAC' },
        5: { bg: '#16A34A' },
        null: { bg: 'rgba(255,255,255,0.1)' } 
    };
    return colors[val] || colors[null];
  };

  const chartData = generateLast7Days().map(date => ({
      fullDate: date,
      displayDate: new Date(date).toLocaleDateString([], { weekday: 'short' }),
      mood: userMoodData?.[date] || 0 
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-lg text-xs shadow-xl">
                <p className="font-bold text-white mb-1">{data.fullDate}</p>
                <p className="text-white/70">Mood Intensity: {data.mood || 'Not Logged'}</p>
            </div>
        );
    }
    return null;
  };

  const quickActions = [
    {
      title: 'AI Companion',
      description: 'Start a processing session',
      icon: MessageSquare,
      color: 'text-gold',
      bg: 'bg-gold/10',
      border: 'border-gold/20',
      path: '/dashboard/chat'
    },
    {
      title: 'Mentor Connect',
      description: 'Book a human session',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      path: '/dashboard/mentor'
    },
    {
      title: 'Activity Log',
      description: 'Review past sessions',
      icon: History,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
      path: '/dashboard/history'
    }
  ];

  return (
    <div className="h-full w-full relative flex items-center justify-center overflow-y-auto overflow-x-hidden bg-transparent p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full h-full max-w-6xl flex flex-col gap-6"
      >
        
        {/* Sample data banner */}
        {usingSampleData && (
          <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Sparkles size={16} className="text-gold flex-shrink-0" />
            <p className="text-xs text-gold/80">
              Showing sample data — use the AI chat to generate live results.
            </p>
          </div>
        )}

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
        <GlassPanel className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
              Welcome back, <span className="text-gold">{user?.name || 'User'}</span>
            </h1>
            <p className="text-sm text-white/50">Here is your emotional wellness overview for today.</p>
          </div>
          
          <div className="relative z-10 mt-6 md:mt-0 flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <Activity className="text-green-400" size={18} />
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Status</p>
                <p className="text-sm font-semibold text-white">Active</p>
              </div>
            </div>
          </div>
        </GlassPanel>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          
          {/* Main Content Area (Left 2 columns) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Quick Actions */}
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest px-2">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => navigate(action.path)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-start p-5 rounded-2xl border ${action.border} bg-black/40 backdrop-blur-md shadow-lg hover:bg-black/60 transition-colors text-left cursor-pointer group`}
                >
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <action.icon size={20} className={action.color} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-gold transition-colors">{action.title}</h3>
                  <p className="text-xs text-white/40">{action.description}</p>
                </motion.button>
              ))}
            </div>

            {/* Weekly Mood Trend */}
            <GlassPanel className="p-6 bg-black/40 border-white/5 shadow-2xl flex-1 min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-gold" />
                    Weekly Emotion Intensity
                  </h3>
                  <p className="text-xs text-white/40 mt-1">Your mood variations over the last 7 days</p>
                </div>
              </div>
              
              <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis 
                          dataKey="displayDate" 
                          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} 
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                      />
                      <YAxis 
                          domain={[0, 5]} 
                          ticks={[1, 2, 3, 4, 5]}
                          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                          axisLine={false}
                          tickLine={false}
                          dx={-10}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="mood" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={moodStyle(entry.mood).bg} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              </div>
            </GlassPanel>
          </div>

          {/* Right Sidebar Area */}
          <div className="flex flex-col gap-6">
            <AnimatedCard className="h-[190px] min-h-[190px]">
              <CardVisual>
                <Visual3 mainColor="#d4af37" secondaryColor="#ffffff" />
              </CardVisual>
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-gold" />
                  <CardTitle className="text-sm">NueraLyn Companion</CardTitle>
                </div>
                <CardDescription>Live companion analytics overview.</CardDescription>
              </CardBody>
            </AnimatedCard>
            
            {/* Upcoming Mentors */}
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest px-2">Upcoming</h2>
            <GlassPanel className="p-5 bg-black/40 border-white/5 shadow-2xl flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarIcon size={16} className="text-gold" />
                  Mentor Slots
                </h3>
              </div>
              
              <div className="flex-1 flex flex-col gap-3">
                {mentorSlots.slice(0, 4).map((slot, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                        <Clock size={14} />
                      </div>
                      <span className="text-xs font-semibold text-white/80">{slot}</span>
                    </div>
                    <button onClick={() => navigate('/dashboard/mentor')} className="text-[10px] text-gold hover:text-white transition-colors cursor-pointer uppercase tracking-wider font-bold">
                      Book
                    </button>
                  </div>
                ))}
                {mentorSlots.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <CalendarIcon size={32} className="mb-2" />
                    <p className="text-xs">No upcoming sessions</p>
                  </div>
                )}
              </div>
            </GlassPanel>
            
            {/* Context Widget */}
            <GlassPanel className="p-5 bg-gold/10 border-gold/20 shadow-2xl">
              <div className="flex items-start gap-3">
                <Sparkles className="text-gold shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-gold mb-1">NueraLyn Insight</h4>
                  <p className="text-xs text-gold/70 leading-relaxed">
                    Consistent processing helps build emotional resilience. Try to have a 5-minute chat session today to keep your streak!
                  </p>
                </div>
              </div>
            </GlassPanel>

          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
