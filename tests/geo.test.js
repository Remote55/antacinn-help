/**
 * เทสต์ของ utils/geo.js
 * รันด้วย: node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineMeters,
  distanceToSegmentMeters,
  projectOnSegment,
  isInsideBoundingBox,
} from '../utils/geo.js';

/** ช่วยเช็คว่าตัวเลขใกล้เคียงกับที่คาดไว้ ภายในค่าคลาดเคลื่อนที่ยอมรับได้ */
function assertClose(actual, expected, toleranceMeters, message) {
  assert.ok(
    Math.abs(actual - expected) <= toleranceMeters,
    `${message}: ได้ ${actual} คาดว่า ${expected} (±${toleranceMeters})`
  );
}

test('haversineMeters: จุดเดียวกันต้องได้ระยะ 0', () => {
  const p = { lat: 7.0086, lng: 100.498 };
  assert.equal(haversineMeters(p, p), 0);
});

test('haversineMeters: ม.อ.หาดใหญ่ → หาดสมิหลา ได้ระยะเส้นตรงประมาณ 22 กม.', () => {
  const psu = { lat: 7.0086, lng: 100.498 };
  const samila = { lat: 7.1975, lng: 100.596 };
  // ระยะเส้นตรง (ไม่ใช่ระยะตามถนน 28.4 กม. ที่ OSRM คืนมา)
  assertClose(haversineMeters(psu, samila), 23600, 800, 'ระยะเส้นตรงหาดใหญ่-สงขลา');
});

test('haversineMeters: 1 องศาละติจูด ประมาณ 111 กม.', () => {
  const a = { lat: 7.0, lng: 100.5 };
  const b = { lat: 8.0, lng: 100.5 };
  assertClose(haversineMeters(a, b), 111195, 500, 'หนึ่งองศาละติจูด');
});

test('haversineMeters: สลับลำดับจุดต้องได้ระยะเท่าเดิม', () => {
  const a = { lat: 7.0086, lng: 100.498 };
  const b = { lat: 7.1975, lng: 100.596 };
  assert.equal(haversineMeters(a, b), haversineMeters(b, a));
});

test('distanceToSegmentMeters: จุดอยู่บนเส้นพอดี ต้องได้ 0', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  const middle = { lat: 7.05, lng: 100.5 };
  assertClose(distanceToSegmentMeters(middle, start, end), 0, 1, 'จุดกลางเส้น');
});

test('distanceToSegmentMeters: จุดตั้งฉากกับกลางเส้น วัดระยะตั้งฉากได้ถูก', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  // ขยับไปทางตะวันออก 0.01 องศาลองจิจูด ที่ละติจูด 7 องศา ประมาณ 1,103 เมตร
  const aside = { lat: 7.05, lng: 100.51 };
  assertClose(distanceToSegmentMeters(aside, start, end), 1103, 60, 'ระยะตั้งฉาก');
});

test('distanceToSegmentMeters: จุดเลยปลายเส้นไป ต้องวัดจากปลายเส้น ไม่ใช่เส้นที่ยืดออกไป', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  // จุดนี้อยู่เหนือปลายเส้นขึ้นไปอีก — นี่คือเหตุผลที่ต้อง clamp ค่า t ให้อยู่ใน [0,1]
  const beyond = { lat: 7.2, lng: 100.5 };
  const expected = haversineMeters(beyond, end);
  assertClose(distanceToSegmentMeters(beyond, start, end), expected, 1, 'จุดเลยปลายเส้น');
});

test('distanceToSegmentMeters: จุดอยู่ก่อนจุดเริ่มต้น ต้องวัดจากจุดเริ่มต้น', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  const before = { lat: 6.9, lng: 100.5 };
  const expected = haversineMeters(before, start);
  assertClose(distanceToSegmentMeters(before, start, end), expected, 1, 'จุดก่อนเส้น');
});

test('distanceToSegmentMeters: เส้นที่มีความยาวเป็นศูนย์ ต้องไม่หารด้วยศูนย์', () => {
  const p = { lat: 7.05, lng: 100.5 };
  const same = { lat: 7.0, lng: 100.5 };
  const result = distanceToSegmentMeters(p, same, same);
  assert.ok(Number.isFinite(result), 'ต้องไม่เป็น NaN หรือ Infinity');
  assertClose(result, haversineMeters(p, same), 1, 'ระยะถึงจุดเดี่ยว');
});

test('projectOnSegment: คืนค่า t บอกตำแหน่งบนเส้น 0 = ต้นเส้น 1 = ปลายเส้น', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };

  // จุดกึ่งกลางเส้น t ต้องเท่ากับ 0.5
  assertClose(projectOnSegment({ lat: 7.05, lng: 100.5 }, start, end).t, 0.5, 0.01, 't กึ่งกลาง');
  // จุดที่ปลายเส้นพอดี t ต้องเท่ากับ 1
  assertClose(projectOnSegment({ lat: 7.1, lng: 100.5 }, start, end).t, 1, 0.01, 't ปลายเส้น');
  // จุดที่ต้นเส้นพอดี t ต้องเท่ากับ 0
  assertClose(projectOnSegment({ lat: 7.0, lng: 100.5 }, start, end).t, 0, 0.01, 't ต้นเส้น');
});

test('projectOnSegment: จุดที่เลยปลายเส้นไป t ต้องถูกบีบไว้ที่ 1 ไม่เกินนั้น', () => {
  const start = { lat: 7.0, lng: 100.5 };
  const end = { lat: 7.1, lng: 100.5 };
  const beyond = { lat: 7.5, lng: 100.5 };
  assert.equal(projectOnSegment(beyond, start, end).t, 1);
});

test('isInsideBoundingBox: จุดใกล้ ๆ ต้องอยู่ในกรอบ', () => {
  const center = { lat: 7.0, lng: 100.5 };
  const near = { lat: 7.001, lng: 100.501 };
  assert.equal(isInsideBoundingBox(near, center, 2000), true);
});

test('isInsideBoundingBox: จุดไกลมากต้องอยู่นอกกรอบ', () => {
  const center = { lat: 7.0, lng: 100.5 };
  const far = { lat: 8.5, lng: 102.0 };
  assert.equal(isInsideBoundingBox(far, center, 2000), false);
});

test('isInsideBoundingBox: ต้องอยู่ในกรอบทั้งสองแกน ใกล้แค่แกนเดียวไม่พอ', () => {
  // เทสต์นี้มีไว้ดักกรณีเผลอเปลี่ยน && เป็น || ในโค้ด
  // ถ้าเทสต์วัดแต่ "ใกล้ทั้งสองแกน" กับ "ไกลทั้งสองแกน" จะจับบั๊กนี้ไม่ได้เลย
  const center = { lat: 7.0, lng: 100.5 };

  // ละติจูดตรงกัน แต่ลองจิจูดไกลมาก
  assert.equal(isInsideBoundingBox({ lat: 7.0, lng: 105.0 }, center, 2000), false);
  // ลองจิจูดตรงกัน แต่ละติจูดไกลมาก
  assert.equal(isInsideBoundingBox({ lat: 9.0, lng: 100.5 }, center, 2000), false);
});
