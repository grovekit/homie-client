import { Node } from "../node/node.js";
import { Property, PropertyInfo, DATATYPE } from "./property.js";
import { STRING } from "@grovekit/homie-core";

/**
 * Format for boolean properties per the Homie spec.
 * A tuple of two strings: the first represents the `false` value label
 * and the second represents the `true` value label.
 *
 * Examples: ["close", "open"], ["off", "on"]
 *
 * Important: the format does NOT specify valid payloads — they are
 * descriptions of the valid payloads `false` and `true`.
 */
export type BooleanFormat = [falseLabel: string, trueLabel: string];

/**
 * Validates a boolean format per the Homie spec.
 * - Both entries must be provided.
 * - Neither entry may be an empty string.
 * - Entries must not be identical.
 */
export const validateBooleanFormat = (format: BooleanFormat): void => {
  if (format[0] === '') {
    throw new Error(`boolean format false-label must not be an empty string`);
  }
  if (format[1] === '') {
    throw new Error(`boolean format true-label must not be an empty string`);
  }
  if (format[0] === format[1]) {
    throw new Error(`boolean format labels must be distinct, got "${format[0]}" for both`);
  }
};

/**
 * Serializes a BooleanFormat to the Homie format string "falseLabel,trueLabel".
 */
export const serializeBooleanFormat = (format: BooleanFormat): string => {
  return `${format[0]},${format[1]}`;
};

export class BooleanProperty extends Property<boolean> {

  constructor(id: string, info: PropertyInfo, value: boolean, node: Node, format?: BooleanFormat) {
    if (format) {
      validateBooleanFormat(format);
    }
    super(id, {
      ...info,
      datatype: DATATYPE.BOOLEAN,
      format: format ? serializeBooleanFormat(format) : undefined,
    }, value, node);
  }

  _parse(raw: string) {
    if (raw === STRING.TRUE) return true;
    if (raw === STRING.FALSE) return false;
    return undefined;
  }

  _serialize(value: boolean) {
    return value ? STRING.TRUE : STRING.FALSE;
  }

  _validate(value: any): value is boolean {
    return value === true || value === false;
  }

};