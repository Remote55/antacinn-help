/**
 * เทสต์ของ utils/motClusters.js
 *
 * 0.001 องศาละติจูด ≈ 111 ม.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { incidentWeight, medoid, summarizeCluster, clusterIncidents } from '../utils/motClusters.js';

function incident(lat, overrides = {}) {
  return { lat, lng: 100.5, yearBE: 2566, fatal: 0, serious: 0, minor: 1, ...overrides };
}

test('น้ำหนักความรุนแรงใช้ ตาย 5 สาหัส 3 เล็กน้อย 1 เหมือนสูตรคะแนน', () => {
  assert.equal(incidentWeight({ fatal: 1, serious: 2, minor: 3 }), 14);
});

test('สองกลุ่มที่ห่างกัน 5 กม. ต้องแยกเป็นสองกลุ่ม', () => {
  const nearA = [incident(7.0), incident(7.001), incident(7.002)];
  const nearB = [incident(7.045), incident(7.046)];
  const clusters = clusterIncidents([...nearA, ...nearB], 500);
  assert.equal(clusters.length, 2);
  assert.deepEqual(clusters.map((c) => c.members.length).sort(), [2, 3]);
});

test('กลุ่มที่รุนแรงกว่าขึ้นก่อน', () => {
  const clusters = clusterIncidents([incident(7.0), incident(7.001), incident(7.045, { fatal: 1 })], 500);
  assert.equal(clusters[0].fatal, 1);
  assert.equal(clusters[0].weight, 6);
});

test('เหตุที่รุนแรงที่สุดเป็นแกนของกลุ่ม: ดึงเหตุทั้งสองข้างที่ห่าง 400 ม. เข้ากลุ่มเดียวกัน', () => {
  // ถ้าเริ่มจากเหตุแรก (7.0) เหตุที่ 7.0072 (800 ม.) จะหลุดกลุ่ม แต่แกนคือเหตุที่มีผู้เสียชีวิตตรงกลาง
  const clusters = clusterIncidents([incident(7.0), incident(7.0036, { fatal: 1 }), incident(7.0072)], 500);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].members.length, 3);
});

test('ตัวแทนของกลุ่มเป็นจุดเกิดเหตุจริงที่อยู่กลางกลุ่ม', () => {
  const middle = incident(7.001);
  assert.equal(medoid([incident(7.0), middle, incident(7.002)]), middle);
});

test('สรุปกลุ่ม: รวมจำนวนคน น้ำหนัก และปีที่เกิดเหตุไม่ซ้ำเรียงจากเก่าไปใหม่', () => {
  const summary = summarizeCluster([
    incident(7.0, { yearBE: 2566, fatal: 1 }),
    incident(7.001, { yearBE: 2563, serious: 1 }),
    incident(7.002, { yearBE: 2566 }),
  ]);
  assert.equal(summary.fatal, 1);
  assert.equal(summary.serious, 1);
  assert.equal(summary.minor, 3);
  assert.equal(summary.weight, 5 + 3 + 3);
  assert.deepEqual(summary.years, [2563, 2566]);
  assert.deepEqual(summary.center, { lat: 7.001, lng: 100.5 });
  assert.equal(summary.representative.lat, 7.001);
});

test('ไม่มีเหตุการณ์ ได้อาเรย์ว่าง', () => {
  assert.deepEqual(clusterIncidents([], 500), []);
});
