import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { validateDatetime } from './datetime.js';

describe('Datetime', () => {

  describe('validateDatetime', () => {

    describe('valid Date instances', () => {

      it('should accept a valid Date object', () => {
        strictEqual(validateDatetime(new Date('2024-03-15T12:30:00Z')), true);
      });

      it('should accept a Date object at epoch', () => {
        strictEqual(validateDatetime(new Date(0)), true);
      });

      it('should reject an invalid Date object', () => {
        strictEqual(validateDatetime(new Date('not a date')), false);
      });

    });

    describe('valid ISO 8601 strings', () => {

      it('should accept a date-only string', () => {
        strictEqual(validateDatetime('2024-03-15'), true);
      });

      it('should accept a date and time without timezone', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00'), true);
      });

      it('should accept a date and time with Z timezone', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00Z'), true);
      });

      it('should accept a date and time with positive offset', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00+05:30'), true);
      });

      it('should accept a date and time with negative offset', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00-04:00'), true);
      });

      it('should accept a date and time with offset without colon', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00+0530'), true);
      });

      it('should reject a date and time with hours-only offset (JS Date limitation)', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00+05'), false);
      });

      it('should accept fractional seconds', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00.123Z'), true);
      });

      it('should accept high-precision fractional seconds', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00.123456Z'), true);
      });

      it('should accept fractional seconds without timezone', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00.5'), true);
      });

      it('should accept fractional seconds with offset', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00.123+02:00'), true);
      });

      it('should accept midnight', () => {
        strictEqual(validateDatetime('2024-03-15T00:00:00Z'), true);
      });

      it('should accept end of day', () => {
        strictEqual(validateDatetime('2024-03-15T23:59:59Z'), true);
      });

    });

    describe('invalid strings (non-ISO 8601)', () => {

      it('should reject a human-readable date string', () => {
        strictEqual(validateDatetime('March 15, 2024'), false);
      });

      it('should reject a slash-separated date', () => {
        strictEqual(validateDatetime('15/03/2024'), false);
      });

      it('should reject a US-style slash-separated date', () => {
        strictEqual(validateDatetime('03/15/2024'), false);
      });

      it('should reject a dot-separated date', () => {
        strictEqual(validateDatetime('15.03.2024'), false);
      });

      it('should reject a date with spaces instead of T separator', () => {
        strictEqual(validateDatetime('2024-03-15 12:30:00'), false);
      });

      it('should reject a time-only string', () => {
        strictEqual(validateDatetime('12:30:00'), false);
      });

      it('should reject a year-month only string', () => {
        strictEqual(validateDatetime('2024-03'), false);
      });

      it('should reject a year-only string', () => {
        strictEqual(validateDatetime('2024'), false);
      });

      it('should reject an empty string', () => {
        strictEqual(validateDatetime(''), false);
      });

      it('should reject a Unix timestamp string', () => {
        strictEqual(validateDatetime('1710504600'), false);
      });

      it('should reject a string with trailing garbage', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00Zfoo'), false);
      });

      it('should reject a string with leading whitespace', () => {
        strictEqual(validateDatetime(' 2024-03-15T12:30:00Z'), false);
      });

      it('should reject a string with trailing whitespace', () => {
        strictEqual(validateDatetime('2024-03-15T12:30:00Z '), false);
      });

      it('should reject an arbitrary word', () => {
        strictEqual(validateDatetime('not-a-date'), false);
      });

      it('should reject a lowercase t separator', () => {
        strictEqual(validateDatetime('2024-03-15t12:30:00Z'), false);
      });

      it('should reject a date with time but missing seconds', () => {
        strictEqual(validateDatetime('2024-03-15T12:30'), false);
      });

      it('should reject a date with time but missing minutes and seconds', () => {
        strictEqual(validateDatetime('2024-03-15T12'), false);
      });

    });

    describe('non-string, non-Date types', () => {

      it('should reject a number', () => {
        strictEqual(validateDatetime(1710504600000), false);
      });

      it('should reject null', () => {
        strictEqual(validateDatetime(null), false);
      });

      it('should reject undefined', () => {
        strictEqual(validateDatetime(undefined), false);
      });

      it('should reject a boolean', () => {
        strictEqual(validateDatetime(true), false);
      });

      it('should reject an object', () => {
        strictEqual(validateDatetime({}), false);
      });

      it('should reject an array', () => {
        strictEqual(validateDatetime([]), false);
      });

    });

  });

});