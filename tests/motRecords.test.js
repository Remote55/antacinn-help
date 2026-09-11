/**
 * เทสต์ของ utils/motRecords.js
 *
 * ตัวอย่างทุกค่าลอกมาจากข้อมูลจริงของกระทรวงคมนาคม จังหวัดสงขลา ปี 2563–2568
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMotDate, parseMotTime, normalizeCause, normalizeMotRecord } from '../utils/motRecords.js';

test('วันที่แบบ ISO (ปี 2563–2565)', () => {
  assert.deepEqual(parseMotDate('2020-01-01T00:00:00'), { year: 2020, month: 1, day: 1 });
});

test('วันที่แบบ เดือน/วัน/ปี (ปี 2566) ตัวแรกคือเดือน', () => {
  assert.deepEqual(parseMotDate('1/2/2023'), { year: 2023, month: 1, day: 2 });
  assert.deepEqual(parseMotDate('12/31/2023'), { year: 2023, month: 12, day: 31 });
});

test('วันที่แบบลำดับวันของ Excel (ปี 2567–2568) ทั้งตัวเลขและข้อความ', () => {
  assert.deepEqual(parseMotDate(45292), { year: 2024, month: 1, day: 1 });
  assert.deepEqual(parseMotDate('45658'), { year: 2025, month: 1, day: 1 });
});

test('วันที่ที่แปลงไม่ได้ คืน null ไม่พัง', () => {
  for (const bad of [null, undefined, '', 'ไม่ระบุ', '13/40/2023', 123]) {
    assert.equal(parseMotDate(bad), null, `ค่า ${bad}`);
  }
});

test('เวลาแบบ ชั่วโมง:นาที ได้ชั่วโมงที่เกิดเหตุ', () => {
  assert.equal(parseMotTime('6:00'), 6);
  assert.equal(parseMotTime('17:40'), 17);
  assert.equal(parseMotTime('0:15'), 0);
  assert.equal(parseMotTime('24:00'), null);
});

test('เวลาแบบสัดส่วนของวัน (ปี 2567) รวมทศนิยมที่ถูกตัดมา', () => {
  assert.equal(parseMotTime('0.090277778'), 2); // 02:10
  assert.equal(parseMotTime('0.645833333'), 15); // 15:30
  assert.equal(parseMotTime('0.041666666'), 1); // 01:00 คูณ 24 ได้ 0.99999998 ต้องไม่ปัดเหลือ 0
  assert.equal(parseMotTime('0'), 0);
});

test('เวลาที่แปลงไม่ได้ คืน null', () => {
  for (const bad of [null, '', 'ไม่ทราบ', '1.5']) assert.equal(parseMotTime(bad), null, `ค่า ${bad}`);
});

test('มูลเหตุที่เขียนต่างกันแต่หมายถึงเรื่องเดียวกัน รวมเป็นชื่อเดียว', () => {
  assert.equal(normalizeCause('ขับรถเร็วเกินอัตราที่กำหนด'), 'ขับรถเร็วเกินอัตรากำหนด');
  assert.equal(normalizeCause(' ฝ่าฝืนสัญญาณไฟ / เครื่องหมายจราจร '), 'ฝ่าฝืนสัญญาณไฟ/เครื่องหมายจราจร');
  assert.equal(normalizeCause('หลับใน'), 'หลับใน');
  assert.equal(normalizeCause(null), '');
});

/** แถวดิบตัวอย่างจาก API (ชื่อฟิลด์ภาษาไทยตามต้นทาง) */
function rawRow(overrides = {}) {
  return {
    'วันที่เกิดเหตุ': '1/2/2023',
    'เวลา': '17:40',
    LATITUDE: '7.12123',
    LONGITUDE: '100.54805',
    'ผู้เสียชีวิต': 1,
    'ผู้บาดเจ็บสาหัส': 0,
    'ผู้บาดเจ็บเล็กน้อย': 2,
    'รหัสสายทาง': '414',
    KM: 3.6,
    'มูลเหตุสันนิษฐาน': 'ขับรถเร็วเกินอัตราที่กำหนด',
    'สภาพอากาศ': 'ฝนตก',
    ...overrides,
  };
}

test('แปลงแถวดิบเป็นเหตุการณ์ครบทุกฟิลด์', () => {
  assert.deepEqual(normalizeMotRecord(rawRow(), 2566), {
    yearBE: 2566,
    month: 1,
    hour: 17,
    lat: 7.12123,
    lng: 100.54805,
    fatal: 1,
    serious: 0,
    minor: 2,
    route: '414',
    km: 3.6,
    cause: 'ขับรถเร็วเกินอัตรากำหนด',
    isRaining: true,
  });
});

test('ไม่มีพิกัด คืน null (ใช้ปักจุดไม่ได้)', () => {
  assert.equal(normalizeMotRecord(rawRow({ LATITUDE: '' }), 2566), null);
  assert.equal(normalizeMotRecord(rawRow({ LONGITUDE: 0 }), 2566), null);
});

test('เดือนเป็น null เมื่อเชื่อไม่ได้: ปี 2565 ที่วันกับเดือนสลับกัน และปีในวันที่ไม่ตรงกับปีของไฟล์', () => {
  assert.equal(normalizeMotRecord(rawRow({ 'วันที่เกิดเหตุ': '2022-03-01T00:00:00' }), 2565).month, null);
  assert.equal(normalizeMotRecord(rawRow({ 'วันที่เกิดเหตุ': '1/2/2023' }), 2567).month, null);
});

test('KM ว่างเป็น null ไม่ใช่ 0', () => {
  assert.equal(normalizeMotRecord(rawRow({ KM: '' }), 2566).km, null);
  assert.equal(normalizeMotRecord(rawRow({ KM: null }), 2566).km, null);
});
