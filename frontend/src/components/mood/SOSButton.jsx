import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone } from 'lucide-react';
import { triggerSOS } from '../../services/sosService';
import toast from 'react-hot-toast';

export default function SOSButton() {
  const [loading, setLoading] = useState(false);

  const handleSOS = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await triggerSOS();
      toast(result?.message || 'Support alert sent to the NGO team.', {
        icon: '🚨',
        style: {
          background: 'rgba(30, 30, 30, 0.95)',
          color: '#fff',
          border: '1px solid rgba(255, 68, 68, 0.3)',
          backdropFilter: 'blur(12px)',
        },
        duration: 4000,
      });
    } catch (error) {
      toast.error(error.message || 'Failed to send SOS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleSOS}
      disabled={loading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-sos flex items-center justify-center cursor-pointer
        shadow-[0_0_15px_rgba(255,68,68,0.4),0_0_30px_rgba(255,68,68,0.15)]
        animate-sos-pulse transition-all duration-300
        hover:shadow-[0_0_30px_rgba(255,68,68,0.6),0_0_60px_rgba(255,68,68,0.2)]"
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        ) : (
          <motion.div
            key="icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Phone size={22} className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-sos/20" />
    </motion.button>
  );
}
