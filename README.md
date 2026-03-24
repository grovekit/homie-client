# `@grovekit/homie-client`

A library for publishing and interacting with devices implementing
the [Homie v5 MQTT convention][homie-spec]. Part of [GroveKit].

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

### Architecture

The library is organized around four main concepts, mirroring the Homie
convention's topology:

- **`HomieRootDevice`** — the top-level device that owns the MQTT connection.
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

### Property types

| Class               | Homie datatype | TypeScript type |
|---------------------|----------------|-----------------|
| `IntegerProperty`   | `integer`      | `number`        |
| `FloatProperty`     | `float`        | `number`        |
| `BooleanProperty`   | `boolean`      | `boolean`       |
| `StringProperty`    | `string`       | `string`        |
| `EnumProperty`      | `enum`         | `string`        |
| `DatetimeProperty`  | `datetime`     | `Date`          |

Color, duration, and JSON property types are not yet implemented.

## Usage

### Creating a device

The entry point is `HomieRootDevice`. You provide a device ID, device metadata,
and MQTT connection options:

```ts
import { HomieRootDevice } from '@grovekit/homie-client';

const device = new HomieRootDevice(
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

# Only sent messages
DEBUG=gk:homie:client:send node your-app.js

# Only received messages
DEBUG=gk:homie:client:recv node your-app.js

# Subscription activity
DEBUG=gk:homie:client:subs node your-app.js
```

## Author

Jacopo Scazzosi ([@jacoscaz])

## License

MIT. See [LICENSE](./LICENSE) file.

[GroveKit]: https://github.com/grovekit
[@jacoscaz]: https://github.com/jacoscaz
[homie-spec]: https://homieiot.github.io/specification/
