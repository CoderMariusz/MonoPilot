#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ModuleConfig {
  name: string;
  displayName: string;
  grepPattern: string;
  script: string;
}

const modules: ModuleConfig[] = [
  { name: 'auth', displayName: 'Auth', grepPattern: 'auth', script: 'test:e2e:auth' },
  { name: 'bom', displayName: 'BOM', grepPattern: 'BOM', script: 'test:e2e:bom' },
  { name: 'planning', displayName: 'Planning', grepPattern: 'Planning', script: 'test:e2e:planning' },
  { name: 'production', displayName: 'Production', grepPattern: 'Production', script: 'test:e2e:production' },
  { name: 'warehouse', displayName: 'Warehouse', grepPattern: 'Warehouse', script: 'test:e2e:warehouse' },
  { name: 'scanner', displayName: 'Scanner', grepPattern: 'Scanner', script: 'test:e2e:scanner' },
  { name: 'settings', displayName: 'Settings', grepPattern: 'Settings', script: 'test:e2e:settings' },
  { name: 'admin', displayName: 'Admin', grepPattern: 'Admin', script: 'test:e2e:admin' },
  { name: 'performance', displayName: 'Performance', grepPattern: 'performance', script: 'test:e2e:performance' },
  { name: 'error-handling', displayName: 'Error Handling', grepPattern: 'error-handling', script: 'test:e2e:error-handling' },
  { name: 'components', displayName: 'UI Components', grepPattern: 'components', script: 'test:e2e:components' }
];

interface ModuleResult {
  module: string;
  displayName: string;
  status: 'success' | 'partial' | 'failed';
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  reportPath: string;
  error?: string;
}

