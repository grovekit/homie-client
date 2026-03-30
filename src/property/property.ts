import { Node } from "../node/node.js";
import { RootDevice } from "../device/root.js";
import { AsyncLock } from "../utils/asynclock.js";
import { PropertyFormat } from "@grovekit/homie-core";
import { validateId } from "../utils/utils.js";

export enum DATATYPE {
  INTEGER = "integer",
  FLOAT = "float",
  BOOLEAN = "boolean",
  STRING = "string",
  ENUM = "enum",
  COLOR = "color",
  DATETIME = "datetime",
  DURATION = "duration",
  JSON = "json"
}

export interface PropertyInfo {
  /** Friendly name of the Property. Defaults to the ID of the property. */
  name?: string;
  /** Whether the Property is settable. Defaults to false. */
  settable?: boolean;
  /** Whether the Property is retained. Defaults to true. */
  retained?: boolean;
  /** Unit of this property. See units. */
  unit?: string; // TODO: enum
}

export interface FullPropertyInfo extends PropertyInfo {
  format?: string;
  datatype: DATATYPE;
}

/**
 * Resolved version of FullPropertyInfo with spec defaults applied.
 */
export interface ResolvedPropertyInfo {
  name: string;
  settable: boolean;
  retained: boolean;
  unit?: string;
  format?: string;
  datatype: DATATYPE;
}

export abstract class Property<B, T extends B = B> {

  #value: T;
  readonly #id: string;
  readonly _node: Node;
  readonly #root: RootDevice;
  readonly #info: ResolvedPropertyInfo;
  readonly #lock: AsyncLock;

  constructor(id: string, info: FullPropertyInfo, value: B, node: Node) {
    validateId(id, 'property id');
    this.#id = id;
    this.#info = {
      ...info,
      name: info.name ?? id,
      settable: info.settable ?? false,
      retained: info.retained ?? true,
    };
    this._node = node;
    this.#root = node._device.root;
    this.#lock = new AsyncLock();
    this.#value = value as T;
    queueMicrotask(() => {
      if (!this._validate(value)) {
        throw new Error(`invalid initial value ${value} for property ${id}`);
      }
    });
  }

  get id() {
    return this.#id;
  }

  get value(): T {
    return this.#value;
  }

  get retained(): boolean {
    return this.#info.retained;
  }

  get settable(): boolean {
    return this.#info.settable;
  }

  abstract _parse(raw: string): B | undefined;

  abstract _serialize(value: T): string;

  abstract _validate(value: any): value is T;

  async setTarget(value: B) {
    if (!this._validate(value)) {
      return;
    }
    const raw = this._serialize(value)
    await this.#root._publishPropertyTarget(this, raw);
  }

  async clearTarget() {
    await this.#root._clearPropertyTarget(this);
  }

  async setValue(value: B) {
    if (!this._validate(value)) {
      return;
    }
    await this.#lock.acquireRunAndRelease(() => this.#setValue(value));
  }

  async handleSet(value: T): Promise<T | undefined> {
    return value;
  }

  #setValue = async (value: T) => {
    this.#value = value;
    const raw = this._serialize(value);
    await this.#root._publishPropertyValue(this, raw);
  }


  async $_handleSet(raw: string) {
    const value = this._parse(raw);
    if (typeof value === 'undefined') {
      return;
    }
    if (!this._validate(value)) {
      return;
    }
    await this.#lock.acquireRunAndRelease(async () => {
      if (await this.handleSet(value) !== undefined) {
        await this.#setValue(value);
      }
    });
  }

  $_getDescription() {
    return this.#info;
  }

  async $_init() {
    if (this.settable) {
      await this.#root._subscribePropertySet(this);
    }
  }

  async $_advertise() {
    const raw = this._serialize(this.value);
    await this.#root._publishPropertyValue(this, raw);
  }

};
