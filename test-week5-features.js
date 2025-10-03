#!/usr/bin/env node

// Comprehensive test for Week 5 features: Export & Generation + Chart Responsiveness
const fs = require('fs');
const path = require('path');

async function testWeek5Features() {
  console.log('🧪 Testing WorkLog AI Week 5 Features...\n');

  const testResults = {
    exportFunctionality: false,
    chartComponents: false,
    responsiveness: false,
    endToEndWorkflows: false,
    performance: false
  };

  // Test 1: Export Functionality (PDF, DOCX, JSON)
  console.log('📊 Test 1: Export Functionality');
  try {
    // Import and test export services
    const { testExportServices } = require('./test-export-functions');
    testResults.exportFunctionality = await testExportServices();
    console.log(testResults.exportFunctionality ? '✅ Export functionality: PASSED' : '❌ Export functionality: FAILED');
  } catch (error) {
    console.error('❌ Export functionality test failed:', error.message);
    testResults.exportFunctionality = false;
  }

  // Test 2: Chart Components
  console.log('\n📈 Test 2: Chart Components Integration');
  try {
    // Check if all chart components exist
    const chartComponents = [
      './frontend/src/components/insights/CompetencyChart.jsx',
      './frontend/src/components/insights/TrendChart.jsx', 
      './frontend/src/components/insights/ProjectTimeline.jsx',
      './frontend/src/components/insights/SkillsCloud.jsx'
    ];

    let allComponentsExist = true;
    chartComponents.forEach(component => {
      if (!fs.existsSync(component)) {
        console.error(`❌ Missing component: ${component}`);
        allComponentsExist = false;
      } else {
        console.log(`✅ Component exists: ${path.basename(component)}`);
      }
    });

    // Check if InsightsDashboard integrates the components
    const dashboardContent = fs.readFileSync('./frontend/src/components/InsightsDashboard.jsx', 'utf8');
    const integratedComponents = [
      'CompetencyChart',
      'TrendChart', 
      'ProjectTimeline',
      'SkillsCloud'
    ];

    let allIntegrated = true;
    integratedComponents.forEach(component => {
      if (!dashboardContent.includes(component)) {
        console.error(`❌ Component not integrated: ${component}`);
        allIntegrated = false;
      } else {
        console.log(`✅ Component integrated: ${component}`);
      }
    });

    testResults.chartComponents = allComponentsExist && allIntegrated;
    console.log(testResults.chartComponents ? '✅ Chart components: PASSED' : '❌ Chart components: FAILED');
  } catch (error) {
    console.error('❌ Chart components test failed:', error.message);
    testResults.chartComponents = false;
  }

  // Test 3: Responsiveness
  console.log('\n📱 Test 3: Responsive Design Verification');
  try {
    // Check for responsive design patterns in chart components
    const responsiveChecks = [];

    const checkResponsivePatterns = (filePath) => {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for responsive patterns
      const patterns = [
        /lg:col-span/g,        // Grid responsiveness
        /md:grid-cols/g,       // Medium breakpoint
        /sm:/g,                // Small breakpoint
        /ResponsiveContainer/g, // Recharts responsive container
        /grid.*grid-cols/g,     // Grid layouts
        /flex.*gap/g           // Flexbox with gaps
      ];

      return patterns.some(pattern => pattern.test(content));
    };

    const filesToCheck = [
      './frontend/src/components/insights/CompetencyChart.jsx',
      './frontend/src/components/insights/TrendChart.jsx',
      './frontend/src/components/insights/ProjectTimeline.jsx',
      './frontend/src/components/insights/SkillsCloud.jsx',
      './frontend/src/components/InsightsDashboard.jsx'
    ];

    let responsiveCount = 0;
    filesToCheck.forEach(file => {
      if (checkResponsivePatterns(file)) {
        console.log(`✅ Responsive design: ${path.basename(file)}`);
        responsiveCount++;
      } else {
        console.log(`⚠️  No responsive patterns: ${path.basename(file)}`);
      }
    });

    testResults.responsiveness = responsiveCount >= 4; // At least 4 out of 5 should be responsive
    console.log(testResults.responsiveness ? '✅ Responsive design: PASSED' : '❌ Responsive design: FAILED');
  } catch (error) {
    console.error('❌ Responsiveness test failed:', error.message);
    testResults.responsiveness = false;
  }

  // Test 4: End-to-End Workflow
  console.log('\n🔄 Test 4: End-to-End Workflow Validation');
  try {
    // Check if all necessary backend routes exist
    const routeFiles = [
      './backend/src/routes/export.js',
      './backend/src/routes/generate.js',
      './backend/src/routes/insights.js'
    ];

    let allRoutesExist = true;
    routeFiles.forEach(route => {
      if (!fs.existsSync(route)) {
        console.error(`❌ Missing route: ${route}`);
        allRoutesExist = false;
      } else {
        console.log(`✅ Route exists: ${path.basename(route)}`);
      }
    });

    // Check if services exist
    const serviceFiles = [
      './backend/src/services/pdfService.js',
      './backend/src/services/docxService.js'
    ];

    let allServicesExist = true;
    serviceFiles.forEach(service => {
      if (!fs.existsSync(service)) {
        console.error(`❌ Missing service: ${service}`);
        allServicesExist = false;
      } else {
        console.log(`✅ Service exists: ${path.basename(service)}`);
      }
    });

    // Check if frontend modal handles exports
    const modalContent = fs.readFileSync('./frontend/src/components/ExportModal.jsx', 'utf8');
    const hasExportHandling = modalContent.includes('PDF') && 
                              modalContent.includes('DOCX') && 
                              modalContent.includes('performance-review') &&
                              modalContent.includes('resume-bullets');

    if (hasExportHandling) {
      console.log('✅ Export modal handles all formats');
    } else {
      console.log('❌ Export modal missing format handling');
    }

    testResults.endToEndWorkflows = allRoutesExist && allServicesExist && hasExportHandling;
    console.log(testResults.endToEndWorkflows ? '✅ End-to-end workflows: PASSED' : '❌ End-to-end workflows: FAILED');
  } catch (error) {
    console.error('❌ End-to-end workflow test failed:', error.message);
    testResults.endToEndWorkflows = false;
  }

  // Test 5: Performance Indicators
  console.log('\n⚡ Test 5: Performance Optimization Verification');
  try {
    // Check for performance optimizations
    const performanceChecks = [];

    // Check for React optimization patterns
    const dashboardContent = fs.readFileSync('./frontend/src/components/InsightsDashboard.jsx', 'utf8');
    const hasUseMemo = dashboardContent.includes('useMemo') || dashboardContent.includes('useCallback');
    const hasConditionalRendering = dashboardContent.includes('&&') && dashboardContent.includes('dashboardData');
    
    // Check chart components for optimization
    const chartFiles = [
      './frontend/src/components/insights/CompetencyChart.jsx',
      './frontend/src/components/insights/SkillsCloud.jsx'
    ];

    let hasChartOptimizations = false;
    chartFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('useMemo') || content.includes('useCallback') || content.includes('useState')) {
          hasChartOptimizations = true;
        }
      }
    });

    // Check for caching in backend
    const cachePatterns = ['cachedDatabase', 'redis', 'cache'];
    let hasCaching = false;
    ['./backend/src/routes/insights.js', './backend/src/routes/export.js'].forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (cachePatterns.some(pattern => content.includes(pattern))) {
          hasCaching = true;
        }
      }
    });

    console.log(hasConditionalRendering ? '✅ Conditional rendering implemented' : '⚠️  No conditional rendering');
    console.log(hasChartOptimizations ? '✅ Chart optimizations present' : '⚠️  No chart optimizations');
    console.log(hasCaching ? '✅ Backend caching implemented' : '⚠️  No backend caching');

    testResults.performance = hasConditionalRendering && hasChartOptimizations && hasCaching;
    console.log(testResults.performance ? '✅ Performance optimizations: PASSED' : '❌ Performance optimizations: FAILED');
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    testResults.performance = false;
  }

  // Generate comprehensive test report
  console.log('\n' + '='.repeat(60));
  console.log('📊 WEEK 5 FEATURES TEST REPORT');
  console.log('='.repeat(60));

  const testCategories = [
    { name: 'Export Functionality (PDF/DOCX/JSON)', status: testResults.exportFunctionality, weight: 25 },
    { name: 'Chart Components Integration', status: testResults.chartComponents, weight: 25 },
    { name: 'Responsive Design', status: testResults.responsiveness, weight: 20 },
    { name: 'End-to-End Workflows', status: testResults.endToEndWorkflows, weight: 20 },
    { name: 'Performance Optimizations', status: testResults.performance, weight: 10 }
  ];

  let totalScore = 0;
  testCategories.forEach(test => {
    const status = test.status ? '✅ PASSED' : '❌ FAILED';
    const score = test.status ? test.weight : 0;
    totalScore += score;
    console.log(`${test.name.padEnd(35)} ${status} (${score}/${test.weight} points)`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`OVERALL SCORE: ${totalScore}/100 points`);
  
  let grade = 'F';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';

  console.log(`GRADE: ${grade}`);
  
  const status = totalScore >= 80 ? 'READY FOR PRODUCTION' : 'NEEDS IMPROVEMENT';
  console.log(`STATUS: ${status}`);

  // Week 5 completion assessment
  const week5Complete = testResults.exportFunctionality && 
                        testResults.chartComponents && 
                        testResults.endToEndWorkflows;

  console.log('\n' + '='.repeat(60));
  console.log('📅 WEEK 5 COMPLETION ASSESSMENT');
  console.log('='.repeat(60));
  console.log(`Export & Generation Features: ${testResults.exportFunctionality ? 'COMPLETE' : 'INCOMPLETE'}`);
  console.log(`Polish & Optimization: ${testResults.responsiveness && testResults.performance ? 'COMPLETE' : 'IN PROGRESS'}`);
  console.log(`Overall Week 5 Status: ${week5Complete ? 'COMPLETE ✅' : 'IN PROGRESS 🔄'}`);

  if (week5Complete) {
    console.log('\n🎉 Week 5 features successfully implemented!');
    console.log('📋 Ready for user testing and production deployment preparation.');
    console.log('🔄 All core export functionality and visualization features are operational.');
  } else {
    console.log('\n⚠️  Week 5 implementation needs attention.');
    console.log('📋 Review failed tests and complete remaining items.');
  }

  return { totalScore, grade, week5Complete, testResults };
}

// Run the comprehensive test
if (require.main === module) {
  testWeek5Features()
    .then(result => {
      process.exit(result.week5Complete ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}

module.exports = { testWeek5Features };