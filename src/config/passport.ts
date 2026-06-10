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

const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL ||
  'http://localhost:5000/api/auth/google/callback';

console.log("================ Google OAuth Configuration ================");
console.log("GOOGLE_CLIENT_ID =", process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 15)}...` : "undefined");
console.log("GOOGLE_CALLBACK_URL =", googleCallbackUrl);
console.log("Google Strategy initialized.");
console.log("============================================================");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: googleCallbackUrl,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(`[Passport GoogleStrategy Callback] Authenticating user from Google profile. ID: ${profile.id}, Email: ${profile.emails?.[0]?.value}`);
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
        if (!username || /^(fallback|test|demo|seed|placeholder)/i.test(username)) {
          username = `googleuser${profile.id.substring(0, 6)}`;
        }

        // Ensure username is unique and doesn't match dummy patterns
        let usernameExists = await User.findOne({ username });
        while (usernameExists || /^(fallback|test|demo|seed|placeholder)/i.test(username)) {
          username = `googleuser${profile.id.substring(0, 6)}_${Math.floor(Math.random() * 10000)}`;
          usernameExists = await User.findOne({ username });
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
