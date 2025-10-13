
import { Node } from "../node/node.js";
import { Property, PropertyInfo, DATATYPE } from "./property.js";

export class DatetimeProperty extends Property<Date> {

  constructor(id: string, info: PropertyInfo, value: Date, node: Node) {
    super(id, { ...info, datatype: DATATYPE.DATETIME }, value, node);
  }

  _parse(raw: string) {
    const value = new Date(raw);
    return value;
  }

  _serialize(value: Date) {
    return value.toISOString();
  }

  _validate(value: any): value is Date {
    return value instanceof Date
      && !Number.isNaN(value.getTime());
  }

};
