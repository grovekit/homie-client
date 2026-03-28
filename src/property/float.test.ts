import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { serializeFloat, serializeFloatFormat, validateFloat } from './float.js';

describe('Float', () => {

  describe('serializeFloat', () => {

    it('should serialize a positive integer', () => {
      strictEqual(serializeFloat(42), '42');
    });

    it('should serialize a negative integer', () => {
      strictEqual(serializeFloat(-42), '-42');
    });

    it('should serialize zero', () => {
      strictEqual(serializeFloat(0), '0');
    });

    it('should serialize a positive decimal', () => {
      strictEqual(serializeFloat(3.14), '3.14');
    });

    it('should serialize a negative decimal', () => {
      strictEqual(serializeFloat(-3.14), '-3.14');
    });

    it('should serialize a small number with negative exponent', () => {
      strictEqual(serializeFloat(1e-8), '1e-8');
    });

    it('should not include "+" in the exponent for large positive numbers', () => {
      const result = serializeFloat(1e21);
      strictEqual(result.includes('+'), false);
      strictEqual(result, '1e21');
    });

    it('should not include "+" in the exponent for large negative numbers', () => {
      const result = serializeFloat(-1e21);
      strictEqual(result.includes('+'), false);
      strictEqual(result, '-1e21');
    });

    it('should serialize a very large number without "+" in the exponent', () => {
      const result = serializeFloat(9.0072e15);
      strictEqual(result.includes('+'), false);
    });

  });

  describe('serializeFloatFormat', () => {

    it('should serialize min and max', () => {
      strictEqual(serializeFloatFormat({ min: 0, max: 10 }), '0:10');
    });

    it('should serialize min only with open-ended max', () => {
      strictEqual(serializeFloatFormat({ min: 0 }), '0:');
    });

    it('should serialize max only with open-ended min', () => {
      strictEqual(serializeFloatFormat({ max: 10 }), ':10');
    });

    it('should serialize min, max, and step', () => {
      strictEqual(serializeFloatFormat({ min: 0, max: 10, step: 2 }), '0:10:2');
    });

    it('should serialize step only', () => {
      strictEqual(serializeFloatFormat({ step: 2 }), '::2');
    });

    it('should serialize an empty format as a single colon', () => {
      strictEqual(serializeFloatFormat({}), ':');
    });

    it('should serialize negative min and max', () => {
      strictEqual(serializeFloatFormat({ min: -20, max: 120 }), '-20:120');
    });

    it('should serialize decimal min, max, and step', () => {
      strictEqual(serializeFloatFormat({ min: -0.5, max: 0.5, step: 0.1 }), '-0.5:0.5:0.1');
    });

    it('should not include "+" in exponents within format values', () => {
      const result = serializeFloatFormat({ min: -1e21, max: 1e21, step: 1e-8 });
      strictEqual(result.includes('+'), false);
      strictEqual(result, '-1e21:1e21:1e-8');
    });

  });

  describe('validateFloat', () => {

    describe('without format', () => {

      it('should accept a positive number', () => {
        strictEqual(validateFloat(42), true);
      });

      it('should accept a negative number', () => {
        strictEqual(validateFloat(-1.5), true);
      });

      it('should accept zero', () => {
        strictEqual(validateFloat(0), true);
      });

      it('should accept a valid float string', () => {
        strictEqual(validateFloat('3.14'), true);
      });

      it('should accept a negative float string', () => {
        strictEqual(validateFloat('-3.14'), true);
      });

      it('should accept a string with negative exponent', () => {
        strictEqual(validateFloat('1e-5'), true);
      });

      it('should accept a string with uppercase exponent', () => {
        strictEqual(validateFloat('1E-5'), true);
      });

      it('should accept a string with only digits', () => {
        strictEqual(validateFloat('42'), true);
      });

      it('should accept a string with leading decimal point', () => {
        strictEqual(validateFloat('.5'), true);
      });

      it('should accept a string with trailing decimal point', () => {
        strictEqual(validateFloat('5.'), true);
      });

      it('should accept a string with exponent and no decimal', () => {
        strictEqual(validateFloat('1e5'), true);
      });

      it('should reject a string with "+" in the exponent', () => {
        strictEqual(validateFloat('1e+5'), false);
      });

      it('should reject a string with leading "+"', () => {
        strictEqual(validateFloat('+5'), false);
      });

      it('should reject an empty string', () => {
        strictEqual(validateFloat(''), false);
      });

      it('should reject a string with only a negation sign', () => {
        strictEqual(validateFloat('-'), false);
      });

      it('should reject a string with only a decimal point', () => {
        strictEqual(validateFloat('.'), false);
      });

      it('should reject "NaN"', () => {
        strictEqual(validateFloat('NaN'), false);
      });

      it('should reject "Infinity"', () => {
        strictEqual(validateFloat('Infinity'), false);
      });

      it('should reject "-Infinity"', () => {
        strictEqual(validateFloat('-Infinity'), false);
      });

      it('should reject a string with trailing non-numeric characters', () => {
        strictEqual(validateFloat('12abc'), false);
      });

      it('should reject a string with leading whitespace', () => {
        strictEqual(validateFloat(' 12'), false);
      });

      it('should reject a string with trailing whitespace', () => {
        strictEqual(validateFloat('12 '), false);
      });

      it('should reject a string with spaces', () => {
        strictEqual(validateFloat('1 2'), false);
      });

      it('should reject a string with multiple decimal points', () => {
        strictEqual(validateFloat('1.2.3'), false);
      });

      it('should reject NaN as a number', () => {
        strictEqual(validateFloat(NaN), false);
      });

      it('should reject Infinity as a number', () => {
        strictEqual(validateFloat(Infinity), false);
      });

      it('should reject -Infinity as a number', () => {
        strictEqual(validateFloat(-Infinity), false);
      });

      it('should reject null', () => {
        strictEqual(validateFloat(null), false);
      });

      it('should reject undefined', () => {
        strictEqual(validateFloat(undefined), false);
      });

      it('should reject a boolean', () => {
        strictEqual(validateFloat(true), false);
      });

      it('should reject an object', () => {
        strictEqual(validateFloat({}), false);
      });

    });

    describe('with min and max', () => {

      const format = { min: -20, max: 120 };

      it('should accept a value within range', () => {
        strictEqual(validateFloat(50, format), true);
      });

      it('should accept the minimum value (inclusive)', () => {
        strictEqual(validateFloat(-20, format), true);
      });

      it('should accept the maximum value (inclusive)', () => {
        strictEqual(validateFloat(120, format), true);
      });

      it('should reject a value below min', () => {
        strictEqual(validateFloat(-20.1, format), false);
      });

      it('should reject a value above max', () => {
        strictEqual(validateFloat(120.1, format), false);
      });

    });

    describe('with min only (open-ended max)', () => {

      const format = { min: 0 };

      it('should accept a value above min', () => {
        strictEqual(validateFloat(100, format), true);
      });

      it('should accept the minimum value', () => {
        strictEqual(validateFloat(0, format), true);
      });

      it('should reject a value below min', () => {
        strictEqual(validateFloat(-0.001, format), false);
      });

      it('should accept a very large value', () => {
        strictEqual(validateFloat(1e15, format), true);
      });

    });

    describe('with max only (open-ended min)', () => {

      const format = { max: 10 };

      it('should accept a value below max', () => {
        strictEqual(validateFloat(-100, format), true);
      });

      it('should accept the maximum value', () => {
        strictEqual(validateFloat(10, format), true);
      });

      it('should reject a value above max', () => {
        strictEqual(validateFloat(10.001, format), false);
      });

    });

    describe('with step (base = min)', () => {

      const format = { min: 0, max: 10, step: 2 };

      it('should accept values aligned to the step from min', () => {
        strictEqual(validateFloat(0, format), true);
        strictEqual(validateFloat(2, format), true);
        strictEqual(validateFloat(4, format), true);
        strictEqual(validateFloat(6, format), true);
        strictEqual(validateFloat(8, format), true);
        strictEqual(validateFloat(10, format), true);
      });

      it('should reject values not aligned to the step', () => {
        strictEqual(validateFloat(1, format), false);
        strictEqual(validateFloat(3, format), false);
        strictEqual(validateFloat(5, format), false);
        strictEqual(validateFloat(7, format), false);
        strictEqual(validateFloat(9, format), false);
      });

    });

    describe('with step and offset min', () => {

      const format = { min: 1, max: 11, step: 2 };

      it('should accept values aligned to the step from min', () => {
        strictEqual(validateFloat(1, format), true);
        strictEqual(validateFloat(3, format), true);
        strictEqual(validateFloat(5, format), true);
        strictEqual(validateFloat(7, format), true);
        strictEqual(validateFloat(9, format), true);
        strictEqual(validateFloat(11, format), true);
      });

      it('should reject values not aligned to the step from min', () => {
        strictEqual(validateFloat(2, format), false);
        strictEqual(validateFloat(4, format), false);
        strictEqual(validateFloat(6, format), false);
      });

    });

    describe('with step, base falls back to max (no min)', () => {

      const format = { max: 10, step: 2 };

      it('should accept values aligned to the step from max', () => {
        strictEqual(validateFloat(10, format), true);
        strictEqual(validateFloat(8, format), true);
        strictEqual(validateFloat(6, format), true);
        strictEqual(validateFloat(4, format), true);
        strictEqual(validateFloat(2, format), true);
        strictEqual(validateFloat(0, format), true);
        strictEqual(validateFloat(-2, format), true);
      });

      it('should reject values not aligned to the step from max', () => {
        strictEqual(validateFloat(9, format), false);
        strictEqual(validateFloat(7, format), false);
        strictEqual(validateFloat(5, format), false);
        strictEqual(validateFloat(3, format), false);
        strictEqual(validateFloat(1, format), false);
      });

    });

    describe('with fractional step', () => {

      const format = { min: 0, max: 1, step: 0.25 };

      it('should accept values aligned to the fractional step', () => {
        strictEqual(validateFloat(0, format), true);
        strictEqual(validateFloat(0.25, format), true);
        strictEqual(validateFloat(0.5, format), true);
        strictEqual(validateFloat(0.75, format), true);
        strictEqual(validateFloat(1, format), true);
      });

      it('should reject values not aligned to the fractional step', () => {
        strictEqual(validateFloat(0.1, format), false);
        strictEqual(validateFloat(0.3, format), false);
        strictEqual(validateFloat(0.6, format), false);
      });

    });

    describe('min/max validation after step rounding (per spec)', () => {

      it('should reject a step-aligned value that falls below min after rounding', () => {
        // step-aligned value at -2 from base 0, but min is 0
        strictEqual(validateFloat(-2, { min: 0, max: 10, step: 2 }), false);
      });

      it('should reject a step-aligned value that falls above max after rounding', () => {
        // step-aligned value at 12 from base 0, but max is 10
        strictEqual(validateFloat(12, { min: 0, max: 10, step: 2 }), false);
      });

    });

    describe('with step only (base falls back to value itself)', () => {

      const format = { step: 5 };

      it('should accept any value when step base falls back to the value itself', () => {
        // When there's no min or max, base = value, so (value - value) / step = 0, rounded = value
        strictEqual(validateFloat(3, format), true);
        strictEqual(validateFloat(7.7, format), true);
        strictEqual(validateFloat(-123.456, format), true);
      });

    });

    describe('string validation with format', () => {

      const format = { min: 0, max: 100 };

      it('should accept a valid string within range', () => {
        strictEqual(validateFloat('50', format), true);
      });

      it('should reject an invalid string even if parseable', () => {
        strictEqual(validateFloat('1e+2', format), false);
      });

      it('should reject a valid string outside range', () => {
        strictEqual(validateFloat('200', format), false);
      });

    });

  });

});