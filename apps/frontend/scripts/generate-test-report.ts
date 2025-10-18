#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: {
    message: string;
    stack?: string;
  };
}

interface TestSuite {
  title: string;
  file: string;
  tests: TestResult[];
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
}

interface PlaywrightReport {
  config: any;
  suites: TestSuite[];
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

function parseTestResults(jsonFilePath: string): PlaywrightReport | null {
  try {
    const content = fs.readFileSync(jsonFilePath, 'utf-8');
    
    // Handle case where the file contains both JSON and other output
    const lines = content.split('\n');
    let jsonStart = -1;
    let jsonEnd = -1;
    
    // Find the start of JSON (first line that starts with {)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('{')) {
        jsonStart = i;
        break;
      }
    }
    
    if (jsonStart === -1) {
      console.error('❌ No JSON found in test results');
      return null;
    }
    
    // Find the end of JSON (look for the last } that's not part of a string)
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = jsonStart; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i;
              break;
            }
          }
        }
      }
      
      if (jsonEnd !== -1) break;
    }
    
    if (jsonEnd === -1) {
      console.error('❌ Could not find end of JSON');
      return null;
    }
    
    // Extract JSON lines
    const jsonLines = lines.slice(jsonStart, jsonEnd + 1);
    const jsonContent = jsonLines.join('\n');
    
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('❌ Failed to parse test results:', error);
    return null;
  }
}

function categorizeFailures(tests: TestResult[]): { [category: string]: TestResult[] } {
  const categories: { [category: string]: TestResult[] } = {
    'Authentication Issues': [],
    'Missing Helper Methods': [],
    'Timeout Issues': [],
    'Selector Issues': [],
    'Navigation Issues': [],
    'Data Issues': [],
    'Other Issues': []
  };

  tests.forEach(test => {
    if (test.status !== 'failed' || !test.error) return;

    const errorMessage = test.error.message.toLowerCase();
    
    if (errorMessage.includes('login') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
      categories['Authentication Issues'].push(test);
    } else if (errorMessage.includes('is not a function') || errorMessage.includes('cleanup') || errorMessage.includes('navigate')) {
      categories['Missing Helper Methods'].push(test);
    } else if (errorMessage.includes('timeout') || errorMessage.includes('exceeded')) {
      categories['Timeout Issues'].push(test);
    } else if (errorMessage.includes('selector') || errorMessage.includes('locator') || errorMessage.includes('element')) {
      categories['Selector Issues'].push(test);
    } else if (errorMessage.includes('navigation') || errorMessage.includes('url') || errorMessage.includes('route')) {
      categories['Navigation Issues'].push(test);
    } else if (errorMessage.includes('data') || errorMessage.includes('database') || errorMessage.includes('seed')) {
      categories['Data Issues'].push(test);
    } else {
      categories['Other Issues'].push(test);
    }
  });

  return categories;
}

function generateRecommendations(categories: { [category: string]: TestResult[] }): string[] {
  const recommendations: string[] = [];

  if (categories['Authentication Issues'].length > 0) {
    recommendations.push('🔐 **Authentication Issues**: Run `pnpm seed:test-users` to create test users, or check if login page selectors match actual HTML');
  }

  if (categories['Missing Helper Methods'].length > 0) {
    recommendations.push('🛠️ **Missing Helper Methods**: All helper methods have been added to TestHelpers class. Check if method names match test calls');
  }

  if (categories['Timeout Issues'].length > 0) {
    recommendations.push('⏱️ **Timeout Issues**: Increase test timeout in playwright.config.ts or check if app is running on correct port');
  }

  if (categories['Selector Issues'].length > 0) {
    recommendations.push('🎯 **Selector Issues**: Update selectors in tests to match actual HTML elements in the application');
  }

  if (categories['Navigation Issues'].length > 0) {
    recommendations.push('🧭 **Navigation Issues**: Check if routes exist and are accessible, verify navigation helper methods');
  }

  if (categories['Data Issues'].length > 0) {
    recommendations.push('💾 **Data Issues**: Ensure test data exists in database, run seed scripts if needed');
  }

  if (categories['Other Issues'].length > 0) {
    recommendations.push('🔍 **Other Issues**: Review individual test failures for specific fixes needed');
  }

  return recommendations;
}

