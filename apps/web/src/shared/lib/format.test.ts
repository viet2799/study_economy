import { describe, expect, it } from 'vitest';

import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('formats VND values', () => {
    expect(formatCurrency(1290000, 'VND')).toContain('1.290.000');
  });
});
