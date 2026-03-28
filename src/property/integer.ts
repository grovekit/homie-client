import { Node } from "../node/node.js";
import { DATATYPE, Property, PropertyInfo } from "./property.js";

export interface IntegerFormat {
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Regex for validating integer payloads per the Homie spec.
 * Allowed characters: digits and "-" (negation). No spaces, decimal points,
 * or exponent characters are permitted.
 */
const INTEGER_REGEX = /^-?\d+$/;

/**
 * Serializes an IntegerFormat to the Homie format string "[min]:[max][:step]".
 * The colon separator between min and max is always present.
 */
export const serializeIntegerFormat = (format: IntegerFormat): string => {
  const min = typeof format.min === 'number' ? `${format.min}` : '';
  const max = typeof format.max === 'number' ? `${format.max}` : '';
  let out = `${min}:${max}`;
  if (typeof format.step === 'number') out += `:${format.step}`;
  return out;
};

/**
 * Validates an integer value per the Homie spec. Accepts both numbers and strings.
 *
 * When a format is provided:
 * - Step validation uses the spec's recommended formula:
 *   result = floor((value - base) / step + 0.5) * step + base
 * - The base is selected as: min, then max, then the value itself (per spec).
 * - Min/max validation is performed after step rounding (per spec).
 * - The input MUST already be a valid integer before rounding to a step (per spec).
 */
export const validateInteger = (value: any, format?: IntegerFormat): value is number => {
  if (typeof value === 'string') {
    if (!INTEGER_REGEX.test(value)) {
      return false;
    }
    value = Number.parseInt(value, 10);
  }
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    return false;
  }
  if (format) {
    const { min, max, step } = format;
    if (typeof step === 'number') {
      const base = min ?? max ?? value;
      const rounded = Math.floor((value - base) / step + 0.5) * step + base;
      if (rounded !== value) {
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

export class IntegerProperty extends Property<number> {

  #format?: IntegerFormat;

  constructor(id: string, info: PropertyInfo, value: number, node: Node, format?: IntegerFormat) {
    super(id, {
      ...info,
      datatype: DATATYPE.INTEGER,
      format: format ? serializeIntegerFormat(format) : undefined,
    }, value, node);
    this.#format = format;
  }

  _parse(raw: string) {
    if (!INTEGER_REGEX.test(raw)) {
      return undefined;
    }
    const value = parseInt(raw, 10);
    if (!Number.isSafeInteger(value)) {
      return undefined;
    }
    return value;
  }

  _serialize(value: number): string {
    return value.toString();
  }

  _validate(value: any): value is number {
    return validateInteger(value, this.#format);
  }

};