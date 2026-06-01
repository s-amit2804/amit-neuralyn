export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getSeverityColor(level) {
  const colors = {
    low: '#4ADE80',
    medium: '#FBBF24',
    high: '#F97316',
    critical: '#EF4444',
  };
  return colors[level] || colors.low;
}

export function formatSessionDate(date, startTime, endTime) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));

  if (!startTime) {
    return formattedDate;
  }

  return `${formattedDate} • ${startTime}${endTime ? ` - ${endTime}` : ''}`;
}

export function formatRelativeDate(date) {
  const value = new Date(date);
  const diffInHours = Math.round((Date.now() - value.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'just now';
  }

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
}

export function toSentenceCase(value = '') {
  if (!value) {
    return '';
  }

  return value
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getSeverityBg(level) {
  const colors = {
    low: 'rgba(74, 222, 128, 0.15)',
    medium: 'rgba(251, 191, 36, 0.15)',
    high: 'rgba(249, 115, 22, 0.15)',
    critical: 'rgba(239, 68, 68, 0.15)',
  };
  return colors[level] || colors.low;
}
