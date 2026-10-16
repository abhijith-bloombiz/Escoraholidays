import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([lenBuf, toCrc, crcBuf]);
}

function writeGrayscalePng(width, height, data, filePath) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 0; // grayscale
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc(height * (1 + width));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width)] = 0; // filter None
    for (let x = 0; x < width; x++) {
      scanlines[y * (1 + width) + 1 + x] = data[y * width + x];
    }
  }
  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  const out = Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, out);
  console.log('Saved mask PNG to', filePath, 'size:', out.length);
}

// Read hero-bg.png
const imgPath = path.resolve(import.meta.dirname, '../../attached_assets/escora/hero-bg.png');
const buf = fs.readFileSync(imgPath);
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

let pos = 8;
const chunks = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') chunks.push(buf.subarray(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(chunks));
const stride = 1 + width * 3;
const rgb = Buffer.alloc(width * height * 3);

for (let y = 0; y < height; y++) {
  const filterType = raw[y * stride];
  const srcOffset = y * stride + 1;
  const dstOffset = y * width * 3;
  for (let x = 0; x < width * 3; x++) {
    const rawVal = raw[srcOffset + x];
    let priorA = (x >= 3) ? rgb[dstOffset + x - 3] : 0;
    let priorB = (y > 0) ? rgb[(y - 1) * width * 3 + x] : 0;
    let priorC = (y > 0 && x >= 3) ? rgb[(y - 1) * width * 3 + x - 3] : 0;
    let val = 0;
    if (filterType === 0) val = rawVal;
    else if (filterType === 1) val = (rawVal + priorA) & 0xff;
    else if (filterType === 2) val = (rawVal + priorB) & 0xff;
    else if (filterType === 3) val = (rawVal + Math.floor((priorA + priorB) / 2)) & 0xff;
    else if (filterType === 4) {
      const p = priorA + priorB - priorC;
      const pa = Math.abs(p - priorA);
      const pb = Math.abs(p - priorB);
      const pc = Math.abs(p - priorC);
      let pr = priorA;
      if (pb < pa && pb < pc) pr = priorB;
      else if (pc < pa) pr = priorC;
      val = (rawVal + pr) & 0xff;
    }
    rgb[dstOffset + x] = val;
  }
}

function getPix(x, y) {
  const idx = (y * width + x) * 3;
  return [rgb[idx], rgb[idx+1], rgb[idx+2]];
}

const mask = Buffer.alloc(width * height, 0);

// Lake shoreline approximation across width:
// At x=0: y~462
// At x=width*0.2: y~458
// At x=width*0.5: y~452
// At x=width*0.8: y~458
// At x=width: y~472
function getShorelineY(x) {
  const nx = x / width; // 0 to 1
  // Gentle curve dipping slightly in center where lake recedes into misty distance
  return 452 + 16 * Math.pow(nx - 0.48, 2) * 4 + (nx > 0.6 ? (nx - 0.6) * 20 : 0);
}

// Boat shape in normalized coordinates:
// Tip of boat prow at x = 833, y = 485
// Widens symmetrically: at y=height, half-width is around 580px (from x=253 to x=1413)
function isInsideBoat(x, y) {
  if (y < 482) return false;
  const t = (y - 482) / (height - 482); // 0 at prow tip, 1 at bottom
  // Outward bowed curve of wooden canoe hull
  const halfWidth = Math.pow(t, 0.88) * 585;
  const cx = 833;
  const dist = Math.abs(x - cx);
  return dist < halfWidth;
}

function boatDistance(x, y) {
  if (y < 482) return 999;
  const t = (y - 482) / (height - 482);
  const halfWidth = Math.pow(t, 0.88) * 585;
  const cx = 833;
  return Math.abs(x - cx) - halfWidth; // positive = outside boat, negative = inside boat
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const shoreY = getShorelineY(x);
    if (y < shoreY) {
      // Sky, hills, mountains: 0
      mask[y * width + x] = 0;
      continue;
    }
    
    // Distance from shore (0 at shore, 1 after 15px)
    const shoreDist = Math.min(1, Math.max(0, (y - shoreY) / 12));
    
    // Distance from boat hull (0 inside boat, 1 after 10px outside)
    const bDist = boatDistance(x, y);
    const boatFactor = Math.min(1, Math.max(0, bDist / 12));
    
    const waterVal = Math.round(255 * shoreDist * boatFactor);
    mask[y * width + x] = waterVal;
  }
}

// 2-pass box blur for smooth feathering
const blurred = Buffer.alloc(width * height);
const radius = 3;

// Horizontal pass
for (let y = 0; y < height; y++) {
  let sum = 0;
  for (let k = -radius; k <= radius; k++) {
    const xClamped = Math.min(width - 1, Math.max(0, k));
    sum += mask[y * width + xClamped];
  }
  for (let x = 0; x < width; x++) {
    blurred[y * width + x] = Math.round(sum / (2 * radius + 1));
    const nextX = Math.min(width - 1, x + radius + 1);
    const prevX = Math.max(0, x - radius);
    sum += mask[y * width + nextX] - mask[y * width + prevX];
  }
}

// Vertical pass
const finalMask = Buffer.alloc(width * height);
for (let x = 0; x < width; x++) {
  let sum = 0;
  for (let k = -radius; k <= radius; k++) {
    const yClamped = Math.min(height - 1, Math.max(0, k));
    sum += blurred[yClamped * width + x];
  }
  for (let y = 0; y < height; y++) {
    finalMask[y * width + x] = Math.round(sum / (2 * radius + 1));
    const nextY = Math.min(height - 1, y + radius + 1);
    const prevY = Math.max(0, y - radius);
    sum += blurred[nextY * width + x] - blurred[prevY * width + x];
  }
}

const outputPath = path.resolve('attached_assets/escora/hero-water-mask.png');
writeGrayscalePng(width, height, finalMask, outputPath);
console.log('Successfully generated hero-water-mask.png!');
