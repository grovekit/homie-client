
import {
  TOPIC,
  RawValue,
  DeviceDescription,
  DeviceInfoTopic,
  DeviceStateTopic,
  DeviceAlertTopic,
  DeviceLogTopic,
  PropertyTargetTopic,
  PropertyValueTopic,
  PropertySetTopic,
  WithRaw,
  getDeviceWildcardTopic,
  getAutodiscoveryTopic,
  DEVICE_STATE,
} from '@grovekit/homie-core';

import { TcpClient } from '@seriousme/opifex/tcpClient';
import { ConnectParameters, PublishParameters, SubscribeParameters } from '@seriousme/opifex/client';
import { PublishPacket } from '@seriousme/opifex/mqttPacket';

import { is } from '@deepkit/type';
import { Counter, errToString } from '../utils/utils.js';

import * as debug from '../utils/debug.js';
import { ClientOpts, clientOptsToConnectParameters } from './opts.js';

type OpifexTopicFilter = SubscribeParameters['subscriptions'][number]['topicFilter'];
type OpifexTopicQoS = SubscribeParameters['subscriptions'][number]['qos'];

export class Client {

  #parameters: ConnectParameters;
  #client: TcpClient;
  #reading: boolean;
  #msg_counter: Counter;
  #subscriptions: Map<OpifexTopicFilter, OpifexTopicQoS>;

  constructor(opts: ClientOpts) {
    this.#parameters = clientOptsToConnectParameters(opts);
    this.#client = new TcpClient();
    this.#reading = false;
    this.#msg_counter = new Counter();
    this.#subscriptions = new Map();
    this.#client.onError = this.#onError;
    this.#client.onConnected = this.#onConnected;
    this.#client.onDisconnected = this.#onDisconnected;
  }

  onError = (err: Error): void => {
    console.error(err);
    process.exit(1);
  };

