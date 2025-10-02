// System component testing script
console.log('🧪 Testing WorkLog AI System Components...\n');

// Test 1: Environment variables
console.log('1. Testing Environment Variables:');
console.log('✅ NODE_ENV:', process.env.NODE_ENV);
console.log('✅ PORT:', process.env.PORT);
console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : '❌ Missing');
console.log('✅ ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : '❌ Missing');
console.log('✅ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : '❌ Missing');
console.log('');

// Test 2: Database connection
console.log('2. Testing Database Connection:');
async function testDatabase() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

// Test 3: AI Service (without queue)
console.log('3. Testing AI Service:');
async function testAIService() {
  try {
    const ClaudeService = require('./src/services/ai/claudeService');
    const service = new ClaudeService();
    const health = await service.healthCheck();
    console.log('✅ AI Service health:', health.status);
  } catch (error) {
    console.log('❌ AI Service failed:', error.message);
  }
}

// Test 4: Simple prompt test
console.log('4. Testing Simple AI Prompt:');
async function testSimplePrompt() {
  try {
    const ClaudeService = require('./src/services/ai/claudeService');
    const service = new ClaudeService();
    
    const testText = "Today I worked on fixing bugs in the authentication system and deployed the new user dashboard.";
    const result = await service.analyzeEntry(testText, {});
    
    if (result.success) {
      console.log('✅ AI Analysis successful');
      console.log('   - Projects found:', result.data.projects?.length || 0);
      console.log('   - Skills found:', result.data.skills?.length || 0);
      console.log('   - Sentiment:', result.data.sentiment);
    } else {
      console.log('❌ AI Analysis failed:', result.error);
    }
  } catch (error) {
    console.log('❌ AI Analysis error:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testDatabase();
  console.log('');
  await testAIService();
  console.log('');
  await testSimplePrompt();
  console.log('\n🏁 Testing complete');
}

runTests().catch(console.error);