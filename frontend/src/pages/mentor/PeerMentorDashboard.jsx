import { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, Clock, Trash2, Save, CheckCircle2, ArrowRight, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  completeMentorSession,
  deleteAvailability,
  getAssignedSessions,
  getMentorAvailability,
  publishAvailability,
  saveMeetLink,
} from '../../services/sessionService';
import { extractApiError } from '../../services/api';
import { formatSessionDate } from '../../utils/formatters';

// ── Sample data when backend returns empty ───────────────────────────────────
const SAMPLE_SESSIONS = [
  {
    _id: 'sample-s1',
    user: { name: 'Amit Kumar', ageGroup: '19-21' },
    scheduledDate: new Date(Date.now() + 86400000).toISOString(),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    meetLink: 'https://meet.google.com/abc-test-xyz',
    summary: '',
  },
  {
    _id: 'sample-s2',
    user: { name: 'Priya Sharma', ageGroup: '16-18' },
    scheduledDate: new Date(Date.now() + 172800000).toISOString(),
    startTime: '14:00',
    endTime: '15:00',
    status: 'pending',
    meetLink: '',
    summary: '',
  },
];

const SAMPLE_AVAILABILITY = [
  {
    _id: 'sample-avail-1',
    date: new Date(Date.now() + 604800000).toISOString(),
    slots: [
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '14:00', endTime: '15:00' },
    ],
  },
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function PeerMentorDashboard() {
  const [availability, setAvailability] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [slotForm, setSlotForm] = useState({
    date: getTodayDate(),
    startTime: '10:00',
    endTime: '11:00',
  });
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [publishingSlot, setPublishingSlot] = useState(false);

  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === selectedSessionId) || sessions[0] || null,
    [selectedSessionId, sessions]
  );

  useEffect(() => {
    const loadWorkspace = async () => {
      setLoading(true);

      try {
        const [availabilityData, sessionData] = await Promise.all([
          getMentorAvailability(),
          getAssignedSessions(),
        ]);

        const hasData = availabilityData.length > 0 || sessionData.length > 0;

        if (hasData) {
          setAvailability(availabilityData);
          setSessions(sessionData);
        } else {
          setUsingSampleData(true);
          setAvailability(SAMPLE_AVAILABILITY);
          setSessions(SAMPLE_SESSIONS);
        }

        const activeSession = hasData ? sessionData[0] : SAMPLE_SESSIONS[0];
        if (activeSession) {
          setSelectedSessionId(activeSession._id);
          setMeetingLink(activeSession.meetLink || '');
          setNotes(activeSession.summary || '');
        }
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to load mentor workspace.'));
        setUsingSampleData(true);
        setAvailability(SAMPLE_AVAILABILITY);
        setSessions(SAMPLE_SESSIONS);
        setSelectedSessionId(SAMPLE_SESSIONS[0]._id);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, []);

  useEffect(() => {
    if (!selectedSession) {
      setMeetingLink('');
      setNotes('');
      return;
    }

    setMeetingLink(selectedSession.meetLink || '');
    setNotes(selectedSession.summary || '');
  }, [selectedSession]);

  const reloadData = async () => {
    const [availabilityData, sessionData] = await Promise.all([
      getMentorAvailability(),
      getAssignedSessions(),
    ]);

    setAvailability(availabilityData);
    setSessions(sessionData);
  };

  const handleAddSlot = async () => {
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      return;
    }

    setPublishingSlot(true);

    try {
      const sameDayEntry = availability.find((entry) => entry.date.split('T')[0] === slotForm.date);
      const nextSlots = [
        ...(sameDayEntry?.slots || []),
        { startTime: slotForm.startTime, endTime: slotForm.endTime },
      ];

      await publishAvailability({
        date: slotForm.date,
        slots: nextSlots,
      });

      await reloadData();
      toast.success('Availability updated.');
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to publish the slot.'));
    } finally {
      setPublishingSlot(false);
    }
  };

  const handleRemoveSlot = async (entryId, slotIndex) => {
    try {
      const entry = availability.find((item) => item._id === entryId);
      if (!entry) {
        return;
      }

      const nextSlots = entry.slots.filter((_, index) => index !== slotIndex);

      if (nextSlots.length === 0) {
        await deleteAvailability(entryId);
      } else {
        await publishAvailability({
          date: entry.date.split('T')[0],
          slots: nextSlots,
        });
      }

      await reloadData();
      toast.success('Availability removed.');
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to remove the slot.'));
    }
  };

  const handleSaveMeetLink = async () => {
    if (!selectedSession || !meetingLink) {
      return;
    }

    setSavingLink(true);

    try {
      await saveMeetLink(selectedSession._id, meetingLink);
      await reloadData();
      toast.success('Meet link shared with the user.');
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to save the meet link.'));
    } finally {
      setSavingLink(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession || !notes.trim()) {
      toast.error('Add session notes before finalizing.');
      return;
    }

    setSavingSession(true);

    try {
      await completeMentorSession(selectedSession._id, { notes });
      await reloadData();
      toast.success('Session completed and analyzed.');
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to complete the session.'));
    } finally {
      setSavingSession(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white font-semibold">Loading workspace...</div>;
  }

  return (
    <div className="p-6">
      {usingSampleData && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <Calendar size={16} className="text-accent flex-shrink-0" />
          <p className="text-xs text-accent/80">
            Showing sample data — seed the database for live results.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Today&apos;s Caseload <span className="text-2xl">🧑‍🏫</span>
            </h1>
            <p className="text-white/40 mt-1">Manage live sessions, notes, and availability from the backend calendar</p>
          </div>

          <div className="flex flex-col gap-3 flex-wrap">
            {sessions.map((session) => (
              <button
                key={session._id}
                onClick={() => setSelectedSessionId(session._id)}
                className={`bg-white/5 border rounded-xl p-4 flex flex-row items-center justify-between transition-colors text-left cursor-pointer ${
                  selectedSession?._id === session._id ? 'border-accent/40 bg-accent/10' : 'border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex flex-row gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <Users size={20} className="text-accent" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="m-0 font-bold text-white text-lg">
                      {session.user?.name || 'User'}
                      <span className="text-xs text-white/40 ml-1 font-medium">({session.user?.ageGroup || 'N/A'})</span>
                    </h3>
                    <p className="m-0 text-white/50 text-xs mt-0.5 flex items-center gap-1">
                      <Clock size={12} />
                      {formatSessionDate(session.scheduledDate, session.startTime, session.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row gap-4 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    session.status === 'completed'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {session.status}
                  </span>
                  <div className="p-2 rounded-lg bg-white/5 hover:bg-white/20 text-white transition-colors">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </button>
            ))}

            {sessions.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/50">
                No assigned mentor sessions yet.
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-accent" />

            <div className="flex flex-row justify-between mb-8 items-center border-b border-white/10 pb-4">
              <h2 className="flex items-center gap-3 m-0 text-xl font-bold text-white">
                <Users size={24} className="text-accent" /> Case Focus: {selectedSession?.user?.name || 'No active session'}
              </h2>
              {selectedSession?.status === 'completed' && (
                <span className="bg-green-500/20 border border-green-500/40 text-green-400 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 size={16} /> Completed
                </span>
              )}
            </div>

            {selectedSession ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 relative">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/50 bg-background-primary px-2 absolute -top-2.5 left-3">Video Link</label>
                  <div className="flex flex-row gap-0">
                    <input
                      className="bg-transparent border border-white/20 rounded-l-xl flex-1 text-sm font-mono p-3 text-white focus:outline-none focus:border-accent"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                    />
                    <button
                      onClick={handleSaveMeetLink}
                      disabled={savingLink}
                      className="bg-white/10 hover:bg-white/20 border border-l-0 border-white/20 rounded-r-xl px-4 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 relative mt-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/50 bg-background-primary px-2 absolute -top-2.5 left-3">Confidential Notes</label>
                  <textarea
                    className="bg-transparent border border-white/20 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent h-32 resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did the user discuss? What support should happen next?"
                  />
                </div>

                <button
                  className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest mt-2 transition-all cursor-pointer ${
                    selectedSession.status === 'completed'
                      ? 'bg-white/5 text-white/40 border border-white/10'
                      : 'bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30'
                  }`}
                  onClick={handleCompleteSession}
                  disabled={savingSession || selectedSession.status === 'completed'}
                >
                  {savingSession ? 'Finalizing...' : selectedSession.status === 'completed' ? 'Session Completed' : 'Finalize & Sign Off Session'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-white/50">Select a session to manage notes and the meet link.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 bg-accent/20 p-4 rounded-full blur-xl w-32 h-32 pointer-events-none" />
            <h3 className="flex items-center gap-2 mb-6 text-lg font-bold text-white relative z-10">
              <Calendar className="text-accent" size={20} /> Slot Manager
            </h3>

            <div className="space-y-3 mb-6">
              {availability.map((entry) => (
                <div key={entry._id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">{entry.date.split('T')[0]}</p>
                  <div className="space-y-2">
                    {entry.slots.map((slot, index) => (
                      <div key={`${entry._id}-${slot.startTime}-${slot.endTime}`} className="flex justify-between items-center bg-black/10 rounded-lg p-3 group">
                        <span className="text-sm text-white font-medium">{slot.startTime} - {slot.endTime}</span>
                        <button
                          onClick={() => handleRemoveSlot(entry._id, index)}
                          className="text-white/20 group-hover:text-red-400 hover:scale-110 transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {availability.length === 0 && <div className="p-4 text-center text-xs text-white/40 italic">No availability published yet.</div>}
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <input
                type="date"
                className="bg-transparent border border-white/20 rounded-lg p-3 text-xs uppercase font-bold text-white focus:outline-none focus:border-accent"
                value={slotForm.date}
                onChange={(e) => setSlotForm((current) => ({ ...current, date: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  className="bg-transparent border border-white/20 rounded-lg p-3 text-xs uppercase font-bold text-white focus:outline-none focus:border-accent"
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm((current) => ({ ...current, startTime: e.target.value }))}
                />
                <input
                  type="time"
                  className="bg-transparent border border-white/20 rounded-lg p-3 text-xs uppercase font-bold text-white focus:outline-none focus:border-accent"
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm((current) => ({ ...current, endTime: e.target.value }))}
                />
              </div>
              <button
                className="w-full py-3 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 rounded-lg text-xs font-bold tracking-widest uppercase transition-all cursor-pointer disabled:opacity-50"
                onClick={handleAddSlot}
                disabled={publishingSlot}
              >
                {publishingSlot ? 'Publishing...' : 'Publish Slot'}
              </button>
            </div>
          </div>

          <div className="bg-background-primary border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <h3 className="flex items-center gap-2 mb-6 text-accent text-xs font-bold uppercase tracking-widest relative z-10">
              <Clock size={16} /> Mentor Metrics
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs text-white/50 font-medium">Scheduled Sessions</span>
                <span className="text-lg font-bold text-white">{sessions.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs text-white/50 font-medium">Completed</span>
                <span className="text-lg font-bold text-white">{sessions.filter((session) => session.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-white/50 font-medium">Open Availability Blocks</span>
                <span className="text-lg font-bold text-accent">{availability.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
