
let IDX = 256;
let BUF: string = '';

const HEX: string[] = [];
const SIZE = 256;

while (IDX--) HEX[IDX] = (IDX + 256).toString(16).substring(1);

export const uid = (len?: number): string => {
  var i = 0, tmp = (len || 11);
  if (!BUF || ((IDX + tmp) > SIZE * 2)) {
    for (BUF = '', IDX = 0; i < SIZE; i++) {
      BUF += HEX[Math.random() * 256 | 0];
    }
  }
  return BUF.substring(IDX, IDX++ + tmp);
};
