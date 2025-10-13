
import { HomieRootDevice } from "./device/root.js";

const device = new HomieRootDevice("my-device"
  , {
    name: 'My Device',
    version: 0,
    type: 'test',
  },
  {
    url: 'mqtt://127.0.0.1:1884',
  },
);

const node = device.addNode('my-node', { name: 'My Node', type: 'test' });

node.addBooleanProperty('bool', { retained: true, name: 'BOOL', settable: true }, false);
node.addEnumProperty('enum', { retained: true, name: 'BOOL', settable: true }, ['one', 'two'], 'one');

device.ready();
