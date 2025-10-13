
import { Node } from "../node/node.js";
import { Property, PropertyInfo, DATATYPE } from "./property.js";

export type EnumFormat = [first: string, ...rest: string[]];

export class EnumProperty<F extends EnumFormat> extends Property<string, F[number]> {

  #format: F;

  constructor(id: string, info: PropertyInfo, value: F[number], node: Node, format: F) {
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
    return this.#format.includes(value);
  }

};
