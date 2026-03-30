
import Debug from 'debug';

const prefix = 'gk:homie';

export const mqtt = Debug(`${prefix}:client`);
export const subs = Debug(`${prefix}:client:subs`);
export const recv = Debug(`${prefix}:client:recv`);
export const send = Debug(`${prefix}:client:send`);
