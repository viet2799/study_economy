import { cartSummarySchema } from '../schemas/cart';
import { productSchema } from '../schemas/product';
import { userSchema } from '../schemas/user';
import { checkoutQuoteSchema } from '../schemas/checkout';

export const mockUser = userSchema.parse({
  id: 'user_demo_01',
  email: 'demo@studybase.local',
  name: 'Demo User',
  avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Studybase',
  roles: ['customer']
});

export const mockProducts = productSchema.array().parse([
  {
    id: 'prd_001',
    slug: 'everyday-overshirt',
    name: 'Everyday Overshirt',
    brand: 'North Grid',
    category: 'Outerwear',
    description: 'Lightweight overshirt with structured cotton twill.',
    rating: 4.8,
    reviewCount: 218,
    skus: [
      {
        id: 'sku_001',
        skuCode: 'NG-OVS-BLK-S',
        name: 'Black / S',
        size: 'S',
        color: 'Black',
        imageUrl: '/products/overshirt.svg',
        price: { amount: 1290000, currency: 'VND' },
        compareAtPrice: { amount: 1590000, currency: 'VND' },
        availableQty: 12,
        availability: 'in_stock',
        badge: 'Best seller'
      },
      {
        id: 'sku_002',
        skuCode: 'NG-OVS-BLK-M',
        name: 'Black / M',
        size: 'M',
        color: 'Black',
        imageUrl: '/products/overshirt.svg',
        price: { amount: 1290000, currency: 'VND' },
        compareAtPrice: { amount: 1590000, currency: 'VND' },
        availableQty: 4,
        availability: 'low_stock',
        badge: 'Low stock'
      }
    ]
  },
  {
    id: 'prd_002',
    slug: 'compact-crossbody',
    name: 'Compact Crossbody',
    brand: 'Field Studio',
    category: 'Accessories',
    description: 'Small crossbody bag made for daily commute.',
    rating: 4.6,
    reviewCount: 94,
    skus: [
      {
        id: 'sku_003',
        skuCode: 'FS-CB-BRN-ONE',
        name: 'Brown / One size',
        size: 'One size',
        color: 'Brown',
        imageUrl: '/products/crossbody.svg',
        price: { amount: 890000, currency: 'VND' },
        availableQty: 0,
        availability: 'out_of_stock'
      }
    ]
  }
]);

export const mockCart = cartSummarySchema.parse({
  itemCount: 1,
  subtotal: { amount: 1290000, currency: 'VND' },
  shippingFee: { amount: 30000, currency: 'VND' },
  discountTotal: { amount: 150000, currency: 'VND' },
  grandTotal: { amount: 1170000, currency: 'VND' },
  items: [
    {
      id: 'cart_item_001',
      sku: mockProducts[0].skus[0],
      quantity: 1,
      lineTotal: { amount: 1290000, currency: 'VND' }
    }
  ]
});

export const mockCheckoutQuote = checkoutQuoteSchema.parse({
  cart: mockCart,
  estimatedDeliveryDate: '2026-03-27',
  payableAmount: { amount: 1170000, currency: 'VND' },
  canCheckout: true,
  warnings: ['Delivery estimate can change after address revalidation.']
});
