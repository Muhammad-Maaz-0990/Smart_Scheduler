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
        const userName = profile.displayName;
        
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
        
        // If user doesn't exist, return error with user info to redirect to register page
        return done(null, false, { 
          message: 'account_not_found', 
          email: email,
          name: userName 
        });
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
