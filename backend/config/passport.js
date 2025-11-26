const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Users = require('../models/Users');
const OwnerUser = require('../models/OwnerUser');
const InstituteInformation = require('../models/InstituteInformation');

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        
        // Check if user exists in OwnerUser collection
        let user = await OwnerUser.findOne({ email });
        
        // If not in OwnerUser, check Users collection
        if (!user) {
          user = await Users.findOne({ email });
        }
        
        // If user exists, return user
        if (user) {
          return done(null, user);
        }
        
        // Get first available institute for new users
        const firstInstitute = await InstituteInformation.findOne();
        
        // If user doesn't exist, create new user in Users collection as Student by default
        const newUser = new Users({
          userName: profile.displayName,
          email: email,
          password: 'google-oauth-' + Date.now(), // Placeholder password
          designation: 'Student',
          phoneNumber: 'N/A',
          cnic: 'N/A',
          instituteID: firstInstitute ? firstInstitute._id : null
        });
        
        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        console.error('Google OAuth Error:', err);
        return done(err, null);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, { id: user._id, model: user.role ? 'OwnerUser' : 'Users' });
  });

  passport.deserializeUser(async (obj, done) => {
    try {
      const Model = obj.model === 'OwnerUser' ? OwnerUser : Users;
      const user = await Model.findById(obj.id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
