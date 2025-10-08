import BomCatalogClient from '@/components/BomCatalogClient';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

async function fetchProducts(category: string, page: number = 1) {
  const url = `${BACKEND_URL}/products?category=${category}&page=${page}`;
  const res = await fetch(url, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    return { data: [], current_page: 1, last_page: 1, total: 0 };
  }
  
  return res.json();
}

export default async function BOMPage() {
  const [meat, dryGoods, finishedGoods, process] = await Promise.all([
    fetchProducts('MEAT'),
    fetchProducts('DRYGOODS'),
    fetchProducts('FINISHED_GOODS'),
    fetchProducts('PROCESS'),
  ]);

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
