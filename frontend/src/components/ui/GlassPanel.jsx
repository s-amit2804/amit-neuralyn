import { cn } from '../../utils/cn';

export default function GlassPanel({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
  ...props
}) {
  return (
    <div
      className={cn(
        'glass-panel',
        padding,
        hover && 'transition-all duration-300 hover:bg-glass-hover hover:border-accent/20 hover:shadow-[0_8px_32px_rgba(175,203,255,0.1)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
