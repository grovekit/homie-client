import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { serializeIntegerFormat, validateInteger } from './integer.js';

describe('Integer', () => {

  describe('serializeIntegerFormat', () => {

    it('should serialize min and max', () => {
      strictEqual(serializeIntegerFormat({ min: 0, max: 10 }), '0:10');
    });

    it('should serialize min only with open-ended max', () => {
      strictEqual(serializeIntegerFormat({ min: 0 }), '0:');
    });

    it('should serialize max only with open-ended min', () => {
      strictEqual(serializeIntegerFormat({ max: 10 }), ':10');
    });

    it('should serialize min, max, and step', () => {
      strictEqual(serializeIntegerFormat({ min: 0, max: 10, step: 2 }), '0:10:2');
    });

    it('should serialize step only', () => {
      strictEqual(serializeIntegerFormat({ step: 2 }), '::2');
    });

    it('should serialize an empty format as a single colon', () => {
      strictEqual(serializeIntegerFormat({}), ':');
    });

    it('should serialize negative min and max', () => {
      strictEqual(serializeIntegerFormat({ min: -100, max: 100 }), '-100:100');
    });

    it('should serialize large values', () => {
      strictEqual(serializeIntegerFormat({ min: -9007199254740991, max: 9007199254740991 }), '-9007199254740991:9007199254740991');
    });

  });

  describe('validateInteger', () => {

    describe('without format', () => {

      it('should accept a positive integer', () => {
        strictEqual(validateInteger(42), true);
      });

      it('should accept a negative integer', () => {
        strictEqual(validateInteger(-42), true);
      });

      it('should accept zero', () => {
        strictEqual(validateInteger(0), true);
      });

      it('should accept a valid integer string', () => {
        strictEqual(validateInteger('42'), true);
      });

      it('should accept a negative integer string', () => {
        strictEqual(validateInteger('-42'), true);
      });

      it('should accept zero as a string', () => {
        strictEqual(validateInteger('0'), true);
      });

      it('should reject a float number', () => {
        strictEqual(validateInteger(3.14), false);
      });

      it('should reject a string with a decimal point', () => {
        strictEqual(validateInteger('3.14'), false);
      });

      it('should reject a string with an exponent', () => {
        strictEqual(validateInteger('1e5'), false);
      });

      it('should reject a string with uppercase exponent', () => {
        strictEqual(validateInteger('1E5'), false);
      });

      it('should reject a string with "+" prefix', () => {
        strictEqual(validateInteger('+5'), false);
      });

      it('should reject an empty string', () => {
        strictEqual(validateInteger(''), false);
      });

      it('should reject a string with only a negation sign', () => {
        strictEqual(validateInteger('-'), false);
      });

      it('should reject a string with trailing non-numeric characters', () => {
        strictEqual(validateInteger('12abc'), false);
      });

      it('should reject a string with leading whitespace', () => {
        strictEqual(validateInteger(' 12'), false);
      });

      it('should reject a string with trailing whitespace', () => {
        strictEqual(validateInteger('12 '), false);
      });

      it('should reject a string with spaces', () => {
        strictEqual(validateInteger('1 2'), false);
      });

      it('should reject NaN', () => {
        strictEqual(validateInteger(NaN), false);
      });

      it('should reject Infinity', () => {
        strictEqual(validateInteger(Infinity), false);
      });

      it('should reject -Infinity', () => {
        strictEqual(validateInteger(-Infinity), false);
      });

      it('should reject null', () => {
        strictEqual(validateInteger(null), false);
      });

      it('should reject undefined', () => {
        strictEqual(validateInteger(undefined), false);
      });

      it('should reject a boolean', () => {
        strictEqual(validateInteger(true), false);
      });

      it('should reject an object', () => {
        strictEqual(validateInteger({}), false);
      });

      it('should reject a number exceeding safe integer range', () => {
        strictEqual(validateInteger(Number.MAX_SAFE_INTEGER + 1), false);
      });

      it('should reject a number below negative safe integer range', () => {
        strictEqual(validateInteger(Number.MIN_SAFE_INTEGER - 1), false);
      });

      it('should accept Number.MAX_SAFE_INTEGER', () => {
        strictEqual(validateInteger(Number.MAX_SAFE_INTEGER), true);
      });

      it('should accept Number.MIN_SAFE_INTEGER', () => {
        strictEqual(validateInteger(Number.MIN_SAFE_INTEGER), true);
      });

    });

    describe('with min and max', () => {

      const format = { min: -10, max: 10 };

      it('should accept a value within range', () => {
        strictEqual(validateInteger(5, format), true);
      });

      it('should accept the minimum value (inclusive)', () => {
        strictEqual(validateInteger(-10, format), true);
      });

      it('should accept the maximum value (inclusive)', () => {
        strictEqual(validateInteger(10, format), true);
      });

      it('should reject a value below min', () => {
        strictEqual(validateInteger(-11, format), false);
      });

      it('should reject a value above max', () => {
        strictEqual(validateInteger(11, format), false);
      });

    });

    describe('with min only (open-ended max)', () => {

      const format = { min: 0 };

      it('should accept a value above min', () => {
        strictEqual(validateInteger(100, format), true);
      });

      it('should accept the minimum value', () => {
        strictEqual(validateInteger(0, format), true);
      });

      it('should reject a value below min', () => {
        strictEqual(validateInteger(-1, format), false);
      });

      it('should accept a very large value', () => {
        strictEqual(validateInteger(Number.MAX_SAFE_INTEGER, format), true);
      });

    });

    describe('with max only (open-ended min)', () => {

      const format = { max: 10 };

      it('should accept a value below max', () => {
        strictEqual(validateInteger(-100, format), true);
      });

      it('should accept the maximum value', () => {
        strictEqual(validateInteger(10, format), true);
      });

      it('should reject a value above max', () => {
        strictEqual(validateInteger(11, format), false);
      });

    });

    describe('with step (base = min)', () => {

      const format = { min: 0, max: 10, step: 2 };

      it('should accept values aligned to the step from min', () => {
        strictEqual(validateInteger(0, format), true);
        strictEqual(validateInteger(2, format), true);
        strictEqual(validateInteger(4, format), true);
        strictEqual(validateInteger(6, format), true);
        strictEqual(validateInteger(8, format), true);
        strictEqual(validateInteger(10, format), true);
      });

      it('should reject values not aligned to the step', () => {
        strictEqual(validateInteger(1, format), false);
        strictEqual(validateInteger(3, format), false);
        strictEqual(validateInteger(5, format), false);
        strictEqual(validateInteger(7, format), false);
        strictEqual(validateInteger(9, format), false);
      });

    });

    describe('with step and offset min', () => {

      const format = { min: 1, max: 11, step: 2 };

      it('should accept values aligned to the step from min', () => {
        strictEqual(validateInteger(1, format), true);
        strictEqual(validateInteger(3, format), true);
        strictEqual(validateInteger(5, format), true);
        strictEqual(validateInteger(7, format), true);
        strictEqual(validateInteger(9, format), true);
        strictEqual(validateInteger(11, format), true);
      });

      it('should reject values not aligned to the step from min', () => {
        strictEqual(validateInteger(2, format), false);
        strictEqual(validateInteger(4, format), false);
        strictEqual(validateInteger(6, format), false);
      });

    });

    describe('with step, base falls back to max (no min)', () => {

      const format = { max: 10, step: 2 };

      it('should accept values aligned to the step from max', () => {
        strictEqual(validateInteger(10, format), true);
        strictEqual(validateInteger(8, format), true);
        strictEqual(validateInteger(6, format), true);
        strictEqual(validateInteger(4, format), true);
        strictEqual(validateInteger(2, format), true);
        strictEqual(validateInteger(0, format), true);
        strictEqual(validateInteger(-2, format), true);
      });

      it('should reject values not aligned to the step from max', () => {
        strictEqual(validateInteger(9, format), false);
        strictEqual(validateInteger(7, format), false);
        strictEqual(validateInteger(5, format), false);
        strictEqual(validateInteger(3, format), false);
        strictEqual(validateInteger(1, format), false);
      });

    });

    describe('with step and large step size', () => {

      const format = { min: 0, max: 100, step: 25 };

      it('should accept values aligned to the step', () => {
        strictEqual(validateInteger(0, format), true);
        strictEqual(validateInteger(25, format), true);
        strictEqual(validateInteger(50, format), true);
        strictEqual(validateInteger(75, format), true);
        strictEqual(validateInteger(100, format), true);
      });

      it('should reject values not aligned to the step', () => {
        strictEqual(validateInteger(1, format), false);
        strictEqual(validateInteger(10, format), false);
        strictEqual(validateInteger(26, format), false);
        strictEqual(validateInteger(99, format), false);
      });

    });

    describe('min/max validation after step rounding (per spec)', () => {

      it('should reject a step-aligned value that falls below min', () => {
        strictEqual(validateInteger(-2, { min: 0, max: 10, step: 2 }), false);
      });

      it('should reject a step-aligned value that falls above max', () => {
        strictEqual(validateInteger(12, { min: 0, max: 10, step: 2 }), false);
      });

    });

    describe('with step only (base falls back to value itself)', () => {

      const format = { step: 5 };

      it('should accept any integer when step base falls back to the value itself', () => {
        // When there's no min or max, base = value, so (value - value) / step = 0, rounded = value
        strictEqual(validateInteger(3, format), true);
        strictEqual(validateInteger(7, format), true);
        strictEqual(validateInteger(-123, format), true);
      });

    });

    describe('spec example: step rounding base selection', () => {

      it('should use min as base when min is provided (spec example: input 5, format "0:10:2" -> 6)', () => {
        // base = 0; result = floor((5-0)/2 + 0.5) * 2 + 0 = floor(3) * 2 + 0 = 6
        // 6 != 5, so 5 is not valid
        strictEqual(validateInteger(5, { min: 0, max: 10, step: 2 }), false);
        // but 6 is valid
        strictEqual(validateInteger(6, { min: 0, max: 10, step: 2 }), true);
      });

      it('should use max as base when min is absent (spec example: input 5, format ":10:2" -> 6 with floor+0.5)', () => {
        // base = 10; result = floor((5-10)/2 + 0.5) * 2 + 10 = floor(-2.5 + 0.5) * 2 + 10 = floor(-2) * 2 + 10 = -4 + 10 = 6
        // 6 != 5, so 5 is not valid
        strictEqual(validateInteger(5, { max: 10, step: 2 }), false);
        // but 6 is valid: floor((6-10)/2 + 0.5) * 2 + 10 = floor(-2 + 0.5) * 2 + 10 = floor(-1.5) * 2 + 10 = -2 * 2 + 10 = 6
        strictEqual(validateInteger(6, { max: 10, step: 2 }), true);
      });

    });

    describe('string validation with format', () => {

      const format = { min: 0, max: 100 };

      it('should accept a valid integer string within range', () => {
        strictEqual(validateInteger('50', format), true);
      });

      it('should reject an invalid integer string even if parseable', () => {
        strictEqual(validateInteger('50.0', format), false);
      });

      it('should reject a valid integer string outside range', () => {
        strictEqual(validateInteger('200', format), false);
      });

    });

  });

});