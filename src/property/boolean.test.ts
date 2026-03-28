import { describe, it } from 'node:test';
import { strictEqual, throws, doesNotThrow } from 'node:assert';
import { validateBooleanFormat, serializeBooleanFormat } from './boolean.js';

describe('Boolean', () => {

  describe('validateBooleanFormat', () => {

    it('should accept a format with two distinct labels', () => {
      doesNotThrow(() => validateBooleanFormat(['off', 'on']));
    });

    it('should accept a format with close/open labels', () => {
      doesNotThrow(() => validateBooleanFormat(['close', 'open']));
    });

    it('should accept a format with labels containing special characters', () => {
      doesNotThrow(() => validateBooleanFormat(['not-active', 'active']));
    });

    it('should accept a format with labels that differ only in case', () => {
      doesNotThrow(() => validateBooleanFormat(['Off', 'ON']));
    });

    it('should accept the default false,true labels', () => {
      doesNotThrow(() => validateBooleanFormat(['false', 'true']));
    });

    it('should throw when the false-label is an empty string', () => {
      throws(() => validateBooleanFormat(['', 'on']), /false-label.*empty string/);
    });

    it('should throw when the true-label is an empty string', () => {
      throws(() => validateBooleanFormat(['off', '']), /true-label.*empty string/);
    });

    it('should throw when both labels are empty strings', () => {
      throws(() => validateBooleanFormat(['', '']), /empty string/);
    });

    it('should throw when both labels are identical', () => {
      throws(() => validateBooleanFormat(['same', 'same']), /distinct/);
    });

  });

  describe('serializeBooleanFormat', () => {

    it('should serialize off/on labels', () => {
      strictEqual(serializeBooleanFormat(['off', 'on']), 'off,on');
    });

    it('should serialize close/open labels', () => {
      strictEqual(serializeBooleanFormat(['close', 'open']), 'close,open');
    });

    it('should serialize the default false/true labels', () => {
      strictEqual(serializeBooleanFormat(['false', 'true']), 'false,true');
    });

    it('should serialize labels with special characters', () => {
      strictEqual(serializeBooleanFormat(['not-active', 'active']), 'not-active,active');
    });

    it('should serialize labels with spaces', () => {
      strictEqual(serializeBooleanFormat(['turned off', 'turned on']), 'turned off,turned on');
    });

  });

});