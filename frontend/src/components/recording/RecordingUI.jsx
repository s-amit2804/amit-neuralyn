import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Upload, FileAudio2 } from 'lucide-react';
import SplineViewer from '../../components/spline/SplineViewer';
import Button from '../../components/ui/Button';
import { submitRecording } from '../../services/recordingService';
import { formatTime, toSentenceCase } from '../../utils/formatters';
import { extractApiError } from '../../services/api';
import toast from 'react-hot-toast';

export default function RecordingUI({ onComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!isRecording) {
      window.clearInterval(timerRef.current);
      return undefined;
    }

    timerRef.current = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => () => {
    window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start();
      setAnalysis(null);
      setSeconds(0);
      setIsRecording(true);
    } catch (error) {
      toast.error(extractApiError(error, 'Microphone access is required to record audio.'));
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    setIsRecording(false);
    setProcessing(true);

    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const result = await submitRecording(blob, `voice-note-${Date.now()}.webm`);
        setAnalysis(result);
        onComplete?.(result);
        toast.success('Voice note analyzed successfully.');
      } catch (error) {
        toast.error(extractApiError(error, 'Failed to process the recording.'));
      } finally {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];
        setProcessing(false);
      }
    };

    recorder.stop();
  };

  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <div className="glass-panel p-6">
        <p className="text-sm text-white/60">This browser does not support microphone recording.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 space-y-6">
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 200 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl overflow-hidden"
          >
            <SplineViewer
              url="https://my.spline.design/voiceinteractionanimation-jBgLbgBJdNgfjwS8h1sKqFqB/"
              className="w-full h-[200px]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-4">
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <span className="w-3 h-3 rounded-full bg-sos animate-pulse" />
            <span className="text-sm text-white/70 font-mono">{formatTime(seconds)}</span>
          </motion.div>
        )}
      </div>

      <div className="h-16 rounded-xl overflow-hidden bg-white/3 flex items-center justify-center">
        <div className="flex items-end gap-1 h-8">
          {Array.from({ length: 18 }).map((_, index) => (
            <motion.span
              key={`bar-${index}`}
              className="w-2 rounded-full bg-accent/50"
              animate={{ height: isRecording ? [8, 28, 12, 24] : 8 }}
              transition={{ repeat: Infinity, duration: 1.2, delay: index * 0.04 }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <Button variant="primary" size="lg" icon={Mic} onClick={startRecording} disabled={processing}>
            {processing ? 'Processing...' : 'Start Recording'}
          </Button>
        ) : (
          <Button variant="danger" size="lg" icon={Square} onClick={stopRecording}>
            Stop Recording
          </Button>
        )}
      </div>

      {analysis && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileAudio2 size={16} className="text-accent" />
            <p className="text-sm text-white/75">Backend audio assessment complete</p>
          </div>

          <p className="text-sm text-white/65 leading-relaxed">{analysis.summary}</p>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl border border-white/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Issue</p>
              <p className="text-sm text-white/80 mt-1">{toSentenceCase(analysis.issueCategory)}</p>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Intensity</p>
              <p className="text-sm text-white/80 mt-1 capitalize">{analysis.intensityLevel}</p>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Score</p>
              <p className="text-sm text-white/80 mt-1">{analysis.distressScore}/10</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
