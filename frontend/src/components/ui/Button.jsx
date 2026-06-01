import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 hover:shadow-[0_0_20px_rgba(175,203,255,0.3)]',
  secondary: 'glass-card text-white/80 hover:text-white',
  danger: 'bg-sos/20 text-sos border border-sos/30 hover:bg-sos/30 hover:shadow-[0_0_20px_rgba(255,68,68,0.3)]',
  ghost: 'text-white/50 hover:text-white/80 hover:bg-white/5',
  accent: 'bg-accent text-background-primary font-semibold hover:bg-accent-light hover:shadow-[0_0_30px_rgba(175,203,255,0.4)]',
};

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 cursor-pointer',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  );
}
