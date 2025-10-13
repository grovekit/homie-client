
import { Node } from "../node/node.js";
import { DATATYPE, Property, PropertyInfo } from "./property.js";

export class StringProperty extends Property<string> {

  constructor(id: string, info: PropertyInfo, value: string, node: Node) {
    super(id, { ...info, datatype: DATATYPE.STRING }, value, node);
  }

  _parse(raw: string) {
    return raw;
  }

  _serialize(value: string) {
    return value;
  }

  _validate(value: any): value is string {
    return typeof value === 'string';
  }

};
