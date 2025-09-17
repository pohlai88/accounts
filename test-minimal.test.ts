
import { describe, it, expect } from 'vitest';

describe('Minimal Mutation Test', () => {
  it('should test basic arithmetic', () => {
    const add = (a, b) => a + b;
    expect(add(2, 3)).toBe(5);
    expect(add(0, 0)).toBe(0);
    expect(add(-1, 1)).toBe(0);
  });

  it('should test string operations', () => {
    const greet = (name) => `Hello ${name}`;
    expect(greet('World')).toBe('Hello World');
    expect(greet('')).toBe('Hello ');
  });
});
