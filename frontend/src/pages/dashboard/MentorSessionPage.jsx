import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Phone, Clock, User, Calendar, CalendarDays, Languages, BadgeCheck } from 'lucide-react';
import {
  bookMentorSession,
  flattenAvailability,
  getAvailableMentors,
  getUserSessions,
} from '../../services/sessionService';
import { useAuth } from '../../context/AuthContext';
import GlassPanel from '../../components/ui/GlassPanel';
import Button from '../../components/ui/Button';
import RecordingUI from '../../components/recording/RecordingUI';
import { formatSessionDate } from '../../utils/formatters';
import { extractApiError } from '../../services/api';
import toast from 'react-hot-toast';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const getDefaultDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

export default function MentorSessionPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [preferredLanguage, setPreferredLanguage] = useState(user?.language || 'en');
  const [preferredGender, setPreferredGender] = useState('no_preference');
  const [loading, setLoading] = useState(true);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [showRecording, setShowRecording] = useState(false);
  const [bookingSlot, setBookingSlot] = useState('');

  const upcomingSessions = useMemo(
    () => sessions.filter((session) => session.status !== 'completed'),
    [sessions]
  );

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await getUserSessions();
        setSessions(data);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  useEffect(() => {
    const loadMentors = async () => {
      setLoadingMentors(true);
      try {
        const data = await getAvailableMentors({
          date: selectedDate,
          language: preferredLanguage,
          gender: preferredGender,
        });
        setAvailableMentors(flattenAvailability(data));
      } catch {
        setAvailableMentors([]);
      } finally {
        setLoadingMentors(false);
      }
    };

    loadMentors();
  }, [preferredGender, preferredLanguage, selectedDate]);

  const handleBookSession = async (slot) => {
    const bookingKey = `${slot.availabilityId}-${slot.slotIndex}`;
    setBookingSlot(bookingKey);

    try {
      await bookMentorSession({
        availabilityId: slot.availabilityId,
        slotIndex: slot.slotIndex,
        languagePreference: preferredLanguage,
        genderPreference: preferredGender,
      });
      toast.success(`Booked ${slot.mentorName} on ${formatSessionDate(slot.date, slot.startTime, slot.endTime)}.`);

      const [nextSessions, nextMentors] = await Promise.all([
        getUserSessions(),
        getAvailableMentors({
          date: selectedDate,
          language: preferredLanguage,
          gender: preferredGender,
        }),
      ]);

      setSessions(nextSessions);
      setAvailableMentors(flattenAvailability(nextMentors));
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to book the session.'));
    } finally {
      setBookingSlot('');
    }
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
      <div>
        <h1 className="text-2xl font-bold text-white">Mentor Sessions</h1>
        <p className="text-sm text-white/40 mt-1">Book live mentor support and track your scheduled sessions</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white/70 mb-4">Upcoming Sessions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {upcomingSessions.map((session, index) => (
            <motion.div
              key={session._id}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
            >
              <GlassPanel hover className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                      <User size={18} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{session.mentor?.name || 'Assigned mentor'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-white/30" />
                        <span className="text-xs text-white/40">
                          {formatSessionDate(session.scheduledDate, session.startTime, session.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    session.status === 'confirmed'
                      ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                      : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {session.meetLink ? <Video size={14} className="text-white/30" /> : <Phone size={14} className="text-white/30" />}
                  <span className="text-xs text-white/30">{session.meetLink ? 'Meet link ready' : 'Awaiting meet link from mentor'}</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={!session.meetLink}
                  onClick={() => session.meetLink && window.open(session.meetLink, '_blank', 'noopener,noreferrer')}
                >
                  {session.meetLink ? 'Join Meeting' : 'Link Pending'}
                </Button>
              </GlassPanel>
            </motion.div>
          ))}

          {upcomingSessions.length === 0 && (
            <GlassPanel className="p-6 md:col-span-2">
              <p className="text-sm text-white/50">No sessions booked yet. Use the mentor calendar below to reserve a slot.</p>
            </GlassPanel>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white/70">Available Mentors</h2>
            <p className="text-xs text-white/35 mt-1">Live availability from the backend mentor schedule</p>
          </div>
        </div>

        <GlassPanel className="p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-[0.2em] block">Date</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="glass-input w-full pl-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-[0.2em] block">Language</label>
              <div className="relative">
                <Languages size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="glass-input w-full pl-11 cursor-pointer"
                >
                  {['en', 'hi', 'ta', 'te', 'kn'].map((language) => (
                    <option key={language} value={language} className="bg-[#111]">
                      {language.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-[0.2em] block">Mentor Preference</label>
              <div className="relative">
                <BadgeCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <select
                  value={preferredGender}
                  onChange={(e) => setPreferredGender(e.target.value)}
                  className="glass-input w-full pl-11 cursor-pointer"
                >
                  <option value="no_preference" className="bg-[#111]">No preference</option>
                  <option value="male" className="bg-[#111]">Male</option>
                  <option value="female" className="bg-[#111]">Female</option>
                  <option value="non-binary" className="bg-[#111]">Non-binary</option>
                </select>
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="grid md:grid-cols-2 gap-4">
          {loadingMentors && (
            <GlassPanel className="p-6 md:col-span-2">
              <p className="text-sm text-white/50">Loading mentor availability...</p>
            </GlassPanel>
          )}

          {!loadingMentors && availableMentors.map((mentorSlot) => {
            const bookingKey = `${mentorSlot.availabilityId}-${mentorSlot.slotIndex}`;
            return (
              <GlassPanel key={bookingKey} hover className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                    <User size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{mentorSlot.mentorName}</h3>
                    <p className="text-xs text-white/40">{mentorSlot.organization || mentorSlot.mentorLanguage.toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-white/30" />
                  <span className="text-xs text-white/30">
                    {formatSessionDate(mentorSlot.date, mentorSlot.startTime, mentorSlot.endTime)}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleBookSession(mentorSlot)}
                  disabled={bookingSlot === bookingKey}
                >
                  {bookingSlot === bookingKey ? 'Booking...' : 'Book Session'}
                </Button>
              </GlassPanel>
            );
          })}

          {!loadingMentors && availableMentors.length === 0 && (
            <GlassPanel className="p-6 md:col-span-2">
              <p className="text-sm text-white/50">No mentors match your filters on this date yet. Try another day or preference mix.</p>
            </GlassPanel>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/70">Voice Recording</h2>
          <button
            onClick={() => setShowRecording((current) => !current)}
            className="text-xs text-accent hover:text-accent-light transition-colors cursor-pointer"
          >
            {showRecording ? 'Hide' : 'Show'}
          </button>
        </div>

        {showRecording && <RecordingUI />}
      </section>
    </div>
  );
}
