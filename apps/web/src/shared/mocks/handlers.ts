import { delay, http, HttpResponse } from 'msw';

import { getMockState, addToCart } from './state';
import { mockUser } from './data';

function envelope<T>(path: string, data: T, message = 'Request processed successfully') {
  return {
    data,
    message,
    status: 'success' as const,
    statusCode: 200,
    path,
    timestamp: new Date().toISOString()
  };
}

export const handlers = [
  http.get('*/api/v1/auth/me', async ({ request }) => {
    await delay(120);
    return HttpResponse.json(envelope(new URL(request.url).pathname, mockUser));
  }),
  http.get('*/api/v1/catalog/products', async ({ request }) => {
    await delay(200);
    return HttpResponse.json(envelope(new URL(request.url).pathname, getMockState().products));
  }),
  http.get('*/api/v1/cart', async ({ request }) => {
    await delay(150);
    return HttpResponse.json(envelope(new URL(request.url).pathname, getMockState().cart));
  }),
  http.post('*/api/v1/cart/items', async ({ request }) => {
    const body = (await request.json()) as { skuId: string; quantity: number };
    const nextCart = addToCart(body.skuId, body.quantity);
    await delay(180);
    return HttpResponse.json(envelope(new URL(request.url).pathname, nextCart));
  }),
  http.get('*/api/v1/checkout/quote', async ({ request }) => {
    await delay(150);
    return HttpResponse.json(envelope(new URL(request.url).pathname, getMockState().checkoutQuote));
  }),
  http.post('*/api/v1/checkout', async ({ request }) => {
    const body = await request.json();
    await delay(240);
    return HttpResponse.json(
      envelope(new URL(request.url).pathname, {
        orderId: `ord_${Math.random().toString(36).slice(2, 10)}`,
        payload: body
      })
    );
  })
];
