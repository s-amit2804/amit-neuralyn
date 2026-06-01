const Assessment = require('../models/Assessment');
const Alert = require('../models/Alert');
const { runMlPipeline } = require('./mlPipelineService');

const classifyIssueCategory = (text = '') => {
  const lowerText = text.toLowerCase();

  if (/parent|mom|dad|family|home|sibling|father|mother/.test(lowerText)) return 'parents';
  if (/friend|peer|bully|bullied|classmate|group|social media|left out/.test(lowerText)) return 'peers';
  if (/relationship|boyfriend|girlfriend|breakup|heartbreak|crush|love/.test(lowerText)) return 'relationship';
  if (/exam|study|grade|mark|school|college|fail|academic|teacher/.test(lowerText)) return 'academic';
  if (/lonely|alone|excluded|no friends|socially/.test(lowerText)) return 'social';
  if (/confident|self-worth|ugly|worthless|hate myself|identity/.test(lowerText)) return 'self_esteem';
  if (/anxious|panic|anxiety|nervous|fear|overwhelm|stress/.test(lowerText)) return 'anxiety';
  return 'other';
};

const toLegacyNextStep = (intensityLevel) => {
  if (intensityLevel === 'high') return 'ngo_alerted';
  if (intensityLevel === 'medium') return 'user_choice';
  return 'self_manage';
};

const syncAlertForAssessment = async (assessment) => {
  if (assessment.intensityLevel !== 'high') {
    return null;
  }

  const alert = await Alert.findOneAndUpdate(
    {
      assessment: assessment._id,
      type: 'auto_high',
    },
    {
      user: assessment.user,
      assessment: assessment._id,
      type: 'auto_high',
      severity: 'high',
      message: `High distress detected. Category: ${assessment.issueCategory}. Immediate offline intervention required.`,
      status: 'active',
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    }
  );

  if (!assessment.alertSent) {
    assessment.alertSent = true;
    await assessment.save();
  }

  return alert;
};

const analyzeAndPersistAssessment = async ({
  userId,
  sourceType = 'direct',
  sourceId = null,
  text = null,
  audioPath = null,
}) => {
  if (!text && !audioPath) {
    throw new Error('Either text or audio input is required for assessment.');
  }

  console.log(
    `[Assessment] Starting analysis sourceType="${sourceType}" ` +
    `sourceId="${sourceId || 'direct'}" text=${Boolean(text)} audio=${Boolean(audioPath)}`
  );

  const pipelineResult = await runMlPipeline({
    text,
    audio_path: audioPath,
  });

  const summaryText = pipelineResult.summary?.summary || pipelineResult.raw_text || '';
  const issueCategory = classifyIssueCategory(
    [summaryText, pipelineResult.raw_text, ...(pipelineResult.scoring?.key_phrases || [])].join(' ')
  );
  const intensityLevel = pipelineResult.scoring?.intensity || 'low';

  const sourceModel =
    sourceType === 'chat'
      ? 'ChatSession'
      : sourceType === 'meet'
      ? 'Session'
      : undefined;

  const assessmentPayload = {
    user: userId,
    sourceType,
    sourceId,
    sourceModel,
    summary: summaryText,
    issueCategory,
    intensityLevel,
    distressScore: pipelineResult.scoring?.score ?? 0,
    keyPhrases: pipelineResult.scoring?.key_phrases || [],
    triageAction: pipelineResult.triage?.action || 'self_help',
    triageLabel: pipelineResult.triage?.label || '',
    triageRationale: pipelineResult.triage?.rationale || '',
    detectedLanguage: pipelineResult.detected_language || 'unknown',
    rawText: pipelineResult.raw_text || '',
    normalisedText: pipelineResult.normalised_text || '',
    transcriptionText: pipelineResult.transcription?.text || '',
    alertSent: intensityLevel === 'high',
  };

  const assessment =
    sourceId && sourceType !== 'direct'
      ? await Assessment.findOneAndUpdate(
          { user: userId, sourceType, sourceId },
          assessmentPayload,
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        )
      : await Assessment.create(assessmentPayload);

  const alert = await syncAlertForAssessment(assessment);

  console.log(
    `[Assessment] Completed analysis issue="${issueCategory}" intensity="${intensityLevel}" ` +
    `triage="${assessment.triageAction}" alert=${Boolean(alert)}`
  );

  return {
    assessment,
    alert,
    pipelineResult,
    nextStep: pipelineResult.triage?.action || 'self_help',
    legacyNextStep: toLegacyNextStep(intensityLevel),
  };
};

module.exports = {
  analyzeAndPersistAssessment,
  classifyIssueCategory,
  toLegacyNextStep,
};
