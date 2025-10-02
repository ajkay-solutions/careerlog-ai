const passport = require('passport');
const authProviderFactory = require('../services/authProviders');

// User serialization for sessions
passport.serializeUser((user, done) => {
  const serializedUser = {
    id: user.id,
    provider: user.provider,
    displayName: user.displayName,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    accessToken: user.accessToken
  };
  console.log('🔍 Serializing user for session:', serializedUser);
  done(null, serializedUser);
});

passport.deserializeUser((user, done) => {
  console.log('🔍 Deserializing user from session:', user);
  done(null, user);
});

// Initialize all available OAuth strategies
function initializePassport() {
  try {
    const strategies = authProviderFactory.initializeStrategies();
    
    strategies.forEach(({ name, strategy }) => {
      passport.use(name, strategy);
      console.log(`✅ ${name} OAuth strategy initialized`);
    });

    if (strategies.length === 0) {
      console.warn('⚠️  No OAuth strategies were initialized');
    }

    return strategies.map(s => s.name);
  } catch (error) {
    console.error('❌ Error initializing Passport strategies:', error);
    return [];
  }
}

module.exports = {
  passport,
  initializePassport,
  authProviderFactory
};