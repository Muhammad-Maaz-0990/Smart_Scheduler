const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');

dotenv.config();
// Env configured via .env (Stripe, FRONTEND_URL, etc.)

const app = express();
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

// MongoDB Connection with extended timeout and DNS options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_scheduler', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
  directConnection: false,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err);
  console.log('\n⚠️  Troubleshooting steps:');
  console.log('1. Check your internet connection');
  console.log('2. Verify MongoDB Atlas cluster is running');
  console.log('3. Whitelist your IP in MongoDB Atlas Network Access (or use 0.0.0.0/0)');
  console.log('4. Change DNS to Google DNS (8.8.8.8) - Run PowerShell as Admin:');
  console.log('   Get-NetAdapter | Set-DnsClientServerAddress -ServerAddresses ("8.8.8.8","8.8.4.4")');
});

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
