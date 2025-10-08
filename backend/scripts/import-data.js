// Import data to new Mumbai database
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function importData(exportFilePath) {
  if (!exportFilePath) {
    console.error('❌ Please provide export file path');
    console.log('Usage: node import-data.js /path/to/export.json');
    process.exit(1);
  }

  if (!fs.existsSync(exportFilePath)) {
    console.error(`❌ Export file not found: ${exportFilePath}`);
    process.exit(1);
  }

  console.log('📥 Starting data import...');
  console.log(`📄 Import file: ${exportFilePath}`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL // This should point to your NEW Mumbai database
      }
    }
  });

  try {
    // Load export data
    const exportData = JSON.parse(fs.readFileSync(exportFilePath, 'utf8'));
    
    console.log('📊 Import Summary:');
    console.log(`   Users: ${exportData.users?.length || 0}`);
    console.log(`   Entries: ${exportData.entries?.length || 0}`);
    console.log(`   Projects: ${exportData.projects?.length || 0}`);
    console.log(`   Skills: ${exportData.skills?.length || 0}`);
    console.log(`   Competencies: ${exportData.competencies?.length || 0}`);
    console.log(`   User Settings: ${exportData.userSettings?.length || 0}`);
    console.log('');

    // Import in correct order (respecting foreign keys)
    
    // 1. Users first
    if (exportData.users?.length > 0) {
      console.log('👥 Importing users...');
      for (const user of exportData.users) {
        try {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email,
              provider: user.provider,
              providerId: user.providerId,
              displayName: user.displayName,
              name: user.name,
              profilePhoto: user.profilePhoto,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
              lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null
            }
          });
        } catch (error) {
          console.warn(`⚠️ User import failed for ${user.id}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${exportData.users.length} users`);
    }

    // 2. Projects
    if (exportData.projects?.length > 0) {
      console.log('🎯 Importing projects...');
      for (const project of exportData.projects) {
        try {
          await prisma.project.create({
            data: {
              id: project.id,
              userId: project.userId,
              name: project.name,
              description: project.description,
              status: project.status,
              startDate: project.startDate ? new Date(project.startDate) : null,
              endDate: project.endDate ? new Date(project.endDate) : null,
              entryCount: project.entryCount,
              createdAt: new Date(project.createdAt),
              updatedAt: new Date(project.updatedAt)
            }
          });
        } catch (error) {
          console.warn(`⚠️ Project import failed for ${project.id}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${exportData.projects.length} projects`);
    }

    // 3. Skills
    if (exportData.skills?.length > 0) {
      console.log('🛠️ Importing skills...');
      for (const skill of exportData.skills) {
        try {
          await prisma.skill.create({
            data: {
              id: skill.id,
              userId: skill.userId,
              name: skill.name,
              category: skill.category,
              firstUsed: new Date(skill.firstUsed),
              lastUsed: new Date(skill.lastUsed),
              usageCount: skill.usageCount,
              createdAt: new Date(skill.createdAt),
              updatedAt: new Date(skill.updatedAt)
            }
          });
        } catch (error) {
          console.warn(`⚠️ Skill import failed for ${skill.id}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${exportData.skills.length} skills`);
    }

    // 4. Competencies
    if (exportData.competencies?.length > 0) {
      console.log('🏆 Importing competencies...');
      for (const comp of exportData.competencies) {
        try {
          await prisma.competency.create({
            data: {
              id: comp.id,
              userId: comp.userId,
              name: comp.name,
              framework: comp.framework,
              description: comp.description,
              demonstrationCount: comp.demonstrationCount,
              lastDemonstrated: comp.lastDemonstrated ? new Date(comp.lastDemonstrated) : null,
              createdAt: new Date(comp.createdAt),
              updatedAt: new Date(comp.updatedAt)
            }
          });
        } catch (error) {
          console.warn(`⚠️ Competency import failed for ${comp.id}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${exportData.competencies.length} competencies`);
    }

    // 5. Entries
    if (exportData.entries?.length > 0) {
      console.log('📝 Importing entries...');
      let imported = 0;
      for (const entry of exportData.entries) {
        try {
          await prisma.entry.create({
            data: {
              id: entry.id,
              userId: entry.userId,
              date: new Date(entry.date),
              rawText: entry.rawText,
              wordCount: entry.wordCount,
              extractedData: entry.extractedData,
              projectIds: entry.projectIds || [],
              skillIds: entry.skillIds || [],
              competencyIds: entry.competencyIds || [],
              isHighlight: entry.isHighlight,
              sentiment: entry.sentiment,
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt)
            }
          });
          imported++;
        } catch (error) {
          console.warn(`⚠️ Entry import failed for ${entry.id}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${imported}/${exportData.entries.length} entries`);
    }

    // 6. User Settings
    if (exportData.userSettings?.length > 0) {
      console.log('⚙️ Importing user settings...');
      for (const settings of exportData.userSettings) {
        try {
          await prisma.userSettings.create({
            data: {
              id: settings.id,
              userId: settings.userId,
              reminderTime: settings.reminderTime,
              reminderEnabled: settings.reminderEnabled,
              aiPromptStyle: settings.aiPromptStyle,
              defaultTags: settings.defaultTags || [],
              allowExport: settings.allowExport,
              allowAnalytics: settings.allowAnalytics,
              createdAt: new Date(settings.createdAt),
              updatedAt: new Date(settings.updatedAt)
            }
          });
        } catch (error) {
          console.warn(`⚠️ User settings import failed for ${settings.id}: ${error.message}`);
        }
      }
      console.log(`✅ Imported ${exportData.userSettings.length} user settings`);
    }

    console.log('');
    console.log('🎉 Data import completed successfully!');
    console.log('📊 Verification - checking counts...');

    // Verify import
    const counts = {
      users: await prisma.user.count(),
      entries: await prisma.entry.count(),
      projects: await prisma.project.count(),
      skills: await prisma.skill.count(),
      competencies: await prisma.competency.count(),
      userSettings: await prisma.userSettings.count()
    };

    console.log('📈 Final counts in new database:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  const exportFile = process.argv[2];
  importData(exportFile).catch(console.error);
}

module.exports = { importData };