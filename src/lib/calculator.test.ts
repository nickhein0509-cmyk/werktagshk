import { describe, expect, it } from 'vitest';
import { calculateExpression, formatCalculatorResult } from './calculator';

describe('workpad calculator', () => {
  it('supports German decimals, units-independent arithmetic and operator precedence', () => {
    expect(calculateExpression('120 × 4,18 × (55 - 15) ÷ 3600')).toBeCloseTo(5.573333333333333);
    expect(calculateExpression('2 + 3 * 4')).toBe(14);
    expect(calculateExpression('(2 + 3) * 4')).toBe(20);
    expect(calculateExpression(',5 + .25')).toBe(0.75);
    expect(calculateExpression('1e-3 * 1000')).toBe(1);
  });
  it('resolves negative numbers and powers consistently', () => {
    expect(calculateExpression('-2^2')).toBe(-4);
    expect(calculateExpression('(-2)^2')).toBe(4);
    expect(calculateExpression('2^-2')).toBe(0.25);
    expect(calculateExpression('2^3^2')).toBe(512);
    expect(calculateExpression('4--2')).toBe(6);
  });
  it('treats percent as division by one hundred and supports square roots', () => {
    expect(calculateExpression('200 * 10%')).toBe(20);
    expect(calculateExpression('200 + 10%')).toBe(200.1);
    expect(calculateExpression('sqrt(81) + √(16)')).toBe(13);
  });
  it.each([
    '',
    '2 / 0',
    'sqrt(-1)',
    '1e309',
    '2^1024',
    '(-1)^0,5',
    '(1+2',
    '1+2)',
    '1 2',
    '2(3)',
    '1,2,3',
    'Math.random()',
    'alert(1)',
    '2;3',
  ])('rejects invalid or undefined arithmetic: %s', (input) => {
    expect(() => calculateExpression(input)).toThrow();
  });
  it('limits expression size and nesting', () => {
    expect(() => calculateExpression('1'.repeat(513))).toThrow();
    expect(() => calculateExpression('('.repeat(33) + '1' + ')'.repeat(33))).toThrow();
  });
  it('formats small and large answers without grouping ambiguity or floating-point noise', () => {
    expect(formatCalculatorResult(calculateExpression('0,1+0,2'))).toBe('0,3');
    expect(formatCalculatorResult(10000.5)).toBe('10000,5');
    expect(formatCalculatorResult(1e-10)).toBe('1e-10');
    expect(formatCalculatorResult(-1.2e15)).toBe('-1,2e+15');
  });
});
