/**
 * เทสต์ของ utils/userPoint.js
 *
 * กฎของโปรเจค (เอกสารบทที่ 6.3): จุดที่ผู้ใช้บันทึกเองต้องไม่มีทางสับสนกับข้อมูลที่มีแหล่งอ้างอิง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserPoint, USER_POINT_SOURCE } from '../utils/userPoint.js';

const input = {
  name: '  ทางโค้งหน้าบ้าน  ',
  type: 'crash',
  description: ' รถเร็วมาก ',
  coordinate: { lat: 7.0, lng: 100.47 },
};
const fixedNow = new Date('2026-09-11T10:00:00.000Z');

test('จุดที่ผู้ใช้บันทึกต้องเป็น verified: false เสมอ', () => {
  assert.equal(buildUserPoint(input, fixedNow).verified, false);
});

test('source ต้องบอกชัดว่าไม่ใช่สถิติทางการ', () => {
  assert.equal(buildUserPoint(input, fixedNow).source, USER_POINT_SOURCE);
});

test('id ขึ้นต้นด้วย user- และไม่ซ้ำกันเมื่อบันทึกคนละเวลา', () => {
  const a = buildUserPoint(input, fixedNow);
  const b = buildUserPoint(input, new Date(fixedNow.getTime() + 1));
  assert.ok(a.id.startsWith('user-'));
  assert.notEqual(a.id, b.id);
});

test('ตัดช่องว่างหัวท้ายของชื่อและรายละเอียด และไม่มีตัวเลขเหตุการณ์', () => {
  const point = buildUserPoint(input, fixedNow);
  assert.equal(point.name, 'ทางโค้งหน้าบ้าน');
  assert.deepEqual(point.advice, ['รถเร็วมาก']);
  assert.deepEqual(point.incidents, []);
});

test('ไม่ใส่รายละเอียด ต้องได้คำแนะนำว่าง ไม่ใช่ข้อความว่าง', () => {
  const point = buildUserPoint({ ...input, description: '   ' }, fixedNow);
  assert.deepEqual(point.advice, []);
});
