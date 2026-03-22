import { describe, expect, it } from 'vitest';

import { productSchema } from './product';
import { mockProducts } from '../mocks/data';

describe('productSchema', () => {
  it('accepts mock catalog products', () => {
    expect(productSchema.array().parse(mockProducts)).toHaveLength(2);
  });
});
