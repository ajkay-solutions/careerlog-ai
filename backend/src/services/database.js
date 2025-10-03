// Centralized Prisma Database Service with Optimized Connection Pooling
// This singleton service manages all database operations with proper connection handling
const { PrismaClient } = require('@prisma/client');

class DatabaseService {
  constructor() {
    if (DatabaseService.instance) {
      return DatabaseService.instance;
    }

    this.prisma = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.lastHealthCheck = null;
    
    DatabaseService.instance = this;
    this.initializePrisma();
  }

  initializePrisma() {
    console.log('🔗 Initializing Prisma Database Service with Connection Pooling...');
    
    // Close existing connection if any
    if (this.prisma) {
      this.prisma.$disconnect().catch(() => {});
    }
    
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
      errorFormat: 'minimal',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Optimized for performance
      transactionOptions: {
        maxWait: 5000, // 5 seconds max wait
        timeout: 10000, // 10 seconds timeout
      }
    });

    this.isConnected = false;
    console.log('✅ Prisma Database Service initialized with optimized settings');
  }

  async connect() {
    // If already connected and healthy, return immediately
    if (this.isConnected && this.prisma) {
      return this.prisma;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt with timeout
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxWait = 30; // 3 seconds max wait
        
        const checkConnection = () => {
          attempts++;
          if (this.isConnected && this.prisma) {
            resolve(this.prisma);
          } else if (attempts >= maxWait) {
            reject(new Error('Timeout waiting for existing connection'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    try {
      this.isConnecting = true;
      
      // Quick connection test without heavy queries
      await this.prisma.$connect();
      
      this.connectionRetries = 0;
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      return this.prisma;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
      
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`🔄 Retrying connection (${this.connectionRetries}/${this.maxRetries})...`);
        
        // Quick retry without reinitializing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return this.connect();
      }
      
      throw new Error(`Database connection failed after ${this.maxRetries} attempts: ${error.message}`);
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('✅ Database disconnected successfully');
      } catch (error) {
        console.warn('⚠️ Error during disconnect:', error.message);
      }
    }
  }

  // Optimized operation wrapper with minimal overhead
  async executeOperation(operation, operationName = 'database operation') {
    const maxAttempts = 2; // Reduced from 3 for faster failure
    let attempt = 1;
    let lastError;

    while (attempt <= maxAttempts) {
      try {
        // Use existing connection without reconnecting
        const prismaClient = await this.connect();
        
        // Execute the operation with timeout (longer for complex operations)
        let operationTimeout;
        if (operationName.includes('dashboard')) {
          operationTimeout = 15000; // 15 seconds for dashboard
        } else if (operationName.includes('export') || operationName.includes('generate') || operationName.includes('performance') || operationName.includes('resume')) {
          operationTimeout = 30000; // 30 seconds for export and generation
        } else {
          operationTimeout = 5000; // 5 seconds for regular operations
        }
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Operation timeout after ${operationTimeout/1000} seconds`)), operationTimeout);
        });
        
        const result = await Promise.race([
          operation(prismaClient),
          timeoutPromise
        ]);
        
        return result;
      } catch (error) {
        lastError = error;
        
        const isConnectionError = 
          error.message?.includes('prepared statement') ||
          error.message?.includes('Connection terminated') ||
          error.message?.includes('database server') ||
          error.message?.includes('connect') ||
          error.message?.includes('timeout') ||
          error.code === 'P1001' ||
          error.code === 'P1017' ||
          error.code === 'P1000' ||
          error.code === 'P2010';

        // Only retry connection errors, and only once
        if (isConnectionError && attempt < maxAttempts) {
          console.log(`🔄 Retrying ${operationName} due to connection issue...`);
          
          // Quick connection reset
          this.isConnected = false;
          await new Promise(resolve => setTimeout(resolve, 200)); // Minimal delay
          
          attempt++;
          continue;
        }

        // For non-connection errors or after max attempts, throw immediately
        break;
      }
    }

    // If we get here, all attempts failed
    throw new Error(`${operationName} failed: ${lastError.message}`);
  }

  // Convenience methods for common operations
  async findMany(model, params) {
    return this.executeOperation(
      (prisma) => prisma[model].findMany(params),
      `findMany ${model}`
    );
  }

  async findUnique(model, params) {
    return this.executeOperation(
      (prisma) => prisma[model].findUnique(params),
      `findUnique ${model}`
    );
  }

  async create(model, params) {
    return this.executeOperation(
      (prisma) => prisma[model].create(params),
      `create ${model}`
    );
  }

  async update(model, params) {
    return this.executeOperation(
      (prisma) => prisma[model].update(params),
      `update ${model}`
    );
  }

  async upsert(model, params) {
    return this.executeOperation(
      (prisma) => prisma[model].upsert(params),
      `upsert ${model}`
    );
  }

  async delete(model, params) {
    return this.executeOperation(
      (prisma) => prisma[model].delete(params),
      `delete ${model}`
    );
  }

  async count(model, params) {
    return this.executeOperation(
      (prisma) => prisma[model].count(params),
      `count ${model}`
    );
  }

  // Batch operations for complex queries
  async executeTransaction(operations) {
    return this.executeOperation(
      (prisma) => prisma.$transaction(operations.map(op => op(prisma))),
      'transaction'
    );
  }

  // Get the Prisma client directly (for complex operations)
  async getPrismaClient() {
    return await this.connect();
  }

  // Lightweight health check
  async healthCheck() {
    try {
      // Use cached result if recent (within 10 seconds)
      const now = Date.now();
      if (this.lastHealthCheck && (now - this.lastHealthCheck.timestamp) < 10000) {
        return this.lastHealthCheck.result;
      }

      // Quick connection test without heavy queries
      const prismaClient = await this.connect();
      const result = { status: 'healthy', timestamp: new Date().toISOString() };
      
      this.lastHealthCheck = {
        result,
        timestamp: now
      };
      
      return result;
    } catch (error) {
      const result = { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
      
      this.lastHealthCheck = {
        result,
        timestamp: Date.now()
      };
      
      return result;
    }
  }
}

// Export singleton instance
const dbService = new DatabaseService();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, closing database connection...');
  await dbService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, closing database connection...');
  await dbService.disconnect();
  process.exit(0);
});

module.exports = dbService;