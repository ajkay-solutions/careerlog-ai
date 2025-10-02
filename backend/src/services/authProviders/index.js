const LinkedInProvider = require('./linkedinProvider');
const GoogleProvider = require('./googleProvider');

class AuthProviderFactory {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Register LinkedIn provider
    this.registerProvider('linkedin', new LinkedInProvider());
    
    // Register Google provider
    this.registerProvider('google', new GoogleProvider());
  }

  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }

  initializeStrategies() {
    const strategies = [];
    
    for (const provider of this.providers.values()) {
      try {
        const strategy = provider.initialize();
        strategies.push({
          name: provider.name,
          strategy: strategy
        });
      } catch (error) {
        console.warn(`Failed to initialize ${provider.name} provider:`, error.message);
      }
    }

    return strategies;
  }
}

module.exports = new AuthProviderFactory();