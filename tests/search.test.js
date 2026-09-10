/**
 * เทสต์ของ utils/search.js
 *
 * โจทย์หลัก: ค้นคำว่า "หาด" ต้องได้ชายหาดขึ้นก่อน
 * ไม่ใช่ได้ทุกจุดในอำเภอหาดใหญ่ปนมาแบบไม่เรียงลำดับ
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchPoints } from '../utils/search.js';

function makePoint(id, name, district, type = 'crash', riskScore = 0) {
  return { id, name, district, type, riskScore };
}

const points = [
  makePoint('hy-lopburi', 'ถนนลพบุรีราเมศวร์ ช่วงเลี่ยงเมืองหาดใหญ่', 'หาดใหญ่', 'crash', 10),
  makePoint('hy-kimyong', 'ตลาดกิมหยง', 'หาดใหญ่', 'crime', 0),
  makePoint('sk-smila', 'หาดสมิหลา โซนหน้ารูปนางเงือก', 'เมืองสงขลา', 'drowning', 20),
  makePoint('sk-chalatat', 'หาดชลาทัศน์ ช่วงถนนเลียบชายหาด', 'เมืองสงขลา', 'drowning', 50),
  makePoint('hy-ton', 'น้ำตกโตนงาช้าง', 'หาดใหญ่', 'fall', 50),
];

test('คำค้นว่าง หรือมีแต่ช่องว่าง ได้ผลว่าง', () => {
  assert.deepEqual(searchPoints(points, ''), []);
  assert.deepEqual(searchPoints(points, '   '), []);
});

test('ค้น "หาด": ชายหาดต้องขึ้นก่อนจุดที่แค่อยู่ในอำเภอหาดใหญ่', () => {
  const ids = searchPoints(points, 'หาด').map((p) => p.id);
  // สองอันแรกเป็นชายหาด (ชื่อขึ้นต้นด้วย "หาด") เรียงตามความอันตราย
  assert.deepEqual(ids.slice(0, 2), ['sk-chalatat', 'sk-smila']);
  // ถนนที่มีคำว่า "หาดใหญ่" อยู่กลางชื่อ มาต่อ
  assert.equal(ids[2], 'hy-lopburi');
  // จุดที่ตรงแค่ชื่ออำเภอ อยู่ท้ายสุด
  assert.deepEqual(ids.slice(3).sort(), ['hy-kimyong', 'hy-ton']);
});

test('ไม่สนช่องว่าง: "หาด สมิหลา" ต้องหาเจอ', () => {
  assert.equal(searchPoints(points, 'หาด สมิหลา')[0].id, 'sk-smila');
});

test('ค้นด้วยประเภทอันตราย: "จมน้ำ" ได้ทุกจุดประเภทจมน้ำ', () => {
  const ids = searchPoints(points, 'จมน้ำ').map((p) => p.id).sort();
  assert.deepEqual(ids, ['sk-chalatat', 'sk-smila']);
});

test('ตัวอักษรอังกฤษไม่สนตัวเล็กตัวใหญ่', () => {
  const withEnglish = [...points, makePoint('user-1', 'Samila Viewpoint', 'บันทึกโดยผู้ใช้')];
  assert.equal(searchPoints(withEnglish, 'samila')[0].id, 'user-1');
});

test('คะแนนความเกี่ยวข้องเท่ากัน จุดที่อันตรายกว่าขึ้นก่อน', () => {
  const ids = searchPoints(points, 'หาดใหญ่').map((p) => p.id);
  // ลพบุรีฯ มีคำนี้ในชื่อจึงขึ้นก่อน ที่เหลือตรงแค่ชื่ออำเภอ เรียงตามคะแนนความเสี่ยง
  assert.equal(ids[0], 'hy-lopburi');
  assert.deepEqual(ids.slice(1), ['hy-ton', 'hy-kimyong']);
});

test('ไม่ตรงอะไรเลย ได้ผลว่าง', () => {
  assert.deepEqual(searchPoints(points, 'เชียงใหม่'), []);
});
