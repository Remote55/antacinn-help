/**
 * เทสต์ของ utils/dataValidation.js
 *
 * ใช้ข้อมูลตัวอย่างที่ตั้งใจทำให้ผิดทีละข้อ เพื่อพิสูจน์ว่าตัวตรวจจับได้จริง
 * ไม่ใช่แค่ผ่านเพราะข้อมูลจริงบังเอิญถูก
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRiskPoints, validatePresetRoutes } from '../utils/dataValidation.js';

/** จุดเสี่ยงที่ถูกต้องทุกฟิลด์ ใช้เป็นฐานแล้วค่อยแก้ทีละฟิลด์ให้ผิด */
function validPoint(overrides = {}) {
  return {
    id: 'hy-test-01',
    name: 'จุดทดสอบ',
    category: 'road',
    type: 'crash',
    district: 'หาดใหญ่',
    coordinate: { lat: 7.0, lng: 100.47 },
    incidents: [{ year: 2566, severity: 'fatal', count: 1, note: '' }],
    peakMonths: [12],
    peakHours: [18],
    advice: ['ขับช้า ๆ'],
    emergency: [{ label: 'กู้ภัย', tel: '1669' }],
    source: 'ไทยรัฐ 1 ม.ค. 2566',
    verified: false,
    ...overrides,
  };
}

/** ช่วยเช็คว่ามีข้อความปัญหาที่มีคำนี้อยู่ */
function assertHasError(errors, fragment) {
  assert.ok(
    errors.some((e) => e.includes(fragment)),
    `คาดว่าจะมีปัญหาที่มีคำว่า "${fragment}" แต่ได้ ${JSON.stringify(errors)}`
  );
}

test('จุดที่ถูกต้องทุกฟิลด์ ต้องไม่มีปัญหาเลย', () => {
  assert.deepEqual(validateRiskPoints([validPoint()]), []);
});

test('id ซ้ำ ต้องถูกจับได้', () => {
  const errors = validateRiskPoints([validPoint(), validPoint()]);
  assertHasError(errors, 'id ซ้ำ');
});

test('คำนำหน้า id ไม่ตรงกับอำเภอ ต้องถูกจับได้', () => {
  const errors = validateRiskPoints([validPoint({ id: 'sk-test-01', district: 'หาดใหญ่' })]);
  assertHasError(errors, 'คำนำหน้า sk-');
});

test('คำนำหน้า id ที่ไม่รู้จัก ต้องถูกจับได้', () => {
  const errors = validateRiskPoints([validPoint({ id: 'xx-test-01' })]);
  assertHasError(errors, 'id ต้องขึ้นต้นด้วย');
});

test('คำนำหน้า sn- (อำเภอสิงหนคร) ใช้ได้เมื่อ district ตรงกัน', () => {
  const point = validPoint({ id: 'sn-test-01', district: 'สิงหนคร', coordinate: { lat: 7.19, lng: 100.547 } });
  assert.deepEqual(validateRiskPoints([point]), []);
});

test('พิกัดสลับ lat กับ lng ต้องถูกจับได้ว่าอยู่นอกพื้นที่', () => {
  const errors = validateRiskPoints([validPoint({ coordinate: { lat: 100.47, lng: 7.0 } })]);
  assertHasError(errors, 'นอกพื้นที่ให้บริการ');
});

test('severity สะกดผิด ต้องถูกจับได้', () => {
  const errors = validateRiskPoints([validPoint({ incidents: [{ year: 2566, severity: 'fetal', count: 1 }] })]);
  assertHasError(errors, 'severity');
});

test('count เป็นศูนย์หรือไม่ใช่จำนวนเต็ม ต้องถูกจับได้', () => {
  assertHasError(validateRiskPoints([validPoint({ incidents: [{ year: 2566, severity: 'minor', count: 0 }] })]), 'count');
  assertHasError(validateRiskPoints([validPoint({ incidents: [{ year: 2566, severity: 'minor', count: '2' }] })]), 'count');
});

