import { cn } from '../../utils/cn';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  icon: Icon,
  error,
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ position: 'relative', zIndex: 1 }}
          className={cn(
            'glass-input w-full',
            Icon && 'pl-12',
            error && 'border-sos/50 focus:border-sos/70',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-sos/80">{error}</p>
      )}
    </div>
  );
}
