import { Node } from "../node/node.js";
import { DATATYPE, Property, PropertyInfo } from "./property.js";

export interface FloatFormat {
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Regex for validating float payloads per the Homie spec.
 * Allowed characters: digits, "-", "e"/"E", and ".".
 * The "+" character is NOT allowed (including in exponents).
 */
const FLOAT_REGEX = /^-?(\d+\.?\d*|\d*\.\d+)([eE]-?\d+)?$/;

/**
 * Serializes a number to a Homie-compliant float string.
 * JavaScript's toString() may produce "e+" for large numbers (e.g. 1e+21),
 * but the Homie spec does not allow "+" in float payloads.
 */
export const serializeFloat = (value: number): string => {
  return value.toString().replace('e+', 'e');
};

/**
 * Serializes a FloatFormat to the Homie format string "[min]:[max][:step]".
 * The colon separator between min and max is always present.
 */
export const serializeFloatFormat = (format: FloatFormat): string => {
  const min = typeof format.min === 'number' ? serializeFloat(format.min) : '';
  const max = typeof format.max === 'number' ? serializeFloat(format.max) : '';
  let out = `${min}:${max}`;
  if (typeof format.step === 'number') out += `:${serializeFloat(format.step)}`;
  return out;
};

/**
 * Validates a float value per the Homie spec. Accepts both numbers and strings.
 *
 * When a format is provided:
 * - Step validation uses the spec's recommended formula:
 *   result = floor((value - base) / step + 0.5) * step + base
 * - The base is selected as: min, then max, then the value itself (per spec).
 * - Min/max validation is performed after step rounding (per spec).
 */
export const validateFloat = (value: any, format?: FloatFormat): value is number => {
  if (typeof value === 'string') {
    if (!FLOAT_REGEX.test(value)) {
      return false;
    }
    value = Number.parseFloat(value);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return false;
  }
  if (format) {
    const { min, max, step } = format;
    if (typeof step === 'number') {
      const base = min ?? max ?? value;
      const rounded = Math.floor((value - base) / step + 0.5) * step + base;
      const tolerance = Number.EPSILON * Math.max(Math.abs(value), Math.abs(rounded), 1);
      if (Math.abs(rounded - value) > tolerance) {
        return false;
      }
      value = rounded;
    }
    if (typeof min === 'number' && value < min) {
      return false;
    }
    if (typeof max === 'number' && value > max) {
      return false;
    }
  }
  return true;
};

export class FloatProperty extends Property<number> {

  #format?: FloatFormat;

  constructor(id: string, info: PropertyInfo, value: number, node: Node, format?: FloatFormat) {
    super(id, {
      ...info,
      datatype: DATATYPE.FLOAT,
      format: format ? serializeFloatFormat(format) : undefined,
    }, value, node);
    this.#format = format;
  }

  _parse(raw: string) {
    if (!FLOAT_REGEX.test(raw)) {
      return undefined;
    }
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value;
  }

  _serialize(value: number) {
    return serializeFloat(value);
  }

  _validate(value: any): value is number {
    return validateFloat(value, this.#format);
  }

};