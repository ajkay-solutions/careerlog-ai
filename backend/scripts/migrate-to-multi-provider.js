#!/usr/bin/env node

/**
 * Migration script to convert existing User records to new multi-provider schema
 * 
 * This script:
 * 1. Reads existing User records with provider/providerId fields
 * 2. Creates corresponding UserProvider records
 * 3. Cleans up the User table structure
 * 
 * Run with: node scripts/migrate-to-multi-provider.js
 */

const { PrismaClient } = require('@prisma/client');

async function migrateToMultiProvider() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting multi-provider migration...');
    
    // Step 1: Get all existing users
    const existingUsers = await prisma.$queryRaw`
      SELECT id, email, provider, "providerId", "displayName", "profilePhoto", 
             "createdAt", "updatedAt", "lastLoginAt"
      FROM "User" 
      WHERE provider IS NOT NULL AND "providerId" IS NOT NULL
    `;
    
    console.log(`📊 Found ${existingUsers.length} users to migrate`);
    
    if (existingUsers.length === 0) {
      console.log('✅ No users found to migrate');
      return;
    }
    
    // Step 2: Create UserProvider records for each existing user
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const user of existingUsers) {
      try {
        console.log(`🔄 Migrating user: ${user.email} (${user.provider})`);
        
        // Create UserProvider record
        await prisma.userProvider.create({
          data: {
            userId: user.id,
            provider: user.provider,
            providerId: user.providerId,
            displayName: user.displayName,
            email: user.email,
            profilePhoto: user.profilePhoto,
            profileData: {
              originalProvider: user.provider,
              migratedAt: new Date().toISOString(),
              originalData: {
                displayName: user.displayName,
                profilePhoto: user.profilePhoto
              }
            },
            createdAt: user.createdAt,
            lastUsed: user.lastLoginAt || user.createdAt
          }
        });
        
        migratedCount++;
        console.log(`✅ Migrated: ${user.email}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
        
        // Check if it's a unique constraint error (user provider already exists)
        if (error.code === 'P2002') {
          console.log(`ℹ️  UserProvider already exists for ${user.email}, skipping...`);
          migratedCount++; // Count as successful since the data exists
          errorCount--; // Don't count as error
        }
      }
    }
    
    console.log('\\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    
    if (errorCount === 0) {
      console.log('\\n🎉 All users migrated successfully!');
      console.log('\\n⚠️  Next steps:');
      console.log('1. Run database migration: npx prisma migrate dev');
      console.log('2. Update OAuth providers to use new schema');
      console.log('3. Test authentication with both providers');
    } else {
      console.log('\\n⚠️  Some users had errors. Please review and fix before proceeding.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Validation function to check data integrity
async function validateMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\\n🔍 Validating migration...');
    
    const userCount = await prisma.user.count();
    const providerCount = await prisma.userProvider.count();
    
    console.log(`Users: ${userCount}`);
    console.log(`UserProviders: ${providerCount}`);
    
    // Check for users without providers
    const usersWithoutProviders = await prisma.user.count({
      where: {
        providers: {
          none: {}
        }
      }
    });
    
    if (usersWithoutProviders > 0) {
      console.log(`⚠️  Warning: ${usersWithoutProviders} users have no OAuth providers`);
    }
    
    // Check for duplicate providers per user
    const duplicateCheck = await prisma.$queryRaw`
      SELECT "userId", provider, COUNT(*) as count
      FROM "UserProvider"
      GROUP BY "userId", provider
      HAVING COUNT(*) > 1
    `;
    
    if (duplicateCheck.length > 0) {
      console.log(`⚠️  Warning: Found ${duplicateCheck.length} duplicate provider entries`);
      console.log(duplicateCheck);
    } else {
      console.log('✅ No duplicate provider entries found');
    }
    
    console.log('✅ Validation complete');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'validate') {
    validateMigration();
  } else {
    migrateToMultiProvider()
      .then(() => validateMigration())
      .catch(console.error);
  }
}

module.exports = { migrateToMultiProvider, validateMigration };