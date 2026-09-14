import { describe, it, expect } from 'vitest';
import { CATEGORIES, isCategory } from '../src/lib/categories';

describe('isCategory', () => {
  it('accepts every defined category', () => {
    for (const c of CATEGORIES) {
      expect(isCategory(c)).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(isCategory('random')).toBe(false);
  });

  it('accepts the llm category', () => {
    expect(isCategory('llm')).toBe(true);
  });
});