test('ปีที่เป็น ค.ศ. แทน พ.ศ. ต้องถูกจับได้', () => {
  // ข้อมูลกระทรวงคมนาคมบางปีใช้ ค.ศ. ถ้าลอกมาโดยไม่แปลงจะได้ 2023 แทน 2566
  const errors = validateRiskPoints([validPoint({ incidents: [{ year: 2023, severity: 'minor', count: 1 }] })]);
  assertHasError(errors, 'year');
});

test('เดือน 13 และชั่วโมง 24 ต้องถูกจับได้', () => {
  assertHasError(validateRiskPoints([validPoint({ peakMonths: [13] })]), 'peakMonths');
  assertHasError(validateRiskPoints([validPoint({ peakHours: [24] })]), 'peakHours');
});

test('มีตัวเลขเหตุการณ์แต่ source ยังเป็นข้อความรอกรอก ต้องถูกจับได้', () => {
  const errors = validateRiskPoints([validPoint({ source: '⚠️ รอกรอกข้อมูลจริง' })]);
  assertHasError(errors, 'แหล่งอ้างอิงจริง');
});

test('จุดที่ยังไม่มีเหตุการณ์ ใช้ข้อความรอกรอกเป็น source ได้', () => {
  const errors = validateRiskPoints([validPoint({ incidents: [], source: '⚠️ รอกรอกข้อมูลจริง' })]);
  assert.deepEqual(errors, []);
});

test('verified: true แต่ source เป็นข่าว ต้องถูกจับได้', () => {
  // UNVERIFIED_TEXT ของทีมนิยามว่ารายงานข่าวยังไม่นับเป็นการยืนยัน
  const errors = validateRiskPoints([validPoint({ verified: true, source: 'ไทยรัฐ 1 ม.ค. 2566' })]);
  assertHasError(errors, 'verified: true');
});

test('verified: true ที่ source เป็นหน่วยงานทางการ ใช้ได้', () => {
  const point = validPoint({ verified: true, source: 'กระทรวงคมนาคม ชุดข้อมูล roadaccident ปี 2566' });
  assert.deepEqual(validateRiskPoints([point]), []);
});

test('verified ที่ไม่ใช่ boolean ต้องถูกจับได้', () => {
  const errors = validateRiskPoints([validPoint({ verified: 'false' })]);
  assertHasError(errors, 'verified ต้องเป็น');
});

/** เส้นทางสำเร็จรูปที่ถูกต้อง */
function validRoute(overrides = {}) {
  return {
    id: 'test-route',
    label: 'ทดสอบ',
    origin: { lat: 7.0, lng: 100.47, name: 'ต้นทาง' },
    destination: { lat: 7.02, lng: 100.47, name: 'ปลายทาง' },
    fallbackCoordinates: [
      { lat: 7.0, lng: 100.47 },
      { lat: 7.02, lng: 100.47 },
    ],
    ...overrides,
  };
}

test('เส้นทางที่ถูกต้อง ต้องไม่มีปัญหา', () => {
  assert.deepEqual(validatePresetRoutes([validRoute()]), []);
});

test('เส้นทางสำรองที่มีจุดเดียว ต้องถูกจับได้', () => {
  const errors = validatePresetRoutes([validRoute({ fallbackCoordinates: [{ lat: 7.0, lng: 100.47 }] })]);
  assertHasError(errors, 'อย่างน้อย 2 จุด');
});

test('เส้นทางสำรองที่ไม่ได้จบที่ปลายทาง ต้องถูกจับได้', () => {
  // บั๊กแบบนี้เกิดได้จริง: แก้พิกัดปลายทางแล้ว แต่เส้นทางสำรองยังลากไปที่เดิม
  const errors = validatePresetRoutes([
    validRoute({ fallbackCoordinates: [{ lat: 7.0, lng: 100.47 }, { lat: 7.1, lng: 100.47 }] }),
  ]);
  assertHasError(errors, 'ห่างปลายทาง');
});
