
import { Node } from "../node/node.js";
import { Property, PropertyInfo, DATATYPE } from "./property.js";
import { STRING } from "@grovekit/homie-core";

export class BooleanProperty extends Property<boolean> {

  constructor(id: string, info: PropertyInfo, value: boolean, node: Node) {
    super(id, { ...info, datatype: DATATYPE.BOOLEAN }, value, node);
  }

  _parse(raw: string) {
    const lower = raw.toLowerCase();
    if (lower === STRING.TRUE) return true;
    if (lower === STRING.FALSE) return false;
    return undefined;
  }

  _serialize(value: boolean) {
    return value ? STRING.TRUE : STRING.FALSE;
  }

  _validate(value: any): value is boolean {
    return value === true || value === false;
  }

};
