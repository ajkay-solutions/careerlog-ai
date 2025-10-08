// Export all data from current database
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function exportData() {
  console.log('📦 Starting data export...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Export all tables
    console.log('👥 Exporting users...');
    const users = await prisma.user.findMany();
    
    console.log('📝 Exporting entries...');
    const entries = await prisma.entry.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('🎯 Exporting projects...');
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('🛠️ Exporting skills...');
    const skills = await prisma.skill.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('🏆 Exporting competencies...');
    const competencies = await prisma.competency.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('⚙️ Exporting user settings...');
    const userSettings = await prisma.userSettings.findMany();

    // Create export data
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        source: 'worklog-ai-us-east'
      },
      users,
      entries,
      projects,
      skills,
      competencies,
      userSettings
    };

    // Create export directory
    const exportDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Write to file
    const exportFile = path.join(exportDir, `worklog-ai-export-${Date.now()}.json`);
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));

    // Create SQL dump as backup
    const sqlFile = path.join(exportDir, `worklog-ai-export-${Date.now()}.sql`);
    const sqlCommands = generateSQLInserts(exportData);
    fs.writeFileSync(sqlFile, sqlCommands);

    console.log('✅ Data export completed!');
    console.log(`📄 JSON Export: ${exportFile}`);
    console.log(`📄 SQL Export: ${sqlFile}`);
    console.log('📊 Export Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Entries: ${entries.length}`);
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Skills: ${skills.length}`);
    console.log(`   Competencies: ${competencies.length}`);
    console.log(`   User Settings: ${userSettings.length}`);

    return exportFile;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function generateSQLInserts(data) {
  let sql = `-- WorkLog AI Database Export
-- Generated: ${data.metadata.exportedAt}
-- Source: ${data.metadata.source}

`;

  // Helper function to escape SQL values
  const escapeValue = (value) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value instanceof Date) return `'${value.toISOString()}'`;
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    return value.toString();
  };

  // Users
  if (data.users.length > 0) {
    sql += `-- Users\n`;
    data.users.forEach(user => {
      sql += `INSERT INTO "User" (id, email, provider, "providerId", "displayName", name, "profilePhoto", "createdAt", "updatedAt", "lastLoginAt") VALUES (${escapeValue(user.id)}, ${escapeValue(user.email)}, ${escapeValue(user.provider)}, ${escapeValue(user.providerId)}, ${escapeValue(user.displayName)}, ${escapeValue(user.name)}, ${escapeValue(user.profilePhoto)}, ${escapeValue(user.createdAt)}, ${escapeValue(user.updatedAt)}, ${escapeValue(user.lastLoginAt)});\n`;
    });
    sql += '\n';
  }

  // Projects
  if (data.projects.length > 0) {
    sql += `-- Projects\n`;
    data.projects.forEach(project => {
      sql += `INSERT INTO "Project" (id, "userId", name, description, status, "startDate", "endDate", "entryCount", "createdAt", "updatedAt") VALUES (${escapeValue(project.id)}, ${escapeValue(project.userId)}, ${escapeValue(project.name)}, ${escapeValue(project.description)}, ${escapeValue(project.status)}, ${escapeValue(project.startDate)}, ${escapeValue(project.endDate)}, ${escapeValue(project.entryCount)}, ${escapeValue(project.createdAt)}, ${escapeValue(project.updatedAt)});\n`;
    });
    sql += '\n';
  }

  // Skills
  if (data.skills.length > 0) {
    sql += `-- Skills\n`;
    data.skills.forEach(skill => {
      sql += `INSERT INTO "Skill" (id, "userId", name, category, "firstUsed", "lastUsed", "usageCount", "createdAt", "updatedAt") VALUES (${escapeValue(skill.id)}, ${escapeValue(skill.userId)}, ${escapeValue(skill.name)}, ${escapeValue(skill.category)}, ${escapeValue(skill.firstUsed)}, ${escapeValue(skill.lastUsed)}, ${escapeValue(skill.usageCount)}, ${escapeValue(skill.createdAt)}, ${escapeValue(skill.updatedAt)});\n`;
    });
    sql += '\n';
  }

  // Competencies
  if (data.competencies.length > 0) {
    sql += `-- Competencies\n`;
    data.competencies.forEach(comp => {
      sql += `INSERT INTO "Competency" (id, "userId", name, framework, description, "demonstrationCount", "lastDemonstrated", "createdAt", "updatedAt") VALUES (${escapeValue(comp.id)}, ${escapeValue(comp.userId)}, ${escapeValue(comp.name)}, ${escapeValue(comp.framework)}, ${escapeValue(comp.description)}, ${escapeValue(comp.demonstrationCount)}, ${escapeValue(comp.lastDemonstrated)}, ${escapeValue(comp.createdAt)}, ${escapeValue(comp.updatedAt)});\n`;
    });
    sql += '\n';
  }

  // Entries (last due to potential size)
  if (data.entries.length > 0) {
    sql += `-- Entries\n`;
    data.entries.forEach(entry => {
      sql += `INSERT INTO "Entry" (id, "userId", date, "rawText", "wordCount", "extractedData", "projectIds", "skillIds", "competencyIds", "isHighlight", sentiment, "createdAt", "updatedAt") VALUES (${escapeValue(entry.id)}, ${escapeValue(entry.userId)}, ${escapeValue(entry.date)}, ${escapeValue(entry.rawText)}, ${escapeValue(entry.wordCount)}, ${escapeValue(entry.extractedData)}, ${escapeValue(entry.projectIds)}, ${escapeValue(entry.skillIds)}, ${escapeValue(entry.competencyIds)}, ${escapeValue(entry.isHighlight)}, ${escapeValue(entry.sentiment)}, ${escapeValue(entry.createdAt)}, ${escapeValue(entry.updatedAt)});\n`;
    });
    sql += '\n';
  }

  // User Settings
  if (data.userSettings.length > 0) {
    sql += `-- User Settings\n`;
    data.userSettings.forEach(settings => {
      sql += `INSERT INTO "UserSettings" (id, "userId", "reminderTime", "reminderEnabled", "aiPromptStyle", "defaultTags", "allowExport", "allowAnalytics", "createdAt", "updatedAt") VALUES (${escapeValue(settings.id)}, ${escapeValue(settings.userId)}, ${escapeValue(settings.reminderTime)}, ${escapeValue(settings.reminderEnabled)}, ${escapeValue(settings.aiPromptStyle)}, ${escapeValue(settings.defaultTags)}, ${escapeValue(settings.allowExport)}, ${escapeValue(settings.allowAnalytics)}, ${escapeValue(settings.createdAt)}, ${escapeValue(settings.updatedAt)});\n`;
    });
  }

  return sql;
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  exportData().catch(console.error);
}

module.exports = { exportData };