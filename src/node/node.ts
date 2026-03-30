
import { Property, PropertyInfo } from "../property/property.js";
import { RootDevice } from "../device/root.js";
import { Device } from "../device/device.js";
import { validateId } from "../utils/utils.js";
import { BooleanProperty, BooleanFormat } from "../property/boolean.js";
import { StringProperty } from "../property/string.js";
import { IntegerProperty, IntegerFormat } from "../property/integer.js";
import { FloatProperty, FloatFormat } from "../property/float.js";
import { EnumProperty, EnumFormat } from "../property/enum.js";
import { DatetimeProperty } from "../property/datetime.js";
import { mapObjectValues } from "../utils/utils.js";
import assert from "node:assert";


export interface NodeInfo {
  /** Friendly name of the Node. Defaults to the ID of the node. */
  name?: string;
  /** Type of Node. Please ensure proper namespacing to prevent naming collisions. */
  type?: string;
}

export class Node {

  readonly #id: string;
  readonly #info: NodeInfo;
  readonly #root: RootDevice;
  readonly _device: Device;
  readonly _properties: Record<string, Property<any>> = {};

  constructor(id: string, info: NodeInfo, device: Device) {
    validateId(id, 'node id');
    this.#id = id;
    this.#info = { ...info, name: info.name ?? id };
    this.#root = device.root;
    this._device = device;
    this._properties = Object.create(null);
  }

  get id() {
    return this.#id;
  }

  #addProperty(property: Property<any>) {
    assert(!this._properties[property.id], `property with id '${property.id}' already exists`);
    this._properties[property.id] = property;
    this.#root._registerProperty(property);
  }

  addIntegerProperty(id: string, info: PropertyInfo, value: number, format?: IntegerFormat) {
    const property = new IntegerProperty(id, info, value, this, format);
    this.#addProperty(property);
    return property;
  }

  addFloatProperty(id: string, info: PropertyInfo, value: number, format?: FloatFormat) {
    const property = new FloatProperty(id, info, value, this, format);
    this.#addProperty(property);
    return property;
  }

  addBooleanProperty(id: string, info: PropertyInfo, value: boolean, format?: BooleanFormat) {
    const property = new BooleanProperty(id, info, value, this, format);
    this.#addProperty(property);
    return property;
  }

  addStringProperty(id: string, info: PropertyInfo, value: string) {
    const property = new StringProperty(id, info, value, this);
    this.#addProperty(property);
    return property;
  }

  addDatetimeProperty(id: string, info: PropertyInfo, value: Date) {
    const property = new DatetimeProperty(id, info, value, this);
    this.#addProperty(property);
    return property;
  }

  addEnumProperty<F extends EnumFormat>(id: string, info: PropertyInfo, format: F, value: F[number]) {
    const property = new EnumProperty<F>(id, info, value, this, format);
    this.#addProperty(property);
    return property;
  }

  addColorProperty() {
    throw new Error('not yet implemented');
  }

  addDurationProperty() {
    throw new Error('not yet implemented');
  }

  addJsonProperty() {
    throw new Error('not yet implemented');
  }

  $_getDescription() {
    return {
      ...this.#info,
      properties: mapObjectValues(this._properties, property => property.$_getDescription()),
    };
  }

  async $_init() {
    for (const property of Object.values(this._properties)) {
      await property.$_init();
    }
  }

  async $_advertise() {
    for (const property of Object.values(this._properties)) {
      await property.$_advertise();
    }
  }


}
