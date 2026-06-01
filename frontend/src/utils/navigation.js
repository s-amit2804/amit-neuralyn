export function getDefaultRouteForUser(user) {
  if (!user) {
    return '/login';
  }

  if (user.role === 'ngo' || user.role === 'admin') {
    return '/ngo';
  }

  if (user.role === 'mentor') {
    if (user.mentorType === 'professional') {
      return '/mentor/professional';
    }

    return '/mentor/peer';
  }

  return '/dashboard/chat';
}
