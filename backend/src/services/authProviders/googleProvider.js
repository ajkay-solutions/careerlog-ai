const GoogleStrategy = require('passport-google-oauth20').Strategy;

class GoogleProvider {
  constructor() {
    this.name = 'google';
    this.strategy = null;
  }

  initialize() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn('Google OAuth credentials not found in environment variables');
      return null;
    }

    const callbackURL = process.env.NODE_ENV === 'production' 
      ? 'https://worklog-ai-backend.onrender.com/auth/google/callback'
      : 'http://localhost:3004/auth/google/callback';
    
    console.log('🔧 Google OAuth Configuration:', {
      clientID: process.env.GOOGLE_CLIENT_ID,
      callbackURL: callbackURL,
      NODE_ENV: process.env.NODE_ENV,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    });
    
    this.strategy = new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('✅ Google OAuth Success - Profile received:', {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value
        });

        // Create or update user in database
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        try {
          // Upsert user to database
          const dbUser = await prisma.user.upsert({
            where: { id: profile.id },
            update: {
              displayName: profile.displayName,
              email: profile.emails?.[0]?.value || '',
              profilePhoto: profile.photos?.[0]?.value || '',
              lastLoginAt: new Date()
            },
            create: {
              id: profile.id,
              provider: 'google',
              providerId: profile.id,
              displayName: profile.displayName,
              email: profile.emails?.[0]?.value || '',
              profilePhoto: profile.photos?.[0]?.value || '',
              createdAt: new Date(),
              lastLoginAt: new Date()
            }
          });

          console.log('✅ User saved to database:', dbUser.id);

          const user = {
            id: dbUser.id,
            provider: 'google',
            displayName: dbUser.displayName,
            name: {
              first: profile.name?.givenName || '',
              last: profile.name?.familyName || ''
            },
            email: dbUser.email,
            profilePhoto: dbUser.profilePhoto,
            accessToken,
            refreshToken,
            profile: profile._json
          };

          return done(null, user);
        } catch (dbError) {
          console.error('❌ Database error saving user:', dbError);
          return done(dbError, null);
        } finally {
          await prisma.$disconnect();
        }
      } catch (error) {
        console.error('❌ Google OAuth Error:', error);
        return done(error, null);
      }
    });

    return this.strategy;
  }

  getAuthUrl() {
    return '/auth/google';
  }

  getCallbackUrl() {
    return '/auth/google/callback';
  }

  getScopes() {
    return ['profile', 'email'];
  }
}

module.exports = GoogleProvider;