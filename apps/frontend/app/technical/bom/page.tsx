import BomCatalogClient from '@/components/BomCatalogClient';
import { ProductsServerAPI } from '@/lib/api/products.server';

async function filterProducts(category: string) {
  const allProducts = await ProductsServerAPI.getAll();
  
  let filtered: any[] = [];
  
  switch (category) {
    case 'MEAT':
      filtered = allProducts.filter(p => p.product_group === 'MEAT');
      break;
    case 'DRYGOODS':
      filtered = allProducts.filter(p => p.product_group === 'DRYGOODS');
      break;
    case 'FINISHED_GOODS':
      filtered = allProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'FG');
      break;
    case 'PROCESS':
      filtered = allProducts.filter(p => p.product_group === 'COMPOSITE' && p.product_type === 'PR');
      break;
    default:
      filtered = [];
  }
  
  return { data: filtered, current_page: 1, last_page: 1, total: filtered.length };
}

export default async function BOMPage() {
  const meat = await filterProducts('MEAT');
  const dryGoods = await filterProducts('DRYGOODS');
  const finishedGoods = await filterProducts('FINISHED_GOODS');
  const process = await filterProducts('PROCESS');

  return (
    <BomCatalogClient
      initialData={{
        meat,
        dryGoods,
        finishedGoods,
        process,
      }}
    />
  );
}
