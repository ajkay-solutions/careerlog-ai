// Quick database performance test
const { PrismaClient } = require('@prisma/client');

async function testDatabasePerformance() {
  console.log('🧪 Testing database performance...');
  
  const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test 1: Simple connection
    console.time('📊 Connection Time');
    await prisma.$connect();
    console.timeEnd('📊 Connection Time');

    // Test 2: Simple query
    console.time('📊 Simple Count Query');
    const userCount = await prisma.user.count();
    console.timeEnd('📊 Simple Count Query');
    console.log(`👥 Total users: ${userCount}`);

    // Test 3: Entry fetch (the problematic query)
    console.time('📊 Entry Fetch Query');
    const entries = await prisma.entry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        date: true,
        wordCount: true,
        rawText: true,
        extractedData: true,
        isHighlight: true
      }
    });
    console.timeEnd('📊 Entry Fetch Query');
    console.log(`📝 Retrieved ${entries.length} entries`);

    // Test 4: Complex query with relations
    console.time('📊 Complex Query with Relations');
    const complexData = await prisma.user.findFirst({
      include: {
        entries: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        projects: {
          take: 3
        }
      }
    });
    console.timeEnd('📊 Complex Query with Relations');
    console.log(`🔗 Complex query returned user with ${complexData?.entries?.length || 0} entries`);

    // Test 5: Raw query for comparison
    console.time('📊 Raw SQL Query');
    const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Entry"`;
    console.timeEnd('📊 Raw SQL Query');
    console.log(`📊 Raw query result:`, rawResult);

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('✅ Database test completed');
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  testDatabasePerformance().catch(console.error);
}

module.exports = { testDatabasePerformance };