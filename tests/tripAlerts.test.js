/**
 * เทสต์ของ utils/tripAlerts.js
 *
 * ไฟล์นี้เป็น pure function ล้วน ไม่มี state ข้างใน
 * ทำให้จำลองสถานการณ์ "ขับรถเข้าใกล้แล้วออกห่าง" ได้ง่ายมาก
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTripAlerts } from '../utils/tripAlerts.js';

const CONFIG = { triggerM: 500, resetM: 800, boundingBoxM: 2000 };

function makePoint(id, lat, lng) {
  return { id, name: id, coordinate: { lat, lng }, incidents: [], peakMonths: [], peakHours: [] };
}

// จุดเสี่ยงอยู่ที่ lat 7.00 พอดี
const points = [makePoint('p1', 7.0, 100.5)];

test('อยู่ไกลมาก ยังไม่เตือน', () => {
  const far = { lat: 7.05, lng: 100.5 }; // ห่างประมาณ 5.5 กม.
  const result = evaluateTripAlerts(far, points, new Set(), CONFIG);
  assert.deepEqual(result.newAlerts, []);
  assert.equal(result.alertedIds.size, 0);
});

test('เข้ามาในระยะ 500 เมตร ต้องเตือน 1 ครั้ง', () => {
  const near = { lat: 7.003, lng: 100.5 }; // ห่างประมาณ 333 เมตร
  const result = evaluateTripAlerts(near, points, new Set(), CONFIG);
  assert.equal(result.newAlerts.length, 1);
  assert.equal(result.newAlerts[0].point.id, 'p1');
  assert.ok(result.alertedIds.has('p1'), 'ต้องจำไว้ว่าเตือนไปแล้ว');
});

test('ยังอยู่ใกล้จุดเดิม ต้องไม่เตือนซ้ำ', () => {
  const near = { lat: 7.003, lng: 100.5 };
  const alreadyAlerted = new Set(['p1']);
  const result = evaluateTripAlerts(near, points, alreadyAlerted, CONFIG);
  assert.deepEqual(result.newAlerts, [], 'ห้ามเตือนซ้ำ');
  assert.ok(result.alertedIds.has('p1'), 'ต้องยังจำว่าเตือนไปแล้ว');
});

test('ขับออกห่างเกิน 800 เมตร ต้องล้างสถานะเตือน', () => {
  const away = { lat: 7.01, lng: 100.5 }; // ห่างประมาณ 1.1 กม.
  const alreadyAlerted = new Set(['p1']);
  const result = evaluateTripAlerts(away, points, alreadyAlerted, CONFIG);
  assert.equal(result.alertedIds.has('p1'), false, 'ต้องล้างสถานะแล้ว');
});

test('ระยะระหว่าง 500-800 เมตร ต้องยังจำสถานะไว้ (โซนกันสั่น)', () => {
  // ห่างประมาณ 666 เมตร: เกินระยะเตือน แต่ยังไม่ถึงระยะล้าง
  // โซนนี้มีไว้กัน GPS แกว่งไปมาแล้วเตือนซ้ำ
  const between = { lat: 7.006, lng: 100.5 };
  const alreadyAlerted = new Set(['p1']);
  const result = evaluateTripAlerts(between, points, alreadyAlerted, CONFIG);
  assert.ok(result.alertedIds.has('p1'), 'ยังต้องจำไว้');
  assert.deepEqual(result.newAlerts, [], 'และห้ามเตือนซ้ำ');
});

test('ขับออกไปแล้ววนกลับมาใหม่ ต้องเตือนอีกครั้ง', () => {
  const near = { lat: 7.003, lng: 100.5 };
  const away = { lat: 7.02, lng: 100.5 };

  // รอบที่ 1: เข้าใกล้ -> เตือน
  let state = evaluateTripAlerts(near, points, new Set(), CONFIG);
  assert.equal(state.newAlerts.length, 1);

  // รอบที่ 2: ขับออกไปไกล -> ล้างสถานะ
  state = evaluateTripAlerts(away, points, state.alertedIds, CONFIG);
  assert.equal(state.alertedIds.has('p1'), false);

  // รอบที่ 3: วนกลับมาใหม่ -> ต้องเตือนอีกครั้ง
  state = evaluateTripAlerts(near, points, state.alertedIds, CONFIG);
  assert.equal(state.newAlerts.length, 1, 'กลับมาใหม่ต้องเตือนอีก');
});

test('คืนระยะทางถึงจุดเสี่ยงมาด้วย เพื่อแสดง "อีก 244 ม."', () => {
  const near = { lat: 7.003, lng: 100.5 };
  const result = evaluateTripAlerts(near, points, new Set(), CONFIG);
  assert.ok(
    Math.abs(result.newAlerts[0].distanceM - 333) < 20,
    `ได้ ${result.newAlerts[0].distanceM} คาดว่าประมาณ 333`
  );
});

test('คืนรายการจุดที่กำลังเฝ้าระวังอยู่ เพื่อแสดง "กำลังเฝ้าระวัง 8 จุด"', () => {
  const manyPoints = [
    makePoint('a', 7.0, 100.5),
    makePoint('b', 7.005, 100.5),
    makePoint('c', 8.0, 101.5), // ไกลมาก ไม่นับ
  ];
  const here = { lat: 7.0, lng: 100.5 };
  const result = evaluateTripAlerts(here, manyPoints, new Set(), CONFIG);
  assert.equal(result.nearbyPoints.length, 2, 'นับเฉพาะจุดที่อยู่ในกรอบใกล้ ๆ');
});

test('ไม่มีตำแหน่งผู้ใช้ ต้องไม่พัง', () => {
  const result = evaluateTripAlerts(null, points, new Set(), CONFIG);
  assert.deepEqual(result.newAlerts, []);
  assert.deepEqual(result.nearbyPoints, []);
});
