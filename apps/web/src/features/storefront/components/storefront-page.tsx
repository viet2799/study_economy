'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { AuthStatusCard } from '../../auth/components/auth-status';
import { useAuth } from '../../auth/hooks/use-auth';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent } from '../../../shared/ui/card';
import { Badge } from '../../../shared/ui/badge';
import { ProductGrid } from '../../catalog/components/product-grid';
import { useAddToCart, useProducts } from '../../catalog/hooks/use-products';
import { CartSummaryCard } from '../../cart/components/cart-summary';
import { CheckoutForm } from '../../checkout/components/checkout-form';
import { CheckoutSummaryCard } from '../../checkout/components/checkout-summary';

export function StorefrontPage() {
  const auth = useAuth();
  const products = useProducts();
  const addToCart = useAddToCart();
  const [activeTab, setActiveTab] = useState<'browse' | 'cart' | 'checkout'>('browse');

  const handleLogin = async () => {
    await auth.session.login();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.92))] p-8 shadow-glow md:p-10">
        <div className="max-w-3xl space-y-4">
          <Badge variant="brand">Commerce core base</Badge>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            Next.js base for catalog, cart, checkout and auth.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            React Query, Zod, RHF, MSW, Keycloak and accessible UI primitives are wired together so
            the team can build checkout flows without waiting for the backend.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">Auth</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {auth.status === 'authenticated' ? 'Session active' : 'Need login'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">Catalog</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {products.data?.length ?? 0} products
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">Invalidation</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                Cart + checkout refresh on mutation
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <AuthStatusCard />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button variant={activeTab === 'browse' ? 'default' : 'outline'} onClick={() => setActiveTab('browse')} type="button">
              Browse
            </Button>
            <Button variant={activeTab === 'cart' ? 'default' : 'outline'} onClick={() => setActiveTab('cart')} type="button">
              Cart
            </Button>
            <Button variant={activeTab === 'checkout' ? 'default' : 'outline'} onClick={() => setActiveTab('checkout')} type="button">
              Checkout
            </Button>
          </div>

          {activeTab === 'browse' ? (
            <Card>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Catalog</p>
                    <h2 className="text-2xl font-semibold text-slate-950">Featured products</h2>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogin}
                    type="button"
                    disabled={auth.mode !== 'keycloak' || auth.status === 'loading'}
                  >
                    {auth.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Login
                  </Button>
                </div>

                {products.isLoading ? (
                  <p>Loading catalog…</p>
                ) : products.data ? (
                  <ProductGrid
                    products={products.data}
                    onAddToCart={(skuId) => {
                      addToCart.mutate({ skuId, quantity: 1 });
                    }}
                  />
                ) : (
                  <p>Catalog unavailable.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'cart' ? <CartSummaryCard /> : null}

          {activeTab === 'checkout' ? (
            <CheckoutForm onSubmit={async () => undefined} />
          ) : null}
        </div>

        <aside className="space-y-6">
          <CheckoutSummaryCard />
        </aside>
      </section>
    </main>
  );
}
