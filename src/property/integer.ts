
import { Node } from "../node/node.js";
import { DATATYPE, Property, PropertyInfo } from "./property.js";
import { STRING } from "@grovekit/homie-core";

export interface IntegerFormat {
  min: number;
  max: number;
  step: number;
}

export const defaultIntegerFormat: IntegerFormat = {
  min: Number.MIN_SAFE_INTEGER,
  max: Number.MAX_SAFE_INTEGER,
  step: 1,
};

export class IntegerProperty extends Property<number> {

  #format: IntegerFormat;

  constructor(id: string, info: PropertyInfo, value: number, node: Node, format: IntegerFormat = defaultIntegerFormat) {
    super(id, {
      ...info,
      datatype: DATATYPE.INTEGER,
      format: `${format.min}:${format.max}:${format.step}`,
    }, value, node);
    this.#format = format;
  }

  _parse(raw: string) {
    const value = parseInt(raw);
    if (!Number.isNaN(value)) {
      return value;
    }
    return undefined;
  }

  _serialize(value: number): string {
    return value.toString();
  }

  _validate(value: any): value is number {
    return typeof value === 'number'
      && !Number.isNaN(value)
      && value % 1 === 0
      && value >= this.#format.min
      && value <= this.#format.max
      && (value - this.#format.min) % this.#format.step === 0;
  }

};
