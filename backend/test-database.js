// Test script to verify database connection and Prisma operations
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing WorkLog AI database connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected successfully!\n');

    // Test 2: Check if tables exist
    console.log('2. Checking database tables...');
    
    // Count records in each table (should be 0 for new database)
    const userCount = await prisma.user.count();
    const entryCount = await prisma.entry.count();
    const projectCount = await prisma.project.count();
    const skillCount = await prisma.skill.count();
    const competencyCount = await prisma.competency.count();
    const settingsCount = await prisma.userSettings.count();

    console.log(`   ✅ User table: ${userCount} records`);
    console.log(`   ✅ Entry table: ${entryCount} records`);
    console.log(`   ✅ Project table: ${projectCount} records`);
    console.log(`   ✅ Skill table: ${skillCount} records`);
    console.log(`   ✅ Competency table: ${competencyCount} records`);
    console.log(`   ✅ UserSettings table: ${settingsCount} records\n`);

    // Test 3: Create a test user (simulate OAuth user)
    console.log('3. Testing user creation...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@worklog-ai.com',
        provider: 'google',
        providerId: 'test-123',
        displayName: 'Test User',
        name: {
          givenName: 'Test',
          familyName: 'User'
        }
      }
    });
    console.log(`   ✅ Created test user: ${testUser.displayName} (ID: ${testUser.id})\n`);

    // Test 4: Create user settings
    console.log('4. Testing user settings creation...');
    const userSettings = await prisma.userSettings.create({
      data: {
        userId: testUser.id,
        reminderEnabled: true,
        aiPromptStyle: 'balanced'
      }
    });
    console.log(`   ✅ Created user settings (ID: ${userSettings.id})\n`);

    // Test 5: Create a test entry
    console.log('5. Testing journal entry creation...');
    const testEntry = await prisma.entry.create({
      data: {
        userId: testUser.id,
        date: new Date(),
        rawText: 'Today I worked on setting up the WorkLog AI database. Successfully created all tables and tested Prisma operations.',
        wordCount: 18,
        extractedData: {
          projects: [{ name: 'WorkLog AI', confidence: 0.95 }],
          skills: [{ name: 'Database Design', category: 'technical', confidence: 0.90 }],
          keywords: ['database', 'prisma', 'setup']
        }
      }
    });
    console.log(`   ✅ Created test entry: "${testEntry.rawText.substring(0, 50)}..." (ID: ${testEntry.id})\n`);

    // Test 6: Test relationships and querying
    console.log('6. Testing relationships and queries...');
    const userWithData = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        entries: true,
        settings: true
      }
    });
    
    console.log(`   ✅ User with relationships: ${userWithData.displayName}`);
    console.log(`   ✅ Entries count: ${userWithData.entries.length}`);
    console.log(`   ✅ Settings linked: ${userWithData.settings ? 'Yes' : 'No'}\n`);

    // Test 7: Clean up test data
    console.log('7. Cleaning up test data...');
    await prisma.entry.delete({ where: { id: testEntry.id } });
    await prisma.userSettings.delete({ where: { id: userSettings.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('   ✅ Test data cleaned up\n');

    console.log('🎉 All database tests passed successfully!');
    console.log('🚀 WorkLog AI database is ready for development!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabase();