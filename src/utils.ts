
/**
 * Regex for validating Homie topic IDs per the spec.
 * "A topic level ID MAY ONLY contain lowercase letters from a to z,
 * numbers from 0 to 9 as well as the hyphen character (-)."
 */
const ID_REGEX = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Validates a Homie topic ID (used for device, node, and property IDs).
 * Throws if the ID is invalid.
 */
export const validateId = (id: string, label: string = 'id'): void => {
  if (!ID_REGEX.test(id)) {
    throw new Error(`invalid ${label} "${id}": must contain only lowercase letters (a-z), numbers (0-9), and hyphens (-)`);
  }
};

export const mapObjectValues = <I, O, K extends string>(obj: Record<K, I>, fn: (value: I) => O): Record<K, O> => {
  const res: Partial<Record<K, O>> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      res[key] = fn(obj[key]);
    }
  }
  return res as Record<K, O>;
};

export const RESOLVED = Promise.resolve();

export class Counter {

  readonly #max: number;
  #cur: number;

  constructor(max: number = Number.MAX_SAFE_INTEGER) {
    this.#max = max;
    this.#cur = 0;
  }

  increment(): number {
    if (this.#cur === this.#max) {
      this.#cur = 0;
    }
    return this.#cur++;
  }

}
