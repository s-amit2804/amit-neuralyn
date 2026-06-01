require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const Organization = require('./models/Organization');
const User = require('./models/User');
const MentorAvailability = require('./models/MentorAvailability');
const ChatSession = require('./models/ChatSession');
const Session = require('./models/Session');
const Assessment = require('./models/Assessment');
const Alert = require('./models/Alert');

const seedData = async () => {
  try {
    console.log('🚀 Starting Database Seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clear existing data
    console.log('🧹 Cleaning old data...');
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      MentorAvailability.deleteMany({}),
      ChatSession.deleteMany({}),
      Session.deleteMany({}),
      Assessment.deleteMany({}),
      Alert.deleteMany({}),
    ]);

    // Small delay to ensure indexes are ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ─── 2. Create Organizations ─────────────────────────────────────────────────
    console.log('🏢 Creating Organizations...');
    const org1 = await Organization.create({
      name: 'MindBridge Global NGO',
      type: 'ngo',
      contactEmail: 'contact@mindbridge.org',
      location: 'Bangalore, India',
    });

    const org2 = await Organization.create({
      name: 'Sunrise Academy',
      type: 'school',
      contactEmail: 'admin@sunrise.edu',
      location: 'Mumbai, India',
    });

    // ─── 3. Create Users (stable credentials) ───────────────────────────────────
    console.log('👤 Creating Users...');

    let user, user2, mentor, ngoAdmin;
    try {
      // Youth User 1
      user = await User.create({
        name: 'Amit Kumar',
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
        organization: org1._id,
        ageGroup: '19-21',
        gender: 'male',
        language: 'hi',
      });

      // Youth User 2 (different org)
      user2 = await User.create({
        name: 'Priya Sharma',
        email: 'user2@test.com',
        password: 'password123',
        role: 'user',
        organization: org2._id,
        ageGroup: '16-18',
        gender: 'female',
        language: 'en',
      });

      // Professional Mentor
      mentor = await User.create({
        name: 'Dr. Sarah Smith',
        email: 'mentor@test.com',
        password: 'password123',
        role: 'mentor',
        mentorType: 'professional',
        specialization: 'Academic stress and crisis counselling',
        organization: org1._id,
        gender: 'female',
        language: 'en',
      });

      // NGO Admin
      ngoAdmin = await User.create({
        name: 'Vikram Singh',
        email: 'ngo@test.com',
        password: 'password123',
        role: 'ngo',
        organization: org1._id,
      });
    } catch (userErr) {
      console.error('❌ User Creation Failed:', userErr.message);
      if (userErr.errors) {
        Object.keys(userErr.errors).forEach(key => {
          console.error(`- Field "${key}": ${userErr.errors[key].message}`);
        });
      }
      throw userErr;
    }

    // ─── 4. Mentor Availability ─────────────────────────────────────────────────
    console.log('📅 Setting Mentor Availability...');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const availability1 = await MentorAvailability.create({
      mentor: mentor._id,
      date: nextWeek,
      language: 'en',
      gender: 'female',
      slots: [
        { startTime: '10:00', endTime: '11:00', isBooked: true },
        { startTime: '14:00', endTime: '15:00', isBooked: false },
        { startTime: '16:00', endTime: '17:00', isBooked: false },
      ],
    });

    await MentorAvailability.create({
      mentor: mentor._id,
      date: dayAfterTomorrow,
      language: 'en',
      gender: 'female',
      slots: [
        { startTime: '09:00', endTime: '10:00', isBooked: false },
        { startTime: '11:00', endTime: '12:00', isBooked: false },
      ],
    });

    // ─── 5. Chat Sessions ───────────────────────────────────────────────────────
    console.log('🤖 Creating Sample Chat History...');

    // Chat 1 — completed, high intensity (Amit)
    const chat1 = await ChatSession.create({
      user: user._id,
      status: 'completed',
      messages: [
        { sender: 'bot', content: 'Hey there 👋 I\'m here to listen and support you — whatever\'s on your mind. How are you feeling today?' },
        { sender: 'user', content: 'Hi, I am feeling very stressed about my board exams.' },
        { sender: 'bot', content: 'I hear you. Exam pressure can be really tough. Tell me more about what specifically is stressing you out.' },
        { sender: 'user', content: 'I feel like if I fail, my life is over. My parents will be so disappointed.' },
        { sender: 'bot', content: 'That sounds like a lot of pressure. It\'s understandable to feel that way, but remember — exams don\'t define your entire future.' },
        { sender: 'user', content: 'I can\'t sleep at night. I keep thinking about it.' },
        { sender: 'bot', content: 'Sleep difficulties are a common sign of stress. Have you tried any relaxation techniques before bed?' },
      ],
      summary: 'User is expressing severe academic pressure and catastrophic thinking about exam failure. Reports insomnia linked to anxiety.',
    });

    // Chat 2 — completed, medium intensity (Amit)
    const chat2 = await ChatSession.create({
      user: user._id,
      status: 'completed',
      messages: [
        { sender: 'bot', content: 'Hey there 👋 I\'m here to listen and support you — whatever\'s on your mind. How are you feeling today?' },
        { sender: 'user', content: 'Hi, I had a fight with my friend today and I\'m feeling upset.' },
        { sender: 'bot', content: 'I\'m sorry to hear that. Conflicts with friends can be really hurtful. Would you like to share what happened?' },
        { sender: 'user', content: 'He said something mean about me in front of others. I feel embarrassed.' },
        { sender: 'bot', content: 'That must have felt really hurtful, especially in front of other people. It\'s okay to feel upset about that.' },
      ],
      summary: 'User experienced a peer conflict involving public humiliation. Reports embarrassment and sadness but no self-harm ideation.',
    });

    // Chat 3 — completed, low intensity (Priya)
    const chat3 = await ChatSession.create({
      user: user2._id,
      status: 'completed',
      messages: [
        { sender: 'bot', content: 'Hey there 👋 I\'m here to listen and support you — whatever\'s on your mind. How are you feeling today?' },
        { sender: 'user', content: 'I\'m feeling okay, just a bit bored with online classes.' },
        { sender: 'bot', content: 'That\'s totally normal! Online learning can feel monotonous. What do you usually do to keep engaged?' },
        { sender: 'user', content: 'I try to take notes and ask questions. But sometimes the lectures are too long.' },
        { sender: 'bot', content: 'That\'s a great strategy! Taking breaks every 25 minutes (the Pomodoro technique) can help maintain focus.' },
      ],
      summary: 'User reports mild boredom with online classes. No signs of distress. Coping strategies are healthy.',
    });

    // Chat 4 — active (Amit, current session)
    await ChatSession.create({
      user: user._id,
      status: 'active',
      messages: [
        { sender: 'bot', content: 'Hey there 👋 I\'m here to listen and support you — whatever\'s on your mind. How are you feeling today?' },
      ],
    });

    // ─── 6. ML Assessments ─────────────────────────────────────────────────────
    console.log('🧠 Creating ML Assessments...');

    const assessment1 = await Assessment.create({
      user: user._id,
      sourceType: 'chat',
      sourceId: chat1._id,
      sourceModel: 'ChatSession',
      summary: chat1.summary,
      issueCategory: 'academic',
      intensityLevel: 'high',
      distressScore: 8.2,
      detectedLanguage: 'en',
      keyPhrases: ['board exams', 'life is over', 'can\'t sleep', 'disappointed'],
      triageAction: 'alert_and_escalate',
      triageLabel: 'NGO Escalation',
      triageRationale: 'High distress score (8.2/10) with catastrophic thinking and sleep disruption warrants immediate professional attention.',
      alertSent: true,
    });

    const assessment2 = await Assessment.create({
      user: user._id,
      sourceType: 'chat',
      sourceId: chat2._id,
      sourceModel: 'ChatSession',
      summary: chat2.summary,
      issueCategory: 'peers',
      intensityLevel: 'medium',
      distressScore: 5.1,
      detectedLanguage: 'en',
      keyPhrases: ['fight', 'embarrassed', 'mean'],
      triageAction: 'peer_mentor',
      triageLabel: 'Peer Mentor Session',
      triageRationale: 'Medium distress from a peer conflict. A peer mentor session can help develop conflict resolution skills.',
      alertSent: false,
    });

    await Assessment.create({
      user: user2._id,
      sourceType: 'chat',
      sourceId: chat3._id,
      sourceModel: 'ChatSession',
      summary: chat3.summary,
      issueCategory: 'other',
      intensityLevel: 'low',
      distressScore: 1.5,
      detectedLanguage: 'en',
      keyPhrases: ['bored', 'online classes'],
      triageAction: 'self_help',
      triageLabel: 'Self-Help Resources',
      triageRationale: 'Low distress with good coping strategies. Self-help resources are sufficient.',
      alertSent: false,
    });

    // ─── 7. Alerts ──────────────────────────────────────────────────────────────
    console.log('⚠️ Triggering NGO Alerts...');

    await Alert.create({
      user: user._id,
      assessment: assessment1._id,
      type: 'auto_high',
      severity: 'high',
      message: 'CRITICAL: High academic distress detected for Amit Kumar. Immediate intervention recommended.',
      status: 'active',
    });

    await Alert.create({
      user: user._id,
      assessment: assessment2._id,
      type: 'sos',
      severity: 'medium',
      message: 'SOS: Amit Kumar triggered manual help request after peer conflict assessment.',
      status: 'acknowledged',
    });

    // ─── 8. Scheduled Sessions ──────────────────────────────────────────────────
    console.log('🤝 Creating Scheduled Meetings...');

    await Session.create({
      user: user._id,
      mentor: mentor._id,
      availability: availability1._id,
      slotIndex: 0,
      scheduledDate: nextWeek,
      startTime: '10:00',
      endTime: '11:00',
      status: 'confirmed',
      meetLink: 'https://meet.google.com/abc-test-xyz',
    });

    await Session.create({
      user: user2._id,
      mentor: mentor._id,
      availability: availability1._id,
      slotIndex: 1,
      scheduledDate: dayAfterTomorrow,
      startTime: '09:00',
      endTime: '10:00',
      status: 'pending',
    });

    // ─── Done ───────────────────────────────────────────────────────────────────
    console.log('');
    console.log('✨ Database Seeded Successfully!');
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║              Test Credentials                   ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Youth User:  user@test.com    / password123    ║');
    console.log('║  Youth User2: user2@test.com   / password123    ║');
    console.log('║  Mentor:      mentor@test.com  / password123    ║');
    console.log('║  NGO Admin:   ngo@test.com     / password123    ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
};

seedData();
