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
  
  // Fix various parameter patterns
  const patterns = [
    // Single id parameter
    {
      from: /{ params }: { params: { id: string } }/g,
      to: '{ params }: { params: Promise<{ id: string }> }'
    },
    // woId parameter
    {
      from: /{ params }: { params: { woId: string } }/g,
      to: '{ params }: { params: Promise<{ woId: string }> }'
    },
    // id and seq parameters
    {
      from: /{ params }: { params: { id: string; seq: string } }/g,
      to: '{ params }: { params: Promise<{ id: string; seq: string }> }'
    },
    // woId and seq parameters
    {
      from: /{ params }: { params: { woId: string; seq: string } }/g,
      to: '{ params }: { params: Promise<{ woId: string; seq: string }> }'
    }
  ];
  
  patterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      modified = true;
    }
  });
  
  // Add await for params and fix variable references
  if (content.includes('params: Promise<')) {
    // Add await for params at the beginning of function
    content = content.replace(
      /\) {\s*try {\s*const.*?= parseInt\(params\./g,
      (match) => {
        if (match.includes('id') && match.includes('seq')) {
          return match.replace(') {', ') {\n  const { id, seq: seqStr } = await params;')
                     .replace('params.id', 'id')
                     .replace('params.seq', 'seqStr');
        } else if (match.includes('woId') && match.includes('seq')) {
          return match.replace(') {', ') {\n  const { woId, seq: seqStr } = await params;')
                     .replace('params.woId', 'woId')
                     .replace('params.seq', 'seqStr');
        } else if (match.includes('woId')) {
          return match.replace(') {', ') {\n  const { woId } = await params;')
                     .replace('params.woId', 'woId');
        } else {
          return match.replace(') {', ') {\n  const { id } = await params;')
                     .replace('params.id', 'id');
        }
      }
    );
    
    // Fix any remaining params.id references
    content = content.replace(/params\.id/g, 'id');
    content = content.replace(/params\.woId/g, 'woId');
    content = content.replace(/params\.seq/g, 'seqStr');
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${path.relative(__dirname, filePath)}`);
  }
});

console.log('All API routes fixed!');
