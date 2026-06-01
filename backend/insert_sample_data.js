/**
 * insert_sample_data.js
 * ─────────────────────
 * ADDITIVE script: inserts sample data into the existing MongoDB collections 
 * WITHOUT deleting anything. Safe to run multiple times (idempotent — checks
 * for existing records before inserting).
 *
 * Usage:  node insert_sample_data.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config();

const mongoose = require('mongoose');

const User = require('./models/User');
const ChatSession = require('./models/ChatSession');
const Assessment = require('./models/Assessment');
const Alert = require('./models/Alert');
const Session = require('./models/Session');
const Organization = require('./models/Organization');

async function insertSampleData() {
  console.log('🚀 Starting additive data insertion (no deletes)...');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── Ensure organizations exist ────────────────────────────────────────
  let org = await Organization.findOne({ name: 'MindBridge Global NGO' });
  if (!org) {
    org = await Organization.create({
      name: 'MindBridge Global NGO',
      type: 'ngo',
      location: 'Bangalore, India',
      contactEmail: 'admin@mindbridge.org',
    });
    console.log('  ✅ Created organization: MindBridge Global NGO');
  } else {
    console.log('  ⏭️  Organization already exists: MindBridge Global NGO');
  }

  // ── Ensure test users exist ──────────────────────────────────────────
  const ensureUser = async (email, name, role, ageGroup) => {
    let user = await User.findOne({ email });
    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        ageGroup,
        organization: org._id,
      });
      console.log(`  ✅ Created user: ${email} (${role})`);
    } else {
      console.log(`  ⏭️  User already exists: ${email}`);
    }
    return user;
  };

  const userAccount = await ensureUser('user@test.com', 'Amit Kumar', 'user', '19-21');
  const mentorAccount = await ensureUser('mentor@test.com', 'Dr. Neha Gupta', 'peer_mentor', '25-30');
  const ngoAccount = await ensureUser('ngo@test.com', 'Hope Foundation Admin', 'ngo', '30+');

  // ── Insert sample chat sessions (only if user has fewer than 3) ──────
  const existingChats = await ChatSession.countDocuments({ user: userAccount._id });
  if (existingChats < 3) {
    const sampleChats = [
      {
        user: userAccount._id,
        status: 'completed',
        summary: 'Student discussed intense academic pressure from board exams. Expressed catastrophic thinking and reported sleeplessness for 3 days.',
        messages: [
          { sender: 'bot', content: "Hey there 👋 I'm here to listen. How are you feeling today?" },
          { sender: 'user', content: "I'm really stressed about my board exams. I feel like my life is over if I don't score well." },
          { sender: 'bot', content: "That sounds like a lot of pressure. It's okay to feel overwhelmed — exams are stressful. What part is weighing on you the most?" },
          { sender: 'user', content: "I haven't slept in 3 days. I keep studying but nothing goes in. My parents expect me to top." },
          { sender: 'bot', content: "Sleep deprivation makes everything harder. Your brain needs rest to retain what you study. Would you like to talk about a small step you could take tonight?" },
        ],
      },
      {
        user: userAccount._id,
        status: 'completed',
        summary: 'Peer conflict at school involving social humiliation. Student reports embarrassment and sadness.',
        messages: [
          { sender: 'bot', content: "Hey there 👋 I'm here to listen. How are you feeling today?" },
          { sender: 'user', content: "I got into a fight with my friend group today. They embarrassed me in front of everyone." },
          { sender: 'bot', content: "That must feel really hurtful. Being embarrassed publicly is one of the hardest things. Do you want to tell me what happened?" },
          { sender: 'user', content: "They made fun of something personal I told them in confidence. I feel so stupid for trusting them." },
          { sender: 'bot', content: "You're not stupid — you trusted someone and they broke that trust. That says more about them than you. How are you feeling right now?" },
        ],
      },
      {
        user: userAccount._id,
        status: 'completed',
        summary: 'Mild boredom with online classes. Student shows good coping skills.',
        messages: [
          { sender: 'bot', content: "Hey there 👋 I'm here to listen. How are you feeling today?" },
          { sender: 'user', content: "I'm just bored with online classes. Nothing exciting happening." },
          { sender: 'bot', content: "Boredom can be tough when everything feels monotonous. What do you usually do to make things more interesting for yourself?" },
          { sender: 'user', content: "I play guitar and go for walks. That helps." },
          { sender: 'bot', content: "Those are great coping strategies! Music and movement are powerful mood boosters. Keep it up! 🎸" },
        ],
      },
    ];

    for (const chatData of sampleChats) {
      await ChatSession.create(chatData);
    }
    console.log(`  ✅ Inserted ${sampleChats.length} sample chat sessions`);
  } else {
    console.log(`  ⏭️  User already has ${existingChats} chat sessions, skipping`);
  }

  // ── Insert sample assessments (only if fewer than 3) ──────────────────
  const existingAssessments = await Assessment.countDocuments({ user: userAccount._id });
  if (existingAssessments < 3) {
    const sampleAssessments = [
      {
        user: userAccount._id,
        sourceType: 'chat',
        summary: 'Student discussed intense academic pressure from board exams with catastrophic thinking.',
        issueCategory: 'academic',
        intensityLevel: 'high',
        distressScore: 8.2,
        detectedLanguage: 'en',
        keyPhrases: ['board exams', 'life is over', "can't sleep"],
        triageAction: 'alert_and_escalate',
        triageRationale: 'High distress score with catastrophic thinking warrants professional attention.',
        alertSent: true,
      },
      {
        user: userAccount._id,
        sourceType: 'chat',
        summary: 'Peer conflict at school — social humiliation leading to embarrassment and trust issues.',
        issueCategory: 'peers',
        intensityLevel: 'medium',
        distressScore: 5.1,
        detectedLanguage: 'en',
        keyPhrases: ['fight', 'embarrassed', 'trust'],
        triageAction: 'peer_mentor',
        triageRationale: 'Medium distress from peer conflict. Peer mentor session recommended.',
        alertSent: false,
      },
      {
        user: userAccount._id,
        sourceType: 'chat',
        summary: 'Mild boredom with online classes. Student has good coping strategies in place.',
        issueCategory: 'other',
        intensityLevel: 'low',
        distressScore: 1.5,
        detectedLanguage: 'en',
        keyPhrases: ['bored', 'online classes'],
        triageAction: 'self_help',
        triageRationale: 'Low distress with good coping. Self-help resources sufficient.',
        alertSent: false,
      },
    ];

    for (const a of sampleAssessments) {
      await Assessment.create(a);
    }
    console.log(`  ✅ Inserted ${sampleAssessments.length} sample assessments`);
  } else {
    console.log(`  ⏭️  Already has ${existingAssessments} assessments, skipping`);
  }

  // ── Insert sample alerts (only if fewer than 2) ───────────────────────
  const existingAlerts = await Alert.countDocuments({ user: userAccount._id });
  if (existingAlerts < 2) {
    const assessment = await Assessment.findOne({ user: userAccount._id, intensityLevel: 'high' });
    if (assessment) {
      await Alert.create({
        user: userAccount._id,
        assessment: assessment._id,
        type: 'auto_high',
        severity: 'high',
        status: 'active',
        message: 'High academic distress detected — catastrophic thinking with sleep deprivation.',
      });
      console.log('  ✅ Inserted 1 sample alert');
    }
  } else {
    console.log(`  ⏭️  Already has ${existingAlerts} alerts, skipping`);
  }

  // ── Insert sample mentor session (only if none exist) ────────────────
  const existingSessions = await Session.countDocuments({ mentor: mentorAccount._id });
  if (existingSessions < 1) {
    const MentorAvailability = require('./models/MentorAvailability');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Create or find availability for the mentor
    let availability = await MentorAvailability.findOne({ mentor: mentorAccount._id });
    if (!availability) {
      availability = await MentorAvailability.create({
        mentor: mentorAccount._id,
        date: tomorrow,
        slots: [
          { startTime: '10:00', endTime: '11:00', isBooked: true },
          { startTime: '14:00', endTime: '15:00', isBooked: false },
        ],
        language: 'en',
        gender: 'female',
      });
      console.log('  ✅ Created mentor availability');
    }

    await Session.create({
      user: userAccount._id,
      mentor: mentorAccount._id,
      availability: availability._id,
      slotIndex: 0,
      scheduledDate: tomorrow,
      startTime: '10:00',
      endTime: '11:00',
      status: 'confirmed',
      meetLink: 'https://meet.google.com/mindbridge-demo',
      summary: '',
    });
    console.log('  ✅ Inserted 1 sample mentor session');
  } else {
    console.log(`  ⏭️  Already has ${existingSessions} sessions, skipping`);
  }

  console.log('\n🎉 Sample data insertion complete!\n');
  console.log('──────────────────────────────────────');
  console.log('Test Credentials:');
  console.log('  User:   user@test.com   / password123');
  console.log('  Mentor: mentor@test.com / password123');
  console.log('  NGO:    ngo@test.com    / password123');
  console.log('──────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

insertSampleData().catch((error) => {
  console.error('❌ Insertion Failed:', error);
  process.exit(1);
});
