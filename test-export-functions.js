#!/usr/bin/env node

// Test export functionality for WorkLog AI
const path = require('path');

// Import services
const PDFService = require('./backend/src/services/pdfService');
const DOCXService = require('./backend/src/services/docxService');

async function testExportServices() {
  console.log('🧪 Testing WorkLog AI Export Services...\n');

  // Initialize services
  const pdfService = new PDFService();
  const docxService = new DOCXService();

  // Create test data
  const testExportData = {
    user: {
      id: 'test-user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    period: {
      startDate: '2024-09-01',
      endDate: '2024-10-03',
      timeframe: 'month'
    },
    summary: {
      totalEntries: 15,
      totalWords: 3250,
      totalProjects: 5,
      totalSkills: 12,
      totalCompetencies: 8
    },
    entries: [
      {
        id: 'entry-1',
        date: '2024-10-01',
        rawText: 'Today I worked on implementing the export functionality for WorkLog AI. Successfully integrated PDF and DOCX generation using PDFKit and docx libraries. The challenge was handling different export formats and ensuring proper file downloads in the frontend.',
        extractedData: {
          projects: [{ name: 'WorkLog AI Export Feature', status: 'active' }],
          skills: [{ name: 'Node.js', category: 'technical' }, { name: 'PDF Generation', category: 'technical' }],
          competencies: [{ name: 'Problem Solving', level: 'advanced' }],
          metrics: { linesOfCode: 500, testsWritten: 10 }
        },
        wordCount: 85,
        sentiment: 'positive',
        isHighlight: true
      },
      {
        id: 'entry-2',
        date: '2024-10-02',
        rawText: 'Continued testing the export functionality. Created comprehensive test cases for PDF and DOCX generation. Fixed several edge cases related to data formatting and file encoding. The export feature is now working reliably.',
        extractedData: {
          projects: [{ name: 'WorkLog AI Export Feature', status: 'active' }],
          skills: [{ name: 'Testing', category: 'technical' }, { name: 'Debugging', category: 'technical' }],
          competencies: [{ name: 'Quality Assurance', level: 'proficient' }],
          metrics: { bugsFixed: 5, testCoverage: 85 }
        },
        wordCount: 78,
        sentiment: 'positive',
        isHighlight: false
      }
    ],
    projects: [
      { id: 'proj-1', name: 'WorkLog AI Export Feature', status: 'active', entryCount: 8 },
      { id: 'proj-2', name: 'User Interface Improvements', status: 'completed', entryCount: 12 },
      { id: 'proj-3', name: 'Database Optimization', status: 'archived', entryCount: 5 }
    ],
    skills: [
      { id: 'skill-1', name: 'Node.js', category: 'technical', usageCount: 25 },
      { id: 'skill-2', name: 'React', category: 'technical', usageCount: 18 },
      { id: 'skill-3', name: 'Problem Solving', category: 'soft', usageCount: 22 },
      { id: 'skill-4', name: 'PDF Generation', category: 'technical', usageCount: 8 }
    ],
    competencies: [
      { id: 'comp-1', name: 'Technical Excellence', demonstrationCount: 15 },
      { id: 'comp-2', name: 'Problem Solving', demonstrationCount: 12 },
      { id: 'comp-3', name: 'Quality Focus', demonstrationCount: 8 }
    ]
  };

  const testPerformanceReviewData = {
    review: `# Performance Review Summary

## Executive Summary
During the review period, the employee demonstrated exceptional technical skills and problem-solving abilities, successfully delivering critical features for the WorkLog AI application.

## Key Accomplishments
• Successfully implemented export functionality with PDF and DOCX generation capabilities
• Improved system performance by 90% through database optimization and caching implementation
• Led the development of interactive visualization components for the insights dashboard
• Demonstrated strong debugging and testing skills, achieving 85% test coverage

## Project Contributions
### WorkLog AI Export Feature
- Led the design and implementation of the export system
- Integrated multiple file format support (PDF, DOCX, JSON)
- Achieved 100% reliability in file generation and download functionality

### User Interface Improvements
- Enhanced user experience with responsive design and interactive components
- Implemented advanced data visualizations using Recharts library
- Improved accessibility and usability across all major browsers

## Skills & Competencies Demonstrated
### Technical Skills
- **Node.js**: Advanced proficiency demonstrated through backend development
- **React**: Expert-level implementation of complex UI components
- **Database Optimization**: Significant performance improvements achieved

### Soft Skills
- **Problem Solving**: Consistently resolved complex technical challenges
- **Quality Focus**: Maintained high standards throughout development process
- **Communication**: Clear documentation and code comments

## Growth Areas & Future Focus
- Continue expanding expertise in AI integration and machine learning
- Explore advanced performance optimization techniques
- Develop leadership skills for mentoring junior developers

## Quantitative Impact
- System performance improved by 90%
- Export functionality serves 100% of user requests successfully
- Test coverage increased to 85%
- Code quality maintained at 95%+ standards`,
    metadata: {
      generatedAt: new Date().toISOString(),
      period: { startDate: '2024-09-01', endDate: '2024-10-03', timeframe: 'month' },
      sourceData: {
        entries: 15,
        projects: 5,
        skills: 12,
        competencies: 8
      }
    }
  };

  const testResumeBulletsData = {
    bullets: `• Developed and implemented comprehensive export functionality for WorkLog AI application, enabling users to generate professional PDF and DOCX documents from journal data with 100% reliability

• Optimized database performance by 90% through implementation of Redis caching layer and connection pooling, reducing average response times from 2.2 seconds to under 250ms

• Built interactive data visualization dashboard using React and Recharts, featuring competency charts, trend analysis, and project timelines that improved user engagement by 85%

• Led technical problem-solving initiatives that resolved 15+ critical bugs and edge cases, achieving 95%+ code quality standards and 85% test coverage

• Designed and developed scalable Node.js backend services with Express.js and Prisma ORM, supporting authentication, data processing, and AI integration for 1000+ potential users

• Implemented responsive frontend components using React 18 and Tailwind CSS, ensuring cross-browser compatibility and accessibility compliance across all major platforms

• Integrated Anthropic Claude AI API for intelligent journal analysis and content generation, processing natural language text to extract projects, skills, and competencies with high accuracy

• Established comprehensive testing framework and quality assurance processes, reducing production bugs by 90% and improving overall system reliability

• Collaborated on full-stack development using modern JavaScript technologies, Docker containerization, and CI/CD practices to deliver features on schedule

• Created technical documentation and user guides that improved onboarding efficiency and reduced support requests by 60%`,
    metadata: {
      generatedAt: new Date().toISOString(),
      period: { startDate: '2024-09-01', endDate: '2024-10-03', timeframe: 'month' },
      targetRole: 'Senior Software Engineer',
      industry: 'Technology',
      sourceData: {
        entries: 15,
        projects: 5,
        skills: 12
      }
    }
  };

  try {
    console.log('🧪 Testing PDF Export Generation...');
    
    // Test Journal Export PDF
    console.log('  📄 Generating journal export PDF...');
    const journalPDF = await pdfService.generateJournalExportPDF(testExportData);
    console.log(`  ✅ Journal PDF generated: ${journalPDF.length} bytes`);

    // Test Performance Review PDF
    console.log('  📄 Generating performance review PDF...');
    const reviewPDF = await pdfService.generatePerformanceReviewPDF(testPerformanceReviewData);
    console.log(`  ✅ Performance review PDF generated: ${reviewPDF.length} bytes`);

    // Test Resume Bullets PDF
    console.log('  📄 Generating resume bullets PDF...');
    const bulletsPDF = await pdfService.generateResumeBulletsPDF(testResumeBulletsData);
    console.log(`  ✅ Resume bullets PDF generated: ${bulletsPDF.length} bytes`);

    console.log('\n🧪 Testing DOCX Export Generation...');
    
    // Test Journal Export DOCX
    console.log('  📄 Generating journal export DOCX...');
    const journalDOCX = await docxService.generateJournalExportDOCX(testExportData);
    console.log(`  ✅ Journal DOCX generated: ${journalDOCX.length} bytes`);

    // Test Performance Review DOCX
    console.log('  📄 Generating performance review DOCX...');
    const reviewDOCX = await docxService.generatePerformanceReviewDOCX(testPerformanceReviewData);
    console.log(`  ✅ Performance review DOCX generated: ${reviewDOCX.length} bytes`);

    // Test Resume Bullets DOCX
    console.log('  📄 Generating resume bullets DOCX...');
    const bulletsDOCX = await docxService.generateResumeBulletsDOCX(testResumeBulletsData);
    console.log(`  ✅ Resume bullets DOCX generated: ${bulletsDOCX.length} bytes`);

    console.log('\n🎉 All export tests completed successfully!');
    console.log('\n📊 Test Results Summary:');
    console.log(`  • Journal Export PDF: ${journalPDF.length} bytes`);
    console.log(`  • Performance Review PDF: ${reviewPDF.length} bytes`);
    console.log(`  • Resume Bullets PDF: ${bulletsPDF.length} bytes`);
    console.log(`  • Journal Export DOCX: ${journalDOCX.length} bytes`);
    console.log(`  • Performance Review DOCX: ${reviewDOCX.length} bytes`);
    console.log(`  • Resume Bullets DOCX: ${bulletsDOCX.length} bytes`);

    // Optional: Save test files to filesystem for manual verification
    console.log('\n💾 Saving test files for manual verification...');
    const fs = require('fs');
    const testDir = './test-exports';
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }

    fs.writeFileSync(`${testDir}/journal-export-test.pdf`, journalPDF);
    fs.writeFileSync(`${testDir}/performance-review-test.pdf`, reviewPDF);
    fs.writeFileSync(`${testDir}/resume-bullets-test.pdf`, bulletsPDF);
    fs.writeFileSync(`${testDir}/journal-export-test.docx`, journalDOCX);
    fs.writeFileSync(`${testDir}/performance-review-test.docx`, reviewDOCX);
    fs.writeFileSync(`${testDir}/resume-bullets-test.docx`, bulletsDOCX);

    console.log(`  ✅ Test files saved to ${testDir}/`);
    console.log('  📁 You can open these files to verify the formatting and content');

    return true;

  } catch (error) {
    console.error('❌ Export test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testExportServices()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testExportServices };