
import Debug from 'debug';

import {
  TOPIC,
  RawValue,
  DeviceDescription,
  LOG_LEVEL,
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
import { HomieClientOpts } from './config.js';
import { Counter } from './utils.js';

const debug = Debug('gk:homie:client');
const subs_debug = Debug('gk:homie:client:subs');
const recv_debug = Debug('gk:homie:client:recv');
const send_debug = Debug('gk:homie:client:send');

type OpifexTopicFilter = SubscribeParameters['subscriptions'][number]['topicFilter'];
type OpifexTopicQoS = SubscribeParameters['subscriptions'][number]['qos'];

export class HomieClient {

  #opts: ConnectParameters;
  #client: TcpClient;
  #reading: boolean;
  #msg_counter: Counter;
  #subscriptions: Map<OpifexTopicFilter, OpifexTopicQoS>;

  onError: (err: Error) => void;
  onConnected: () => void;
  onDisconnected: () => void;

  constructor(opts: HomieClientOpts) {
    this.#opts = { ...opts, url: new URL(opts.url) };
    this.#client = new TcpClient();
    this.#reading = false;
    this.#msg_counter = new Counter();
    this.#subscriptions = new Map();
    this.onError = () => { };
    this.onConnected = () => { };
    this.onDisconnected = () => { };

    this.#client.onConnected = () => {
      debug('connected');
      this.#client.subscribe({
        subscriptions: Array.from(this.#subscriptions.entries()).map(([topic, qos]) => ({ topicFilter: topic, qos })),
      }).catch(this.onError);
      queueMicrotask(this.onConnected);
    };

    this.#client.onDisconnected = () => {
      debug('disconnected');
      queueMicrotask(this.onDisconnected);
    };
  }

  async #startReadingMessages() {
    if (!this.#reading) {
      this.#reading = true;
      while (this.#reading) {
        try {
          for await (const message of this.#client.messages()) {
            await this.#handleMessage(message);
          }
        } catch (err) {
          this.onError(err as any);
        } finally {
          this.#reading = this.#client.connectionState === 'connected';
        }
      }
    }
  }

  async connect() {
    await this.#client.connect(this.#opts);
    this.#startReadingMessages();
  }

  async disconnect() {
    await this.#client.disconnect();
  }

  async #subscribe(topic: string, qos: 0 | 1 | 2 = 0) {
    if (this.#subscriptions.get(topic) !== qos) {
      this.#subscriptions.set(topic, qos);
      await this.#client.subscribe({ subscriptions: [{ topicFilter: topic, qos }] });
      subs_debug('subscribed to topic %s with qos %s', topic, qos);
    } else {
      subs_debug('already subscribed to topic %s with qos %s', topic, qos);
    }
  }

  async #publish(params: PublishParameters) {
    await this.#client.publish(params);
    send_debug('published to topic %s with qos %s', params.topic, params.qos);
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
      qos: 0,
      retain: false,
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

  async publishPropertyValue(parsed: PropertyValueTopic, value: RawValue) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: 2,
      retain: true,
    });
  }

  async subscribeToPropertyValue(parsed: PropertyValueTopic) {
    await this.#subscribe(TOPIC.stringify(parsed), 2);
  }

  async handlePropertySet(parsed: WithRaw<PropertySetTopic>, value: RawValue) {

  }

  async publishPropertySet(parsed: PropertySetTopic, value: RawValue) {
    await this.#publish({
      topic: TOPIC.stringify(parsed),
      payload: Buffer.from(value),
      qos: 0,
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
    recv_debug('msg %s: new message, topic %s', packet_id, packet.topic);
    const payload = Buffer.from(packet.payload).toString('utf8');
    const parsed_topic = TOPIC.parse(packet.topic);
    if (!parsed_topic){
      recv_debug('msg %s: ignoring message (failed to parse topic)', packet_id);
      return;
    }
    switch (parsed_topic.type) {
      case 'device_state': {
        if (is<DEVICE_STATE>(payload)) {
          const wildcard_topic = getDeviceWildcardTopic(parsed_topic);
          await this.#subscribe(wildcard_topic);
          await this.handleDeviceState(parsed_topic, payload)
            .catch(this.onError);
        }
      } break;
      case 'device_info': {
        const parsed_payload = JSON.parse(payload);
        if (is<DeviceDescription>(parsed_payload)) {
          await this.handleDeviceInfo(parsed_topic, parsed_payload)
            .catch(this.onError);
        }
      } break;
      case 'device_log': {
        await this.handleDeviceLog(parsed_topic, payload)
          .catch(this.onError);
      } break;
      case 'device_alert': {
        await this.handleDeviceAlert(parsed_topic, payload)
          .catch(this.onError);
      } break;
      case 'property_target': {
        await this.handlePropertyTarget(parsed_topic, payload as RawValue)
          .catch(this.onError);
      } break;
      case 'property_set': {
        await this.handlePropertySet(parsed_topic, payload as RawValue)
          .catch(this.onError);
      } break;
      case 'property_value': {
        await this.handlePropertyValue(parsed_topic, payload as RawValue)
          .catch(this.onError);
      } break;
    }
    recv_debug('msg %s: message handling completed', packet_id);
  };

}
