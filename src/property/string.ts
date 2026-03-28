import { Node } from "../node/node.js";
import { DATATYPE, Property, PropertyInfo } from "./property.js";
import { STRING } from "@grovekit/homie-core";

/**
 * Maximum allowed string length per the Homie spec.
 * "String types are limited to 268,435,456 characters"
 */
export const MAX_STRING_LENGTH = 268_435_456;

/**
 * Validates a string value per the Homie spec.
 * - Must be a string type.
 * - Must not exceed 268,435,456 characters.
 */
export const validateString = (value: any): value is string => {
  return typeof value === 'string' && value.length <= MAX_STRING_LENGTH;
};

export class StringProperty extends Property<string> {

  constructor(id: string, info: PropertyInfo, value: string, node: Node) {
    super(id, { ...info, datatype: DATATYPE.STRING }, value, node);
  }

  _parse(raw: string) {
    return raw === STRING.EMPTY ? '' : raw;
  }

  _serialize(value: string) {
    return value === '' ? STRING.EMPTY : value;
  }

  _validate(value: any): value is string {
    return validateString(value);
  }

};