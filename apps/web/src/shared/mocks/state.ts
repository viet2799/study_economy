import { mockCart, mockCheckoutQuote, mockProducts } from './data';

const state = {
  products: [...mockProducts],
  cart: structuredClone(mockCart),
  checkoutQuote: structuredClone(mockCheckoutQuote)
};

export function getMockState() {
  return state;
}

export function addToCart(skuId: string, quantity: number) {
  const product = state.products
    .flatMap((item) => item.skus)
    .find((sku) => sku.id === skuId);

  if (!product) {
    return state.cart;
  }

  const existing = state.cart.items.find((item) => item.sku.id === skuId);
  if (existing) {
    existing.quantity += quantity;
    existing.lineTotal = {
      amount: existing.sku.price.amount * existing.quantity,
      currency: existing.sku.price.currency
    };
  } else {
    state.cart.items.push({
      id: `cart_item_${state.cart.items.length + 1}`,
      sku: product,
      quantity,
      lineTotal: {
        amount: product.price.amount * quantity,
        currency: product.price.currency
      }
    });
  }

  const subtotal = state.cart.items.reduce((total, item) => total + item.lineTotal.amount, 0);
  const discountTotal = 150000;
  const shippingFee = subtotal > 1000000 ? 0 : 30000;

  state.cart = {
    itemCount: state.cart.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: { amount: subtotal, currency: 'VND' },
    shippingFee: { amount: shippingFee, currency: 'VND' },
    discountTotal: { amount: discountTotal, currency: 'VND' },
    grandTotal: { amount: subtotal + shippingFee - discountTotal, currency: 'VND' },
    items: state.cart.items
  };

  state.checkoutQuote = {
    cart: state.cart,
    estimatedDeliveryDate: '2026-03-27',
    payableAmount: state.cart.grandTotal,
    canCheckout: state.cart.itemCount > 0,
    warnings: ['Delivery estimate can change after address revalidation.']
  };

  return state.cart;
}
