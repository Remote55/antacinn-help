/**
 * เทสต์ของ utils/layout.js
 *
 * โจทย์: บนคอมพิวเตอร์ต้องใช้พื้นที่เต็มจอแบบเว็บ บนมือถือเป็นแบบแอป
 * และการ์ดในหน้าแรกต้องเรียงเป็นตารางตามความกว้างจอ ไม่ใช่เรียงลงมาทีละใบ
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isWideLayout, pagePadding, contentWidth, gridColumns, gridItemWidth } from '../utils/layout.js';

test('จอกว้างตั้งแต่ 900 px ใช้หน้าตาแบบเว็บ ต่ำกว่านั้นแบบมือถือ', () => {
  assert.equal(isWideLayout(899), false);
  assert.equal(isWideLayout(900), true);
  assert.equal(isWideLayout(1440), true);
});

test('ขอบซ้ายขวาของเนื้อหา: มือถือ 16 px คอมพิวเตอร์ 32 px', () => {
  assert.equal(pagePadding(390), 16);
  assert.equal(pagePadding(1440), 32);
});

test('ความกว้างเนื้อหาไม่เกิน 1200 px แม้จอกว้างกว่า (อ่านง่าย ไม่ยืดสุดขอบจอใหญ่)', () => {
  assert.equal(contentWidth(1440), 1200 - 64);
  assert.equal(contentWidth(1000), 1000 - 64);
  assert.equal(contentWidth(390), 390 - 32);
});

test('จำนวนคอลัมน์: ใส่ได้เท่าที่การ์ดยังกว้างอย่างน้อยตามที่กำหนด แต่ไม่เกินสูงสุด', () => {
  assert.equal(gridColumns(1136, 260, 4), 4);
  assert.equal(gridColumns(700, 260, 4), 2);
  assert.equal(gridColumns(358, 260, 4), 1);
  assert.equal(gridColumns(1136, 260, 3), 3);
});

test('จอแคบกว่าการ์ดหนึ่งใบก็ยังได้ 1 คอลัมน์ ไม่ใช่ 0', () => {
  assert.equal(gridColumns(200, 260, 4), 1);
});

test('ความกว้างการ์ดหักช่องว่างระหว่างคอลัมน์แล้ว เรียงเต็มแถวพอดี', () => {
  assert.equal(gridItemWidth(1136, 4, 16), 272);
  assert.equal(gridItemWidth(358, 1, 16), 358);
});
