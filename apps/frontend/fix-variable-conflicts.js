const fs = require('fs');
const path = require('path');

// Find all API route files
function findApiRoutes(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findApiRoutes(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

const apiRoutes = findApiRoutes(path.join(__dirname, 'app/api'));

apiRoutes.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix variable naming conflicts
  const patterns = [
    // woId conflicts
    {
      from: /const \{ woId \} = await params;\s*try {\s*const woId = parseInt\(woId\);/g,
      to: 'const { woId: woIdStr } = await params;\n  try {\n    const woId = parseInt(woIdStr);'
    },
    // woId and seq conflicts
    {
      from: /const \{ woId \} = await params;\s*try {\s*const woId = parseInt\(woId\);\s*const seq = parseInt\(seqStr\);/g,
      to: 'const { woId: woIdStr, seq: seqStr } = await params;\n  try {\n    const woId = parseInt(woIdStr);\n    const seq = parseInt(seqStr);'
    },
    // id conflicts
    {
      from: /const \{ id \} = await params;\s*try {\s*const.*?= parseInt\(id\);/g,
      (match) => {
        if (match.includes('woId')) {
          return match.replace('const { id } = await params;', 'const { id: woIdStr } = await params;')
                     .replace('parseInt(id)', 'parseInt(woIdStr)');
        } else if (match.includes('palletId')) {
          return match.replace('const { id } = await params;', 'const { id: palletIdStr } = await params;')
                     .replace('parseInt(id)', 'parseInt(palletIdStr)');
        } else if (match.includes('lpId')) {
          return match.replace('const { id } = await params;', 'const { id: lpIdStr } = await params;')
                     .replace('parseInt(id)', 'parseInt(lpIdStr)');
        } else {
          return match.replace('const { id } = await params;', 'const { id: idStr } = await params;')
                     .replace('parseInt(id)', 'parseInt(idStr)');
        }
      }
    }
  ];
  
  patterns.forEach(pattern => {
    if (typeof pattern.from === 'function') {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    } else if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed variable conflicts in ${path.relative(__dirname, filePath)}`);
  }
});

console.log('All variable conflicts fixed!');
