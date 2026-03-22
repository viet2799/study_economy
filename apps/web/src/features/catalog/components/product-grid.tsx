'use client';

import { type Product } from '../../../shared/schemas/product';
import { ProductCard } from './product-card';

type Props = {
  products: Product[];
  onAddToCart: (skuId: string) => void;
};

export function ProductGrid({ products, onAddToCart }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          brand={product.brand}
          description={product.description}
          name={product.name}
          rating={product.rating}
          reviewCount={product.reviewCount}
          sku={product.skus[0]}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
