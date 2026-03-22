'use client';

import { CheckoutForm } from '../../features/checkout/components/checkout-form';
import { CheckoutSummaryCard } from '../../features/checkout/components/checkout-summary';
import { useSubmitCheckout } from '../../features/checkout/hooks/use-checkout';
import { useToast } from '../../shared/ui/toast';

function CheckoutClient() {
  const submitCheckout = useSubmitCheckout();
  const { toast } = useToast();

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <CheckoutForm
        onSubmit={async (values) => {
          const result = await submitCheckout.mutateAsync(values);
          toast({
            title: 'Order created',
            description: `Order ${result.orderId} is now ${result.status}.`,
            variant: 'success'
          });
        }}
      />
      <CheckoutSummaryCard />
    </main>
  );
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}
