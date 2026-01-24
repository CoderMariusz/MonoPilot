import fs from 'fs';
import path from 'path';

const files = [
  'apps/frontend/app/api/technical/routings/[id]/operations/[operationId]/route.ts',
  'apps/frontend/app/api/technical/routings/[id]/products/route.ts',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix malformed function signatures
  // Pattern 1: Two-line malformed signature
  content = content.replace(
    /({ params }: { params: Promise<{[^}]+}> })\s+const\s+({[^}]+})\s+=\s+await\s+params\s*\)/g,
    '$1) {\n  try {\n    const $2 = await params'
  );

  // Pattern 2: Remove duplicate 'try {'
  content = content.replace(/\) {\s+try {\s+try {/g, ') {\n  try {');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All files fixed!');
