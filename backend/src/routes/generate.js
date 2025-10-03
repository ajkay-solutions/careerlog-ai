const express = require('express');
const { requireAuth } = require('../middleware/auth');
const dbService = require('../services/database');
const ClaudeService = require('../services/ai/claudeService');
const PDFService = require('../services/pdfService');
const DOCXService = require('../services/docxService');

const router = express.Router();

// Initialize services
const claudeService = new ClaudeService();
const pdfService = new PDFService();
const docxService = new DOCXService();

// Helper function to generate text using Claude
async function generateText(prompt, options = {}) {
  const response = await claudeService.client.messages.create({
    model: options.model || 'claude-3-haiku-20240307',
    max_tokens: options.maxTokens || 2000,
    temperature: options.temperature || 0.3,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });
  
  return response.content[0].text;
}

// POST /api/generate/performance-review - Generate performance review summary
router.post('/performance-review', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      startDate,
      endDate,
      timeframe = 'quarter',
      competencyFramework = 'general',
      format = 'structured'
    } = req.body;

    console.log(`📊 Generating performance review for user ${userId}, timeframe: ${timeframe}`);

    // Get user data for the specified period
    const userData = await dbService.executeOperation(async (prismaClient) => {
      // Build date filter
      const dateFilter = {
        userId,
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      };

      // Get entries for the period
      const entries = await prismaClient.entry.findMany({
        where: dateFilter,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          date: true,
          rawText: true,
          extractedData: true,
          wordCount: true,
          sentiment: true,
          isHighlight: true
        }
      });

      // Get projects
      const projects = await prismaClient.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });

      // Get skills
      const skills = await prismaClient.skill.findMany({
        where: { userId },
        orderBy: { usageCount: 'desc' }
      });

      // Get competencies
      const competencies = await prismaClient.competency.findMany({
        where: { userId },
        orderBy: { demonstrationCount: 'desc' }
      });

      return { entries, projects, skills, competencies };
    }, 'performance review generation');

    if (userData.entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No journal entries found for the specified period'
      });
    }

    // Prepare data for AI analysis
    const analysisData = {
      period: { startDate, endDate, timeframe },
      summary: {
        totalEntries: userData.entries.length,
        totalWords: userData.entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0),
        highlightedEntries: userData.entries.filter(e => e.isHighlight).length
      },
      entries: userData.entries.map(entry => ({
        date: entry.date.toISOString().split('T')[0],
        content: entry.rawText,
        analysis: entry.extractedData,
        sentiment: entry.sentiment,
        isHighlight: entry.isHighlight
      })),
      projects: userData.projects,
      skills: userData.skills,
      competencies: userData.competencies
    };

    // Generate performance review using AI
    const aiPrompt = `Generate a comprehensive performance review summary based on the following work journal data:

**Review Period**: ${startDate || 'Beginning'} to ${endDate || 'Present'} (${timeframe})
**Competency Framework**: ${competencyFramework}

**Data Summary**:
- Total journal entries: ${analysisData.summary.totalEntries}
- Total words written: ${analysisData.summary.totalWords}
- Highlighted achievements: ${analysisData.summary.highlightedEntries}
- Active projects: ${userData.projects.length}
- Skills demonstrated: ${userData.skills.length}
- Competencies shown: ${userData.competencies.length}

**Recent Entries** (last 10):
${userData.entries.slice(0, 10).map(entry => 
  `${entry.date.toISOString().split('T')[0]}: ${entry.rawText.slice(0, 200)}...`
).join('\n')}

**Top Projects**:
${userData.projects.slice(0, 5).map(project => 
  `- ${project.name} (${project.status}) - ${project.entryCount} entries`
).join('\n')}

**Top Skills**:
${userData.skills.slice(0, 10).map(skill => 
  `- ${skill.name} (${skill.category}) - used ${skill.usageCount} times`
).join('\n')}

**Top Competencies**:
${userData.competencies.slice(0, 5).map(comp => 
  `- ${comp.name} - demonstrated ${comp.demonstrationCount} times`
).join('\n')}

Please generate a structured performance review with the following sections:
1. **Executive Summary** (2-3 sentences of key achievements)
2. **Key Accomplishments** (3-5 bullet points with specific examples)
3. **Project Contributions** (highlight major projects and impact)
4. **Skills & Competencies Demonstrated** (organized by category)
5. **Growth Areas & Future Focus** (based on patterns in the data)
6. **Quantitative Impact** (metrics and numbers where available)

Format: Use markdown with clear headings and bullet points. Be specific and use data from the journal entries to support claims.`;

    const performanceReview = await generateText(aiPrompt, {
      maxTokens: 2000,
      temperature: 0.3 // Lower temperature for more consistent, professional output
    });

    const reviewData = {
      review: performanceReview,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate, timeframe },
        sourceData: {
          entries: userData.entries.length,
          projects: userData.projects.length,
          skills: userData.skills.length,
          competencies: userData.competencies.length
        },
        framework: competencyFramework,
        format: format
      }
    };

    // Handle different output formats
    switch (format.toLowerCase()) {
      case 'pdf':
        try {
          console.log('📄 Generating PDF performance review...');
          const pdfBuffer = await pdfService.generatePerformanceReviewPDF(reviewData);
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="performance-review-${timeframe}-${new Date().toISOString().split('T')[0]}.pdf"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          
          return res.send(pdfBuffer);
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          // Fallback to JSON
          return res.json({ success: true, data: reviewData });
        }

      case 'docx':
        try {
          console.log('📄 Generating DOCX performance review...');
          const docxBuffer = await docxService.generatePerformanceReviewDOCX(reviewData);
          
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="performance-review-${timeframe}-${new Date().toISOString().split('T')[0]}.docx"`);
          res.setHeader('Content-Length', docxBuffer.length);
          
          return res.send(docxBuffer);
        } catch (docxError) {
          console.error('DOCX generation failed:', docxError);
          // Fallback to JSON
          return res.json({ success: true, data: reviewData });
        }

      default:
        // Return JSON for all other formats
        return res.json({ success: true, data: reviewData });
    }

  } catch (error) {
    console.error('❌ Performance review generation failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance review',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/generate/resume-bullets - Generate resume bullet points
router.post('/resume-bullets', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      startDate,
      endDate,
      timeframe = 'year',
      targetRole,
      industry,
      maxBullets = 10,
      format = 'action-result'
    } = req.body;

    console.log(`📋 Generating resume bullets for user ${userId}, timeframe: ${timeframe}`);

    // Get user data for the specified period
    const userData = await dbService.executeOperation(async (prismaClient) => {
      // Build date filter
      const dateFilter = {
        userId,
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      };

      // Get highlighted entries and high-impact entries
      const entries = await prismaClient.entry.findMany({
        where: {
          ...dateFilter,
          OR: [
            { isHighlight: true },
            { sentiment: 'positive' },
            { wordCount: { gte: 100 } } // Longer entries likely have more detail
          ]
        },
        orderBy: { date: 'desc' },
        take: 50, // Limit to most recent/relevant entries
        select: {
          id: true,
          date: true,
          rawText: true,
          extractedData: true,
          isHighlight: true,
          sentiment: true
        }
      });

      // Get projects with high entry counts
      const projects = await prismaClient.project.findMany({
        where: { 
          userId,
          entryCount: { gte: 3 } // Projects with substantial activity
        },
        orderBy: { entryCount: 'desc' },
        take: 10
      });

      // Get top skills
      const skills = await prismaClient.skill.findMany({
        where: { 
          userId,
          usageCount: { gte: 2 }
        },
        orderBy: { usageCount: 'desc' },
        take: 15
      });

      return { entries, projects, skills };
    }, 'resume bullets generation');

    if (userData.entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No substantial journal entries found for the specified period'
      });
    }

    // Prepare data for AI analysis
    const analysisData = {
      period: { startDate, endDate, timeframe },
      targetRole: targetRole || 'Professional role',
      industry: industry || 'Technology',
      achievements: userData.entries.map(entry => ({
        date: entry.date.toISOString().split('T')[0],
        content: entry.rawText,
        analysis: entry.extractedData,
        isHighlight: entry.isHighlight
      })),
      projects: userData.projects,
      skills: userData.skills
    };

    // Generate resume bullets using AI
    const aiPrompt = `Generate compelling resume bullet points based on the following work achievements:

**Target Role**: ${targetRole || 'Professional position'}
**Industry**: ${industry || 'Technology'}
**Time Period**: ${startDate || 'Recent'} to ${endDate || 'Present'}
**Requested Format**: ${format}

**Achievement Data**:
${userData.entries.slice(0, 20).map((entry, index) => 
  `${index + 1}. [${entry.date.toISOString().split('T')[0]}] ${entry.rawText}`
).join('\n')}

**Key Projects**:
${userData.projects.map(project => 
  `- ${project.name} (${project.status}) - ${project.entryCount} logged activities`
).join('\n')}

**Skills Demonstrated**:
${userData.skills.slice(0, 12).map(skill => 
  `- ${skill.name} (${skill.category})`
).join('\n')}

Please generate ${maxBullets} powerful resume bullet points that:
1. Start with strong action verbs
2. Include quantifiable results where possible
3. Are relevant to the target role of "${targetRole || 'professional position'}"
4. Use the ${format} format (action verb + context + result)
5. Are 1-2 lines each, optimized for ATS systems
6. Highlight leadership, impact, and technical skills
7. Use specific examples from the journal entries

Format each bullet point as:
• [Action verb] [what you did] [quantifiable result/impact]

Focus on the most impactful achievements and avoid generic statements.`;

    const resumeBullets = await generateText(aiPrompt, {
      maxTokens: 1500,
      temperature: 0.4 // Slightly higher for more creative phrasing
    });

    const bulletsData = {
      bullets: resumeBullets,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate, timeframe },
        targetRole: targetRole,
        industry: industry,
        sourceData: {
          entries: userData.entries.length,
          projects: userData.projects.length,
          skills: userData.skills.length
        },
        format: format,
        maxBullets: maxBullets
      }
    };

    // Handle different output formats
    switch (format.toLowerCase()) {
      case 'pdf':
        try {
          console.log('📄 Generating PDF resume bullets...');
          const pdfBuffer = await pdfService.generateResumeBulletsPDF(bulletsData);
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="resume-bullets-${timeframe}-${new Date().toISOString().split('T')[0]}.pdf"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          
          return res.send(pdfBuffer);
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          // Fallback to JSON
          return res.json({ success: true, data: bulletsData });
        }

      case 'docx':
        try {
          console.log('📄 Generating DOCX resume bullets...');
          const docxBuffer = await docxService.generateResumeBulletsDOCX(bulletsData);
          
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="resume-bullets-${timeframe}-${new Date().toISOString().split('T')[0]}.docx"`);
          res.setHeader('Content-Length', docxBuffer.length);
          
          return res.send(docxBuffer);
        } catch (docxError) {
          console.error('DOCX generation failed:', docxError);
          // Fallback to JSON
          return res.json({ success: true, data: bulletsData });
        }

      default:
        // Return JSON for all other formats
        return res.json({ success: true, data: bulletsData });
    }

  } catch (error) {
    console.error('❌ Resume bullets generation failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate resume bullets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export generated content (used by GeneratedContentEditor)
router.post('/export', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, format, content, metadata } = req.body;

    console.log(`📤 Exporting ${type} in ${format} format for user ${userId}`);

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Content is required for export'
      });
    }

    // Prepare export data structure
    const exportData = {
      user: {
        displayName: req.user.displayName || 'WorkLog AI User',
        email: req.user.email
      },
      content: content,
      metadata: {
        type: type,
        generatedAt: metadata.generatedAt || new Date().toISOString(),
        timeframe: metadata.timeframe || 'custom',
        entriesCount: metadata.entriesCount || 0,
        ...metadata
      }
    };

    let fileBuffer;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'pdf':
        if (type === 'performance-review') {
          fileBuffer = await pdfService.generatePerformanceReviewPDF({
            review: content,
            metadata: exportData.metadata
          });
        } else if (type === 'resume-bullets') {
          fileBuffer = await pdfService.generateResumeBulletsPDF({
            bullets: content,
            metadata: exportData.metadata
          });
        } else {
          throw new Error(`Unsupported PDF export type: ${type}`);
        }
        contentType = 'application/pdf';
        filename = `${type}-${new Date().toISOString().split('T')[0]}.pdf`;
        break;

      case 'docx':
        if (type === 'performance-review') {
          fileBuffer = await docxService.generatePerformanceReviewDOCX({
            review: content,
            metadata: exportData.metadata
          });
        } else if (type === 'resume-bullets') {
          fileBuffer = await docxService.generateResumeBulletsDOCX({
            bullets: content,
            metadata: exportData.metadata
          });
        } else {
          throw new Error(`Unsupported DOCX export type: ${type}`);
        }
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${type}-${new Date().toISOString().split('T')[0]}.docx`;
        break;

      case 'json':
        fileBuffer = Buffer.from(JSON.stringify(exportData, null, 2));
        contentType = 'application/json';
        filename = `${type}-${new Date().toISOString().split('T')[0]}.json`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported format: ${format}`
        });
    }

    // Set response headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    console.log(`✅ Export completed: ${filename} (${fileBuffer.length} bytes)`);

    // Send the file
    res.send(fileBuffer);

  } catch (error) {
    console.error('❌ Export failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Export failed. Please try again.'
    });
  }
});

module.exports = router;