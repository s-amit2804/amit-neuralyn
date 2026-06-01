const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/authRoutes');
const mentorRoutes     = require('./routes/mentorRoutes');
const sessionRoutes    = require('./routes/sessionRoutes');
const chatRoutes       = require('./routes/chatRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const alertRoutes      = require('./routes/alertRoutes');
const dashboardRoutes  = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const getServiceStatus = () => {
  const azureConfigured = Boolean(
    process.env.AZURE_OPENAI_API_KEY &&
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_WHISPER_DEPLOYMENT_NAME
  );
  const openRouterConfigured = Boolean(process.env.OPENROUTER_API_KEY);

  return {
    database: 'MongoDB',
    llm: openRouterConfigured
      ? `OpenRouter (${process.env.CHAT_MODEL_ID || process.env.OPENROUTER_CHAT_MODEL || 'qwen3.5-397b-a17b'})`
      : 'Fallback responses only',
    transcription: azureConfigured
      ? `Azure Whisper (${process.env.AZURE_WHISPER_DEPLOYMENT_NAME})`
      : 'Not configured',
    scoring: process.env.MENTAL_ROBERTA_MODEL || 'MentalRoBERTa / ML pipeline',
    mlPython: process.env.ML_PYTHON_BIN || path.join(path.resolve(__dirname, '..'), 'venv', 'bin', 'python'),
  };
};

const logStartupSummary = () => {
  const services = getServiceStatus();

  console.log('');
  console.log('================ MindBridge Backend ================');
  console.log(`Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port        : ${PORT}`);
  console.log(`Database    : ${services.database}`);
  console.log(`LLM         : ${services.llm}`);
  console.log(`Transcriber : ${services.transcription}`);
  console.log(`Scoring     : ${services.scoring}`);
  console.log(`ML Python   : ${services.mlPython}`);
  console.log('Logs        : [LLM] chat model calls, [ML] pipeline calls, [Assessment] end-to-end triage');
  console.log('====================================================');
  console.log('');
};

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());                        // Allow cross-origin requests from the React frontend
app.use(express.json({ limit: '25mb' }));                // Accept text and base64 audio payloads
app.use(express.urlencoded({ extended: true, limit: '25mb' })); // Parse URL-encoded bodies

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/mentors',     mentorRoutes);
app.use('/api/sessions',    sessionRoutes);
app.use('/api/chat',        chatRoutes);
app.use('/api/assessment',  assessmentRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/dashboard',   dashboardRoutes);

// ── Health check endpoint ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🧠 MindBridge API is running',
    version: '1.0.0',
    endpoints: {
      auth:       '/api/auth',
      mentors:    '/api/mentors',
      sessions:   '/api/sessions',
      chat:       '/api/chat',
      assessment: '/api/assessment',
      alerts:     '/api/alerts',
      dashboard:  '/api/dashboard',
    },
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Catches any errors thrown with next(err) pattern in controllers
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Handle unmatched routes ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Start server ──────────────────────────────────────────────────────────────
const startServer = async () => {
  logStartupSummary();
  await connectDB();
  return app.listen(PORT, () => {
    console.log(`🚀 MindBridge server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log('✅ Ready to accept API requests.');
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
