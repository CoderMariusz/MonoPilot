import BomCatalogClient from '@/components/BomCatalogClient';
import { ProductsAPI } from '@/lib/api/products';

async function filterProducts(category: string) {
  const allProducts = await ProductsAPI.getAll();
  const filtered = allProducts.filter(p => p.category === category);
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
