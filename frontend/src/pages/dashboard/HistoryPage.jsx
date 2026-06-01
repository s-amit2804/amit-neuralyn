import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, Users, Mic, ChevronRight, Activity, BadgeAlert } from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import { getAssessments } from '../../services/assessmentService';
import { formatDate, getSeverityColor, getSeverityBg, toSentenceCase } from '../../utils/formatters';

// ── Sample data shown when backend returns empty ─────────────────────────────
const SAMPLE_ASSESSMENTS = [
  {
    _id: 'sample-1',
    sourceType: 'chat',
    issueCategory: 'academic',
    intensityLevel: 'high',
    distressScore: 8.2,
    detectedLanguage: 'en',
    keyPhrases: ['board exams', 'life is over', 'can\'t sleep'],
    triageAction: 'alert_and_escalate',
    triageRationale: 'High distress score with catastrophic thinking warrants professional attention.',
    summary: 'Student expressed severe academic pressure and catastrophic thinking about exam failure. Reports insomnia.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'sample-2',
    sourceType: 'chat',
    issueCategory: 'peers',
    intensityLevel: 'medium',
    distressScore: 5.1,
    detectedLanguage: 'en',
    keyPhrases: ['fight', 'embarrassed'],
    triageAction: 'peer_mentor',
    triageRationale: 'Medium distress from peer conflict. A peer mentor session can help.',
    summary: 'Peer conflict involving public humiliation. Reports embarrassment and sadness.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: 'sample-3',
    sourceType: 'chat',
    issueCategory: 'other',
    intensityLevel: 'low',
    distressScore: 1.5,
    detectedLanguage: 'en',
    keyPhrases: ['bored', 'online classes'],
    triageAction: 'self_help',
    triageRationale: 'Low distress with good coping. Self-help resources sufficient.',
    summary: 'Mild boredom with online classes. Good coping strategies in place.',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const typeIcons = {
  chat: MessageSquare,
  meet: Users,
  direct: Mic,
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function HistoryPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getAssessments();
        if (data.length > 0) {
          setAssessments(data);
        } else {
          setUsingSampleData(true);
          setAssessments(SAMPLE_ASSESSMENTS);
        }
      } catch {
        setUsingSampleData(true);
        setAssessments(SAMPLE_ASSESSMENTS);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

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
        <h1 className="text-2xl font-bold text-white">Assessment History</h1>
        <p className="text-sm text-white/40 mt-1">Review summaries, distress scores, and support decisions</p>
      </div>

      {usingSampleData && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <Activity size={16} className="text-accent flex-shrink-0" />
          <p className="text-xs text-accent/80">
            Showing sample data — end a chat session for live results.
          </p>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-accent/30 via-accent/10 to-transparent" />

        <div className="space-y-4">
          {assessments.map((assessment, index) => {
            const TypeIcon = typeIcons[assessment.sourceType] || MessageSquare;
            const isExpanded = expandedId === assessment._id;

            return (
              <motion.div
                key={assessment._id}
                custom={index}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="relative pl-12"
              >
                <div className="absolute left-2.5 top-6 w-4 h-4 rounded-full border-2 border-accent/40 bg-background-primary z-10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                </div>

                <GlassPanel
                  hover
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : assessment._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TypeIcon size={16} className="text-accent/70" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-white/30 capitalize">{assessment.sourceType} analysis</span>
                          <span className="text-[10px] text-white/20">•</span>
                          <span className="text-xs text-white/30">{toSentenceCase(assessment.issueCategory)}</span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{assessment.summary}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                      <span className="text-xs text-white/30">{formatDate(assessment.createdAt)}</span>
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
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight size={14} className="text-white/20" />
                      </motion.div>
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-glass-border space-y-4"
                    >
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="glass-card p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity size={12} className="text-accent/50" />
                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Distress Score</span>
                          </div>
                          <p className="text-lg font-semibold" style={{ color: getSeverityColor(assessment.intensityLevel) }}>
                            {assessment.distressScore}/10
                          </p>
                        </div>

                        <div className="glass-card p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <BadgeAlert size={12} className="text-accent/50" />
                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Triage</span>
                          </div>
                          <p className="text-sm font-semibold text-white/70">{toSentenceCase(assessment.triageAction)}</p>
                        </div>

                        <div className="glass-card p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={12} className="text-accent/50" />
                            <span className="text-[10px] text-white/30 uppercase tracking-wider">Language</span>
                          </div>
                          <p className="text-sm font-semibold text-white/70 uppercase">{assessment.detectedLanguage || 'N/A'}</p>
                        </div>
                      </div>

                      {assessment.keyPhrases?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {assessment.keyPhrases.map((phrase) => (
                            <span
                              key={phrase}
                              className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] text-accent"
                            >
                              {phrase}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-white/40 leading-relaxed">
                        {assessment.triageRationale || 'This assessment did not include a triage rationale.'}
                      </p>
                    </motion.div>
                  )}
                </GlassPanel>
              </motion.div>
            );
          })}

          {assessments.length === 0 && (
            <GlassPanel className="p-8 text-center">
              <p className="text-sm text-white/60">No assessments yet. End a chat or submit a recording to populate your history.</p>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
