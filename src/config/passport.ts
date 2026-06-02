import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: 'https://plethora-p5ei.onrender.com/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists with this googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // 2. If not, check if a user with the same email exists
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            // Link googleId to existing account
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }
        }

        // 3. Create a new user if one doesn't exist
        let username = (profile.displayName || '').replace(/\s+/g, '').toLowerCase();
        if (!username) {
          username = `googleuser${profile.id.substring(0, 6)}`;
        }

        // Ensure username is unique
        let usernameExists = await User.findOne({ username });
        if (usernameExists) {
          username = `${username}${Math.floor(Math.random() * 10000)}`;
        }

        user = await User.create({
          username,
          email: email ? email.toLowerCase() : `${profile.id}@google.placeholder.com`,
          fullName: profile.displayName || '',
          googleId: profile.id,
          profilePicture: profile.photos?.[0]?.value || 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png',
          bio: '',
          followers: [],
          following: [],
          bookmarks: [],
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
