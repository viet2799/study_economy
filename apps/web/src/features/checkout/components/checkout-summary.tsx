'use client';

import { Badge } from '../../../shared/ui/badge';
import { Card, CardContent } from '../../../shared/ui/card';
import { formatCurrency } from '../../../shared/lib/format';
import { useCheckoutQuote } from '../hooks/use-checkout';

export function CheckoutSummaryCard() {
  const quote = useCheckoutQuote();

  if (quote.isLoading) {
    return <Card className="p-6">Loading checkout quote…</Card>;
  }

  if (!quote.data) {
    return <Card className="p-6">Checkout quote unavailable.</Card>;
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Checkout</p>
            <h3 className="text-xl font-semibold text-slate-950">Quote</h3>
          </div>
          <Badge variant={quote.data.canCheckout ? 'success' : 'danger'}>
            {quote.data.canCheckout ? 'Ready' : 'Blocked'}
          </Badge>
        </div>
        <dl className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <dt>Payable</dt>
            <dd>{formatCurrency(quote.data.payableAmount.amount, quote.data.payableAmount.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>ETA</dt>
            <dd>{quote.data.estimatedDeliveryDate}</dd>
          </div>
        </dl>
        <ul className="space-y-2 text-sm text-slate-500">
          {quote.data.warnings.map((warning) => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
