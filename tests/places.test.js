/**
 * เทสต์ของ utils/places.js
 *
 * โจทย์ (เอกสารบทที่ 4): การ์ดสถานที่ยอดนิยมในหน้าแรก
 * บอกว่ารอบสถานที่มีจุดเสี่ยงกี่จุด และจุดที่อันตรายที่สุดอยู่ระดับไหน
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRisksNearPlace, searchPlaces } from '../utils/places.js';

const samila = {
  id: 'place-samila',
  name: 'หาดสมิหลา (รูปปั้นนางเงือก)',
  district: 'เมืองสงขลา',
  coordinate: { lat: 7.21549, lng: 100.59581 },
};

/** จุดเสี่ยงห่างจากหาดสมิหลาไปทางเหนือหรือใต้ (0.009 องศาละติจูด ≈ 1,000 ม.) */
function riskPointAt(id, latOffset, riskScore) {
  return {
    id,
    coordinate: { lat: 7.21549 + latOffset, lng: 100.59581 },
    riskScore,
    riskLevel: { id: 'test', label: 'ทดสอบ', color: '#000000' },
  };
}

const points = [
  riskPointAt('near-low', 0.0045, 10), // ≈ 500 ม.
  riskPointAt('mid-high', -0.0135, 60), // ≈ 1,500 ม.
  riskPointAt('far', 0.027, 90), // ≈ 3,000 ม. นอกรัศมี 2 กม.
];

test('นับเฉพาะจุดในรัศมี และบอกจุดที่อันตรายที่สุด', () => {
  const summary = summarizeRisksNearPlace(samila, points, 2000);
  assert.equal(summary.count, 2);
  assert.equal(summary.highest.id, 'mid-high');
});

test('รายการจุดรอบสถานที่เรียงจากใกล้ไปไกล พร้อมระยะ', () => {
  const { nearby } = summarizeRisksNearPlace(samila, points, 2000);
  assert.deepEqual(nearby.map((item) => item.point.id), ['near-low', 'mid-high']);
  assert.ok(Math.abs(nearby[0].distanceM - 500) < 10, `ระยะ ${nearby[0].distanceM}`);
});

test('ไม่มีจุดในรัศมี: นับได้ 0 และไม่มีจุดอันตรายที่สุด (ห้ามตีความว่าปลอดภัย)', () => {
  const summary = summarizeRisksNearPlace(samila, [points[2]], 2000);
  assert.equal(summary.count, 0);
  assert.equal(summary.highest, null);
  assert.deepEqual(summary.nearby, []);
});

test('คะแนนเท่ากัน เลือกจุดที่ใกล้กว่าเป็นจุดอันตรายที่สุด', () => {
  const tie = [riskPointAt('b-far', 0.009, 50), riskPointAt('a-near', 0.0045, 50)];
  assert.equal(summarizeRisksNearPlace(samila, tie, 2000).highest.id, 'a-near');
});

const places = [
  { id: 'place-psu', name: 'ม.อ.หาดใหญ่', district: 'หาดใหญ่' },
  { id: 'place-samila', name: 'หาดสมิหลา (รูปปั้นนางเงือก)', district: 'เมืองสงขลา' },
  { id: 'place-chalatat', name: 'หาดชลาทัศน์', district: 'เมืองสงขลา' },
  { id: 'place-kimyong', name: 'ตลาดกิมหยง', district: 'หาดใหญ่' },
];

test('ค้นสถานที่: คำค้นว่าง หรือมีแต่ช่องว่าง ได้ผลว่าง', () => {
  assert.deepEqual(searchPlaces(places, ''), []);
  assert.deepEqual(searchPlaces(places, '   '), []);
});

test('ค้นสถานที่ "หาด": ชายหาดขึ้นก่อน ตามด้วยที่มีคำนี้กลางชื่อ แล้วค่อยเป็นที่ตรงแค่อำเภอ', () => {
  const ids = searchPlaces(places, 'หาด').map((p) => p.id);
  assert.deepEqual(ids, ['place-samila', 'place-chalatat', 'place-psu', 'place-kimyong']);
});

test('ค้นสถานที่: ไม่สนช่องว่าง "หาด ชลาทัศน์" หาเจอ', () => {
  assert.equal(searchPlaces(places, 'หาด ชลาทัศน์')[0].id, 'place-chalatat');
});

test('ค้นสถานที่ด้วยชื่ออำเภอ: "สงขลา" ได้สถานที่ในเมืองสงขลา', () => {
  assert.deepEqual(searchPlaces(places, 'สงขลา').map((p) => p.id), ['place-samila', 'place-chalatat']);
});
