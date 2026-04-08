# `@grovekit/homie-client`

A library for publishing and interacting with devices implementing
the [Homie v5 MQTT convention][homie-spec]. Part of [GroveKit].

## Table of Contents

- [Status](#status)
- [Installation](#installation)
- [Overview](#overview)
  - [Architecture](#architecture)
  - [Property types](#property-types)
- [Publishing Devices](#publishing-devices)
  - [Creating a device](#creating-a-device)
  - [Adding nodes and properties](#adding-nodes-and-properties)
  - [Handling commands](#handling-commands)
  - [Publishing values](#publishing-values)
  - [Child devices](#child-devices)
  - [Alerts and logging](#alerts-and-logging)
  - [Going online](#going-online)
- [Consuming Devices](#consuming-devices)
  - [Creating a client](#creating-a-client)
  - [Enabling auto-discovery](#enabling-auto-discovery)
  - [Handling device events](#handling-device-events)
  - [Sending commands to devices](#sending-commands-to-devices)
  - [Client lifecycle callbacks](#client-lifecycle-callbacks)
- [Examples](#examples)
- [Debugging](#debugging)
- [Author](#author)
- [License](#license)

## Status

Currently in development, pre-alpha state.

## Installation

```sh
npm install @grovekit/homie-client
```

## Overview

`@grovekit/homie-client` provides a TypeScript API for creating and managing
[Homie v5][homie-spec]-compliant MQTT devices. It handles the full device
lifecycle — connection, discovery, description publishing, property
advertisement, and command handling — so that you can focus on your device's
application logic.

The library supports two primary use cases:

- **Publishing devices** — Creating Homie-compliant devices that expose
  properties and respond to commands from controllers.
- **Consuming devices** — Building controllers or dashboards that discover
  devices, monitor their state, and send commands.

### Architecture

The library is organized around four main concepts, mirroring the Homie
convention's topology:

- **`RootDevice`** — the top-level device that owns the MQTT connection.
  Every device tree has exactly one root device. It manages the connection
  lifecycle, the MQTT last will (LWT), and coordinates publishing for itself
  and all of its children.

- **`Device`** — a logical or physical device in the Homie topology. Devices
  can be organized into parent–child hierarchies (e.g. a bridge device
  exposing several child devices). Non-root devices are created via
  `device.addChild()`.

- **`Node`** — an independent or logically separable part of a device. For
  example, a thermostat device might have a `sensors` node and a `controls`
  node. Nodes are created via `device.addNode()`.

- **`Property`** — a typed value exposed by a node, such as a temperature
  reading or a power switch state. Properties can be **retained** or
  **non-retained** (for momentary events), and **settable** or
  **read-only**. Each property type maps to a Homie datatype.

For consuming devices, there is also:

- **`Client`** — a low-level MQTT client for discovering and interacting with
  Homie devices. It handles auto-discovery, topic parsing, and provides hooks
  for reacting to device state changes, property updates, alerts, and logs.

## Publishing Devices

### Creating a device

The entry point is `HomieRootDevice`. You provide a device ID, device metadata,
and MQTT connection options:

```ts
import { RootDevice } from '@grovekit/homie-client';

const device = new RootDevice(
  'thermostat-17',                        // unique device ID
  { name: 'My Thermostat', type: 'thermostat', version: 1 },
  { url: 'mqtt://localhost:1883' },       // MQTT broker URL
);
```

### Adding nodes and properties

Nodes group related properties. Properties are added to nodes with a typed
`add*Property()` method:

```ts
const node = device.addNode('main', {
  name: 'Main Sensor',
  type: 'sensor',
});

const temperature = node.addFloatProperty(
  'temperature',
  { name: 'Temperature', unit: '°C', settable: false, retained: true },
  21.5,                                   // initial value
  { min: -20, max: 120, step: 0.1 },     // optional format constraints
);

const power = node.addBooleanProperty(
  'power',
  { name: 'Power', settable: true, retained: true },
  false,
);
```

Available methods on `Node`:

- `addIntegerProperty(id, info, value, format?)`
- `addFloatProperty(id, info, value, format?)`
- `addBooleanProperty(id, info, value)`
- `addStringProperty(id, info, value)`
- `addEnumProperty(id, info, format, value)`
- `addDatetimeProperty(id, info, value)`

### Handling commands

For settable properties, override `handleSet` to react to incoming commands
from controllers. Return the value to accept it, or `undefined` to reject it:

```ts
power.handleSet = async (value) => {
  // Apply the value to your hardware, then return it to accept.
  await cycleRelay(value);
  return value;
};
```

For properties where the state change is not instantaneous (e.g. dimming a
light), you can use the target mechanism:

```ts
temperature.handleSet = async (value) => {
  await temperature.setTarget(value);

  // Simulate a gradual change.
  queueMicrotask(async () => {
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      await temperature.setValue(temperature.value + (value - temperature.value) / (5 - i));
    }
    await temperature.clearTarget();
  });

  // Return undefined to prevent immediate value update.
  return undefined;
};
```

### Publishing values

To update a property's value programmatically (e.g. from a sensor reading):

```ts
await temperature.setValue(23.1);
```

### Child devices

Devices can be organized in parent–child hierarchies. This is useful for
bridge devices that expose multiple sub-devices:

```ts
const child = device.addChild('sensor-01', {
  name: 'Living Room Sensor',
  type: 'temperature-sensor',
  version: 1,
});

const childNode = child.addNode('main', {
  name: 'Readings',
  type: 'sensor',
});

childNode.addFloatProperty('temperature', {
  name: 'Temperature',
  unit: '°C',
  settable: false,
  retained: true,
}, 20.0);
```

Child devices automatically include the `root` and `parent` fields in their
Homie description documents, as required by the spec.

### Alerts and logging

Devices can raise user-facing alerts and publish log messages:

```ts
await device.publishAlert('battery', 'Battery is low, at 8%');
await device.clearAlert('battery');

await device.log('warn', 'Sensor value is near limit');
```

Log levels follow the Homie spec: `debug`, `info`, `warn`, `error`, `fatal`.

### Going online

Once your device tree is fully configured, call `ready()` to connect to the
broker and begin advertising:

```ts
await device.ready();
```

This will:

1. Connect to the MQTT broker (with the LWT set to `$state = lost`).
2. Initialize all nodes and properties (subscribe to `/set` topics for
   settable properties).
3. Publish the description document, all property values, and finally
   `$state = ready` for each device in the tree.

## Consuming Devices

The `Client` class provides a low-level interface for building Homie
controllers, dashboards, or any application that needs to discover and
interact with Homie devices on the network.

### Creating a client

Create a `Client` instance with MQTT connection options:

```ts
import { Client, ClientOpts } from '@grovekit/homie-client';

const opts: ClientOpts = {
  url: new URL('mqtt://localhost:1883'),
  client_id: 'my-controller',           // optional, auto-generated if omitted
  username: 'user',                     // optional
  password: 'pass',                     // optional
  version: 5,                           // MQTT version: 3 or 5
  keepAlive: 15_000,                    // optional, in milliseconds
};

const client = new Client(opts);
```

### Enabling auto-discovery

To discover devices on the network, enable auto-discovery for one or more
Homie topic prefixes. The Homie convention uses `homie` as the default prefix:

```ts
await client.connect();
await client.enableAutoDiscovery('homie');

// Or discover devices under multiple prefixes:
await client.enableAutoDiscovery(['homie', 'my-prefix']);
```

When auto-discovery is enabled, the client subscribes to the appropriate
wildcard topics and automatically subscribes to all topics under a device's
subtree when it detects a device's `$state` message.

### Handling device events

The `Client` class uses overridable handler methods to react to incoming
messages. Override these methods to implement your application logic:

#### Device state changes

Called when a device's `$state` changes (e.g., `init`, `ready`, `lost`,
`sleeping`, `alert`):

```ts
client.handleDeviceState = async (topic, state) => {
  console.log(`Device ${topic.device} is now ${state}`);
  // topic.prefix - the Homie prefix (e.g., 'homie')
  // topic.device - the device ID
  // topic.raw    - the raw topic string
};
```

#### Device description

Called when a device publishes its description document (the `$description`
topic containing device metadata, nodes, and properties):

```ts
client.handleDeviceInfo = async (topic, info) => {
  console.log(`Discovered device: ${info.name}`);
  console.log(`  Type: ${info.type}`);
  console.log(`  Nodes: ${Object.keys(info.nodes ?? {}).join(', ')}`);
  // info contains the full DeviceDescription object
};
```

#### Property values

Called when a property value is published:

```ts
client.handlePropertyValue = async (topic, value) => {
  console.log(`${topic.device}/${topic.node}/${topic.property} = ${value}`);
  // topic.prefix   - the Homie prefix
  // topic.device   - the device ID
  // topic.node     - the node ID
  // topic.property - the property ID
  // value          - the raw string value
};
```

#### Property targets

Called when a property's target value changes (for properties that support
gradual transitions):

```ts
client.handlePropertyTarget = async (topic, target) => {
  console.log(`${topic.property} target set to ${target}`);
};
```

#### Property set commands

Called when a `/set` command is published (useful for monitoring or proxying):

```ts
client.handlePropertySet = async (topic, value) => {
  console.log(`Set command: ${topic.property} -> ${value}`);
};
```

#### Device alerts

Called when a device publishes an alert:

```ts
client.handleDeviceAlert = async (topic, message) => {
  console.log(`Alert from ${topic.device} [${topic.alert}]: ${message}`);
};
```

#### Device logs

Called when a device publishes a log message:

```ts
client.handleDeviceLog = async (topic, message) => {
  console.log(`Log from ${topic.device} [${topic.level}]: ${message}`);
  // topic.level - the log level (debug, info, warn, error, fatal)
};
```

### Sending commands to devices

To control a device, publish to its property's `/set` topic:

```ts
// Send a command to set a property value
await client.publishPropertySet(
  { prefix: 'homie', device: 'thermostat-17', node: 'main', property: 'temp' },
  '25.0'
);
```

### Client lifecycle callbacks

The client provides callbacks for connection lifecycle events:

```ts
// Called when the client connects to the broker
client.onConnected = () => {
  console.log('Connected to MQTT broker');
};

// Called when the client disconnects
client.onDisconnected = () => {
  console.log('Disconnected from MQTT broker');
};

// Called on errors (default: logs and exits)
client.onError = (err) => {
  console.error('MQTT error:', err);
  // Handle error appropriately for your application
};
```

### Complete consumer example

```ts
import { Client } from '@grovekit/homie-client';

const client = new Client({
  url: new URL('mqtt://localhost:1883'),
});

// Track discovered devices
const devices = new Map();

client.handleDeviceState = async (topic, state) => {
  if (state === 'ready') {
    console.log(`Device ${topic.device} is online`);
  } else if (state === 'lost') {
    console.log(`Device ${topic.device} went offline`);
    devices.delete(topic.device);
  }
};

client.handleDeviceInfo = async (topic, info) => {
  devices.set(topic.device, info);
  console.log(`Discovered: ${info.name} (${info.type})`);
};

client.handlePropertyValue = async (topic, value) => {
  console.log(`${topic.device}/${topic.node}/${topic.property} = ${value}`);
};

client.onConnected = async () => {
  console.log('Connected! Discovering devices...');
};

// Start the client
await client.connect();
await client.enableAutoDiscovery('homie');
```

## Examples

See the [examples directory](./src/examples) for runnable examples:

- **[01-simple-thermostat.ts](./src/examples/01-simple-thermostat.ts)** —
  a minimal thermostat device with a settable temperature property that
  simulates gradual state changes using the `$target` mechanism.

## Debugging

This library uses the [`debug`](https://www.npmjs.com/package/debug) module
for logging. Enable debug output with the `DEBUG` environment variable:

```sh
# All homie-client debug output
DEBUG=gk:homie:client* node your-app.js
```

## Author

Jacopo Scazzosi ([@jacoscaz])

## License

MIT. See [LICENSE](./LICENSE) file.

[GroveKit]: https://github.com/grovekit
[@jacoscaz]: https://github.com/jacoscaz
[homie-spec]: https://homieiot.github.io/specification/
