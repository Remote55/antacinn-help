/**
 * เทสต์ของ utils/alertMessage.js
 *
 * ประโยคพวกนี้ถูกพูดออกเสียงขณะผู้ใช้ขับรถ ต้องสั้น ชัด และไม่แม่นเกินจริง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speakableDistance, buildAlertMessage, buildHeadsUpMessage } from '../utils/alertMessage.js';

test('speakableDistance: ต่ำกว่า 1 กม. ปัดเป็นหลักร้อยเมตร', () => {
  assert.equal(speakableDistance(437), '400 เมตร');
  assert.equal(speakableDistance(250), '300 เมตร');
});

test('speakableDistance: ไม่ต่ำกว่า 100 เมตร', () => {
  assert.equal(speakableDistance(49), '100 เมตร');
});

test('speakableDistance: ปัดแล้วถึง 1,000 เปลี่ยนเป็นกิโลเมตร', () => {
  assert.equal(speakableDistance(960), '1 กิโลเมตร');
});

test('speakableDistance: กิโลเมตรทศนิยมหนึ่งตำแหน่ง และไม่พูด .0', () => {
  assert.equal(speakableDistance(4230), '4.2 กิโลเมตร');
  assert.equal(speakableDistance(2000), '2 กิโลเมตร');
});

test('speakableDistance: ค่าผิดปกติไม่พัง', () => {
  assert.equal(speakableDistance(NaN), 'ใกล้ ๆ นี้');
  assert.equal(speakableDistance(-5), 'ใกล้ ๆ นี้');
});

const beach = {
  name: 'หาดชลาทัศน์',
  type: 'drowning',
  riskLevel: { label: 'เสี่ยง' },
  advice: ['ถ้าเห็นธงแดงห้ามลงน้ำเด็ดขาด เหตุเสียชีวิตปี 2563 เกิดจากการฝ่าธงแดงลงไปเล่น'],
};

test('buildAlertMessage: บอกระยะ ชื่อ ระดับ และประโยคหลักของคำแนะนำ', () => {
  assert.equal(
    buildAlertMessage(beach, 310),
    'ระวัง! อีกประมาณ 300 เมตร หาดชลาทัศน์ ระดับเสี่ยง ถ้าเห็นธงแดงห้ามลงน้ำเด็ดขาด'
  );
});

test('buildAlertMessage: พูดแค่ประโยคแรกของคำแนะนำ ไม่พูดทั้งย่อหน้า', () => {
  // ภาษาไทยเว้นวรรคระหว่างประโยค ท่อนหลังเป็นเหตุผลประกอบ ฟังแล้วยาวเกินขณะขับรถ
  assert.ok(!buildAlertMessage(beach, 310).includes('2563'));
});

test('buildAlertMessage: จุดที่ยังไม่มีคำแนะนำ ใช้คำเตือนทั่วไปตามประเภทอันตราย', () => {
  const road = { name: 'แยกแมนดาริน', type: 'crash', riskLevel: { label: 'เฝ้าระวัง' }, advice: [] };
  assert.ok(buildAlertMessage(road, 500).endsWith('ลดความเร็ว'), buildAlertMessage(road, 500));
});

test('buildAlertMessage: จุดที่ไม่มีระดับความเสี่ยง ไม่พัง และไม่พูดคำว่าระดับ', () => {
  const message = buildAlertMessage({ name: 'จุดผู้ใช้', type: 'fall' }, 200);
  assert.ok(message.includes('จุดผู้ใช้'));
  assert.ok(!message.includes('ระดับ'));
});

test('buildHeadsUpMessage: บอกระยะตามเส้นทางแบบที่เอกสารบทที่ 5.2 ยกตัวอย่าง', () => {
  assert.equal(
    buildHeadsUpMessage({ name: 'สะพานติณสูลานนท์' }, 4230),
    'จุดเสี่ยงถัดไป สะพานติณสูลานนท์ อีก 4.2 กิโลเมตร ข้างหน้า'
  );
});
