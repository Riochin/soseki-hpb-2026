import { describe, it, expect } from 'vitest';
import { toCredit } from './currency';

describe('toCredit', () => {
  it('0 → "0"', () => {
    expect(toCredit(0)).toBe('0');
  });

  it('100 → "1"（整数クレジット）', () => {
    expect(toCredit(100)).toBe('1');
  });

  it('250 → "2.5"（小数点以下の末尾0を除去）', () => {
    expect(toCredit(250)).toBe('2.5');
  });

  it('1000 → "10"', () => {
    expect(toCredit(1000)).toBe('10');
  });

  it('1 → "0.01"', () => {
    expect(toCredit(1)).toBe('0.01');
  });

  it('50 → "0.5"', () => {
    expect(toCredit(50)).toBe('0.5');
  });

  it('10000 → "100"', () => {
    expect(toCredit(10000)).toBe('100');
  });

  it('500 → "5"', () => {
    expect(toCredit(500)).toBe('5');
  });
});
