import { motion } from 'framer-motion';

export default function MessageBubble({ message, isBot }) {
  const botMessage = isBot ?? message.sender === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${botMessage ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div
        className={`max-w-[80%] lg:max-w-[70%] rounded-2xl px-5 py-3.5 ${
          botMessage
            ? 'bg-glass border border-glass-border rounded-tl-md'
            : 'bg-accent/15 border border-accent/20 rounded-tr-md'
        }`}
      >
        {botMessage && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-[10px]">🧠</span>
            </div>
            <span className="text-[10px] text-accent/60 font-medium uppercase tracking-wider">NueraLyn AI</span>
          </div>
        )}
        <p className={`text-sm leading-relaxed ${botMessage ? 'text-white/70' : 'text-white/80'}`}>
          {message.text}
        </p>
        <p className="text-[10px] text-white/20 mt-2">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
