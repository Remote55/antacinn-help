/**
 * สร้างไอคอนของเว็บแอป (PWA) ลงใน public/icons
 *
 * วิธีใช้: npm run icons   (รันใหม่เมื่อเปลี่ยนสีหรือรูปไอคอน แล้ว commit ไฟล์ PNG ที่ได้)
 *
 * รูป: สามเหลี่ยมเตือนสีเหลืองมีเครื่องหมายตกใจ บนพื้นสีกรมท่า (สีเดียวกับระดับ "เฝ้าระวัง" และสีหลักของแอป)
 * วาดด้วยสูตรระยะทางถึงขอบรูปทรง (signed distance) แล้วสุ่มจุดย่อย 4×4 ต่อพิกเซลให้ขอบเรียบ
 * เข้ารหัส PNG เองด้วย zlib ของ Node ไม่ต้องติดตั้งไลบรารีรูปภาพเพิ่ม
 *
 * ไฟล์ที่ได้:
 *   icon-192.png, icon-512.png   ไอคอนทั่วไป มุมโค้งโปร่งใส
 *   icon-maskable-512.png        พื้นเต็มกรอบ รูปอยู่ในวงกลมกลางภาพ (Android ตัดขอบเป็นรูปทรงของตัวเอง)
 *   apple-touch-icon.png         180×180 พื้นเต็มกรอบ (iOS ทำมุมโค้งเอง ถ้าโปร่งใสจะกลายเป็นสีดำ)
 *   favicon-48.png               ไอคอนบนแท็บเบราว์เซอร์
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(ROOT, 'public', 'icons');

/** ต้องตรงกับ COLORS.primary และสีระดับ "เฝ้าระวัง" ใน constants */
const NAVY = [0x1b, 0x3a, 0x5c];
const YELLOW = [0xfb, 0xc0, 0x2d];
const SAMPLES_PER_AXIS = 4;

// ---------- รูปทรง (พิกัด 0-1 ทั้งภาพ ค่าติดลบ = อยู่ในรูปทรง) ----------

const dot = (ax, ay, bx, by) => ax * bx + ay * by;
const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** สี่เหลี่ยมมุมโค้ง จุดกึ่งกลาง (0.5, 0.5) */
function roundedSquare(x, y, halfSize, radius) {
  const qx = Math.abs(x - 0.5) - halfSize + radius;
  const qy = Math.abs(y - 0.5) - halfSize + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

/** สามเหลี่ยม (สูตรของ Inigo Quilez) */
function triangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const edges = [
    [ax, ay, bx - ax, by - ay],
    [bx, by, cx - bx, cy - by],
    [cx, cy, ax - cx, ay - cy],
  ];
  const orientation = Math.sign((bx - ax) * (ay - cy) - (by - ay) * (ax - cx));
  let nearest = Infinity;
  let inside = Infinity;
  for (const [ox, oy, ex, ey] of edges) {
    const vx = px - ox;
    const vy = py - oy;
    const t = clamp01(dot(vx, vy, ex, ey) / dot(ex, ey, ex, ey));
    const dx = vx - ex * t;
    const dy = vy - ey * t;
    nearest = Math.min(nearest, dx * dx + dy * dy);
    inside = Math.min(inside, orientation * (vx * ey - vy * ex));
  }
  return -Math.sqrt(nearest) * Math.sign(inside);
}

/** เส้นหัวมน จาก (x, y1) ถึง (x, y2) */
function capsule(px, py, x, y1, y2, radius) {
  const t = clamp01((py - y1) / (y2 - y1));
  return Math.hypot(px - x, py - (y1 + (y2 - y1) * t)) - radius;
}

/**
 * สีของจุดหนึ่งในภาพ คืน [r, g, b, a] หรือ null ถ้าโปร่งใส
 * @param fullBleed true = พื้นเต็มกรอบและย่อรูปให้อยู่ในวงกลมกลางภาพ (maskable / iOS)
 */
function sampleColor(x, y, fullBleed) {
  if (!fullBleed && roundedSquare(x, y, 0.5, 0.2) > 0) return null;

  // ย่อรูปรอบจุดกลางภาพ ให้สามเหลี่ยมอยู่ในวงกลมรัศมี 0.4 ที่ Android รับประกันว่าไม่ถูกตัด
  const scale = fullBleed ? 0.78 : 1;
  const u = 0.5 + (x - 0.5) / scale;
  const v = 0.5 + (y - 0.5) / scale;

  const insideTriangle = triangle(u, v, [0.5, 0.25], [0.2, 0.76], [0.8, 0.76]) - 0.06 <= 0;
  if (!insideTriangle) return NAVY;

  const insideMark = capsule(u, v, 0.5, 0.4, 0.56, 0.04) <= 0 || Math.hypot(u - 0.5, v - 0.685) - 0.045 <= 0;
  return insideMark ? NAVY : YELLOW;
}

/** วาดภาพขนาด size×size คืน RGBA แบบไม่คูณ alpha */
function render(size, fullBleed) {
  const pixels = Buffer.alloc(size * size * 4);
  const total = SAMPLES_PER_AXIS * SAMPLES_PER_AXIS;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let covered = 0;
      for (let sy = 0; sy < SAMPLES_PER_AXIS; sy++) {
        for (let sx = 0; sx < SAMPLES_PER_AXIS; sx++) {
          const color = sampleColor(
            (px + (sx + 0.5) / SAMPLES_PER_AXIS) / size,
            (py + (sy + 0.5) / SAMPLES_PER_AXIS) / size,
            fullBleed
          );
          if (!color) continue;
          r += color[0];
          g += color[1];
          b += color[2];
          covered++;
        }
      }
      const offset = (py * size + px) * 4;
      if (covered > 0) {
        pixels[offset] = Math.round(r / covered);
        pixels[offset + 1] = Math.round(g / covered);
        pixels[offset + 2] = Math.round(b / covered);
        pixels[offset + 3] = Math.round((covered / total) * 255);
      }
    }
  }
  return pixels;
}

// ---------- เข้ารหัส PNG (https://www.w3.org/TR/png/) ----------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 บิตต่อช่องสี
  header[9] = 6; // RGBA

  // ทุกแถวขึ้นต้นด้วยไบต์ตัวกรอง 0 (ไม่กรอง)
  const rowLength = size * 4;
  const raw = Buffer.alloc((rowLength + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (rowLength + 1) + 1, y * rowLength, (y + 1) * rowLength);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ICONS = [
  { file: 'icon-192.png', size: 192, fullBleed: false },
  { file: 'icon-512.png', size: 512, fullBleed: false },
  { file: 'icon-maskable-512.png', size: 512, fullBleed: true },
  { file: 'apple-touch-icon.png', size: 180, fullBleed: true },
  { file: 'favicon-48.png', size: 48, fullBleed: false },
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const { file, size, fullBleed } of ICONS) {
  const png = encodePng(size, render(size, fullBleed));
  fs.writeFileSync(path.join(OUTPUT_DIR, file), png);
  console.log(`✓ public/icons/${file} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
