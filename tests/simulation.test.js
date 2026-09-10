/**
 * เทสต์ของ utils/simulation.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { positionAtDistance, metersPerTick } from '../utils/simulation.js';
import { locateOnRoute } from '../utils/routeProgress.js';
import { SIMULATION, DISTANCE } from '../constants/config.js';

const straightRoute = [
  { lat: 7.0, lng: 100.5 },
  { lat: 7.01, lng: 100.5 },
  { lat: 7.02, lng: 100.5 },
  { lat: 7.03, lng: 100.5 },
  { lat: 7.04, lng: 100.5 },
];

/** ช่วยเช็คว่าพิกัดใกล้ค่าที่คาดไม่เกินประมาณ 20 เมตร */
function assertNear(actual, expected, label) {
  const ok = Math.abs(actual.lat - expected.lat) < 0.0002 && Math.abs(actual.lng - expected.lng) < 0.0002;
  assert.ok(ok, `${label}: ได้ ${JSON.stringify(actual)} คาดว่าใกล้ ${JSON.stringify(expected)}`);
}

test('ระยะ 0 หรือติดลบ อยู่ที่จุดเริ่ม', () => {
  assertNear(positionAtDistance(straightRoute, 0), { lat: 7.0, lng: 100.5 }, 'ระยะ 0');
  assertNear(positionAtDistance(straightRoute, -50), { lat: 7.0, lng: 100.5 }, 'ระยะติดลบ');
});

test('ครึ่งช่วงแรก อยู่กึ่งกลางช่วงแรก', () => {
  assertNear(positionAtDistance(straightRoute, 556), { lat: 7.005, lng: 100.5 }, '556 ม.');
});

test('ข้ามหลายช่วง: 2,224 ม. อยู่ที่จุดที่สาม', () => {
  assertNear(positionAtDistance(straightRoute, 2224), { lat: 7.02, lng: 100.5 }, '2,224 ม.');
});

test('เลยความยาวเส้นทาง อยู่ที่ปลายทาง', () => {
  assertNear(positionAtDistance(straightRoute, 99999), { lat: 7.04, lng: 100.5 }, 'เลยปลายทาง');
});

test('ไปกลับกันได้: ตำแหน่งที่ระยะ 3,000 ม. ต้องหาระยะกลับได้ 3,000 ม.', () => {
  // ผูกสองไฟล์เข้าด้วยกัน ถ้าไฟล์ใดไฟล์หนึ่งคิดระยะผิด เทสต์นี้จะแดง
  const position = positionAtDistance(straightRoute, 3000);
  const back = locateOnRoute(straightRoute, position);
  assert.ok(Math.abs(back.alongM - 3000) < 5, `หาระยะกลับได้ ${back.alongM}`);
  assert.ok(back.offRouteM < 1, `ห่างเส้นทาง ${back.offRouteM}`);
});

test('ไม่มีเส้นทาง คืน null', () => {
  assert.equal(positionAtDistance([], 100), null);
  assert.equal(positionAtDistance(null, 100), null);
});

test('เส้นทางจุดเดียว อยู่ที่จุดนั้นเสมอ', () => {
  assertNear(positionAtDistance([{ lat: 7.1, lng: 100.6 }], 500), { lat: 7.1, lng: 100.6 }, 'จุดเดียว');
});

test('metersPerTick: 60 กม./ชม. เร่ง 10 เท่า จังหวะละ 250 มิลลิวินาที ประมาณ 41.7 ม.', () => {
  assert.ok(Math.abs(metersPerTick(60, 10, 250) - 41.667) < 0.01);
});

test('metersPerTick: เวลาจริง 60 กม./ชม. วินาทีละ 16.7 ม.', () => {
  assert.ok(Math.abs(metersPerTick(60, 1, 1000) - 16.667) < 0.01);
});

test('ที่ความเร่งสูงสุดที่ให้เลือก ต้องขยับน้อยกว่าครึ่งรัศมีเตือน ไม่งั้นอาจวิ่งข้ามจุดเสี่ยงโดยไม่เตือน', () => {
  // ถ้าวันหนึ่งมีคนเพิ่มตัวเลือก ×100 เทสต์นี้จะแดงทันที
  const fastest = Math.max(...SIMULATION.SPEED_UPS);
  const step = metersPerTick(SIMULATION.SPEED_KMH, fastest, SIMULATION.TICK_MS);
  assert.ok(step < DISTANCE.ALERT_TRIGGER / 2, `ขยับจังหวะละ ${step} ม.`);
});
