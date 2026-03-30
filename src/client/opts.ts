
import { type ConnectParameters } from "@seriousme/opifex/client";
import { type ProtocolLevel } from "@seriousme/opifex/mqttPacket";
import { uid } from "../utils/uid.js";

export type MqttVersion = 3 | '3' | '3.1' | '3.1.1' | 5 | '5' | '5.0';

export interface ClientOpts {
  url: URL;
  version?: MqttVersion;
  client_id?: string;
  username?: string;
  password?: string | Uint8Array;
  keepAlive?: number;
  caCerts?: string[];
  cert?: string;
  key?: string;
  numberOfRetries?: number;
  will?: {
    topic: string;
    payload: string | Uint8Array;
    qos?: 0 | 1 | 2;
    retain?: boolean;
  };
}

export const mqttVersionToProtocolLevel = (version: MqttVersion): ProtocolLevel => {
  switch (version) {
    case 3:
    case '3':
    case '3.1':
      return 3;
    case '3.1.1':
      return 4;
    case 5:
    case '5':
    case '5.0':
      return 5;
    default:
      throw new Error(`Invalid MQTT version: ${version}`);
  }
};

export const clientOptsToConnectParameters = (opts: ClientOpts): ConnectParameters => {
  let will: Exclude<ConnectParameters['options'], undefined>['will'] = undefined;
  if (opts.will) {
    will = {
      topic: opts.will.topic,
      payload: typeof opts.will.payload === 'string' ? Buffer.from(opts.will.payload) : opts.will.payload,
      qos: opts.will.qos,
      retain: opts.will.retain,
    };
  }
  return {
    url: opts.url,
    caCerts: opts.caCerts,
    cert: opts.cert,
    key: opts.key,
    numberOfRetries: opts.numberOfRetries,
    options: {
      protocolLevel: opts.version ? mqttVersionToProtocolLevel(opts.version) : 3,
      clientId: opts.client_id ?? `homie-${uid()}`,
      username: opts.username,
      password: typeof opts.password === 'string' ? Buffer.from(opts.password) : opts.password,
      keepAlive: opts.keepAlive ?? 15_000,
      will,
    },
  };
};
