/**
 * สร้าง dist/sw.js (service worker ที่ทำให้เว็บแอปเปิดได้ตอนออฟไลน์) หลัง build เว็บ
 *
 * วิธีใช้: npm run build:web   (= expo export --platform web แล้วตามด้วยสคริปต์นี้)
 *
 * ทำสองอย่าง:
 *   1. ไล่ดูไฟล์ทุกไฟล์ใน dist แล้วเขียนเป็นรายการให้ service worker โหลดเก็บตอนติดตั้ง
 *   2. คำนวณเวอร์ชันจากเนื้อหาไฟล์ทั้งหมด แก้โค้ดเมื่อไร sw.js จะเปลี่ยน เบราว์เซอร์จึงรู้ว่ามีเวอร์ชันใหม่
 *      ถ้าไม่เปลี่ยนอะไรเลย เวอร์ชันเท่าเดิม ผู้ใช้ไม่ต้องโหลดใหม่
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TEMPLATE = path.join(ROOT, 'scripts', 'sw-template.js');

/** ไฟล์ที่ไม่ต้องเก็บ: ตัว service worker เอง และข้อมูลการ build ของ Expo */
const SKIP = new Set(['sw.js', 'metadata.json']);

function listFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out);
    else out.push(path.relative(DIST, full).split(path.sep).join('/'));
  }
  return out;
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('ไม่พบ dist/index.html ให้ build เว็บก่อน: npx expo export --platform web');
  process.exit(1);
}

const files = listFiles(DIST)
  .filter((file) => !SKIP.has(file) && !file.endsWith('.map'))
  .sort();

const hash = crypto.createHash('sha256');
let totalBytes = 0;
for (const file of files) {
  const contents = fs.readFileSync(path.join(DIST, file));
  totalBytes += contents.length;
  hash.update(file).update('\0').update(contents);
}
const version = hash.digest('hex').slice(0, 12);

// หน้าเว็บเก็บในชื่อ './' เพราะผู้ใช้เปิดที่ /antacinn-help/ ไม่ใช่ /antacinn-help/index.html
const appFiles = files.map((file) => (file === 'index.html' ? './' : file));

const template = fs.readFileSync(TEMPLATE, 'utf8');
const serviceWorker = template
  .replace("'__VERSION__'", JSON.stringify(version))
  .replace('__APP_FILES__', JSON.stringify(appFiles, null, 2));

fs.writeFileSync(path.join(DIST, 'sw.js'), serviceWorker);
console.log(
  `✓ dist/sw.js เวอร์ชัน ${version} · เก็บ ${appFiles.length} ไฟล์ (${(totalBytes / 1024 / 1024).toFixed(2)} MB) ไว้ใช้ออฟไลน์`
);
