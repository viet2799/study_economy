'use client';

import { ShoppingBag } from 'lucide-react';

import { Badge } from '../../../shared/ui/badge';
import { Card, CardContent } from '../../../shared/ui/card';
import { formatCurrency } from '../../../shared/lib/format';
import { useCartSummary } from '../hooks/use-cart';

export function CartSummaryCard() {
  const cart = useCartSummary();

  if (cart.isLoading) {
    return <Card className="p-6">Loading cart…</Card>;
  }

  if (!cart.data) {
    return <Card className="p-6">Cart is empty.</Card>;
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Cart</p>
            <h3 className="text-xl font-semibold text-slate-950">Summary</h3>
          </div>
          <Badge variant="brand">
            <ShoppingBag className="mr-1 h-3.5 w-3.5" />
            {cart.data.itemCount} items
          </Badge>
        </div>

        <div className="space-y-3">
          {cart.data.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <p className="font-medium text-slate-950">{item.sku.name}</p>
                <p className="text-sm text-slate-500">
                  {item.quantity} x {formatCurrency(item.sku.price.amount, item.sku.price.currency)}
                </p>
              </div>
              <p className="font-semibold text-slate-950">
                {formatCurrency(item.lineTotal.amount, item.lineTotal.currency)}
              </p>
            </div>
          ))}
        </div>

        <dl className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(cart.data.subtotal.amount, cart.data.subtotal.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{formatCurrency(cart.data.shippingFee.amount, cart.data.shippingFee.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>-{formatCurrency(cart.data.discountTotal.amount, cart.data.discountTotal.currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-950">
            <dt>Total</dt>
            <dd>{formatCurrency(cart.data.grandTotal.amount, cart.data.grandTotal.currency)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
