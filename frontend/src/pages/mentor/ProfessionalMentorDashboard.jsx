import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Play, Tag, Clock, User, Activity } from 'lucide-react';
import { claimEscalatedCase, getEscalatedCases } from '../../services/sessionService';
import GlassPanel from '../../components/ui/GlassPanel';
import Button from '../../components/ui/Button';
import { formatRelativeDate, getSeverityColor, getSeverityBg, toSentenceCase } from '../../utils/formatters';
import { extractApiError } from '../../services/api';
import toast from 'react-hot-toast';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

export default function ProfessionalMentorDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState('');

  useEffect(() => {
    const loadCases = async () => {
      try {
        const data = await getEscalatedCases();
        setCases(data);
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const handleAccept = async (id) => {
    setClaimingId(id);

    try {
      const updatedCase = await claimEscalatedCase(id);
      setCases((current) => current.map((caseItem) => (caseItem._id === id ? updatedCase : caseItem)));
      toast.success('Case claimed for professional follow-up.');
    } catch (error) {
      toast.error(extractApiError(error, 'Failed to claim the escalated case.'));
    } finally {
      setClaimingId('');
    }
  };

  const handleStartSession = (caseItem) => {
    toast.success(`Open a follow-up session for ${caseItem.user?.name || 'this user'} from the mentor schedule.`);
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escalated Cases</h1>
          <p className="text-sm text-white/40 mt-1">High-severity alerts routed from backend triage</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sos/10 border border-sos/20">
          <AlertTriangle size={12} className="text-sos" />
          <span className="text-xs text-sos/80 font-medium">{cases.length} pending</span>
        </div>
      </div>

      <div className="space-y-4">
        {cases.map((caseItem, index) => {
          const accepted = Boolean(caseItem.assignedTo);

          return (
            <motion.div
              key={caseItem._id}
              custom={index}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <GlassPanel hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: getSeverityBg(caseItem.severity) }}>
                      <User size={18} style={{ color: getSeverityColor(caseItem.severity) }} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white/80">{caseItem.user?.name || 'Anonymous user'}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={10} className="text-white/20" />
                        <span className="text-[10px] text-white/30">{formatRelativeDate(caseItem.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: getSeverityBg(caseItem.severity),
                      color: getSeverityColor(caseItem.severity),
                      border: `1px solid ${getSeverityColor(caseItem.severity)}40`,
                    }}
                  >
                    {caseItem.severity}
                  </span>
                </div>

                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  {caseItem.assessment?.summary || caseItem.message}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <Activity size={14} className="text-white/30" />
                  <span className="text-xs text-white/30">Distress:</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((caseItem.assessment?.distressScore || 0) * 10, 100)}%`,
                        backgroundColor: getSeverityColor(caseItem.severity),
                      }}
                    />
                  </div>
                  <span className="text-xs capitalize" style={{ color: getSeverityColor(caseItem.severity) }}>
                    {caseItem.assessment?.distressScore || 0}/10
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {(caseItem.assessment?.keyPhrases || []).map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-sos/8 text-sos/70 border border-sos/15"
                    >
                      <Tag size={8} />
                      {keyword}
                    </span>
                  ))}
                  {(caseItem.assessment?.keyPhrases || []).length === 0 && (
                    <span className="text-xs text-white/35">{toSentenceCase(caseItem.assessment?.intensityLevel || 'high')} follow-up needed</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-glass-border">
                  <p className="text-xs text-white/35">
                    {accepted ? `Claimed by ${caseItem.assignedTo?.name || 'mentor'}` : 'Not claimed yet'}
                  </p>

                  {!accepted ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleAccept(caseItem._id)}
                      disabled={claimingId === caseItem._id}
                    >
                      {claimingId === caseItem._id ? 'Claiming...' : 'Claim Case'}
                    </Button>
                  ) : (
                    <Button variant="accent" size="sm" icon={Play} onClick={() => handleStartSession(caseItem)}>
                      Start Follow-up
                    </Button>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}

        {cases.length === 0 && (
          <GlassPanel className="p-8 text-center">
            <p className="text-sm text-white/55">No escalated cases are waiting right now.</p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
