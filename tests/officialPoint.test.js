/**
 * เทสต์ของ utils/officialPoint.js
 *
 * จุดที่สร้างต้องผ่านกฎเดียวกับจุดที่ทีมกรอกเอง (validateRiskPoints) และทุกข้อความต้องมาจากข้อมูลจริง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPeakWindow, incidentsByYear, buildOfficialPoint, HIGHWAY_POLICE } from '../utils/officialPoint.js';
import { summarizeCluster } from '../utils/motClusters.js';
import { validateRiskPoints } from '../utils/dataValidation.js';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

test('ช่วงเสี่ยง: เหตุกระจุกช่วงเย็น ได้ช่วง 3 ชั่วโมงนั้น', () => {
  assert.deepEqual(findPeakWindow([17, 18, 18, 19, 3], HOURS), [17, 18, 19]);
});

test('ช่วงเสี่ยง: วนรอบข้ามปีได้ (พ.ย.–ม.ค.)', () => {
  assert.deepEqual(findPeakWindow([12, 1, 1, 11], MONTHS), [11, 12, 1]);
});

test('ช่วงเสี่ยง: หลักฐานไม่พอ (น้อยกว่า 3 เหตุ หรือกระจายเกินไป) ได้อาเรย์ว่าง', () => {
  assert.deepEqual(findPeakWindow([17, 18], HOURS), []);
  assert.deepEqual(findPeakWindow([1, 5, 9, 13, 17, 21], HOURS), []);
});

test('ช่วงเสี่ยง: ค่าที่ไม่รู้ (null) ไม่นับ และคืนเฉพาะค่าที่เกิดเหตุจริงในช่วงนั้น', () => {
  // ช่วงที่หนาแน่นที่สุดคือ 16–18 น. แต่ไม่เคยเกิดเหตุตอน 16 น. จึงไม่ใส่ 16
  assert.deepEqual(findPeakWindow([null, null, 17, 18, 18], HOURS), [17, 18]);
  assert.deepEqual(findPeakWindow([1, 1, 1, 1], MONTHS), [1]);
});

/** เหตุการณ์ในรูปแบบของ normalizeMotRecord */
function incident(overrides = {}) {
  return {
    yearBE: 2566,
    month: 1,
    hour: 18,
    lat: 7.12123,
    lng: 100.54805,
    fatal: 0,
    serious: 0,
    minor: 1,
    route: '414',
    km: 3.6,
    cause: 'ขับรถเร็วเกินอัตรากำหนด',
    isRaining: false,
    ...overrides,
  };
}

const members = [
  incident({ yearBE: 2566, fatal: 1, minor: 0, hour: 18 }),
  incident({ yearBE: 2566, minor: 2, hour: 19 }),
  incident({ yearBE: 2563, serious: 1, minor: 0, hour: 17, isRaining: true, lat: 7.1215 }),
  incident({ yearBE: 2567, minor: 1, hour: 18, cause: 'หลับใน', isRaining: true, lat: 7.1209 }),
];

test('สถิติรายปี: รวมจำนวนคนตามความรุนแรง ข้ามความรุนแรงที่เป็นศูนย์ ปีใหม่ขึ้นก่อน', () => {
  const result = incidentsByYear(members);
  assert.deepEqual(
    result.map(({ year, severity, count }) => ({ year, severity, count })),
    [
      { year: 2567, severity: 'minor', count: 1 },
      { year: 2566, severity: 'fatal', count: 1 },
      { year: 2566, severity: 'minor', count: 2 },
      { year: 2563, severity: 'serious', count: 1 },
    ]
  );
  assert.match(result[1].note, /ปี 2566: เกิดเหตุ 2 ครั้ง/);
});

const info = {
  id: 'hy-mot-414-km3-6',
  name: 'ถนนลพบุรีราเมศวร์ กม. 3.6 ช่วงบ้านท่านางหอม',
  district: 'หาดใหญ่',
  fetchedDate: '2026-09-11',
  radiusM: 500,
};

test('จุดทางการผ่านกฎทุกข้อของไฟล์ข้อมูล และตั้ง verified: true', () => {
  const point = buildOfficialPoint(summarizeCluster(members), info);
  assert.deepEqual(validateRiskPoints([point]), []);
  assert.equal(point.verified, true);
  assert.equal(point.category, 'road');
  assert.equal(point.type, 'crash');
});

test('แหล่งอ้างอิงบอกชื่อชุดข้อมูล ปี จำนวนเหตุ และวันที่ดึงข้อมูล ให้ตรวจย้อนได้', () => {
  const { source } = buildOfficialPoint(summarizeCluster(members), info);
  assert.match(source, /กระทรวงคมนาคม/);
  assert.match(source, /datagov\.mot\.go\.th/);
  assert.match(source, /2563–2567/);
  assert.match(source, /4 ครั้ง/);
  assert.match(source, /2026-09-11/);
});

test('คำแนะนำแรกมาจากมูลเหตุที่พบบ่อยที่สุด พร้อมตัวเลขหลักฐาน และเตือนเรื่องฝนเมื่อเกิดขณะฝนตกบ่อย', () => {
  const { advice } = buildOfficialPoint(summarizeCluster(members), info);
  assert.match(advice[0], /^ลดความเร็วก่อนถึงช่วงนี้/);
  assert.match(advice[0], /3 จาก 4 ครั้ง/);
  assert.ok(advice.some((line) => line.includes('2 จาก 4 ครั้งเกิดขณะฝนตก')), JSON.stringify(advice));
});

test('ช่วงเวลาเสี่ยงคำนวณจากข้อมูล และมีเบอร์ตำรวจทางหลวง', () => {
  const point = buildOfficialPoint(summarizeCluster(members), info);
  assert.deepEqual(point.peakHours, [17, 18, 19]);
  assert.ok(point.emergency.some((contact) => contact.tel === HIGHWAY_POLICE.tel));
});

test('พิกัดของจุดคือจุดเกิดเหตุตัวแทน ปัดทศนิยม 5 ตำแหน่ง', () => {
  const point = buildOfficialPoint(summarizeCluster(members), info);
  assert.deepEqual(point.coordinate, { lat: 7.12123, lng: 100.54805 });
});
