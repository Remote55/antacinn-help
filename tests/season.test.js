/**
 * เทสต์ของ utils/season.js
 *
 * บั๊กที่เทสต์นี้กันไม่ให้กลับมา: หัวข้อบอก "ต้องระวังเป็นพิเศษ" ทุกเดือน
 * แม้เนื้อความจะบอกว่าเดือนนั้นไม่มีจุดใดอยู่ในช่วงเสี่ยง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSeason, THAI_MONTHS } from '../utils/season.js';

const beach = { name: 'หาดชลาทัศน์', peakMonths: [12, 1] };
const road = { name: 'ทางขึ้นเขาคอหงส์', peakMonths: [] };

test('เดือนที่มีจุดอยู่ในช่วงเสี่ยง: หัวข้อต้องบอกให้ระวังเป็นพิเศษ และระบุชื่อจุด', () => {
  const result = summarizeSeason([beach, road], 12);
  assert.equal(result.title, 'ช่วงธันวาคมนี้ต้องระวังเป็นพิเศษ');
  assert.ok(result.body.includes('หาดชลาทัศน์'), result.body);
  assert.equal(result.pointsInPeak.length, 1);
});

test('เดือนที่ไม่มีจุดอยู่ในช่วงเสี่ยง: หัวข้อต้องไม่บอกว่าระวังเป็นพิเศษ', () => {
  const result = summarizeSeason([beach, road], 9);
  assert.ok(!result.title.includes('เป็นพิเศษ'), `หัวข้อ: ${result.title}`);
  assert.ok(result.body.includes('ไม่มีจุดใด'), result.body);
  assert.equal(result.pointsInPeak.length, 0);
});

test('จุดเยอะ แสดงชื่อแค่ 3 จุด ที่เหลือบอกเป็นจำนวน', () => {
  const many = ['ก', 'ข', 'ค', 'ง', 'จ'].map((name) => ({ name, peakMonths: [1] }));
  const result = summarizeSeason(many, 1);
  assert.ok(result.body.includes('ก, ข, ค และอีก 2 จุด'), result.body);
});

test('จุดที่ไม่มีฟิลด์ peakMonths ต้องไม่พัง', () => {
  const result = summarizeSeason([{ name: 'จุดผู้ใช้' }], 5);
  assert.equal(result.pointsInPeak.length, 0);
});

test('ชื่อเดือนครบ 12 เดือน เริ่มที่มกราคม', () => {
  assert.equal(THAI_MONTHS.length, 12);
  assert.equal(THAI_MONTHS[0], 'มกราคม');
  assert.equal(THAI_MONTHS[11], 'ธันวาคม');
});