  #onError = (err: Error): void => {
    debug.mqtt('error: %s', errToString(err));
    this.onError(err);
  };

  onConnected = (): void => {};

  #onConnected = (): void => {
    debug.mqtt('connected');
    this.#client.subscribe({
      subscriptions: Array.from(this.#subscriptions.entries()).map(([topic, qos]) => ({ topicFilter: topic, qos })),
    })
      .then(() => {
        this.#startReadingMessages();
        this.onConnected();
      })
      .catch((err) => this.#onError(err));
  };

  onDisconnected = (): void => {};

  #onDisconnected = (): void => {
    debug.mqtt('disconnected');
    this.onDisconnected();
  };

  #startReadingMessages() {
    if (this.#reading) {
      return;
    }
    this.#reading = true;
    (async () => {
      while (this.#reading) {
        try {
          for await (const message of this.#client.messages()) {
            await this.#handleMessage(message);
          }
        } catch (err) {
          this.#onError(err as any);
        } finally {
          this.#reading = this.#client.connectionState === 'connected';
        }
      }
    })();
  }

  async connect() {
    await this.#client.connect(this.#parameters);
  }

  async disconnect() {
    await this.#client.disconnect();
  }

  async #subscribe(topic: string, qos: 0 | 1 | 2 = 0) {
    if (this.#subscriptions.get(topic) !== qos) {
      this.#subscriptions.set(topic, qos);
      await this.#client.subscribe({ subscriptions: [{ topicFilter: topic, qos }] });
      debug.subs('subscribed to topic %s with qos %s', topic, qos);
    } else {
      debug.subs('already subscribed to topic %s with qos %s', topic, qos);
    }
  }

  async #publish(params: PublishParameters) {
    await this.#client.publish(params);
    debug.send('published to topic %s with qos %s and retain %s', params.topic, params.qos, !!params.retain);
  }

  async enableAutoDiscovery(prefix: string) {
    await this.#subscribe(getAutodiscoveryTopic(prefix));
  }

  async handleDeviceInfo(parsed: WithRaw<DeviceInfoTopic>,  info: DeviceDescription) {

  }

  async publishDeviceInfo(parsed: DeviceInfoTopic, info: DeviceDescription) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(JSON.stringify(info)),
      qos: 2,
      retain: true,
    });
  }

  async handleDeviceState(parsed: WithRaw<DeviceStateTopic>,  state: DEVICE_STATE) {

  }

  async publishDeviceState(parsed: DeviceStateTopic, state: DEVICE_STATE) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(state),
      qos: 2,
      retain: true,
    });
  }

  async handleDeviceAlert(parsed: WithRaw<DeviceAlertTopic>, message: string) {

  }

  async publishDeviceAlert(parsed: DeviceAlertTopic, message: string) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(message),
      qos: 2,
      retain: true,
    });
  }

  async handleDeviceLog(parsed: WithRaw<DeviceLogTopic>, message: string) {

  }

  async publishDeviceLog(parsed: DeviceLogTopic, message: string) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(message),
      qos: 0,
      retain: false,
    });
  }

  async handlePropertyTarget(parsed: WithRaw<PropertyTargetTopic>, target: RawValue) {

  }

  async publishPropertyTarget(parsed: PropertyTargetTopic, value: RawValue) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: 2,
      retain: true,
    });
  }

  async subscribeToPropertyTarget(parsed: PropertyTargetTopic) {
    await this.#subscribe(TOPIC.stringify(parsed), 2);
  }

  async handlePropertyValue(parsed: WithRaw<PropertyValueTopic>, value: RawValue) {

  }

  async publishPropertyValue(parsed: PropertyValueTopic, value: RawValue, retained: boolean = true) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: retained ? 2 : 0,
      retain: retained,
    });
  }

  async subscribeToPropertyValue(parsed: PropertyValueTopic) {
    await this.#subscribe(TOPIC.stringify(parsed), 2);
  }

  async handlePropertySet(parsed: WithRaw<PropertySetTopic>, value: RawValue) {

  }

  async publishPropertySet(parsed: PropertySetTopic, value: RawValue, retained: boolean = true) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: retained ? 2 : 0,
      retain: false,
    });
  }

  async subscribeToPropertySet(parsed: PropertySetTopic) {
    await this.#subscribe(TOPIC.stringify(parsed), 2);
  }

  #handleMessage = async (packet: PublishPacket) => {
    // `packet.id` can be undefined so we internally generate an identifier
    // based on a simple counter which takes a long time before wrapping
    // around and starting from zero once again.
    const packet_id = this.#msg_counter.increment();
    debug.recv('msg %s: new message, topic %s', packet_id, packet.topic);
    const payload = Buffer.from(packet.payload).toString('utf8');
    const parsed_topic = TOPIC.parse(packet.topic);
    if (!parsed_topic){
      debug.recv('msg %s: ignoring message (failed to parse topic)', packet_id);
      return;
    }
    switch (parsed_topic.type) {
      case 'device_state': {
        if (is<DEVICE_STATE>(payload)) {
          const wildcard_topic = getDeviceWildcardTopic(parsed_topic);
          await this.#subscribe(wildcard_topic);
          await this.handleDeviceState(parsed_topic, payload)
            .catch(this.#onError);
        }
      } break;
      case 'device_info': {
        const parsed_payload = JSON.parse(payload);
        if (is<DeviceDescription>(parsed_payload)) {
          await this.handleDeviceInfo(parsed_topic, parsed_payload)
            .catch(this.#onError);
        }
      } break;
      case 'device_log': {
        await this.handleDeviceLog(parsed_topic, payload)
          .catch(this.#onError);
      } break;
      case 'device_alert': {
        await this.handleDeviceAlert(parsed_topic, payload)
          .catch(this.#onError);
      } break;
      case 'property_target': {
        await this.handlePropertyTarget(parsed_topic, payload as RawValue)
          .catch(this.#onError);
      } break;
      case 'property_set': {
        await this.handlePropertySet(parsed_topic, payload as RawValue)
          .catch(this.#onError);
      } break;
      case 'property_value': {
        await this.handlePropertyValue(parsed_topic, payload as RawValue)
          .catch(this.#onError);
      } break;
    }
    debug.recv('msg %s: message handling completed', packet_id);
  };

}
