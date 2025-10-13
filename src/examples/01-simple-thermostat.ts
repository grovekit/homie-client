
import { HomieRootDevice } from "../device/root.js";

(async () => {

  const info = {
    name: 'My Thermostat',
    type: 'thermostat',
    version: 1,
  };

  const opts = {
    url: 'mqtt://localhost:1884',
  };

  const device = new HomieRootDevice('thermostat-17', info, opts);

  const node = device.addNode('main', { name: 'Main Node', type: 'Generic Node' });

  const temperature = node.addFloatProperty('temp', {
    name: 'Temperature',
    unit: '°C',
    settable: true,
    retained: true,
  }, 20);

  temperature.handleSet = async (value) => {

    // Instead of directly setting the value,
    await temperature.setTarget(value);
    const delta = value - temperature.value;

    // We simulate an incremental temperature change over 5 seconds, ending
    // with clearing the property's target value the latter has been reached.
    // The simulation is postponed via the runtime's microtask queue to avoid
    // blocking the MQTT client.
    queueMicrotask(async () => {
      for (let i = 0; i < 5; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await temperature.setValue(temperature.value + (delta / 5));
      }
      await temperature.clearTarget();
    });

    // Returning `undefined` prevents the property's value from being updated
    // immediately.
    return undefined;
  };

  await device.ready();


})().catch((err) => {
  console.error(err);
  process.exit(1);
})