async function runModuleTests(module: ModuleConfig): Promise<ModuleResult> {
  console.log(`🧪 Running tests for ${module.displayName} module...`);
  
  const reportDir = 'test-results';
  const reportsDir = 'test-reports';
  const jsonFile = path.join(reportDir, `${module.name}-results.json`);
  const reportFile = path.join(reportsDir, `${module.name}-module.md`);

  try {
    // Ensure directories exist
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Run tests
    const startTime = Date.now();
    execSync(`pnpm ${module.script} --reporter=json > "${jsonFile}" 2>&1`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const duration = Date.now() - startTime;

    // Generate report
    execSync(`tsx scripts/generate-test-report.ts "${module.name}" "${jsonFile}" "${reportFile}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Parse results
    const content = fs.readFileSync(jsonFile, 'utf-8');
    const lines = content.split('\n');
    let jsonLine = '';
    
    for (const line of lines) {
      if (line.trim().startsWith('{') && line.includes('"suites"')) {
        jsonLine = line;
        break;
      }
    }

    if (jsonLine) {
      const result = JSON.parse(jsonLine);
      const stats = result.stats;
      
      let status: 'success' | 'partial' | 'failed';
      if (stats.failed === 0) {
        status = 'success';
      } else if (stats.passed > stats.failed) {
        status = 'partial';
      } else {
        status = 'failed';
      }

      return {
        module: module.name,
        displayName: module.displayName,
        status,
        passed: stats.passed,
        failed: stats.failed,
        skipped: stats.skipped,
        total: stats.total,
        duration: Math.round(duration / 1000),
        reportPath: reportFile
      };
    } else {
      return {
        module: module.name,
        displayName: module.displayName,
        status: 'failed',
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: Math.round(duration / 1000),
        reportPath: reportFile,
        error: 'Failed to parse test results'
      };
    }

  } catch (error) {
    console.error(`❌ Failed to run tests for ${module.displayName}:`, error);
    return {
      module: module.name,
      displayName: module.displayName,
      status: 'failed',
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      reportPath: reportFile,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function generateMasterReport(results: ModuleResult[]): string {
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  const successModules = results.filter(r => r.status === 'success').length;
  const partialModules = results.filter(r => r.status === 'partial').length;
  const failedModules = results.filter(r => r.status === 'failed').length;

  let markdown = `# E2E Test Master Report\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  
  markdown += `## 📊 Executive Summary\n\n`;
  markdown += `- **Total Tests:** ${totalTests}\n`;
  markdown += `- **Passed:** ${totalPassed} (${passRate}%)\n`;
  markdown += `- **Failed:** ${totalFailed}\n`;
  markdown += `- **Skipped:** ${totalSkipped}\n`;
  markdown += `- **Modules Tested:** ${results.length}\n`;
  markdown += `- **Fully Passing:** ${successModules}\n`;
  markdown += `- **Partially Passing:** ${partialModules}\n`;
  markdown += `- **Failed:** ${failedModules}\n\n`;

  if (passRate === 100) {
    markdown += `## 🎉 Status: All Tests Passing\n\n`;
    markdown += `Congratulations! All E2E tests are passing across all modules.\n\n`;
  } else if (passRate >= 80) {
    markdown += `## ⚠️ Status: Mostly Passing\n\n`;
    markdown += `Most tests are passing, but there are some issues to address.\n\n`;
  } else {
    markdown += `## ❌ Status: Major Issues\n\n`;
    markdown += `Many tests are failing and need attention.\n\n`;
  }

  markdown += `## 📋 Module Breakdown\n\n`;
  results.forEach(result => {
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
    const passRate = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
    
    markdown += `### ${statusIcon} ${result.displayName} Module\n`;
    markdown += `- **Status:** ${result.status.toUpperCase()}\n`;
    markdown += `- **Tests:** ${result.passed}/${result.total} passed (${passRate}%)\n`;
    markdown += `- **Duration:** ${result.duration}s\n`;
    markdown += `- **Report:** [${result.displayName} Report](./${result.module}-module.md)\n`;
    
    if (result.error) {
      markdown += `- **Error:** ${result.error}\n`;
    }
    markdown += '\n';
  });

  markdown += `## 🔧 Common Issues Found\n\n`;
  
  const hasAuthIssues = results.some(r => r.status === 'failed' && r.module === 'auth');
  const hasHelperIssues = results.some(r => r.failed > 0);
  
  if (hasAuthIssues) {
    markdown += `1. **Authentication Issues** - Auth module failing blocks other tests\n`;
  }
  if (hasHelperIssues) {
    markdown += `2. **Missing Helper Methods** - Some helper methods may need updates\n`;
  }
  markdown += `3. **Selector Mismatches** - Test selectors may not match actual HTML\n`;
  markdown += `4. **Test Data Issues** - Database may need test data seeding\n`;
  markdown += `5. **Timeout Issues** - Tests may be timing out due to slow responses\n\n`;

  markdown += `## 📈 Performance Metrics\n\n`;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const slowestModule = results.reduce((slowest, current) => 
    current.duration > slowest.duration ? current : slowest
  );
  
  markdown += `- **Average Module Duration:** ${Math.round(avgDuration)}s\n`;
  markdown += `- **Slowest Module:** ${slowestModule.displayName} (${slowestModule.duration}s)\n`;
  markdown += `- **Total Execution Time:** ${Math.round(results.reduce((sum, r) => sum + r.duration, 0))}s\n\n`;

  markdown += `## 🎯 Next Steps\n\n`;
  
  if (hasAuthIssues) {
    markdown += `- [ ] **Priority 1:** Fix authentication issues (blocks all other tests)\n`;
  }
  if (hasHelperIssues) {
    markdown += `- [ ] **Priority 2:** Update helper methods and selectors\n`;
  }
  markdown += `- [ ] **Priority 3:** Add missing test data to database\n`;
  markdown += `- [ ] **Priority 4:** Optimize slow tests\n`;
  markdown += `- [ ] **Priority 5:** Add integration tests\n`;
  markdown += `- [ ] **Priority 6:** Setup CI/CD pipeline\n\n`;

  markdown += `## 📁 Individual Module Reports\n\n`;
  results.forEach(result => {
    markdown += `- [${result.displayName} Report](./${result.module}-module.md)\n`;
  });

  markdown += '\n---\n\n';
  markdown += `*Master report generated by E2E Test Report Generator*\n`;

  return markdown;
}

async function main() {
  console.log('🚀 Starting comprehensive E2E test run...\n');

  const results: ModuleResult[] = [];

  for (const module of modules) {
    const result = await runModuleTests(module);
    results.push(result);
    
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${result.displayName}: ${result.passed}/${result.total} passed\n`);
  }

  // Generate master report
  console.log('📊 Generating master report...');
  const masterReport = generateMasterReport(results);
  
  const masterReportPath = 'test-reports/00-MASTER-REPORT.md';
  fs.writeFileSync(masterReportPath, masterReport);
  
  console.log(`✅ Master report generated: ${masterReportPath}`);

  // Summary
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  console.log('\n📊 Final Summary:');
  console.log(`- Total Tests: ${totalTests}`);
  console.log(`- Passed: ${totalPassed} (${passRate}%)`);
  console.log(`- Failed: ${results.reduce((sum, r) => sum + r.failed, 0)}`);
  console.log(`- Skipped: ${results.reduce((sum, r) => sum + r.skipped, 0)}`);
  console.log(`- Modules: ${results.length}`);
  console.log(`- Fully Passing: ${results.filter(r => r.status === 'success').length}`);
  console.log(`- Partially Passing: ${results.filter(r => r.status === 'partial').length}`);
  console.log(`- Failed: ${results.filter(r => r.status === 'failed').length}`);

  if (passRate === 100) {
    console.log('\n🎉 All tests are passing!');
  } else if (passRate >= 80) {
    console.log('\n⚠️ Most tests are passing, but some issues need attention.');
  } else {
    console.log('\n❌ Many tests are failing and need immediate attention.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runModuleTests, generateMasterReport };
