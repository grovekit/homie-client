import { describe, it } from 'node:test';
import { strictEqual, throws, doesNotThrow } from 'node:assert';
import { validateId } from './utils.js';

describe('validateId', () => {

  describe('valid IDs', () => {

    it('should accept a simple lowercase string', () => {
      doesNotThrow(() => validateId('device'));
    });

    it('should accept a single character', () => {
      doesNotThrow(() => validateId('a'));
    });

    it('should accept a single digit', () => {
      doesNotThrow(() => validateId('1'));
    });

    it('should accept lowercase letters and digits', () => {
      doesNotThrow(() => validateId('sensor1'));
    });

    it('should accept hyphens between characters', () => {
      doesNotThrow(() => validateId('my-device'));
    });

    it('should accept multiple hyphens', () => {
      doesNotThrow(() => validateId('my-cool-device'));
    });

    it('should accept digits only', () => {
      doesNotThrow(() => validateId('12345'));
    });

    it('should accept a trailing hyphen', () => {
      doesNotThrow(() => validateId('device-'));
    });

    it('should accept a mix of letters, digits, and hyphens', () => {
      doesNotThrow(() => validateId('abc-123-def'));
    });

  });

  describe('invalid IDs', () => {

    it('should reject an empty string', () => {
      throws(() => validateId(''), /invalid/);
    });

    it('should reject uppercase letters', () => {
      throws(() => validateId('Device'), /invalid/);
    });

    it('should reject mixed case', () => {
      throws(() => validateId('myDevice'), /invalid/);
    });

    it('should reject underscores', () => {
      throws(() => validateId('my_device'), /invalid/);
    });

    it('should reject spaces', () => {
      throws(() => validateId('my device'), /invalid/);
    });

    it('should reject a leading hyphen', () => {
      throws(() => validateId('-device'), /invalid/);
    });

    it('should reject dots', () => {
      throws(() => validateId('my.device'), /invalid/);
    });

    it('should reject special characters', () => {
      throws(() => validateId('device!'), /invalid/);
    });

    it('should reject the $ character (reserved for attributes)', () => {
      throws(() => validateId('$state'), /invalid/);
    });

    it('should reject a slash', () => {
      throws(() => validateId('my/device'), /invalid/);
    });

    it('should reject unicode characters', () => {
      throws(() => validateId('café'), /invalid/);
    });

    it('should reject leading whitespace', () => {
      throws(() => validateId(' device'), /invalid/);
    });

    it('should reject trailing whitespace', () => {
      throws(() => validateId('device '), /invalid/);
    });

  });

  describe('custom label', () => {

    it('should include the label in the error message', () => {
      throws(() => validateId('INVALID', 'device id'), /device id/);
    });

    it('should include the invalid ID in the error message', () => {
      throws(() => validateId('my_device', 'node id'), /my_device/);
    });

  });

});