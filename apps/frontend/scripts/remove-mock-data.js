const fs = require('fs');
const path = require('path');

// List of components that use mock data
const components = [
  'CreateGRNModal.tsx',
  'EditTransferOrderModal.tsx', 
  'CreateTransferOrderModal.tsx',
  'EditPurchaseOrderModal.tsx',
  'CreatePurchaseOrderModal.tsx',
  'AmendLPModal.tsx',
  'SettingsForm.tsx'
];

const componentsDir = path.join(__dirname, '../components');

function updateComponent(fileName) {
  const filePath = path.join(componentsDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${fileName} not found, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace mock data imports
  content = content.replace(
    /import\s*{\s*([^}]*mockLocations[^}]*)\s*}\s*from\s*['"]@\/lib\/mockData['"];?/g,
    `import { LocationsAPI } from '@/lib/api/locations';
import type { Location } from '@/lib/types';`
  );
  
  content = content.replace(
    /import\s*{\s*([^}]*mockProducts[^}]*)\s*}\s*from\s*['"]@\/lib\/mockData['"];?/g,
    `import { ProductsAPI } from '@/lib/api/products';
import type { Product } from '@/lib/types';`
  );
  
  content = content.replace(
    /import\s*{\s*([^}]*mockTransferOrders[^}]*)\s*}\s*from\s*['"]@\/lib\/mockData['"];?/g,
    `import { TransferOrdersAPI } from '@/lib/api/transferOrders';
import type { TransferOrder } from '@/lib/types';`
  );
  
  content = content.replace(
    /import\s*{\s*([^}]*mockPurchaseOrders[^}]*)\s*}\s*from\s*['"]@\/lib\/mockData['"];?/g,
    `import { PurchaseOrdersAPI } from '@/lib/api/purchaseOrders';
import type { PurchaseOrder } from '@/lib/types';`
  );
  
  // Add useState and useEffect imports if not present
  if (content.includes('useState') && !content.includes("import { useState")) {
    content = content.replace(
      /import\s*{\s*([^}]*)\s*}\s*from\s*['"]react['"];?/,
      (match, imports) => {
        const newImports = imports.includes('useState') ? imports : `${imports}, useState`;
        return `import { ${newImports} } from 'react';`;
      }
    );
  }
  
  if (content.includes('useEffect') && !content.includes("import { useEffect")) {
    content = content.replace(
      /import\s*{\s*([^}]*)\s*}\s*from\s*['"]react['"];?/,
      (match, imports) => {
        const newImports = imports.includes('useEffect') ? imports : `${imports}, useEffect`;
        return `import { ${newImports} } from 'react';`;
      }
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${fileName}`);
}

console.log('🔄 Removing mock data from components...');

components.forEach(updateComponent);

console.log('✅ Mock data removal complete!');
