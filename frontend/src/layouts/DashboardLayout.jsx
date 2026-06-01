import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MessageSquare, Users, History, Settings, LogOut, Menu, X, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMood } from '../context/MoodContext';
import MoodSlider from '../components/mood/MoodSlider';
import SOSButton from '../components/mood/SOSButton';
import OnboardingModal from '../components/OnboardingModal';

const sidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/dashboard/mentor', icon: Users, label: 'Mentor Session' },
  { to: '/dashboard/history', icon: History, label: 'History' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, logout, needsOnboarding } = useAuth();
  const { currentMood } = useMood();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white" data-mood={currentMood}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:static z-50 h-full w-72 flex flex-col border-r border-glass-border bg-background-primary/80 backdrop-blur-xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-glass-border">
          <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
            <Brain size={20} className="text-accent" />
          </div>
          <span className="text-lg font-bold text-gradient">NueraLyn</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-2 rounded-lg hover:bg-white/5 text-white/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mood Input */}
        <div className="px-4 py-4 border-b border-glass-border">
          <MoodSlider compact />
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-glass-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-white/40 hover:text-sos/80"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-glass-border bg-background-primary/80 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/50"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-gradient">NueraLyn</span>
        </div>

        <div className="flex-1 overflow-y-auto relative">
          <div className="mood-overlay" style={{ background: 'var(--mood-overlay)' }} />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* SOS Button */}
      <SOSButton />

      {/* Onboarding Modal */}
      {needsOnboarding && <OnboardingModal />}
    </div>
  );
}