function generateMarkdownReport(module: string, report: PlaywrightReport): string {
  const stats = report.stats;
  const totalTests = stats.total;
  const passedTests = stats.passed;
  const failedTests = stats.failed;
  const skippedTests = stats.skipped;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  const allTests = report.suites.flatMap(suite => suite.tests);
  const failedTestsList = allTests.filter(test => test.status === 'failed');
  const passedTestsList = allTests.filter(test => test.status === 'passed');
  const skippedTestsList = allTests.filter(test => test.status === 'skipped');

  const categories = categorizeFailures(failedTestsList);
  const recommendations = generateRecommendations(categories);

  let markdown = `# ${module.charAt(0).toUpperCase() + module.slice(1)} Module Test Report\n\n`;
  
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  
  markdown += `## 📊 Summary\n\n`;
  markdown += `- **Total Tests:** ${totalTests}\n`;
  markdown += `- **Passed:** ${passedTests} (${passRate}%)\n`;
  markdown += `- **Failed:** ${failedTests}\n`;
  markdown += `- **Skipped:** ${skippedTests}\n`;
  markdown += `- **Duration:** ${Math.round(stats.duration / 1000)}s\n\n`;

  if (passRate === 100) {
    markdown += `## ✅ Status: All Tests Passing\n\n`;
    markdown += `🎉 Congratulations! All tests in the ${module} module are passing.\n\n`;
  } else if (passRate >= 80) {
    markdown += `## ⚠️ Status: Mostly Passing\n\n`;
    markdown += `Most tests are passing, but there are some issues to address.\n\n`;
  } else {
    markdown += `## ❌ Status: Major Issues\n\n`;
    markdown += `Many tests are failing and need attention.\n\n`;
  }

  if (passedTestsList.length > 0) {
    markdown += `## ✅ Passing Tests (${passedTestsList.length})\n\n`;
    passedTestsList.forEach(test => {
      markdown += `- ✅ ${test.title}\n`;
    });
    markdown += '\n';
  }

  if (failedTestsList.length > 0) {
    markdown += `## ❌ Failed Tests (${failedTestsList.length})\n\n`;
    
    Object.entries(categories).forEach(([category, tests]) => {
      if (tests.length > 0) {
        markdown += `### ${category} (${tests.length})\n\n`;
        tests.forEach(test => {
          markdown += `- ❌ **${test.title}**\n`;
          if (test.error) {
            markdown += `  - Error: ${test.error.message}\n`;
          }
        });
        markdown += '\n';
      }
    });
  }

  if (skippedTestsList.length > 0) {
    markdown += `## ⏭️ Skipped Tests (${skippedTestsList.length})\n\n`;
    skippedTestsList.forEach(test => {
      markdown += `- ⏭️ ${test.title}\n`;
    });
    markdown += '\n';
  }

  if (recommendations.length > 0) {
    markdown += `## 🔧 Recommendations\n\n`;
    recommendations.forEach(rec => {
      markdown += `${rec}\n\n`;
    });
  }

  markdown += `## 📁 Test Files\n\n`;
  report.suites.forEach(suite => {
    const suiteStats = {
      total: suite.tests.length,
      passed: suite.tests.filter(t => t.status === 'passed').length,
      failed: suite.tests.filter(t => t.status === 'failed').length,
      skipped: suite.tests.filter(t => t.status === 'skipped').length
    };
    
    const status = suiteStats.failed === 0 ? '✅' : suiteStats.passed === 0 ? '❌' : '⚠️';
    markdown += `- ${status} **${suite.file}** (${suiteStats.passed}/${suiteStats.total} passed)\n`;
  });

  markdown += '\n---\n\n';
  markdown += `*Report generated by E2E Test Report Generator*\n`;

  return markdown;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ Usage: tsx generate-test-report.ts <module> <json-file> <output-file>');
    console.error('Example: tsx generate-test-report.ts auth test-results/auth-results.json test-reports/auth-module.md');
    process.exit(1);
  }

  const [module, jsonFile, outputFile] = args;

  console.log(`📊 Generating report for ${module} module...`);
  console.log(`📁 Reading: ${jsonFile}`);
  console.log(`📝 Output: ${outputFile}`);

  // Check if input file exists
  if (!fs.existsSync(jsonFile)) {
    console.error(`❌ Input file not found: ${jsonFile}`);
    process.exit(1);
  }

  // Parse test results
  const report = parseTestResults(jsonFile);
  if (!report) {
    console.error('❌ Failed to parse test results');
    process.exit(1);
  }

  // Generate markdown report
  const markdown = generateMarkdownReport(module, report);

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write report
  fs.writeFileSync(outputFile, markdown);

  console.log(`✅ Report generated successfully: ${outputFile}`);
  console.log(`📊 Summary: ${report.stats.passed}/${report.stats.total} tests passed`);
}

if (require.main === module) {
  main();
}

export { generateMarkdownReport, parseTestResults, categorizeFailures };
