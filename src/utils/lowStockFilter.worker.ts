// src/utils/lowStockFilter.worker.ts

self.onmessage = (e) => {
  const { products, threshold } = e.data;
  // Filter products with quantity less than threshold
  const lowStock = products.filter((p) => p.quantity < threshold);
  self.postMessage({ lowStock });
}; 