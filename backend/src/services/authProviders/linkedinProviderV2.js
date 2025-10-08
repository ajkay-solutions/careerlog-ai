const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');

class LinkedInProvider {
  constructor() {
    this.name = 'linkedin';
    this.strategy = null;
  }

  initialize() {
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      throw new Error('LinkedIn OAuth credentials not found in environment variables');
    }

    // Environment-aware callback URL for WorkLog AI
    const callbackURL = process.env.NODE_ENV === 'production' 
      ? 'https://worklog.ajkaysolutions.com/auth/linkedin/callback'
      : 'http://localhost:3004/auth/linkedin/callback';
    
    console.log('🔧 LinkedIn OAuth Config (WorkLog AI):', {
      NODE_ENV: process.env.NODE_ENV,
      callbackURL: callbackURL,
      clientID: process.env.LINKEDIN_CLIENT_ID,
    });

    // Custom LinkedIn OpenID Connect strategy
    this.strategy = new OAuth2Strategy({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: callbackURL,
      scope: ['openid', 'profile', 'email', 'r_basicprofile'],
      state: false
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 Fetching LinkedIn profile with access token...');
        
        // Fetch user profile using LinkedIn v2 API
        const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        
        const linkedinProfile = profileResponse.data;
        console.log('✅ LinkedIn Profile fetched:', {
          sub: linkedinProfile.sub,
          name: linkedinProfile.name,
          email: linkedinProfile.email,
          hasPicture: !!linkedinProfile.picture
        });

        // LinkedIn profile photo from userinfo endpoint
        let profilePhotoUrl = linkedinProfile.picture;

        // Create or update user with UserProvider pattern
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        try {
          // Find or create user by email
          let user = await prisma.user.findUnique({
            where: { email: linkedinProfile.email }
          });

          if (!user) {
            // Create new user
            console.log('✅ Creating new user for:', linkedinProfile.email);
            user = await prisma.user.create({
              data: {
                id: linkedinProfile.sub, // Use LinkedIn sub as user ID
                email: linkedinProfile.email,
                displayName: linkedinProfile.name,
                profilePhoto: profilePhotoUrl || '',
                provider: 'linkedin', // Keep for backward compatibility
                providerId: linkedinProfile.sub, // Keep for backward compatibility
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
                displayName: linkedinProfile.name || user.displayName,
                profilePhoto: profilePhotoUrl || user.profilePhoto
              }
            });
          }

          // Create or update UserProvider record
          const existingProvider = await prisma.userProvider.findUnique({
            where: {
              userId_provider: {
                userId: user.id,
                provider: 'linkedin'
              }
            }
          });

          if (existingProvider) {
            // Update existing provider
            await prisma.userProvider.update({
              where: { id: existingProvider.id },
              data: {
                displayName: linkedinProfile.name,
                email: linkedinProfile.email,
                profilePhoto: profilePhotoUrl,
                accessToken: accessToken,
                refreshToken: refreshToken,
                profileData: linkedinProfile,
                lastUsed: new Date(),
                updatedAt: new Date()
              }
            });
            console.log('✅ Updated LinkedIn provider for user:', user.id);
          } else {
            // Create new provider record
            await prisma.userProvider.create({
              data: {
                userId: user.id,
                provider: 'linkedin',
                providerId: linkedinProfile.sub,
                displayName: linkedinProfile.name,
                email: linkedinProfile.email,
                profilePhoto: profilePhotoUrl || '',
                accessToken: accessToken,
                refreshToken: refreshToken,
                profileData: linkedinProfile,
                createdAt: new Date(),
                lastUsed: new Date()
              }
            });
            console.log('✅ Created LinkedIn provider for user:', user.id);
          }

          // Fetch all providers for the user to get best profile data
          const allProviders = await prisma.userProvider.findMany({
            where: { userId: user.id },
            orderBy: { lastUsed: 'desc' }
          });

          // Select best profile photo (prefer LinkedIn, then most recent)
          const bestPhoto = allProviders.find(p => p.profilePhoto)?.profilePhoto || '';
          
          // Return user object for JWT
          const userForJWT = {
            id: user.id,
            provider: 'linkedin',
            displayName: user.displayName,
            name: {
              first: linkedinProfile.given_name || '',
              last: linkedinProfile.family_name || ''
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
        console.error('❌ LinkedIn OAuth Error:', error.response?.data || error.message);
        return done(error, null);
      }
    });

    return this.strategy;
  }

  getAuthUrl() {
    return '/auth/linkedin';
  }

  getCallbackUrl() {
    return '/auth/linkedin/callback';
  }

  getScopes() {
    return ['openid', 'profile', 'email', 'r_basicprofile'];
  }
}

module.exports = LinkedInProvider;