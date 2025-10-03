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
      ? 'https://worklog-ai-backend.onrender.com/auth/linkedin/callback'
      : 'http://localhost:3004/auth/linkedin/callback';
    
    console.log('🔧 LinkedIn OAuth Config (WorkLog AI):', {
      NODE_ENV: process.env.NODE_ENV,
      NODE_ENV_TYPE: typeof process.env.NODE_ENV,
      NODE_ENV_STRICT: process.env.NODE_ENV === 'production',
      callbackURL: callbackURL,
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecretLength: process.env.LINKEDIN_CLIENT_SECRET?.length || 0
    });

    // Custom LinkedIn OpenID Connect strategy
    this.strategy = new OAuth2Strategy({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: callbackURL,
      scope: ['openid', 'profile', 'email'],
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
          email: linkedinProfile.email
        });

        // Create or update user in database with safe operation
        const { PrismaClient } = require('@prisma/client');
        
        // Create a safe database operation wrapper
        const safeDbOperation = async (operation) => {
          const prismaClient = new PrismaClient();
          try {
            const result = await operation(prismaClient);
            return result;
          } catch (error) {
            console.error('❌ Database operation failed:', error.message);
            
            // For prepared statement errors, wait a moment and retry once
            if (error.message?.includes('prepared statement') || error.code === 'P1001') {
              console.log('🔄 Retrying after prepared statement error...');
              
              // Wait 500ms before retry
              await new Promise(resolve => setTimeout(resolve, 500));
              
              try {
                const result = await operation(prismaClient);
                return result;
              } catch (retryError) {
                console.error('❌ Retry failed:', retryError.message);
                throw retryError;
              }
            }
            
            throw error;
          } finally {
            await prismaClient.$disconnect();
          }
        };

        try {
          // Upsert user to database
          const dbUser = await safeDbOperation(async (prismaClient) => {
            return await prismaClient.user.upsert({
              where: { id: linkedinProfile.sub },
              update: {
                displayName: linkedinProfile.name,
                email: linkedinProfile.email || '',
                profilePhoto: linkedinProfile.picture || '',
                lastLoginAt: new Date()
              },
              create: {
                id: linkedinProfile.sub,
                provider: 'linkedin',
                providerId: linkedinProfile.sub,
                displayName: linkedinProfile.name,
                email: linkedinProfile.email || '',
                profilePhoto: linkedinProfile.picture || '',
                createdAt: new Date(),
                lastLoginAt: new Date()
              }
            });
          });

          console.log('✅ User saved to database:', dbUser.id);

          const user = {
            id: dbUser.id,
            provider: 'linkedin',
            displayName: dbUser.displayName,
            name: {
              first: linkedinProfile.given_name || '',
              last: linkedinProfile.family_name || ''
            },
            email: dbUser.email,
            profilePhoto: dbUser.profilePhoto,
            accessToken,
            refreshToken,
            profile: linkedinProfile
          };

          return done(null, user);
        } catch (dbError) {
          console.error('❌ Database error saving user:', dbError);
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
    return ['openid', 'profile', 'email'];
  }
}

module.exports = LinkedInProvider;