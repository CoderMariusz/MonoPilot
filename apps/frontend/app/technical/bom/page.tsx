import BomCatalogClient from '@/components/BomCatalogClient';
import { mockProducts } from '@/lib/mockData';

function filterProducts(category: string) {
  const filtered = mockProducts.filter(p => p.category === category);
  return { data: filtered, current_page: 1, last_page: 1, total: filtered.length };
}

export default async function BOMPage() {
  const meat = filterProducts('MEAT');
  const dryGoods = filterProducts('DRYGOODS');
  const finishedGoods = filterProducts('FINISHED_GOODS');
  const process = filterProducts('PROCESS');

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
