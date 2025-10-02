const { PrismaClient } = require('@prisma/client');
const ClaudeService = require('./claudeService');
const { cacheExtraction, getCachedExtraction } = require('../cache');

class AnalysisService {
  constructor() {
    this.prisma = new PrismaClient();
    this.claudeService = new ClaudeService();
  }

  // Analyze an entry and update the database with extracted data
  async analyzeEntry(entryId, options = {}) {
    try {
      console.log(`🔍 Starting analysis for entry ${entryId}...`);

      // Get the entry from database
      const entry = await this.prisma.entry.findUnique({
        where: { id: entryId },
        include: {
          user: {
            include: {
              projects: true,
              skills: true,
              competencies: true
            }
          }
        }
      });

      if (!entry) {
        throw new Error('Entry not found');
      }

      // Check cache first (optional optimization)
      if (!options.forceRefresh) {
        const cached = await getCachedExtraction(entry.rawText);
        if (cached) {
          console.log('📦 Using cached analysis result');
          await this.updateEntryWithAnalysis(entryId, cached);
          return { success: true, data: cached, cached: true };
        }
      }

      // Prepare user context for better AI analysis
      const userContext = {
        existingProjects: entry.user.projects.map(p => p.name),
        existingSkills: entry.user.skills.map(s => s.name),
        existingCompetencies: entry.user.competencies.map(c => c.name),
        jobTitle: entry.user.jobTitle,
        industry: entry.user.industry
      };

      // Analyze with Claude AI
      const analysisResult = await this.claudeService.analyzeEntry(entry.rawText, userContext);

      if (!analysisResult.success) {
        throw new Error(`AI analysis failed: ${analysisResult.error}`);
      }

      const extractedData = analysisResult.data;

      // Update entry with extracted data
      await this.updateEntryWithAnalysis(entryId, extractedData);

      // Process and store individual entities
      await this.processExtractedEntities(entry.userId, extractedData);

      // Cache the result for future use
      await cacheExtraction(entry.rawText, extractedData);

      console.log('✅ Entry analysis completed successfully');
      return {
        success: true,
        data: extractedData,
        usage: analysisResult.usage,
        cached: false
      };

    } catch (error) {
      console.error('❌ Entry analysis failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update entry with extracted data
  async updateEntryWithAnalysis(entryId, extractedData) {
    // Prepare arrays of IDs for manual tags
    const projectIds = [];
    const skillIds = [];
    const competencyIds = [];

    await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        extractedData: extractedData,
        sentiment: extractedData.sentiment,
        projectIds: projectIds,
        skillIds: skillIds,
        competencyIds: competencyIds
      }
    });
  }

  // Process extracted entities and create/update database records
  async processExtractedEntities(userId, extractedData) {
    // Process projects
    for (const project of extractedData.projects || []) {
      await this.upsertProject(userId, project);
    }

    // Process skills
    for (const skill of extractedData.skills || []) {
      await this.upsertSkill(userId, skill);
    }

    // Process competencies
    for (const competency of extractedData.competencies || []) {
      await this.upsertCompetency(userId, competency);
    }
  }

  // Create or update project
  async upsertProject(userId, projectData) {
    try {
      const existing = await this.prisma.project.findUnique({
        where: {
          userId_name: {
            userId: userId,
            name: projectData.name
          }
        }
      });

      if (existing) {
        // Update existing project
        await this.prisma.project.update({
          where: { id: existing.id },
          data: {
            entryCount: { increment: 1 },
            status: projectData.status || existing.status,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new project
        await this.prisma.project.create({
          data: {
            userId: userId,
            name: projectData.name,
            description: projectData.context || projectData.description,
            status: projectData.status || 'active',
            entryCount: 1
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to upsert project "${projectData.name}":`, error.message);
    }
  }

  // Create or update skill
  async upsertSkill(userId, skillData) {
    try {
      const existing = await this.prisma.skill.findUnique({
        where: {
          userId_name: {
            userId: userId,
            name: skillData.name
          }
        }
      });

      if (existing) {
        // Update existing skill
        await this.prisma.skill.update({
          where: { id: existing.id },
          data: {
            usageCount: { increment: 1 },
            lastUsed: new Date(),
            category: skillData.category || existing.category,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new skill
        await this.prisma.skill.create({
          data: {
            userId: userId,
            name: skillData.name,
            category: skillData.category || 'other',
            usageCount: 1,
            firstUsed: new Date(),
            lastUsed: new Date()
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to upsert skill "${skillData.name}":`, error.message);
    }
  }

  // Create or update competency
  async upsertCompetency(userId, competencyData) {
    try {
      const existing = await this.prisma.competency.findUnique({
        where: {
          userId_name: {
            userId: userId,
            name: competencyData.name
          }
        }
      });

      if (existing) {
        // Update existing competency
        await this.prisma.competency.update({
          where: { id: existing.id },
          data: {
            demonstrationCount: { increment: 1 },
            lastDemonstrated: new Date(),
            framework: competencyData.framework || existing.framework,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new competency
        await this.prisma.competency.create({
          data: {
            userId: userId,
            name: competencyData.name,
            framework: competencyData.framework || 'custom',
            description: competencyData.evidence || competencyData.description,
            demonstrationCount: 1,
            lastDemonstrated: new Date()
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to upsert competency "${competencyData.name}":`, error.message);
    }
  }

  // Analyze multiple entries in batch
  async batchAnalyzeEntries(entryIds, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 5; // Process 5 at a time to avoid rate limits
    
    for (let i = 0; i < entryIds.length; i += batchSize) {
      const batch = entryIds.slice(i, i + batchSize);
      const batchPromises = batch.map(entryId => this.analyzeEntry(entryId, options));
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < entryIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Get user's extracted data summary
  async getUserDataSummary(userId, timeframe = null) {
    const whereClause = { userId };
    
    if (timeframe) {
      const { startDate, endDate } = this.parseTimeframe(timeframe);
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const [projects, skills, competencies, entries] = await Promise.all([
      this.prisma.project.findMany({
        where: whereClause,
        orderBy: { entryCount: 'desc' }
      }),
      this.prisma.skill.findMany({
        where: whereClause,
        orderBy: { usageCount: 'desc' }
      }),
      this.prisma.competency.findMany({
        where: whereClause,
        orderBy: { demonstrationCount: 'desc' }
      }),
      this.prisma.entry.findMany({
        where: { ...whereClause, extractedData: { not: null } },
        select: {
          id: true,
          date: true,
          extractedData: true,
          sentiment: true,
          wordCount: true
        },
        orderBy: { date: 'desc' }
      })
    ]);

    return {
      projects,
      skills,
      competencies,
      entries,
      summary: {
        totalEntries: entries.length,
        totalProjects: projects.length,
        totalSkills: skills.length,
        totalCompetencies: competencies.length,
        timeframe: timeframe
      }
    };
  }

  // Parse timeframe string into start and end dates
  parseTimeframe(timeframe) {
    const now = new Date();
    let startDate, endDate = now;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    return { startDate, endDate };
  }

  // Health check for the analysis service
  async healthCheck() {
    try {
      const claudeHealth = await this.claudeService.healthCheck();
      
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        services: {
          claude: claudeHealth,
          database: { status: 'healthy' },
          cache: { status: 'available' }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = AnalysisService;