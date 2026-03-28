import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { validateString, MAX_STRING_LENGTH } from './string.js';

describe('String', () => {

  describe('validateString', () => {

    it('should accept a regular string', () => {
      strictEqual(validateString('hello world'), true);
    });

    it('should accept an empty string', () => {
      strictEqual(validateString(''), true);
    });

    it('should accept a string with unicode characters', () => {
      strictEqual(validateString('°C — temperature 🌡️'), true);
    });

    it('should accept a string with newlines', () => {
      strictEqual(validateString('line1\nline2\nline3'), true);
    });

    it('should accept a string at exactly the max length', () => {
      const value = 'a'.repeat(MAX_STRING_LENGTH);
      strictEqual(validateString(value), true);
    });

    it('should reject a string exceeding the max length', () => {
      const value = 'a'.repeat(MAX_STRING_LENGTH + 1);
      strictEqual(validateString(value), false);
    });

    it('should reject a number', () => {
      strictEqual(validateString(42), false);
    });

    it('should reject a boolean', () => {
      strictEqual(validateString(true), false);
    });

    it('should reject null', () => {
      strictEqual(validateString(null), false);
    });

    it('should reject undefined', () => {
      strictEqual(validateString(undefined), false);
    });

    it('should reject an object', () => {
      strictEqual(validateString({}), false);
    });

    it('should reject an array', () => {
      strictEqual(validateString([]), false);
    });

  });

});