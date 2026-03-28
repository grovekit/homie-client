import { describe, it } from 'node:test';
import { strictEqual, throws } from 'node:assert';
import { validateEnumFormat } from './enum.js';

describe('Enum', () => {

  describe('validateEnumFormat', () => {

    it('should accept a format with a single value', () => {
      validateEnumFormat(['on']);
    });

    it('should accept a format with multiple distinct values', () => {
      validateEnumFormat(['on', 'off', 'standby']);
    });

    it('should accept a format with values containing special characters', () => {
      validateEnumFormat(['value-1', 'value_2', 'value 3']);
    });

    it('should accept a format with values that differ only in case', () => {
      validateEnumFormat(['On', 'on', 'ON']);
    });

    it('should accept a format with values containing leading/trailing whitespace', () => {
      // Spec says "Leading- and trailing-whitespace is significant"
      validateEnumFormat(['car', ' car', 'car ']);
    });

    it('should throw on a format containing an empty string value', () => {
      throws(() => validateEnumFormat(['']), /empty string/);
    });

    it('should throw on a format containing an empty string among other values', () => {
      throws(() => validateEnumFormat(['on', '', 'off']), /empty string/);
    });

    it('should throw on a format with duplicate values', () => {
      throws(() => validateEnumFormat(['on', 'off', 'on']), /duplicate/);
    });

    it('should throw on a format with consecutive duplicate values', () => {
      throws(() => validateEnumFormat(['on', 'on']), /duplicate/);
    });

    it('should throw on a format with all identical values', () => {
      throws(() => validateEnumFormat(['a', 'a', 'a']), /duplicate/);
    });

  });

});