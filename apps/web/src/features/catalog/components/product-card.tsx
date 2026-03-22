'use client';

import { Star } from 'lucide-react';

import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent, CardFooter } from '../../../shared/ui/card';
import { cn } from '../../../shared/lib/cn';
import { formatCurrency } from '../../../shared/lib/format';
import { type ProductSku } from '../../../shared/schemas/product';

type Props = {
  name: string;
  brand: string;
  description: string;
  rating: number;
  reviewCount: number;
  sku: ProductSku;
  onAddToCart: (skuId: string) => void;
};

export function ProductCard({
  name,
  brand,
  description,
  rating,
  reviewCount,
  sku,
  onAddToCart
}: Props) {
  const isOutOfStock = sku.availability === 'out_of_stock';

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={sku.imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{brand}</p>
            <h3 className="text-lg font-semibold text-slate-950">{name}</h3>
          </div>
          {sku.badge ? <Badge variant="brand">{sku.badge}</Badge> : null}
        </div>

        <p className="text-sm leading-6 text-slate-600">{description}</p>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
            <Star className="h-4 w-4 fill-current text-amber-500" />
            {rating.toFixed(1)}
          </span>
          <span>({reviewCount} reviews)</span>
          <Badge
            variant={
              sku.availability === 'in_stock'
                ? 'success'
                : sku.availability === 'low_stock'
                  ? 'brand'
                  : 'danger'
            }
          >
            {sku.availability.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">Price</p>
            <p className="text-2xl font-semibold text-slate-950">
              {formatCurrency(sku.price.amount, sku.price.currency)}
            </p>
            {sku.compareAtPrice ? (
              <p className="text-sm text-slate-400 line-through">
                {formatCurrency(sku.compareAtPrice.amount, sku.compareAtPrice.currency)}
              </p>
            ) : null}
          </div>
          <p className={cn('text-sm font-medium', isOutOfStock ? 'text-rose-600' : 'text-slate-500')}>
            {isOutOfStock ? 'Out of stock' : `${sku.availableQty} left`}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          SKU {sku.skuCode} · {sku.size} · {sku.color}
        </p>
        <Button
          disabled={isOutOfStock}
          onClick={() => onAddToCart(sku.id)}
          type="button"
        >
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
}
