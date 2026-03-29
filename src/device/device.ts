
import { type HomieRootDevice } from './root.js';
import { Node, NodeInfo } from '../node/node.js';
import { mapObjectValues, validateId } from '../utils.js';
import { DEVICE_STATE, LOG_LEVEL } from '@grovekit/homie-core';
import assert from 'node:assert';

export interface DeviceInfo {
  /** The implemented Homie convention version, without the “patch” level. So the format is "5.x", where the 'x' is the minor version. */
  homie: '5.0';
  /** The version of the description document. Whenever the document changes, a new version must be assigned. This does not need to be sequential, eg. a timestamp or a random number could be used. */
  version: number;
  /** Friendly name of the device. Defaults to the ID of the device. */
  name?: string;
  /** Type of Device. Please ensure proper namespacing to prevent naming collisions. */
  type?: string;
}



export class Device {

  readonly #id: string;
  readonly #info: DeviceInfo;
  readonly _nodes: Record<string, Node>;
  #root?: HomieRootDevice;
  #parent?: Device;
  _state: DEVICE_STATE;
  readonly _children: Record<string, Device>;

  constructor(id: string, info: Omit<DeviceInfo, 'homie'>, root?: HomieRootDevice, parent?: Device) {
    validateId(id, 'device id');
    this.#info = { ...info, homie: '5.0', name: info.name ?? id };
    this.#id = id;
    this._nodes = {};
    this._state = DEVICE_STATE.INIT;
    this._children = {};
    if (root) {
      this.#root = root;
    }
    if (parent) {
      this.#parent = parent;
    }
  }

  get id() {
    return this.#id;
  }

  get root(): HomieRootDevice {
    assert(this.#root, 'device has no root yet');
    return this.#root;
  }

  get parent(): Device | undefined {
    return this.#parent;
  }

  protected _setRoot(root: HomieRootDevice) {
    assert(!this.#root, 'device already has a root');
    this.#root = root;
  }

  addNode(id: string, info: NodeInfo) {
    assert(!this._nodes[id], `node with id '${id}' already exists`);
    const node = new Node(id, info, this);
    this._nodes[id] = node;
    this.root._registerNode(node);
    return node;
  }

  addChild(id: string, info: Omit<DeviceInfo, 'homie'>) {
    assert(!this._children[id], `child with id '${id}' already exists`);
    const child = new Device(id, info, this.root, this);
    this._children[id] = child;
    this.root._registerDevice(child);
    return child;
  }

  async publishAlert(alertId: string, message: string) {
    return this.root._publishDeviceAlert(this, alertId, message)
  }

  async clearAlert(alertId: string) {
    return this.root._clearDeviceAlert(this, alertId);
  }

  async log(level: LOG_LEVEL, message: string) {
    return this.root._publishDeviceLog(this, level, message);
  }

  async setState(state: DEVICE_STATE, publish: boolean = true) {
    this._state = state;
    if (publish) {
      await this.root._publishDeviceState(this, state);
    }
  }

  $_getDescription() {
    const isRoot = this.root as Device === this;
    return {
      ...this.#info,
      root: isRoot ? undefined : this.root.id,
      nodes: mapObjectValues(this._nodes, node => node.$_getDescription()),
      parent: this.#parent?.id,
      children: Object.keys(this._children),
      extensions: [],
    };
  }

  async $_init() {
    for (const node of Object.values(this._nodes)) {
      await node.$_init();
    }
    for (const child of Object.values(this._children)) {
      await child.$_init();
    }
  }

  async $_advertise() {
    await this.root._publishDeviceDescription(this);
    for (const node of Object.values(this._nodes)) {
      await node.$_advertise();
    }
    for (const child of Object.values(this._children)) {
      await child.$_advertise();
    }
    await this.root._publishDeviceState(this, this._state);
  }

}
