const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');

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

    // More robust production detection
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.RENDER === '1' || 
                        process.env.DATABASE_URL?.includes('supabase.co');
    
    const callbackURL = isProduction
      ? 'https://worklog-ai-backend.onrender.com/auth/google/callback'
      : 'http://localhost:3004/auth/google/callback';
    
    console.log('🔧 [ISSUE-7-DEBUG] Google OAuth Configuration:', {
      NODE_ENV: process.env.NODE_ENV,
      RENDER: process.env.RENDER,
      isProduction: isProduction,
      clientID: process.env.GOOGLE_CLIENT_ID,
      callbackURL: callbackURL,
      hasSupabaseDB: process.env.DATABASE_URL?.includes('supabase.co')
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

        // Create or update user with UserProvider pattern
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        try {
          const userEmail = profile.emails?.[0]?.value || '';
          const googleProfilePhoto = profile.photos?.[0]?.value || '';
          
          // Find or create user by email
          let user = await prisma.user.findUnique({
            where: { email: userEmail }
          });

          if (!user) {
            // Create new user
            console.log('✅ Creating new user for:', userEmail);
            user = await prisma.user.create({
              data: {
                id: profile.id, // Use Google ID as user ID for new users
                email: userEmail,
                displayName: profile.displayName,
                profilePhoto: googleProfilePhoto,
                provider: 'google', // Keep for backward compatibility
                providerId: profile.id, // Keep for backward compatibility
                createdAt: new Date(),
                lastLoginAt: new Date()
              }
            });
          } else {
            // Update existing user's last login
            console.log('🔄 Updating existing user:', user.id);
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                lastLoginAt: new Date(),
                // Update display info if better data available
                displayName: profile.displayName || user.displayName,
                profilePhoto: googleProfilePhoto || user.profilePhoto
              }
            });
          }

          // Create or update UserProvider record
          const existingProvider = await prisma.userProvider.findUnique({
            where: {
              userId_provider: {
                userId: user.id,
                provider: 'google'
              }
            }
          });

          if (existingProvider) {
            // Update existing provider
            await prisma.userProvider.update({
              where: { id: existingProvider.id },
              data: {
                displayName: profile.displayName,
                email: userEmail,
                profilePhoto: googleProfilePhoto,
                accessToken: accessToken,
                refreshToken: refreshToken,
                profileData: {
                  id: profile.id,
                  displayName: profile.displayName,
                  name: profile.name,
                  emails: profile.emails,
                  photos: profile.photos
                },
                lastUsed: new Date(),
                updatedAt: new Date()
              }
            });
            console.log('✅ Updated Google provider for user:', user.id);
          } else {
            // Create new provider record with generated ID
            await prisma.userProvider.create({
              data: {
                id: crypto.randomUUID(),  // Generate unique ID
                userId: user.id,
                provider: 'google',
                providerId: profile.id,
                displayName: profile.displayName,
                email: userEmail,
                profilePhoto: googleProfilePhoto,
                accessToken: accessToken,
                refreshToken: refreshToken,
                profileData: {
                  id: profile.id,
                  displayName: profile.displayName,
                  name: profile.name,
                  emails: profile.emails,
                  photos: profile.photos
                },
                createdAt: new Date(),
                lastUsed: new Date()
              }
            });
            console.log('✅ Created Google provider for user:', user.id);
          }

          // Fetch all providers for the user to get best profile data
          const allProviders = await prisma.userProvider.findMany({
            where: { userId: user.id },
            orderBy: { lastUsed: 'desc' }
          });

          // Select best profile photo (prefer most recent with photo)
          const bestPhoto = allProviders.find(p => p.profilePhoto)?.profilePhoto || '';
          
          // Return user object for JWT
          const userForJWT = {
            id: user.id,
            provider: 'google',
            displayName: user.displayName,
            name: {
              first: profile.name?.givenName || '',
              last: profile.name?.familyName || ''
            },
            email: user.email,
            profilePhoto: bestPhoto // This will be fetched from API, not stored in JWT
          };

          await prisma.$disconnect();
          return done(null, userForJWT);

        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          await prisma.$disconnect();
          return done(dbError, null);
        }
      } catch (error) {
        console.error('❌ Google OAuth Error:', error.message);
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