/**
 * เทสต์ของ utils/userPoint.js
 *
 * กฎของโปรเจค (เอกสารบทที่ 6.3): จุดที่ผู้ใช้บันทึกเองต้องไม่มีทางสับสนกับข้อมูลที่มีแหล่งอ้างอิง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserPoint, sanitizeSavedPoints, USER_POINT_SOURCE } from '../utils/userPoint.js';

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

// ข้อมูลในเครื่องเสียได้ (แอปเวอร์ชันเก่า เขียนไม่ครบตอนแอปถูกปิด หรือถูกแก้จากภายนอก)
// ถ้าปล่อยผ่าน หน้าจอที่อ่าน coordinate.lat จะพังทุกครั้งที่เปิดแอป
test('sanitizeSavedPoints: ค่าที่ไม่ใช่อาเรย์ได้รายการว่าง ไม่พัง', () => {
  assert.deepEqual(sanitizeSavedPoints(null), []);
  assert.deepEqual(sanitizeSavedPoints({ points: [] }), []);
  assert.deepEqual(sanitizeSavedPoints('เสีย'), []);
});

test('sanitizeSavedPoints: จุดที่บันทึกตามปกติผ่านครบทุกฟิลด์', () => {
  const saved = buildUserPoint(input, fixedNow);
  assert.deepEqual(sanitizeSavedPoints([saved]), [saved]);
});

test('sanitizeSavedPoints: ทิ้งรายการที่ไม่มี id ไม่มีชื่อ หรือพิกัดไม่ใช่ตัวเลข', () => {
  const good = buildUserPoint(input, fixedNow);
  const broken = [
    null,
    'ข้อความ',
    { ...good, id: undefined },
    { ...good, name: '   ' },
    { ...good, coordinate: null },
    { ...good, coordinate: { lat: '7.0', lng: 100.47 } },
  ];
  assert.deepEqual(sanitizeSavedPoints([...broken, good]).map((p) => p.id), [good.id]);
});

test('sanitizeSavedPoints: บังคับกฎจุดของผู้ใช้ซ้ำ ถึงข้อมูลในเครื่องจะถูกแก้ให้ดูเป็นข้อมูลทางการ', () => {
  const tampered = {
    ...buildUserPoint(input, fixedNow),
    verified: true,
    source: 'กรมทางหลวง',
    incidents: [{ year: 2566, severity: 'fatal', count: 9 }],
  };
  const [point] = sanitizeSavedPoints([tampered]);
  assert.equal(point.verified, false);
  assert.equal(point.source, USER_POINT_SOURCE);
  assert.deepEqual(point.incidents, []);
});

test('sanitizeSavedPoints: คำแนะนำที่ไม่ใช่ข้อความถูกทิ้ง ส่วนที่เหลือเก็บไว้', () => {
  const point = { ...buildUserPoint(input, fixedNow), advice: ['ขับช้าๆ', 42, null] };
  assert.deepEqual(sanitizeSavedPoints([point])[0].advice, ['ขับช้าๆ']);
});
