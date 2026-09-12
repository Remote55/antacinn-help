/**
 * ตรวจว่าทุกค่าในธีมที่โค้ดเรียกใช้ มีอยู่จริงใน constants/theme.js
 *
 * ทำไมต้องมี: พิมพ์ชื่อสีผิด เช่น COLORS.textMutd จะได้ undefined แล้ว React Native ใช้ค่าตั้งต้นแทน
 * (ตัวอักษรกลายเป็นสีดำ พื้นกลายเป็นโปร่งใส) โดยไม่มี error ให้เห็นเลย
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as theme from '../constants/theme.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIRS = ['components', 'screens', 'navigation', 'hooks'];
const TOKEN_GROUPS = ['COLORS', 'TEXT', 'FONTS', 'SPACING', 'RADIUS', 'SHADOWS', 'LAYOUT'];

function sourceFiles() {
  const files = [path.join(ROOT, 'App.js')];
  for (const dir of SOURCE_DIRS) {
    for (const name of fs.readdirSync(path.join(ROOT, dir))) {
      if (name.endsWith('.js')) files.push(path.join(ROOT, dir, name));
    }
  }
  return files;
}

test('ทุกค่าธีมที่ถูกเรียกใช้ (COLORS.xxx, TEXT.xxx, ...) มีอยู่จริง', () => {
  const missing = [];
  for (const file of sourceFiles()) {
    const source = fs.readFileSync(file, 'utf8');
    for (const group of TOKEN_GROUPS) {
      for (const match of source.matchAll(new RegExp(`\\b${group}\\.([A-Za-z0-9_]+)`, 'g'))) {
        const tokens = theme[group];
        if (!tokens || !(match[1] in tokens)) {
          missing.push(`${path.relative(ROOT, file)}: ${group}.${match[1]}`);
        }
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('ทุกแบบตัวอักษรใน TEXT ใช้ฟอนต์ที่ประกาศไว้ใน FONTS (ฟอนต์ที่ไม่ได้โหลดจะกลายเป็นฟอนต์ระบบ)', () => {
  const loadedFonts = new Set(Object.values(theme.FONTS));
  for (const [name, style] of Object.entries(theme.TEXT)) {
    assert.ok(loadedFonts.has(style.fontFamily), `TEXT.${name} ใช้ฟอนต์ ${style.fontFamily}`);
    assert.ok(style.lineHeight >= style.fontSize * 1.25, `TEXT.${name} ระยะบรรทัดชิดเกินไปสำหรับสระและวรรณยุกต์ไทย`);
  }
});
