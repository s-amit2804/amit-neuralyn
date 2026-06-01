import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  History,
  TrendingUp,
  Brain,
  ArrowRight,
  Activity,
  CalendarDays,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GlassPanel from '../../components/ui/GlassPanel';
import { useAuth } from '../../context/AuthContext';
import { listChats } from '../../services/chatService';
import { getAssessments } from '../../services/assessmentService';
import { getUserSessions } from '../../services/sessionService';
import { extractApiError } from '../../services/api';
import { useMood } from '../../context/MoodContext';
import { formatDate, toSentenceCase, getSeverityColor, getSeverityBg } from '../../utils/formatters';
import toast from 'react-hot-toast';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const moodScoreMap = { happy: 5, neutral: 3, sad: 1 };

// ── Sample fallback data shown when backend returns empty ─────────────────
const SAMPLE_STATS = {
  totalChats: 12,
  activeChats: 1,
  totalAssessments: 8,
  upcomingSessions: 2,
};

const SAMPLE_ASSESSMENTS = [
  {
    _id: 'sample-1',
    sourceType: 'chat',
    issueCategory: 'academic',
    intensityLevel: 'high',
    distressScore: 8.2,
    summary: 'Student expressed severe academic pressure and catastrophic thinking.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'sample-2',
    sourceType: 'chat',
    issueCategory: 'peers',
    intensityLevel: 'medium',
    distressScore: 5.1,
    summary: 'Peer conflict involving public humiliation reported.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: 'sample-3',
    sourceType: 'chat',
    issueCategory: 'other',
    intensityLevel: 'low',
    distressScore: 1.5,
    summary: 'Mild boredom with online classes. Good coping strategies.',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const SAMPLE_SESSIONS = [
  {
    _id: 'sample-s1',
    mentor: { name: 'Dr. Sarah Smith' },
    scheduledDate: new Date(Date.now() + 604800000).toISOString(),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
  },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const { moodEntries } = useMood();
  const [stats, setStats] = useState(null);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [chats, assessments, sessions] = await Promise.all([
          listChats().catch(() => []),
          getAssessments().catch(() => []),
          getUserSessions().catch(() => []),
        ]);

        const hasData = chats.length > 0 || assessments.length > 0 || sessions.length > 0;

        if (hasData) {
          setStats({
            totalChats: chats.length,
            activeChats: chats.filter((c) => c.status === 'active').length,
            totalAssessments: assessments.length,
            upcomingSessions: sessions.filter((s) => s.status !== 'completed').length,
          });
          setRecentAssessments(assessments.slice(0, 3));
          setUpcomingSessions(sessions.filter((s) => s.status !== 'completed').slice(0, 3));
        } else {
          setUsingSampleData(true);
          setStats(SAMPLE_STATS);
          setRecentAssessments(SAMPLE_ASSESSMENTS);
          setUpcomingSessions(SAMPLE_SESSIONS);
        }
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to load overview.'));
        setUsingSampleData(true);
        setStats(SAMPLE_STATS);
        setRecentAssessments(SAMPLE_ASSESSMENTS);
        setUpcomingSessions(SAMPLE_SESSIONS);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  // Generate mood chart data
  const chartData = [];
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    const entry = moodEntries[key];
    chartData.push({
      fullDate: key,
      displayDate: new Date(key).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      mood: entry ? moodScoreMap[entry.mood] || 0 : 0,
    });
  }

  const moodColor = (value) => {
    const colors = { 1: '#F87171', 2: '#FB923C', 3: '#FDE047', 4: '#86EFAC', 5: '#16A34A', 0: 'rgba(255,255,255,0.1)' };
    return colors[value] || colors[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Here&apos;s a quick overview of your mental wellness journey
        </p>
      </div>

      {usingSampleData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <Brain size={16} className="text-accent flex-shrink-0" />
          <p className="text-xs text-accent/80">
            Showing sample data — start a chat or run the seed script for live results.
          </p>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Chats', value: stats?.totalChats || 0, icon: MessageSquare, color: 'text-blue-400' },
          { label: 'Active Now', value: stats?.activeChats || 0, icon: Activity, color: 'text-green-400' },
          { label: 'Assessments', value: stats?.totalAssessments || 0, icon: TrendingUp, color: 'text-amber-400' },
          { label: 'Upcoming Sessions', value: stats?.upcomingSessions || 0, icon: CalendarDays, color: 'text-purple-400' },
        ].map((kpi, index) => (
          <motion.div key={kpi.label} custom={index} variants={fadeInUp} initial="hidden" animate="visible">
            <GlassPanel className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{kpi.label}</span>
                <kpi.icon size={16} className={kpi.color} />
              </div>
              <span className="text-3xl font-bold text-white">{kpi.value}</span>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {/* Middle row: Mood + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mood Trend */}
        <motion.div custom={4} variants={fadeInUp} initial="hidden" animate="visible">
          <GlassPanel>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Mood Trend (2 Weeks)</h2>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="displayDate" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 5]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="glass-panel p-2 text-xs">
                          <p className="font-bold text-white mb-1">{d.displayDate}</p>
                          <p className="text-white/70">Mood: {d.mood || 'N/A'}</p>
                        </div>
                      );
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.fullDate} fill={moodColor(entry.mood)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Quick Actions */}
        <motion.div custom={5} variants={fadeInUp} initial="hidden" animate="visible">
          <GlassPanel>
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { to: '/dashboard/chat', icon: MessageSquare, label: 'AI Companion', desc: 'Start or continue a support conversation' },
                { to: '/dashboard/mentor', icon: Users, label: 'Mentor Connect', desc: 'Book a session with a trained mentor' },
                { to: '/dashboard/history', icon: History, label: 'Assessment History', desc: 'Review past sessions and distress scores' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <action.icon size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">{action.label}</h3>
                    <p className="text-xs text-white/35 mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-accent transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {/* Bottom row: Recent Assessments + Upcoming Sessions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Assessments */}
        <motion.div custom={6} variants={fadeInUp} initial="hidden" animate="visible">
          <GlassPanel>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Recent Assessments</h2>
              <Link to="/dashboard/history" className="text-xs text-accent hover:text-accent/80 transition-colors">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentAssessments.map((assessment) => (
                <div key={assessment._id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: getSeverityColor(assessment.intensityLevel) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/40 capitalize">{assessment.sourceType}</span>
                      <span className="text-[10px] text-white/20">•</span>
                      <span className="text-xs text-white/40">{toSentenceCase(assessment.issueCategory)}</span>
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2">{assessment.summary}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          backgroundColor: getSeverityBg(assessment.intensityLevel),
                          color: getSeverityColor(assessment.intensityLevel),
                          border: `1px solid ${getSeverityColor(assessment.intensityLevel)}30`,
                        }}
                      >
                        {assessment.intensityLevel}
                      </span>
                      <span className="text-[10px] text-white/30">{formatDate(assessment.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {recentAssessments.length === 0 && (
                <p className="text-sm text-white/50 text-center py-4">
                  No assessments yet. End a chat to generate your first analysis.
                </p>
              )}
            </div>
          </GlassPanel>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div custom={7} variants={fadeInUp} initial="hidden" animate="visible">
          <GlassPanel>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Upcoming Sessions</h2>
              <Link to="/dashboard/mentor" className="text-xs text-accent hover:text-accent/80 transition-colors">
                Book New
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session._id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">{session.mentor?.name || 'Assigned mentor'}</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      {new Date(session.scheduledDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' • '}
                      {session.startTime} – {session.endTime}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      session.status === 'confirmed'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}

              {upcomingSessions.length === 0 && (
                <p className="text-sm text-white/50 text-center py-4">
                  No upcoming sessions. Book a mentor session to get started.
                </p>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
