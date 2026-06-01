import { getAssessments, requestHelpAlert } from './assessmentService';

export async function triggerSOS() {
  const assessments = await getAssessments();
  const latestAssessment = assessments[0];

  if (!latestAssessment) {
    throw new Error('Complete a chat or voice assessment first so we can route you to the right support.');
  }

  if (latestAssessment.alertSent || latestAssessment.intensityLevel === 'high') {
    return {
      alreadyEscalated: true,
      message: 'A high-priority alert is already active for your latest assessment.',
    };
  }

  if (latestAssessment.intensityLevel !== 'medium') {
    throw new Error('Use SOS after a medium-risk assessment, or continue chatting so the system can triage you accurately.');
  }

  return requestHelpAlert(latestAssessment._id);
}
