const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');

// Load .env and override any pre-set env vars (avoids stale STRIPE keys in shell)
// In hosted environments (Replit/Render/etc.), platform env vars should win.
dotenv.config();
// Env configured via .env (Stripe, FRONTEND_URL, etc.)

const app = express();
// Needed on hosted platforms (Replit/Render/etc.) so req.protocol uses x-forwarded-proto.
app.set('trust proxy', 1);
// Load payments webhook early with raw body (before JSON parser)
const paymentsModule = require('./routes/payments');
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentsModule.webhookHandler);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
// Increase body size limits to handle base64 logos (max ~6.7MB for 5MB image)
app.use(express.json({ limit: process.env.BODY_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '10mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./config/passport')(passport);

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_scheduler', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  Please check:');
    console.log('   1. Your internet connection');
    console.log('   2. MongoDB Atlas IP whitelist settings');
    console.log('   3. MongoDB credentials in .env file');
    console.log('   Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/timeslots', require('./routes/timeslots'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/timetables-gen', require('./routes/timetables_gen'));
app.use('/api/payments', paymentsModule.router);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
