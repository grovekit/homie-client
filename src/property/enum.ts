import { Node } from "../node/node.js";
import { Property, PropertyInfo, DATATYPE } from "./property.js";

export type EnumFormat = [first: string, ...rest: string[]];

/**
 * Validates an enum format per the Homie spec.
 * - Individual values cannot be empty strings.
 * - Duplicates are not allowed.
 */
export const validateEnumFormat = (format: EnumFormat): void => {
  const seen = new Set<string>();
  for (const value of format) {
    if (value === '') {
      throw new Error(`enum format must not contain empty string values`);
    }
    if (seen.has(value)) {
      throw new Error(`enum format contains duplicate value "${value}"`);
    }
    seen.add(value);
  }
};

export class EnumProperty<F extends EnumFormat> extends Property<string, F[number]> {

  #format: F;

  constructor(id: string, info: PropertyInfo, value: F[number], node: Node, format: F) {
    validateEnumFormat(format);
    super(id, {
      ...info,
      datatype: DATATYPE.ENUM,
      format: format.join(','),
    }, value, node);
    this.#format = format;
  }

  _parse(raw: string) {
    return raw;
  }

  _serialize(value: F[number]) {
    return value;
  }

  _validate(value: any): value is F[number] {
    return typeof value === 'string' && value !== '' && this.#format.includes(value);
  }

};