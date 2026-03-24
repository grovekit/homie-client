
import { Node } from "../node/node.js";
import { DATATYPE, Property, PropertyInfo } from "./property.js";

export interface FloatFormat {
  min: number;
  max: number;
  step: number;
}

export const defaultFloatFormat: FloatFormat = {
  min: -Number.MAX_SAFE_INTEGER,
  max: Number.MAX_SAFE_INTEGER,
  step: 0.00000001,
};

export class FloatProperty extends Property<number> {

  #format: FloatFormat;

  constructor(id: string, info: PropertyInfo, value: number, node: Node, format: FloatFormat = defaultFloatFormat) {
    super(id, {
      ...info,
      datatype: DATATYPE.FLOAT,
      format: `${format.min.toExponential(5)}:${format.max.toExponential(5)}:${format.step.toExponential(5)}`,
    }, value, node);
    this.#format = format;
  }

  _parse(raw: string) {
    const value = parseFloat(raw);
    if (!Number.isNaN(value)) {
      return value;
    }
    return undefined;
  }

  _serialize(value: number) {
    return value.toString();
  }

  _validate(value: any): value is number {
    return typeof value === 'number'
      && !Number.isNaN(value)
      && value >= this.#format.min
      && value <= this.#format.max
      // && (value - this.#format.min) % this.#format.step < this.#format.step;
  }

};
