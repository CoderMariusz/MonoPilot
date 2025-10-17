const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/scanner/lp/[id]/route.ts',
  'app/api/scanner/pallets/[id]/items/route.ts',
  'app/api/scanner/pallets/[id]/route.ts',
  'app/api/scanner/wo/[id]/stage-status/route.ts',
  'app/api/production/work-orders/[id]/update-bom-snapshot/route.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix parameter type
    content = content.replace(
      /{ params }: { params: { id: string } }/g,
      '{ params }: { params: Promise<{ id: string }> }'
    );
    
    // Add await for params
    content = content.replace(
      /\) {\s*try {\s*const.*?= parseInt\(params\.id\);/g,
      (match) => {
        return match.replace(') {', ') {\n  const { id } = await params;')
                   .replace('params.id', 'id');
      }
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${filePath}`);
  }
});

console.log('All API routes fixed!');
