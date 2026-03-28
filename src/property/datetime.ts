import { Node } from "../node/node.js";
import { Property, PropertyInfo, DATATYPE } from "./property.js";

/**
 * Regex for validating ISO 8601 datetime payloads per the Homie spec.
 *
 * Accepts:
 *   - Date only: YYYY-MM-DD
 *   - Date and time: YYYY-MM-DDTHH:mm:ss
 *   - With fractional seconds: YYYY-MM-DDTHH:mm:ss.sss
 *   - With timezone: Z, ±HH, ±HH:MM, or ±HHMM
 *
 * Rejects non-ISO formats like "March 15, 2024", "15/03/2024", etc.
 */
const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Validates a datetime value per the Homie spec. Accepts Date instances and
 * ISO 8601 strings.
 */
export const validateDatetime = (value: any): value is Date => {
  if (typeof value === 'string') {
    if (!ISO8601_REGEX.test(value)) {
      return false;
    }
    value = new Date(value);
  }
  return value instanceof Date && !Number.isNaN(value.getTime());
};

export class DatetimeProperty extends Property<Date> {

  constructor(id: string, info: PropertyInfo, value: Date, node: Node) {
    super(id, { ...info, datatype: DATATYPE.DATETIME }, value, node);
  }

  _parse(raw: string) {
    if (!ISO8601_REGEX.test(raw)) {
      return undefined;
    }
    const value = new Date(raw);
    if (!Number.isNaN(value.getTime())) {
      return value;
    }
    return undefined;
  }

  _serialize(value: Date) {
    return value.toISOString();
  }

  _validate(value: any): value is Date {
    return validateDatetime(value);
  }

};