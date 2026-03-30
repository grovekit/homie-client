
import { Device, DeviceInfo } from './device.js';
import { TOPIC, DEVICE_STATE, LOG_LEVEL, STRING, PropertySetTopic, RawValue } from '@grovekit/homie-core';
import { Node } from '../node/node.js';
import { Property } from '../property/property.js';
import { Client, ClientOpts } from '../client/client.js';

export class RootDevice extends Device {

  #prefix: string;
  #client: Client;
  #descendants: Map<string, Device>;

  constructor(id: string, info: DeviceInfo, opts: ClientOpts, prefix?: string) {
    super(id, info);
    this._setRoot(this);
    this.#prefix = prefix ?? 'homie';
    this.#descendants = new Map();
    this.#client = new Client({
      ...opts,
      options: {
        will: {
          topic: TOPIC.stringify({ type: 'device_state', prefix: this.#prefix, device: this.id }),
          payload: Buffer.from('lost'),
          qos: 2,
          retain: true,
        },
        protocolLevel: 3,
      },
    });

    this.#client.onConnected = () => {
      this.$_init()
        .then(() => this.$_advertise())
        .catch(console.error);
    };

    this.#client.handlePropertySet = this.#handlePropertySet;

  }

  override async $_init() {
    await this.setState(DEVICE_STATE.INIT, true);
    // Publish init state for all devices so controllers know we're coming online
    for (const device of this.#descendants.values()) {
      await device.setState(DEVICE_STATE.INIT, true);
    }
    // Subscribe to /set topics recursively
    await super.$_init();
    // Set state to READY without publishing — will be published in $_advertise()
    await this.setState(DEVICE_STATE.READY, false);
    for (const device of this.#descendants.values()) {
      await device.setState(DEVICE_STATE.READY, false);
    }
  }

  _registerDevice(device: Device) {
    if (this.#descendants.has(device.id)) {
      throw new Error(`duplicate device ID "${device.id}"`);
    }
    this.#descendants.set(device.id, device);
  }

  _registerNode(node: Node) {

  }

  _registerProperty(property: Property<any>) {

  }

  #handlePropertySet = async (parsed: PropertySetTopic, value: RawValue) => {
    if (value === STRING.NULL) {
      return;
    }
    const device = this.#descendants.get(parsed.device);
    const property = device?._nodes[parsed.node]?._properties[parsed.property];
    if (property?.settable) {
      await property.$_handleSet(value);
    }
  };

  async _publishPropertyValue(property: Property<any>, raw: string) {
    const node = property._node;
    const device = node._device;
    await this.#client.publishPropertyValue(
      { type: 'property_value', prefix: this.#prefix, device: device.id, node: node.id, property: property.id },
      raw as RawValue,
      property.retained,
    );
  }

  async _publishPropertyTarget(property: Property<any>, raw: string) {
    const node = property._node;
    const device = node._device;
    await this.#client.publishPropertyTarget(
      { type: 'property_target', prefix: this.#prefix, device: device.id, node: node.id, property: property.id },
      raw as RawValue,
    );
  }

  async _clearPropertyTarget(property: Property<any>) {
    await this._publishPropertyTarget(property, STRING.NULL);
  }

  async _subscribePropertySet(property: Property<any>) {
    await this.#client.subscribeToPropertySet({
      type: 'property_set',
      prefix: this.#prefix,
      device: property._node._device.id,
      node: property._node.id,
      property: property.id,
    });
  }

  async _publishDeviceAlert(device: Device, alert_id: string, message: string) {
    await this.#client.publishDeviceAlert(
      { type: 'device_alert', prefix: this.#prefix, device: device.id, alert_id },
      message,
    );
  }

  async _clearDeviceAlert(device: Device, alert_id: string) {
    await this._publishDeviceAlert(device, alert_id, STRING.NULL);
  }

  async _publishDeviceLog(device: Device, level: LOG_LEVEL, message: string) {
    await this.#client.publishDeviceLog(
      { type: 'device_log', prefix: this.#prefix, device: device.id, log_level: level },
      message,
    );
  }

  async _publishDeviceState(device: Device, state: DEVICE_STATE) {
    await this.#client.publishDeviceState(
      { type: 'device_state', prefix: this.#prefix, device: device.id },
      state,
    );
  }

  async _publishDeviceDescription(device: Device) {
    await this.#client.publishDeviceInfo(
      { type: 'device_info', prefix: this.#prefix, device: device.id },
      device.$_getDescription(),
    );
  }

  async ready() {
    await this.#client.connect();
  }

}
