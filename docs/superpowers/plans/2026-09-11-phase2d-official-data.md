# ระยะที่ 2 ช่วง D — ข้อมูลทางการและข้อมูลสด Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มจุดเสี่ยงบนทางหลวงที่ยืนยันจากข้อมูลทางการของกระทรวงคมนาคม (`verified: true`) ด้วยสคริปต์ที่ทีมรันซ้ำได้ทุกปี และแสดงสภาพคลื่นกับฝนสดจาก Open-Meteo (S7 และบทที่ 8 ของเอกสาร)

**Architecture:** ตรรกะทั้งหมดเป็นฟังก์ชันบริสุทธิ์ใน `utils/` ที่มีเทสต์ (แปลงข้อมูลดิบ → จัดกลุ่ม → สร้างจุดเสี่ยง) สคริปต์ `scripts/mot-accidents.mjs` แค่ดึงข้อมูลแล้วเรียกฟังก์ชันเหล่านั้น ผลลัพธ์เขียนลงไฟล์แยก `data/officialRiskPoints.json` (สร้างด้วยสคริปต์ ไม่แก้ด้วยมือ) ที่ `useRiskPoints` รวมกับจุดของทีม ส่วนสภาพอากาศสดแสดงผลอย่างเดียว ไม่แตะสูตรคะแนน

**Tech Stack:** Node 24 (`fetch` ในตัว), CKAN datastore API ของ datagov.mot.go.th, Nominatim reverse geocoding, Open-Meteo, React Native + Expo SDK 54

**อ้างอิง:** `docs/superpowers/specs/2026-09-11-antacinn-help-phase2-design.md` ช่วง D ข้อ 2.3, 2.4, 5, 9

---

## ผลการสำรวจก่อนเขียนแผน (2026-09-11)

**ข้อมูลกระทรวงคมนาคม** (`package_show?id=roadaccident`): ไฟล์ CSV ที่ค้นผ่าน API ได้คือปี 2563–2568 ส่วนปี 2562 และ 2569 ยังไม่เปิด datastore จังหวัดสงขลามี 1,466 เหตุการณ์ ทุกเหตุการณ์มีพิกัด

| ปี | วันที่เกิดเหตุ | เวลา |
|---|---|---|
| 2563–2565 | `2020-01-01T00:00:00` | `17:40` |
| 2566 | `1/2/2023` (เดือน/วัน/ปี ค.ศ. ตัวแรกไม่เกิน 12 ตัวที่สองถึง 31) | `17:40` |
| 2567 | `45292` (ลำดับวันแบบ Excel) | `0.090277778` (สัดส่วนของวัน) |
| 2568 | `45658` (ลำดับวันแบบ Excel) | `4:50` |

ปี 2565: 29 จาก 40 เหตุการณ์ตกวันที่ 1 หรือ 2 ของเดือน และหลายเหตุ "เกิด" หลังวันที่รายงาน แปลว่าวันกับเดือนสลับกัน ใช้นับจำนวนได้ แต่ใช้หาเดือนที่เสี่ยงไม่ได้

มูลเหตุสันนิษฐานมีชื่อซ้ำที่เขียนต่างกัน เช่น "ขับรถเร็วเกินอัตรากำหนด" 812 กับ "ขับรถเร็วเกินอัตราที่กำหนด" 212 ต้องรวมก่อนนับ

**ทดลองจัดกลุ่มรัศมี 500 ม.** (เท่ากับระยะเริ่มเตือน) ผ่านเกณฑ์น้ำหนัก ≥ 10 และเกิดซ้ำ ≥ 2 ปี 37 กลุ่มทั้งกรอบพื้นที่ อยู่ในอำเภอหาดใหญ่ 11 กลุ่ม เมืองสงขลา 2 กลุ่ม (ที่เหลืออยู่ในจะนะ นาหม่อม บางกล่ำ สิงหนคร รัตภูมิ) จุดของทีม 12 จุดรวมกับ 13 จุดนี้ได้ 25 จุด ตรงเป้า 20–25 จุดในเอกสารบทที่ 1.3 จึงรับทุกกลุ่มที่ผ่านเกณฑ์ ไม่ตัดเหลือ 5–8 จุดตามที่ประมาณไว้ในเอกสารออกแบบ

**Open-Meteo:** เรียกจากเบราว์เซอร์ได้ (ส่ง CORS header) คลื่นคืนค่าจากจุดกริดทะเลที่ใกล้ที่สุด ซึ่งห่างหาดสมิหลาราว 14 กม. ส่วน `current.precipitation` เป็นปริมาณฝนใน 15 นาทีก่อนหน้า (`interval: 900`) ต้องคูณ 4 เป็นรายชั่วโมงก่อนเทียบเกณฑ์ WMO

## การตัดสินใจที่ต่างจากเอกสารออกแบบ

- เอกสารออกแบบเขียนว่า "เพิ่มจุดทางหลวงใน `data/riskPoints.json`" แผนนี้เขียนลงไฟล์แยก `data/officialRiskPoints.json` แทน โครงสร้างฟิลด์เหมือนกันทุกอย่าง เหตุผล: ปีหน้าทีมรันสคริปต์ใหม่แล้วเขียนทับไฟล์นี้ได้ทั้งไฟล์ โดยไม่ต้องรวมมือกับจุดที่ทีมกรอกเอง
- ย้าย `describeHours` จากหน้ารายละเอียดไป `utils/format.js` พร้อมเทสต์ เพราะช่วงเวลาที่คำนวณจากข้อมูลจริงอาจข้ามเที่ยงคืน (23:00–02:00) ซึ่งฟังก์ชันเดิมแสดงผิดเป็น 00:00–24:00

## โครงสร้างไฟล์

| ไฟล์ | สร้าง/แก้ | หน้าที่ |
|---|---|---|
| `utils/motRecords.js` | สร้าง | แปลงวันที่ เวลา มูลเหตุ และแถวดิบของกระทรวงคมนาคม |
| `utils/motClusters.js` | สร้าง | จัดกลุ่มอุบัติเหตุที่เกิดใกล้กัน |
| `utils/format.js` | แก้ | เพิ่ม `describeHours` |
| `utils/officialPoint.js` | สร้าง | สร้างจุดเสี่ยงจากกลุ่ม (สถิติรายปี ช่วงเสี่ยง คำแนะนำ แหล่งอ้างอิง) |
| `scripts/mot-accidents.mjs` | สร้าง | ดึงข้อมูล → จัดกลุ่ม → หาอำเภอ → เขียนไฟล์และรายงาน |
| `data/officialRiskPoints.json` | สร้าง (โดยสคริปต์) | จุดเสี่ยงทางการ |
| `data/MOT_REPORT.md` | สร้าง (โดยสคริปต์) | รายงานที่มาและวิธีคิด |
| `hooks/useRiskPoints.js` | แก้ | รวมจุดทางการ |
| `utils/conditions.js` | สร้าง | จัดระดับคลื่นและฝน ดึงข้อมูล Open-Meteo |
| `hooks/useLiveConditions.js` | สร้าง | ดึงสภาพตอนนี้ในหน้าจอ |
| `components/ConditionsCard.js` | สร้าง | การ์ดสภาพตอนนี้ |
| `screens/RiskDetailScreen.js` | แก้ | ใช้ `describeHours` ใหม่ และแสดงการ์ดสภาพตอนนี้ |
| `screens/HomeScreen.js` | แก้ | แถบเตือนเมื่อคลื่นแรง |
| `constants/config.js`, `constants/theme.js` | แก้ | ค่าคงที่ของ Open-Meteo และสีระวัง |
| `package.json` | แก้ | `npm run data:mot` |

---

## Task 1: แปลงข้อมูลดิบของกระทรวงคมนาคม

**Files:**
- Create: `utils/motRecords.js`
- Test: `tests/motRecords.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/motRecords.test.js`

```javascript
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
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL หาไฟล์ `utils/motRecords.js` ไม่เจอ

- [ ] **Step 3: สร้าง `utils/motRecords.js`**

```javascript
/**
 * แปลงข้อมูลอุบัติเหตุดิบของกระทรวงคมนาคม ให้อยู่ในรูปแบบเดียวกันทุกปี
 *
 * แหล่งข้อมูล: datagov.mot.go.th ชุด "อุบัติเหตุบนโครงข่ายถนนของกระทรวงคมนาคม" (roadaccident)
 *
 * ปัญหาที่ไฟล์นี้แก้: แต่ละปีเก็บวันที่และเวลาคนละรูปแบบ (ตรวจเมื่อ 2026-09-11)
 *   ปี 2563–2565  วันที่ "2020-01-01T00:00:00"           เวลา "17:40"
 *   ปี 2566       วันที่ "1/2/2023" (เดือน/วัน/ปี ค.ศ.)   เวลา "17:40"
 *   ปี 2567       วันที่ 45292 (ลำดับวันแบบ Excel)        เวลา 0.736 (สัดส่วนของวัน)
 *   ปี 2568       วันที่ 45658 (ลำดับวันแบบ Excel)        เวลา "17:40"
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

/** วันที่ 0 ของลำดับวันแบบ Excel (Excel นับ 29 ก.พ. 1900 ที่ไม่มีจริงด้วย จึงเริ่มที่ 30 ธ.ค. 1899) */
const EXCEL_DAY_ZERO_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * ปีที่วันกับเดือนในข้อมูลต้นทางสลับกัน ใช้นับจำนวนเหตุได้ แต่ใช้หาเดือนที่เสี่ยงไม่ได้
 * ปี 2565: 29 จาก 40 เหตุการณ์ตกวันที่ 1 หรือ 2 ของเดือน และหลายเหตุ "เกิด" หลังวันที่รายงาน
 */
export const YEARS_WITH_SWAPPED_DAY_MONTH = [2565];

/** ชื่อมูลเหตุที่เขียนต่างกันแต่หมายถึงเรื่องเดียวกัน (หลังตัดช่องว่างรอบ / แล้ว) */
const CAUSE_ALIASES = {
  'ขับรถเร็วเกินอัตราที่กำหนด': 'ขับรถเร็วเกินอัตรากำหนด',
  'มีการตัดหน้าระยะกระชั้นชิด': 'คน/รถ/สัตว์ตัดหน้ากระชั้นชิด',
  'ยางรถยนต์ชำรุด': 'ยางเสื่อมสภาพ/ยางแตก',
  'ถนนลื่น (เนื่องจากสภาพอากาศ)': 'ถนนลื่น',
  'ขับรถไม่ชำนาญ/ไม่เป็น': 'ไม่คุ้นเคยเส้นทาง/ขับรถไม่ชำนาญ',
  'ใช้โทรศัพท์ขณะขับรถ': 'ใช้โทรศัพท์เคลื่อนที่ขณะขับรถ',
};

function validDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * @returns { year, month, day } ปี ค.ศ. หรือ null ถ้าแปลงไม่ได้
 */
export function parseMotDate(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const monthFirst = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (monthFirst) return validDate(Number(monthFirst[3]), Number(monthFirst[1]), Number(monthFirst[2]));

  // ลำดับวันแบบ Excel ต้องเป็นตัวเลขห้าหลัก (ปี 1927–2173) กันตัวเลขอื่นที่บังเอิญเป็นตัวเลขล้วน
  if (/^\d{5}(\.\d+)?$/.test(text)) {
    const date = new Date(EXCEL_DAY_ZERO_MS + Math.floor(Number(text)) * DAY_MS);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }

  return null;
}

/**
 * @returns ชั่วโมง 0–23 ที่เกิดเหตุ หรือ null ถ้าแปลงไม่ได้
 */
export function parseMotTime(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();

  const clock = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (clock) {
    const hour = Number(clock[1]);
    return hour <= 23 ? hour : null;
  }

  // สัดส่วนของวันแบบ Excel: 0.5 = 12:00 น.
  // บวกค่าเล็กมากก่อนปัดลง เพราะทศนิยมที่ถูกตัดมา เช่น 0.041666666 (01:00) คูณ 24 ได้ 0.99999998
  if (/^(0?\.\d+|0)$/.test(text)) {
    return Math.floor(Number(text) * 24 + 1e-6);
  }

  return null;
}

/** รวมชื่อมูลเหตุที่เขียนต่างกันให้เป็นชื่อเดียว */
export function normalizeCause(value) {
  const text = String(value || '').trim().replace(/\s*\/\s*/g, '/');
  return CAUSE_ALIASES[text] || text;
}

function toPeopleCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

/**
 * แปลงหนึ่งแถวจาก API ของกระทรวงคมนาคม
 * @param raw แถวดิบ (ชื่อฟิลด์ภาษาไทยตามต้นทาง)
 * @param yearBE ปี พ.ศ. ของไฟล์ที่แถวนี้มา
 * @returns เหตุการณ์ในรูปแบบที่ใช้ต่อได้ หรือ null ถ้าไม่มีพิกัด
 */
export function normalizeMotRecord(raw, yearBE) {
  const lat = Number(raw.LATITUDE);
  const lng = Number(raw.LONGITUDE);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;

  const date = parseMotDate(raw['วันที่เกิดเหตุ']);
  // เดือนใช้ได้เมื่อปีในวันที่ตรงกับปีของไฟล์ และไม่ใช่ปีที่รู้ว่าวันกับเดือนสลับกัน
  const isMonthReliable =
    date !== null && date.year + 543 === yearBE && !YEARS_WITH_SWAPPED_DAY_MONTH.includes(yearBE);
  const isKmMissing = raw.KM === null || raw.KM === undefined || raw.KM === '';

  return {
    yearBE,
    month: isMonthReliable ? date.month : null,
    hour: parseMotTime(raw['เวลา']),
    lat,
    lng,
    fatal: toPeopleCount(raw['ผู้เสียชีวิต']),
    serious: toPeopleCount(raw['ผู้บาดเจ็บสาหัส']),
    minor: toPeopleCount(raw['ผู้บาดเจ็บเล็กน้อย']),
    route: String(raw['รหัสสายทาง'] || '').trim(),
    km: isKmMissing || !Number.isFinite(Number(raw.KM)) ? null : Number(raw.KM),
    cause: normalizeCause(raw['มูลเหตุสันนิษฐาน']),
    isRaining: String(raw['สภาพอากาศ'] || '').trim() === 'ฝนตก',
  };
}
```

- [ ] **Step 4: รันเทสต์**

Run: `npm test`
Expected: `pass 185` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/motRecords.js tests/motRecords.test.js
git commit -m "feat: แปลงข้อมูลอุบัติเหตุกระทรวงคมนาคมที่แต่ละปีใช้รูปแบบวันที่ต่างกัน 4 แบบ"
```

---

## Task 2: จัดกลุ่มอุบัติเหตุที่เกิดใกล้กัน

**Files:**
- Create: `utils/motClusters.js`
- Test: `tests/motClusters.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/motClusters.test.js`

```javascript
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
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL หาไฟล์ `utils/motClusters.js` ไม่เจอ

- [ ] **Step 3: สร้าง `utils/motClusters.js`**

```javascript
/**
 * รวมอุบัติเหตุที่เกิดใกล้กันเป็น "จุดรวมเหตุ"
 *
 * วิธีการ: เรียงเหตุการณ์จากรุนแรงมากไปน้อย หยิบเหตุที่รุนแรงที่สุดที่ยังไม่มีกลุ่มเป็นแกน
 * แล้วดึงทุกเหตุที่ยังไม่มีกลุ่มในรัศมีรอบแกนเข้ามาเป็นกลุ่มเดียวกัน ทำซ้ำจนครบทุกเหตุ
 * เลือกวิธีนี้เพราะอธิบายได้ในประโยคเดียว ได้ผลเหมือนเดิมทุกครั้งที่รัน
 * และแกนของกลุ่มคือที่ที่เคยเกิดเหตุร้ายแรงจริง
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { haversineMeters } from './geo.js';
import { SEVERITY_WEIGHTS } from '../constants/config.js';

/** น้ำหนักความรุนแรงของเหตุการณ์หรือของผลรวม ใช้น้ำหนักเดียวกับสูตรคะแนน */
export function incidentWeight({ fatal, serious, minor }) {
  return fatal * SEVERITY_WEIGHTS.fatal + serious * SEVERITY_WEIGHTS.serious + minor * SEVERITY_WEIGHTS.minor;
}

/**
 * ตัวแทนของกลุ่ม = เหตุการณ์ที่ห่างจากเหตุอื่นในกลุ่มรวมกันน้อยที่สุด
 * ใช้แทนค่าเฉลี่ยพิกัด เพราะค่าเฉลี่ยของเหตุบนทางโค้งอาจตกนอกถนน ส่วนตัวแทนเป็นจุดเกิดเหตุจริงเสมอ
 */
export function medoid(members) {
  let best = members[0];
  let bestTotalM = Infinity;
  for (const candidate of members) {
    const totalM = members.reduce((sum, other) => sum + haversineMeters(candidate, other), 0);
    if (totalM < bestTotalM) {
      bestTotalM = totalM;
      best = candidate;
    }
  }
  return best;
}

/**
 * สรุปกลุ่ม
 * @returns { center, representative, members, fatal, serious, minor, weight, years }
 *   representative = เหตุการณ์ตัวแทน (ใช้ต่อ เช่น สายทางและหลักกิโลเมตรของจุดนี้)
 */
export function summarizeCluster(members) {
  const representative = medoid(members);
  const totals = members.reduce(
    (sum, item) => ({
      fatal: sum.fatal + item.fatal,
      serious: sum.serious + item.serious,
      minor: sum.minor + item.minor,
    }),
    { fatal: 0, serious: 0, minor: 0 }
  );

  return {
    center: { lat: representative.lat, lng: representative.lng },
    representative,
    members,
    ...totals,
    weight: incidentWeight(totals),
    years: [...new Set(members.map((item) => item.yearBE))].sort((a, b) => a - b),
  };
}

/**
 * @param incidents เหตุการณ์จาก normalizeMotRecord
 * @param radiusM รัศมีรอบแกนของกลุ่ม หน่วยเมตร
 * @returns กลุ่มเรียงจากน้ำหนักมากไปน้อย
 */
export function clusterIncidents(incidents, radiusM) {
  const bySeverity = [...(incidents || [])].sort((a, b) => incidentWeight(b) - incidentWeight(a));
  const grouped = new Set();
  const clusters = [];

  for (const seed of bySeverity) {
    if (grouped.has(seed)) continue;
    const members = bySeverity.filter((item) => !grouped.has(item) && haversineMeters(seed, item) <= radiusM);
    members.forEach((item) => grouped.add(item));
    clusters.push(summarizeCluster(members));
  }

  return clusters.sort((a, b) => b.weight - a.weight || b.members.length - a.members.length);
}
```

- [ ] **Step 4: รันเทสต์**

Run: `npm test`
Expected: `pass 192` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/motClusters.js tests/motClusters.test.js
git commit -m "feat: จัดกลุ่มอุบัติเหตุที่เกิดใกล้กัน โดยใช้เหตุที่รุนแรงที่สุดเป็นแกน"
```

---

## Task 3: ช่วงเวลาที่เสี่ยงที่ข้ามเที่ยงคืนได้

**Files:**
- Modify: `utils/format.js`
- Modify: `screens/RiskDetailScreen.js`
- Test: `tests/format.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** ต่อท้าย `tests/format.test.js` และเพิ่ม `describeHours` ในรายการ import

```javascript
test('describeHours: ยังไม่มีข้อมูล', () => {
  assert.equal(describeHours([]), 'ยังไม่ระบุ');
  assert.equal(describeHours(undefined), 'ยังไม่ระบุ');
});

test('describeHours: ช่วงต่อเนื่อง ไม่สนลำดับที่กรอก ชั่วโมงสุดท้ายนับถึงต้นชั่วโมงถัดไป', () => {
  assert.equal(describeHours([17, 18, 19]), '17:00-20:00');
  assert.equal(describeHours([19, 17, 18]), '17:00-20:00');
});

test('describeHours: ช่วงข้ามเที่ยงคืน', () => {
  assert.equal(describeHours([23, 0, 1]), '23:00-02:00');
  assert.equal(describeHours([22, 23]), '22:00-00:00');
});

test('describeHours: หลายช่วงแยกกัน', () => {
  assert.equal(describeHours([8, 17, 18]), '08:00-09:00, 17:00-19:00');
});
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL `describeHours` ไม่มีอยู่

- [ ] **Step 3: เพิ่ม `describeHours` ต่อท้าย `utils/format.js`**

```javascript
/**
 * ช่วงเวลาที่เสี่ยง เช่น [17, 18, 19] → "17:00-20:00"
 * ชั่วโมง 19 หมายถึงช่วง 19:00–20:00 เวลาสิ้นสุดจึงเป็นชั่วโมงสุดท้าย + 1
 * รองรับช่วงข้ามเที่ยงคืน [23, 0, 1] → "23:00-02:00" และหลายช่วง [8, 17, 18] → "08:00-09:00, 17:00-19:00"
 */
export function describeHours(peakHours) {
  const hours = [...new Set(Array.isArray(peakHours) ? peakHours : [])]
    .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23)
    .sort((a, b) => a - b);
  if (hours.length === 0) return 'ยังไม่ระบุ';
  if (hours.length === 24) return 'ตลอดทั้งวัน';

  // แบ่งเป็นช่วงต่อเนื่อง
  const runs = [];
  for (const hour of hours) {
    const currentRun = runs[runs.length - 1];
    if (currentRun && hour === currentRun[currentRun.length - 1] + 1) currentRun.push(hour);
    else runs.push([hour]);
  }

  // ช่วงที่ลงท้าย 23 กับช่วงที่เริ่ม 0 คือช่วงเดียวกันที่ข้ามเที่ยงคืน
  const lastRun = runs[runs.length - 1];
  if (runs.length > 1 && runs[0][0] === 0 && lastRun[lastRun.length - 1] === 23) {
    lastRun.push(...runs.shift());
  }

  const clock = (hour) => `${String(hour % 24).padStart(2, '0')}:00`;
  return runs.map((run) => `${clock(run[0])}-${clock(run[run.length - 1] + 1)}`).join(', ');
}
```

- [ ] **Step 4: ใช้ใน `screens/RiskDetailScreen.js`**

ลบทั้งฟังก์ชัน `describeHours` ในไฟล์ (รวมคอมเมนต์ด้านบน) แล้วแทนที่ `import { summarizeIncidents } from '../utils/format';` ด้วย

```javascript
import { summarizeIncidents, describeHours } from '../utils/format';
```

- [ ] **Step 5: ตรวจ**

Run: `npm test` → `pass 196` `fail 0`
Run: `npm run check:imports` → `OK`

- [ ] **Step 6: Commit**

```bash
git add utils/format.js tests/format.test.js screens/RiskDetailScreen.js
git commit -m "fix: ช่วงเวลาเสี่ยงที่ข้ามเที่ยงคืนแสดงผิดเป็น 00:00-24:00

ย้าย describeHours ไป utils/format.js พร้อมเทสต์ รองรับช่วงข้ามเที่ยงคืนและหลายช่วง"
```

---

## Task 4: สร้างจุดเสี่ยงจากกลุ่มอุบัติเหตุ

**Files:**
- Create: `utils/officialPoint.js`
- Test: `tests/officialPoint.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/officialPoint.test.js`

```javascript
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
  assert.deepEqual(findPeakWindow([1, 1, 1, 1], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), [1]);
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
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL หาไฟล์ `utils/officialPoint.js` ไม่เจอ

- [ ] **Step 3: สร้าง `utils/officialPoint.js`**

```javascript
/**
 * แปลง "จุดรวมเหตุ" จากข้อมูลกระทรวงคมนาคม ให้เป็นจุดเสี่ยงรูปแบบเดียวกับ data/riskPoints.json
 *
 * ทุกข้อความในจุดที่สร้าง (สถิติ ช่วงเวลา คำแนะนำ) มาจากข้อมูลทางการของกลุ่มนั้นเท่านั้น
 * จึงตั้ง verified: true ได้ตามนิยามของทีม (UNVERIFIED_TEXT ใน constants/config.js)
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { DEFAULT_EMERGENCY, CATEGORIES } from '../constants/config.js';
import { describeHours } from './format.js';

/** สายด่วนตำรวจทางหลวง ใช้กับจุดบนทางหลวง */
export const HIGHWAY_POLICE = { label: 'ตำรวจทางหลวง', tel: '1193' };

const DATASET_NAME = 'อุบัติเหตุบนโครงข่ายถนนของกระทรวงคมนาคม';
const DATASET_URL = 'datagov.mot.go.th/dataset/roadaccident';

/**
 * คำแนะนำตามมูลเหตุ (ชื่อผ่าน normalizeCause แล้ว)
 * ท่อนแรกก่อนเว้นวรรคต้องเป็นประโยคที่ครบในตัว เพราะโหมดเดินทางพูดเฉพาะท่อนแรก (utils/alertMessage.js)
 */
const CAUSE_ADVICE = {
  'ขับรถเร็วเกินอัตรากำหนด': 'ลดความเร็วก่อนถึงช่วงนี้',
  'หลับใน': 'ถ้าง่วงให้จอดพักก่อนถึงช่วงนี้',
  'คน/รถ/สัตว์ตัดหน้ากระชั้นชิด': 'ระวังรถหรือคนตัดหน้า เว้นระยะจากคันหน้าให้มากขึ้น',
  'อุปกรณ์ยานพาหนะบกพร่อง': 'ตรวจเบรกและไฟรถก่อนเดินทาง',
  'ยางเสื่อมสภาพ/ยางแตก': 'ตรวจสภาพยางและลมยางก่อนเดินทาง',
  'เมาสุรา': 'ระวังรถที่ขับส่ายไปมา โดยเฉพาะช่วงกลางคืน',
  'ถนนลื่น': 'ลดความเร็วเมื่อถนนเปียก',
  'ฝ่าฝืนสัญญาณไฟ/เครื่องหมายจราจร': 'ชะลอก่อนถึงทางแยก ระวังรถฝ่าสัญญาณไฟ',
  'แซงรถอย่างผิดกฎหมาย': 'อย่าแซงในช่วงนี้ ระวังรถสวนที่แซงมา',
  'ทางโค้งอันตราย': 'ชะลอความเร็วก่อนเข้าโค้ง',
};
const GENERIC_ADVICE = 'ลดความเร็วและเพิ่มความระวังเมื่อผ่านช่วงนี้';

/** ช่วงเสี่ยงยาว 3 ชั่วโมงหรือ 3 เดือน */
const PEAK_WINDOW_SIZE = 3;
/** ต้องมีเหตุในช่วงอย่างน้อย 3 ครั้ง และเป็นอย่างน้อยครึ่งหนึ่งของเหตุที่รู้เวลา ถึงนับว่าเป็นช่วงเสี่ยงสูง */
const PEAK_MIN_COUNT = 3;
const PEAK_MIN_SHARE = 0.5;

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const round5 = (value) => Math.round(value * 1e5) / 1e5;

/**
 * หาช่วงต่อเนื่องที่มีเหตุมากที่สุด วนรอบได้ เช่น ธ.ค.–ม.ค. หรือ 23:00–01:00
 * คืนเฉพาะค่าในช่วงนั้นที่เกิดเหตุจริง (ไม่เติมเดือนหรือชั่วโมงที่ไม่มีเหตุเข้าไปให้ครบ 3)
 * และคืนค่าเฉพาะเมื่อมีหลักฐานพอ ไม่งั้นคืนอาเรย์ว่าง
 * เพราะช่วงเสี่ยงเป็นตัวคูณคะแนน ใส่จากหลักฐานน้อยเกินไปจะดันคะแนนสูงเกินจริง
 * @param values ค่าที่พบในแต่ละเหตุ (null = ไม่รู้ ไม่นับ)
 * @param domain ค่าที่เป็นไปได้ทั้งหมดเรียงตามลำดับ เช่น เดือน 1–12
 */
export function findPeakWindow(values, domain) {
  const known = (values || []).filter((value) => domain.includes(value));
  if (known.length < PEAK_MIN_COUNT) return [];

  let bestWindow = [];
  let bestCount = 0;
  for (let start = 0; start < domain.length; start++) {
    const window = Array.from({ length: PEAK_WINDOW_SIZE }, (_, i) => domain[(start + i) % domain.length]);
    const count = known.filter((value) => window.includes(value)).length;
    if (count > bestCount) {
      bestCount = count;
      bestWindow = window;
    }
  }

  const hasEnoughEvidence = bestCount >= PEAK_MIN_COUNT && bestCount / known.length >= PEAK_MIN_SHARE;
  return hasEnoughEvidence ? bestWindow.filter((value) => known.includes(value)) : [];
}

/** รวมจำนวนผู้เสียชีวิตและบาดเจ็บของแต่ละปี ในรูปแบบ incidents ของ riskPoints.json (ปีใหม่ขึ้นก่อน) */
export function incidentsByYear(members) {
  const years = [...new Set(members.map((item) => item.yearBE))].sort((a, b) => b - a);
  const result = [];
  for (const year of years) {
    const ofYear = members.filter((item) => item.yearBE === year);
    const note = `ข้อมูลกระทรวงคมนาคม ปี ${year}: เกิดเหตุ ${ofYear.length} ครั้งในบริเวณนี้`;
    for (const severity of ['fatal', 'serious', 'minor']) {
      const count = ofYear.reduce((sum, item) => sum + item[severity], 0);
      if (count > 0) result.push({ year, severity, count, note });
    }
  }
  return result;
}

/** นับค่าที่ซ้ำกัน เรียงจากพบมากไปน้อย */
function countByValue(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function buildAdvice(members, peakHours) {
  const lines = [];
  const [topCause] = countByValue(members.map((item) => item.cause).filter(Boolean));
  if (topCause) {
    const [cause, count] = topCause;
    lines.push(
      `${CAUSE_ADVICE[cause] || GENERIC_ADVICE} (มูลเหตุที่บันทึกบ่อยที่สุด: ${cause} ${count} จาก ${members.length} ครั้ง)`
    );
  } else {
    lines.push(GENERIC_ADVICE);
  }

  const rainyCount = members.filter((item) => item.isRaining).length;
  if (rainyCount >= 2 && rainyCount / members.length >= 1 / 3) {
    lines.push(`ระวังเป็นพิเศษตอนฝนตก ${rainyCount} จาก ${members.length} ครั้งเกิดขณะฝนตก`);
  }
  if (peakHours.length > 0) {
    lines.push(`เกิดเหตุบ่อยช่วง ${describeHours(peakHours)} น.`);
  }
  return lines;
}

function buildSource(cluster, info) {
  const years = cluster.years;
  const yearText = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : `${years[0]}`;
  return (
    `กระทรวงคมนาคม ชุดข้อมูล "${DATASET_NAME}" (${DATASET_URL} สัญญาอนุญาต Open Data Common) ` +
    `ปี ${yearText}: เกิดเหตุ ${cluster.members.length} ครั้งในรัศมี ${info.radiusM} ม. ` +
    `ผู้เสียชีวิต ${cluster.fatal} บาดเจ็บสาหัส ${cluster.serious} บาดเจ็บเล็กน้อย ${cluster.minor} ราย ` +
    `ดึงข้อมูลเมื่อ ${info.fetchedDate} ด้วย scripts/mot-accidents.mjs`
  );
}

/**
 * @param cluster ผลจาก clusterIncidents / summarizeCluster
 * @param info { id, name, district, fetchedDate, radiusM }
 */
export function buildOfficialPoint(cluster, info) {
  const { members } = cluster;
  const peakHours = findPeakWindow(
    members.map((item) => item.hour),
    HOURS
  );

  return {
    id: info.id,
    name: info.name,
    category: CATEGORIES.ROAD,
    type: 'crash',
    district: info.district,
    coordinate: { lat: round5(cluster.center.lat), lng: round5(cluster.center.lng) },
    incidents: incidentsByYear(members),
    peakMonths: findPeakWindow(
      members.map((item) => item.month),
      MONTHS
    ),
    peakHours,
    advice: buildAdvice(members, peakHours),
    emergency: [DEFAULT_EMERGENCY, HIGHWAY_POLICE],
    source: buildSource(cluster, info),
    verified: true,
  };
}
```

- [ ] **Step 4: รันเทสต์**

Run: `npm test`
Expected: `pass 206` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/officialPoint.js tests/officialPoint.test.js
git commit -m "feat: สร้างจุดเสี่ยงจากกลุ่มอุบัติเหตุทางการ ทุกข้อความมาจากข้อมูลจริง"
```

---

## Task 5: สคริปต์ดึงข้อมูลที่ทีมรันซ้ำได้ทุกปี

**Files:**
- Create: `scripts/mot-accidents.mjs`
- Modify: `package.json`
- Create (โดยสคริปต์): `data/officialRiskPoints.json`, `data/MOT_REPORT.md`

- [ ] **Step 1: สร้าง `scripts/mot-accidents.mjs`**

```javascript
/**
 * สร้างจุดเสี่ยงบนทางหลวงจากข้อมูลอุบัติเหตุทางการของกระทรวงคมนาคม
 *
 * ผลลัพธ์:
 *   data/officialRiskPoints.json  จุดเสี่ยงที่ผ่านเกณฑ์ แอปโหลดใช้ทันที
 *                                 ห้ามแก้ไฟล์นี้ด้วยมือ ให้รันสคริปต์ใหม่แทน (รันแล้วเขียนทับทั้งไฟล์)
 *   data/MOT_REPORT.md            รายงานที่มา วิธีคิด และรายการที่ผ่าน/ไม่ผ่านเกณฑ์ ให้ตรวจย้อนได้
 *
 * วิธีใช้ (ต้องต่ออินเทอร์เน็ต ใช้เวลาราว 1 นาที): npm run data:mot
 * กระทรวงเปิดข้อมูลปีใหม่เมื่อไหร่ รันซ้ำได้เลย สคริปต์หาไฟล์ของทุกปีเองจากหน้าชุดข้อมูล
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeMotRecord } from '../utils/motRecords.js';
import { clusterIncidents } from '../utils/motClusters.js';
import { buildOfficialPoint } from '../utils/officialPoint.js';
import { isInServiceArea } from '../utils/geo.js';
import { validateRiskPoints } from '../utils/dataValidation.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://datagov.mot.go.th/api/3/action';
const DATASET_ID = 'roadaccident';
const PROVINCE = 'สงขลา';
const USER_AGENT = 'AntacinnHelp-student-project/1.0 (MOT data pipeline)';

/** เกณฑ์คัดจุด (เอกสารออกแบบระยะที่ 2 ข้อ D2) */
const CLUSTER_RADIUS_M = 500; // เท่ากับระยะเริ่มเตือนของโหมดเดินทาง
const MIN_YEARS = 2; // เกิดซ้ำอย่างน้อย 2 ปี ไม่ใช่เหตุบังเอิญครั้งเดียว
const MIN_WEIGHT = 10; // น้ำหนักรวม ตาย 5 สาหัส 3 เล็กน้อย 1

/** อำเภอเป้าหมายตามขอบเขตเอกสารบทที่ 1.3 และคำนำหน้า id */
const TARGET_DISTRICTS = { 'หาดใหญ่': 'hy', 'เมืองสงขลา': 'sk' };

/** ชื่อที่คนในพื้นที่เรียกทางหลวงสายหลัก ใช้ตั้งชื่อจุดคู่กับหลักกิโลเมตรของสายเดียวกัน */
const HIGHWAY_NAMES = { '4': 'ถนนเพชรเกษม', '407': 'ถนนกาญจนวนิช', '414': 'ถนนลพบุรีราเมศวร์' };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const today = new Date().toISOString().slice(0, 10);

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

/** ไฟล์ CSV ของทุกปีที่เปิดให้ค้นผ่าน API */
async function listYearResources() {
  const { result } = await getJson(`${API}/package_show?id=${DATASET_ID}`);
  const usable = [];
  const skipped = [];
  for (const resource of result.resources) {
    const year = Number((String(resource.name).match(/ปี\s*(\d{4})/) || [])[1]);
    if (!year || String(resource.format).toUpperCase() !== 'CSV') continue;
    if (resource.datastore_active) usable.push({ year, id: resource.id });
    else skipped.push(year);
  }
  return {
    title: result.title,
    license: result.license_title,
    usable: usable.sort((a, b) => a.year - b.year),
    skipped: skipped.sort(),
  };
}

/** ดึงทุกแถวของจังหวัดเป้าหมายในไฟล์เดียว ทีละ 1,000 แถว */
async function pullProvince(resourceId) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const query = new URLSearchParams({
      resource_id: resourceId,
      filters: JSON.stringify({ 'จังหวัด': PROVINCE }),
      limit: '1000',
      offset: String(offset),
    });
    const { result } = await getJson(`${API}/datastore_search?${query}`);
    rows.push(...result.records);
    if (offset + 1000 >= result.total) return rows;
  }
}

/** หาอำเภอและชื่อหมู่บ้านจากพิกัด (Nominatim อนุญาต 1 ครั้งต่อวินาที) */
async function reverseGeocode({ lat, lng }) {
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&accept-language=th' +
    `&lat=${lat}&lon=${lng}`;
  const { address = {} } = await getJson(url);
  const district = String(address.county || address.state_district || '').replace(/^อำเภอ/, '').trim();
  // ใช้เฉพาะชื่อที่เป็นภาษาไทยล้วน บางที่ใน OpenStreetMap มีแต่ชื่ออังกฤษ
  const locality =
    [address.village, address.hamlet, address.suburb, address.quarter, address.town].find(
      (name) => name && /[฀-๿]/.test(name) && !/[A-Za-z]/.test(name)
    ) || '';
  return { district, locality };
}

function roadLabel(route) {
  if (HIGHWAY_NAMES[route]) return HIGHWAY_NAMES[route];
  if (/^สข\./.test(route)) return `ทางหลวงชนบท ${route}`;
  return `ทางหลวงหมายเลข ${route}`;
}

/** ชื่อจุด = ถนน + หลักกิโลเมตร + หมู่บ้าน เช่น "ถนนลพบุรีราเมศวร์ กม. 3.6 ช่วงบ้านท่านางหอม" */
function nameFor(cluster, locality) {
  const { route, km } = cluster.representative;
  const kmText = km !== null ? ` กม. ${km.toFixed(1)}` : '';
  return `${roadLabel(route)}${kmText}${locality ? ` ช่วง${locality}` : ''}`;
}

function idFor(prefix, cluster, usedIds) {
  const { route, km } = cluster.representative;
  const routeSlug = route.replace(/\D/g, '') || 'road';
  const kmSlug = km !== null ? `km${km.toFixed(1).replace('.', '-')}` : 'km-na';
  let id = `${prefix}-mot-${routeSlug}-${kmSlug}`;
  for (let n = 2; usedIds.has(id); n++) id = `${prefix}-mot-${routeSlug}-${kmSlug}-${n}`;
  usedIds.add(id);
  return id;
}

function writeReport({ dataset, yearStats, candidates, points }) {
  const lines = [
    '# รายงานจุดเสี่ยงจากข้อมูลกระทรวงคมนาคม',
    '',
    `สร้างโดย \`scripts/mot-accidents.mjs\` เมื่อ ${today} ห้ามแก้ไฟล์นี้ด้วยมือ ให้รัน \`npm run data:mot\` ใหม่`,
    '',
    `ชุดข้อมูล: **${dataset.title}** (https://datagov.mot.go.th/dataset/${DATASET_ID}) สัญญาอนุญาต ${dataset.license}`,
    `จังหวัด: ${PROVINCE}`,
    '',
    '## ข้อมูลที่ใช้',
    '',
    '| ปี | เหตุการณ์ | มีพิกัด | อยู่ในพื้นที่ให้บริการ | ผู้เสียชีวิต |',
    '|---|---|---|---|---|',
    ...yearStats.map((s) => `| ${s.year} | ${s.rows} | ${s.withCoordinate} | ${s.inArea} | ${s.fatal} |`),
    '',
    dataset.skipped.length > 0
      ? `ปีที่ยังค้นผ่าน API ไม่ได้ (ยังไม่เปิด datastore): ${dataset.skipped.join(', ')}`
      : 'ทุกปีที่มีไฟล์ค้นผ่าน API ได้',
    '',
    '## ข้อควรรู้เกี่ยวกับข้อมูล',
    '',
    '- ครอบคลุมเฉพาะถนนในความดูแลของกระทรวงคมนาคม (กรมทางหลวง กรมทางหลวงชนบท) ไม่รวมถนนเทศบาลในเมือง',
    '- แต่ละปีเก็บวันที่คนละรูปแบบ แปลงด้วย `utils/motRecords.js` ที่มีเทสต์คุมทุกรูปแบบ',
    '- ปี 2565 วันกับเดือนสลับกัน จึงไม่ใช้หาเดือนที่เสี่ยง แต่ยังนับจำนวนเหตุ',
    '- ตัวเลขนับเฉพาะเหตุที่หน่วยงานบันทึก จำนวนจริงอาจสูงกว่านี้',
    '',
    '## วิธีคัดจุด',
    '',
    `1. จัดกลุ่มเหตุที่อยู่ในรัศมี ${CLUSTER_RADIUS_M} ม. โดยใช้เหตุที่รุนแรงที่สุดเป็นแกน (\`utils/motClusters.js\`)`,
    `2. เก็บเฉพาะกลุ่มที่เกิดเหตุซ้ำอย่างน้อย ${MIN_YEARS} ปี และมีน้ำหนักรวม (ตาย 5 สาหัส 3 เล็กน้อย 1) ไม่ต่ำกว่า ${MIN_WEIGHT}`,
    `3. เก็บเฉพาะกลุ่มที่อยู่ในอำเภอ${Object.keys(TARGET_DISTRICTS).join(' หรือ ')} (ตรวจอำเภอจาก OpenStreetMap)`,
    '4. ช่วงเวลาและเดือนที่เสี่ยงใส่เฉพาะเมื่อมีเหตุในช่วง 3 ชั่วโมง/3 เดือนเดียวกันอย่างน้อย 3 ครั้ง และเป็นอย่างน้อยครึ่งหนึ่งของเหตุที่รู้เวลา',
    '',
    '## กลุ่มที่ผ่านเกณฑ์น้ำหนักและจำนวนปี',
    '',
    '| # | พิกัด | สายทาง กม. | เหตุ | ตาย/สาหัส/เล็กน้อย | น้ำหนัก | ปี | อำเภอ | ผล |',
    '|---|---|---|---|---|---|---|---|---|',
    ...candidates.map((c, i) => {
      const r = c.cluster.representative;
      const result = c.pointId ? `✓ ${c.pointId}` : `✗ ${c.reason}`;
      return (
        `| ${i + 1} | ${c.cluster.center.lat.toFixed(5)}, ${c.cluster.center.lng.toFixed(5)} | ${r.route} ${r.km ?? '-'} ` +
        `| ${c.cluster.members.length} | ${c.cluster.fatal}/${c.cluster.serious}/${c.cluster.minor} | ${c.cluster.weight} ` +
        `| ${c.cluster.years.join(', ')} | ${c.district || '-'} | ${result} |`
      );
    }),
    '',
    `## จุดที่เขียนลง data/officialRiskPoints.json (${points.length} จุด)`,
    '',
    ...points.map((p) => `- \`${p.id}\` ${p.name} (${p.district})`),
    '',
  ];
  fs.writeFileSync(path.join(ROOT, 'data', 'MOT_REPORT.md'), lines.join('\n'));
}

async function main() {
  console.log('1/4 อ่านรายการไฟล์ของชุดข้อมูล...');
  const dataset = await listYearResources();

  console.log(`2/4 ดึงข้อมูลจังหวัด${PROVINCE} ${dataset.usable.length} ปี...`);
  const incidents = [];
  const yearStats = [];
  for (const { year, id } of dataset.usable) {
    const rows = await pullProvince(id);
    const normalized = rows.map((row) => normalizeMotRecord(row, year)).filter(Boolean);
    const inArea = normalized.filter((item) => isInServiceArea(item));
    incidents.push(...inArea);
    yearStats.push({
      year,
      rows: rows.length,
      withCoordinate: normalized.length,
      inArea: inArea.length,
      fatal: normalized.reduce((sum, item) => sum + item.fatal, 0),
    });
    console.log(`   ปี ${year}: ${rows.length} เหตุการณ์ อยู่ในพื้นที่ ${inArea.length}`);
  }

  console.log('3/4 จัดกลุ่มและตรวจอำเภอ...');
  const qualified = clusterIncidents(incidents, CLUSTER_RADIUS_M).filter(
    (cluster) => cluster.years.length >= MIN_YEARS && cluster.weight >= MIN_WEIGHT
  );

  const usedIds = new Set();
  const candidates = [];
  const points = [];
  for (const cluster of qualified) {
    const place = await reverseGeocode(cluster.center);
    await sleep(1100);
    const prefix = TARGET_DISTRICTS[place.district];
    if (!prefix) {
      candidates.push({ cluster, district: place.district, reason: 'อยู่นอกอำเภอเป้าหมาย' });
      continue;
    }
    const point = buildOfficialPoint(cluster, {
      id: idFor(prefix, cluster, usedIds),
      name: nameFor(cluster, place.locality),
      district: place.district,
      fetchedDate: today,
      radiusM: CLUSTER_RADIUS_M,
    });
    points.push(point);
    candidates.push({ cluster, district: place.district, pointId: point.id });
    console.log(`   ✓ ${point.name}`);
  }

  // ต้องผ่านกฎเดียวกับจุดที่ทีมกรอกเอง ไม่งั้นไม่เขียนไฟล์
  const errors = validateRiskPoints(points);
  if (errors.length > 0) throw new Error('จุดที่สร้างไม่ผ่านกฎ:\n' + errors.join('\n'));

  console.log('4/4 เขียนไฟล์...');
  fs.writeFileSync(path.join(ROOT, 'data', 'officialRiskPoints.json'), JSON.stringify(points, null, 2) + '\n');
  writeReport({ dataset, yearStats, candidates, points });
  console.log(`เสร็จ: ${points.length} จุด → data/officialRiskPoints.json และรายงาน data/MOT_REPORT.md`);
}

main().catch((error) => {
  console.error('ล้มเหลว:', error.message);
  process.exitCode = 1;
});
```

- [ ] **Step 2: เพิ่มคำสั่งใน `package.json`** ในส่วน `scripts` ต่อจาก `check:imports`

```json
    "data:mot": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/mot-accidents.mjs"
```

- [ ] **Step 3: รันสคริปต์**

Run: `npm run data:mot`
Expected: ปี 2563–2568 ครบ 6 ปี จังหวัดสงขลารวม 1,466 เหตุการณ์ บรรทัดสุดท้าย `เสร็จ: 13 จุด` (± ถ้า OpenStreetMap เปลี่ยน) ไฟล์ `data/officialRiskPoints.json` และ `data/MOT_REPORT.md` ถูกสร้าง

อ่าน `data/MOT_REPORT.md` ทั้งไฟล์ ตรวจว่าแต่ละจุดชื่อสมเหตุสมผล (ถนน กม. หมู่บ้าน) และจุดที่ไม่ผ่านบอกเหตุผล

- [ ] **Step 4: Commit**

```bash
git add scripts/mot-accidents.mjs package.json data/officialRiskPoints.json data/MOT_REPORT.md
git commit -m "data: จุดเสี่ยงบนทางหลวงจากข้อมูลทางการของกระทรวงคมนาคม พร้อมสคริปต์ที่รันซ้ำได้ทุกปี"
```

---

## Task 6: แอปใช้จุดทางการ

**Files:**
- Modify: `hooks/useRiskPoints.js`
- Test: `tests/data.test.js`
- Modify: `data/SOURCES.md`, `README.md`

- [ ] **Step 1: เขียนเทสต์** ต่อท้าย `tests/data.test.js`

```javascript
test('data/officialRiskPoints.json ผ่านกฎทุกข้อ และทุกจุดยืนยันจากข้อมูลทางการ', () => {
  const points = readJson('../data/officialRiskPoints.json');
  assert.ok(points.length > 0, 'ต้องมีจุดทางการอย่างน้อยหนึ่งจุด (รัน npm run data:mot)');
  assert.deepEqual(validateRiskPoints(points), []);
  assert.ok(points.every((point) => point.verified === true));
});

test('id ไม่ซ้ำกันข้ามไฟล์จุดของทีมกับจุดทางการ', () => {
  const ids = [...readJson('../data/riskPoints.json'), ...readJson('../data/officialRiskPoints.json')].map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});
```

Run: `npm test` → `pass 208` `fail 0`

- [ ] **Step 2: รวมจุดทางการใน `hooks/useRiskPoints.js`**

แทนที่ `import baseRiskPoints from '../data/riskPoints.json';` ด้วย

```javascript
import baseRiskPoints from '../data/riskPoints.json';
import officialRiskPoints from '../data/officialRiskPoints.json';
```

แทนที่

```javascript
    // รวมข้อมูลจากไฟล์ JSON กับจุดที่ผู้ใช้บันทึกเอง
    const merged = [...baseRiskPoints, ...savedPoints];
```

ด้วย

```javascript
    // รวมสามแหล่ง: จุดที่ทีมกรอก จุดทางการจากกระทรวงคมนาคม (สร้างด้วย scripts/mot-accidents.mjs)
    // และจุดที่ผู้ใช้บันทึกเอง
    const merged = [...baseRiskPoints, ...officialRiskPoints, ...savedPoints];
```

- [ ] **Step 3: `data/SOURCES.md`** เพิ่มก่อนหัวข้อ `## ข้อมูลภาพรวมระดับอำเภอ`

```markdown
## จุดเสี่ยงทางการ (`officialRiskPoints.json`)

สร้างด้วย `npm run data:mot` จากชุดข้อมูล "อุบัติเหตุบนโครงข่ายถนนของกระทรวงคมนาคม" (datagov.mot.go.th)
ทุกจุดเป็น `verified: true` เพราะมาจากเอกสารทางการ วิธีคัด ตารางกลุ่มที่ผ่านและไม่ผ่าน อยู่ใน `MOT_REPORT.md`
ห้ามแก้ไฟล์นี้ด้วยมือ ให้รันสคริปต์ใหม่
```

- [ ] **Step 4: README** ในหัวข้อ "⚠️ อ่านก่อนใช้งาน: สถานะข้อมูล" แทนที่ย่อหน้าแรก (`**4 จาก 12 จุด** ...` สองบรรทัด) ด้วย

```markdown
ข้อมูลจุดเสี่ยงมาจากสองแหล่ง แยกไฟล์กัน

| ไฟล์ | จำนวน | ที่มา | ป้ายในแอป |
|---|---|---|---|
| `data/riskPoints.json` | 12 จุด (มีเหตุการณ์จริง 4 จุด) | ทีมกรอกจากรายงานข่าว | ⚠️ ยังไม่ยืนยัน |
| `data/officialRiskPoints.json` | ดูจำนวนใน `data/MOT_REPORT.md` | กระทรวงคมนาคม สร้างด้วย `npm run data:mot` | ✓ ข้อมูลทางการ |

จุดของทีมที่มีเหตุการณ์จริง: ทางขึ้นเขาคอหงส์ · หาดชลาทัศน์ · น้ำตกโตนงาช้าง · สะพานติณสูลานนท์ ช่วงที่ 2
```

แทนที่หัวข้อ `### ทำไมทุกจุดยังเป็น \`verified: false\`` ด้วย `### ทำไมจุดของทีมยังเป็น \`verified: false\`` (เนื้อหาเดิมคงไว้) และเพิ่มท้ายหัวข้อ "วิธีกรอกข้อมูลเพิ่ม"

```markdown
- จุดบนทางหลวงไม่ต้องกรอกเอง ปีหน้ากระทรวงคมนาคมเปิดข้อมูลปีใหม่แล้ว รัน `npm run data:mot` ไฟล์จุดทางการและรายงานจะอัปเดตเอง
```

- [ ] **Step 5: Commit**

```bash
git add hooks/useRiskPoints.js tests/data.test.js data/SOURCES.md README.md
git commit -m "feat: แอปแสดงจุดเสี่ยงทางการคู่กับจุดของทีม พร้อมป้าย ✓ ข้อมูลทางการ"
```

---

## Task 7: สภาพคลื่นและฝนสด (ตรรกะ)

**Files:**
- Modify: `constants/config.js`
- Create: `utils/conditions.js`
- Test: `tests/conditions.test.js`

- [ ] **Step 1: ค่าคงที่** ต่อท้าย `constants/config.js`

```javascript

/**
 * ข้อมูลสภาพคลื่นและฝนสดจาก Open-Meteo (ฟรี ไม่ต้องใช้คีย์)
 * ตรวจแล้ว 2026-09-11: เรียกจากเบราว์เซอร์ได้ ใช้ได้ทั้งบนเว็บและ Expo Go
 */
export const CONDITIONS = {
  WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',
  MARINE_URL: 'https://marine-api.open-meteo.com/v1/marine',
  TIMEOUT_MS: 8000,
  /** ใช้ดูคลื่นแถบหาดสมิหลา–ชลาทัศน์ในหน้าแรก (สองหาดใช้จุดกริดทะเลเดียวกันของ Open-Meteo) */
  BEACH_COORDINATE: { lat: 7.21549, lng: 100.59581 },
};

/** ข้อความกำกับทุกที่ที่แสดงสภาพคลื่นหรือฝน (เอกสารออกแบบระยะที่ 2 ข้อ D3) */
export const CONDITIONS_DISCLAIMER = 'ข้อมูลพยากรณ์ ไม่ใช่ประกาศทางการ ให้ยึดธงเตือนและคำสั่งเจ้าหน้าที่เป็นหลัก';
```

- [ ] **Step 2: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/conditions.test.js`

```javascript
/**
 * เทสต์ของ utils/conditions.js
 *
 * ไม่ต่ออินเทอร์เน็ตจริง: แทน fetch ด้วยของปลอม
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWaves, classifyRain, conditionsNeededFor, fetchWaves, fetchRain } from '../utils/conditions.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function respondWith(body, ok = true) {
  globalThis.fetch = async (url) => {
    respondWith.lastUrl = url;
    return { ok, status: ok ? 200 : 500, json: async () => body };
  };
}

test('ระดับคลื่นตาม Douglas Sea Scale และขอบของแต่ละระดับ', () => {
  assert.equal(classifyWaves(0.12).id, 'calm');
  assert.equal(classifyWaves(0.5).id, 'slight');
  assert.equal(classifyWaves(1.25).id, 'rough');
  assert.equal(classifyWaves(2.5).id, 'danger');
  assert.equal(classifyWaves(-1), null);
  assert.equal(classifyWaves(NaN), null);
});

test('ระดับฝนตามเกณฑ์ WMO', () => {
  assert.equal(classifyRain(0).id, 'none');
  assert.equal(classifyRain(1).id, 'light');
  assert.equal(classifyRain(2.5).id, 'moderate');
  assert.equal(classifyRain(7.6).id, 'moderate');
  assert.equal(classifyRain(8).id, 'heavy');
  assert.equal(classifyRain(undefined), null);
});

test('จุดจมน้ำดูคลื่น น้ำตก (ลื่น/ตก ที่เป็นสถานที่ท่องเที่ยว) ดูฝน ถนนไม่ดึงอะไรเลย', () => {
  assert.deepEqual(conditionsNeededFor({ type: 'drowning', category: 'destination' }), { waves: true, rain: false });
  assert.deepEqual(conditionsNeededFor({ type: 'fall', category: 'destination' }), { waves: false, rain: true });
  assert.deepEqual(conditionsNeededFor({ type: 'crash', category: 'road' }), { waves: false, rain: false });
  assert.deepEqual(conditionsNeededFor(null), { waves: false, rain: false });
});

test('ดึงคลื่นสำเร็จ: ได้ความสูง เวลา และระยะถึงจุดกริดทะเลที่ใช้', async () => {
  respondWith({ latitude: 7.291664, longitude: 100.70836, current: { time: '2026-09-11T06:30', wave_height: 1.4 } });
  const waves = await fetchWaves({ lat: 7.21549, lng: 100.59581 });
  assert.equal(waves.heightM, 1.4);
  assert.equal(waves.time, '2026-09-11T06:30');
  assert.ok(Math.abs(waves.gridDistanceM - 14700) < 500, `ระยะ ${waves.gridDistanceM}`);
  assert.ok(respondWith.lastUrl.includes('latitude=7.21549'), respondWith.lastUrl);
});

test('ดึงคลื่นไม่สำเร็จ หรือไม่มีค่าคลื่น คืน null ไม่ throw', async () => {
  globalThis.fetch = async () => {
    throw new Error('ไม่มีอินเทอร์เน็ต');
  };
  assert.equal(await fetchWaves({ lat: 7.2, lng: 100.6 }), null);
  respondWith({ latitude: 7.29, longitude: 100.7, current: { time: 't', wave_height: null } });
  assert.equal(await fetchWaves({ lat: 7.2, lng: 100.6 }), null);
});

test('ฝน: ปริมาณใน 15 นาทีแปลงเป็นรายชั่วโมง', async () => {
  respondWith({ current: { time: '2026-09-11T06:30', interval: 900, precipitation: 0.5 } });
  assert.deepEqual(await fetchRain({ lat: 6.94664, lng: 100.23193 }), { mmPerHour: 2, time: '2026-09-11T06:30' });
});

test('ฝน: บริการตอบผิดพลาด คืน null', async () => {
  respondWith({}, false);
  assert.equal(await fetchRain({ lat: 6.94664, lng: 100.23193 }), null);
});
```

- [ ] **Step 3: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL หาไฟล์ `utils/conditions.js` ไม่เจอ

- [ ] **Step 4: สร้าง `utils/conditions.js`**

```javascript
/**
 * สภาพคลื่นและฝนตอนนี้ จาก Open-Meteo (เอกสารบทที่ 8: อยากเชื่อมข้อมูลสภาพอากาศ)
 *
 * ใช้แสดงผลอย่างเดียว ไม่นำไปคูณคะแนนความเสี่ยง
 * เพราะสูตรคะแนนเป็นการตัดสินใจของทีม และมีเทสต์ "ตรงกับม็อกอัพ" คุมอยู่
 *
 * ฟังก์ชันที่ดึงข้อมูลไม่มีทาง throw: ล้มเหลวคืน null ให้หน้าจอซ่อนการ์ดไปเฉย ๆ
 * ห้ามแสดงค่าเก่าหรือค่าเดา (เอกสารออกแบบระยะที่ 2 ข้อ 5)
 *
 * ไฟล์นี้ไม่ import react
 */

import { CONDITIONS, CATEGORIES } from '../constants/config.js';
import { haversineMeters } from './geo.js';

/** ระดับคลื่นตาม Douglas Sea Scale (มาตรฐานสภาพทะเลที่ใช้สากล) ความสูงต่ำกว่า maxM */
const WAVE_LEVELS = [
  { id: 'calm', maxM: 0.5, label: 'ทะเลสงบ', advice: 'ลงเล่นน้ำเฉพาะในเขตที่มีธงอนุญาต' },
  { id: 'slight', maxM: 1.25, label: 'คลื่นเล็กน้อย', advice: 'ระวังเด็กเล็ก อย่าออกไปไกลจากฝั่ง' },
  { id: 'rough', maxM: 2.5, label: 'คลื่นแรง', advice: 'ไม่ควรลงเล่นน้ำ' },
  { id: 'danger', maxM: Infinity, label: 'คลื่นสูงอันตราย', advice: 'ห้ามลงน้ำเด็ดขาด' },
];

/** ความแรงของฝนรายชั่วโมงตามเกณฑ์ WMO */
const RAIN = {
  none: { id: 'none', label: 'ไม่มีฝน' },
  light: { id: 'light', label: 'ฝนเล็กน้อย' },
  moderate: { id: 'moderate', label: 'ฝนปานกลาง', advice: 'หินลื่นและน้ำอาจหลากฉับพลัน ไม่ควรลงเล่นน้ำ' },
  heavy: { id: 'heavy', label: 'ฝนหนัก', advice: 'น้ำอาจหลากฉับพลัน อย่าเข้าใกล้ลำน้ำ' },
};

/** @returns { id, label, advice } หรือ null ถ้าค่าใช้ไม่ได้ */
export function classifyWaves(heightM) {
  if (!Number.isFinite(heightM) || heightM < 0) return null;
  return WAVE_LEVELS.find((level) => heightM < level.maxM);
}

/** @returns { id, label, advice? } หรือ null ถ้าค่าใช้ไม่ได้ */
export function classifyRain(mmPerHour) {
  if (!Number.isFinite(mmPerHour) || mmPerHour < 0) return null;
  if (mmPerHour === 0) return RAIN.none;
  if (mmPerHour < 2.5) return RAIN.light;
  if (mmPerHour <= 7.6) return RAIN.moderate;
  return RAIN.heavy;
}

/**
 * จุดไหนต้องดูอะไร: จุดจมน้ำดูคลื่น จุดลื่น/ตกที่เป็นสถานที่ท่องเที่ยว (เช่น น้ำตก) ดูฝน
 * จุดอื่นไม่ดึงข้อมูลเลย ประหยัดเน็ตของผู้ใช้
 */
export function conditionsNeededFor(point) {
  if (!point) return { waves: false, rain: false };
  return {
    waves: point.type === 'drowning',
    rain: point.type === 'fall' && point.category === CATEGORIES.DESTINATION,
  };
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * คลื่นตอนนี้ใกล้พิกัดที่ให้มา
 * Open-Meteo ใช้จุดกริดทะเลที่ใกล้ที่สุด ซึ่งอาจอยู่นอกชายฝั่งหลายกิโลเมตร จึงคืนระยะนั้นมาให้หน้าจอบอกผู้ใช้
 * @returns { heightM, time, gridDistanceM } หรือ null
 */
export async function fetchWaves(coordinate, timeoutMs = CONDITIONS.TIMEOUT_MS) {
  try {
    const url =
      `${CONDITIONS.MARINE_URL}?latitude=${coordinate.lat}&longitude=${coordinate.lng}` +
      '&current=wave_height&timezone=Asia%2FBangkok';
    const json = await fetchJson(url, timeoutMs);
    const heightM = json.current ? json.current.wave_height : null;
    if (!Number.isFinite(heightM)) return null;
    return {
      heightM,
      time: json.current.time,
      gridDistanceM: haversineMeters(coordinate, { lat: json.latitude, lng: json.longitude }),
    };
  } catch (error) {
    return null;
  }
}

/**
 * ฝนตอนนี้ หน่วย มม./ชม.
 * precipitation ของ current คือปริมาณฝนในช่วง interval วินาทีก่อนหน้า (ปกติ 15 นาที)
 * จึงต้องแปลงเป็นรายชั่วโมงก่อนเทียบเกณฑ์ WMO
 * @returns { mmPerHour, time } หรือ null
 */
export async function fetchRain(coordinate, timeoutMs = CONDITIONS.TIMEOUT_MS) {
  try {
    const url =
      `${CONDITIONS.WEATHER_URL}?latitude=${coordinate.lat}&longitude=${coordinate.lng}` +
      '&current=precipitation&timezone=Asia%2FBangkok';
    const json = await fetchJson(url, timeoutMs);
    const { precipitation, interval, time } = json.current || {};
    if (!Number.isFinite(precipitation) || !Number.isFinite(interval) || interval <= 0) return null;
    const mmPerHour = Math.round(((precipitation * 3600) / interval) * 10) / 10;
    return { mmPerHour, time };
  } catch (error) {
    return null;
  }
}
```

- [ ] **Step 5: รันเทสต์**

Run: `npm test`
Expected: `pass 215` `fail 0`

- [ ] **Step 6: Commit**

```bash
git add constants/config.js utils/conditions.js tests/conditions.test.js
git commit -m "feat: จัดระดับคลื่นและฝนสดจาก Open-Meteo แสดงผลอย่างเดียว ไม่แตะสูตรคะแนน"
```

---

## Task 8: การ์ดสภาพตอนนี้และแถบเตือนคลื่นแรง

**Files:**
- Modify: `constants/theme.js`
- Create: `hooks/useLiveConditions.js`
- Create: `components/ConditionsCard.js`
- Modify: `screens/RiskDetailScreen.js`
- Modify: `screens/HomeScreen.js`

- [ ] **Step 1: สีระวัง** ใน `constants/theme.js` ต่อจาก `warningBorder: '#F0C33C',`

```javascript
  /** ตัวอักษรระดับ "ระวัง" เช่น คลื่นเล็กน้อย ฝนปานกลาง (ส้มเข้มพออ่านบนพื้นขาว) */
  caution: '#E65100',
```

- [ ] **Step 2: สร้าง `hooks/useLiveConditions.js`**

```javascript
/**
 * ดึงสภาพคลื่นหรือฝนตอนนี้ ครั้งเดียวตอนเปิดหน้าจอ
 *
 * ไม่มีเน็ตหรือบริการล่ม ได้ null กลับมา หน้าจอซ่อนการ์ดไปเฉย ๆ ไม่แสดงค่าเก่าหรือค่าเดา
 */

import { useState, useEffect } from 'react';
import { fetchWaves, fetchRain } from '../utils/conditions';

/**
 * @param coordinate { lat, lng } หรือ null (ไม่ดึงอะไร)
 * @param needs { waves, rain } อยากได้ข้อมูลไหนบ้าง
 * @returns { waves, rain, isLoading }
 */
export function useLiveConditions(coordinate, { waves: wantsWaves = false, rain: wantsRain = false } = {}) {
  const lat = coordinate ? coordinate.lat : null;
  const lng = coordinate ? coordinate.lng : null;
  const isWanted = lat !== null && (wantsWaves || wantsRain);

  const [state, setState] = useState({ waves: null, rain: null, isLoading: isWanted });

  useEffect(() => {
    if (!isWanted) {
      setState({ waves: null, rain: null, isLoading: false });
      return undefined;
    }

    let isCancelled = false;
    const target = { lat, lng };
    setState({ waves: null, rain: null, isLoading: true });
    Promise.all([wantsWaves ? fetchWaves(target) : null, wantsRain ? fetchRain(target) : null]).then(
      ([waves, rain]) => {
        if (!isCancelled) setState({ waves, rain, isLoading: false });
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [isWanted, wantsWaves, wantsRain, lat, lng]);

  return state;
}
```

- [ ] **Step 3: สร้าง `components/ConditionsCard.js`**

```javascript
/**
 * การ์ด "สภาพตอนนี้" ในหน้ารายละเอียดจุดเสี่ยง (คลื่นสำหรับชายหาด ฝนสำหรับน้ำตก)
 *
 * ไม่มีข้อมูล (ออฟไลน์หรือบริการล่ม) ไม่แสดงการ์ดเลย ไม่แสดงค่าเก่าหรือค่าเดา
 * ไม่ใช้สีเขียวกับทะเลสงบหรือไม่มีฝน เพราะสีเขียวสื่อว่าปลอดภัย แต่จุดนี้ยังเป็นจุดเสี่ยงอยู่
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { classifyWaves, classifyRain } from '../utils/conditions';
import { formatDistance } from '../utils/format';
import { CONDITIONS_DISCLAIMER } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** จุดกริดทะเลห่างเกินนี้ บอกผู้ใช้ว่าค่าคลื่นมาจากนอกชายฝั่ง */
const FAR_GRID_M = 3000;

const LEVEL_COLORS = {
  calm: COLORS.text,
  none: COLORS.text,
  light: COLORS.text,
  slight: COLORS.caution,
  moderate: COLORS.caution,
  rough: COLORS.danger,
  danger: COLORS.danger,
  heavy: COLORS.danger,
};

export default function ConditionsCard({ waves, rain, isLoading }) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.meta}>กำลังดูสภาพตอนนี้...</Text>
      </View>
    );
  }

  const waveLevel = waves ? classifyWaves(waves.heightM) : null;
  const rainLevel = rain ? classifyRain(rain.mmPerHour) : null;
  if (!waveLevel && !rainLevel) return null;

  const time = (waves && waves.time) || (rain && rain.time) || '';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>สภาพตอนนี้</Text>

      {waveLevel && (
        <View style={styles.row}>
          <Text style={[styles.value, { color: LEVEL_COLORS[waveLevel.id] }]}>
            🌊 คลื่นสูงประมาณ {waves.heightM.toFixed(1)} ม. · {waveLevel.label}
          </Text>
          <Text style={styles.advice}>{waveLevel.advice}</Text>
          {waves.gridDistanceM > FAR_GRID_M && (
            <Text style={styles.meta}>
              ค่าจากแบบจำลองทะเลนอกชายฝั่ง ห่างจุดนี้ประมาณ {formatDistance(waves.gridDistanceM)}
            </Text>
          )}
        </View>
      )}

      {rainLevel && (
        <View style={styles.row}>
          <Text style={[styles.value, { color: LEVEL_COLORS[rainLevel.id] }]}>
            🌧️ ฝน {rain.mmPerHour} มม./ชม. · {rainLevel.label}
          </Text>
          {rainLevel.advice && <Text style={styles.advice}>{rainLevel.advice}</Text>}
        </View>
      )}

      <Text style={styles.meta}>
        {CONDITIONS_DISCLAIMER} · ที่มา Open-Meteo{time ? ` เวลา ${time.slice(11, 16)} น.` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  row: {
    gap: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
  },
  advice: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
```

- [ ] **Step 4: หน้ารายละเอียด** ใน `screens/RiskDetailScreen.js`

เพิ่ม import

```javascript
import ConditionsCard from '../components/ConditionsCard';
import { useLiveConditions } from '../hooks/useLiveConditions';
import { conditionsNeededFor } from '../utils/conditions';
```

ต่อจากบรรทัด `const point = findPointById(pointId);` (hook ต้องเรียกก่อน return ตอนหาจุดไม่เจอ)

```javascript
  // ชายหาดดูคลื่น น้ำตกดูฝน จุดอื่นไม่ดึงอะไร (utils/conditions.js)
  const conditions = useLiveConditions(point ? point.coordinate : null, conditionsNeededFor(point));
```

ต่อจาก `<Disclaimer variant={point.verified ? 'verified' : 'unverified'} />`

```javascript

        <ConditionsCard waves={conditions.waves} rain={conditions.rain} isLoading={conditions.isLoading} />
```

- [ ] **Step 5: แถบเตือนคลื่นแรงในหน้าแรก** ใน `screens/HomeScreen.js`

เพิ่ม import

```javascript
import { useLiveConditions } from '../hooks/useLiveConditions';
import { classifyWaves } from '../utils/conditions';
import { CONDITIONS, CONDITIONS_DISCLAIMER } from '../constants/config';
```

ต่อจาก `const { favoriteIds } = useFavorites();`

```javascript
  // คลื่นแถบหาดสมิหลา–ชลาทัศน์ แสดงแถบเตือนเฉพาะตอนคลื่นแรง (เอกสารออกแบบระยะที่ 2 ข้อ D3)
  const beach = useLiveConditions(CONDITIONS.BEACH_COORDINATE, { waves: true });
  const beachLevel = beach.waves ? classifyWaves(beach.waves.heightM) : null;
  const isBeachRough = beachLevel !== null && (beachLevel.id === 'rough' || beachLevel.id === 'danger');
```

แทรกก่อนคอมเมนต์ `{/* แถบสรุปความเสี่ยงประจำเดือน ปรับข้อความตามข้อมูลจริง */}`

```javascript
            {isBeachRough && (
              <View style={styles.waveBanner}>
                <Text style={styles.waveBannerTitle}>
                  🌊 คลื่นแถบหาดสมิหลา–ชลาทัศน์ตอนนี้ประมาณ {beach.waves.heightM.toFixed(1)} ม. · {beachLevel.label}
                </Text>
                <Text style={styles.waveBannerText}>
                  {beachLevel.advice} · {CONDITIONS_DISCLAIMER}
                </Text>
              </View>
            )}

```

เพิ่มสไตล์ต่อจาก `emptyText`

```javascript
  waveBanner: {
    backgroundColor: COLORS.warningBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  waveBannerTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  waveBannerText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    lineHeight: 20,
  },
```

- [ ] **Step 6: ตรวจ**

Run: `npm test` → `pass 215` `fail 0`
Run: `npm run check:imports` → `OK`

- [ ] **Step 7: Commit**

```bash
git add constants/theme.js hooks/useLiveConditions.js components/ConditionsCard.js screens/RiskDetailScreen.js screens/HomeScreen.js
git commit -m "feat: การ์ดสภาพคลื่นและฝนตอนนี้ และแถบเตือนในหน้าแรกเมื่อคลื่นแรง"
```

---

## Task 9: ตรวจของจริงและอัปเดต README

- [ ] **Step 1: build** — `npx expo export --platform web` (ไม่มี react-native-maps ในบันเดิลเว็บ) และ `npx expo export --platform android`

- [ ] **Step 2: ตรวจที่ขนาดมือถือ 375×812**

| # | ตรวจ | เกณฑ์ผ่าน |
|---|---|---|
| 1 | แผนที่ | จำนวนหมุด = 12 + จำนวนจุดทางการ |
| 2 | หน้ารายละเอียดจุดทางการ | ป้าย "✓ ข้อมูลทางการ" กล่องสีฟ้า สถิติรายปี ตำรวจทางหลวง 1193 แหล่งอ้างอิงกระทรวงคมนาคม |
| 3 | การ์ดจุดของทีม | ยังเป็น "⚠️ ยังไม่ยืนยัน" |
| 4 | เส้นทาง ม.อ. → หาดสมิหลา | มีจุดทางการบนถนนกาญจนวนิชในรายการ |
| 5 | จำลองการเดินทางเส้นเดียวกัน | พูดเตือนจุดทางการด้วย |
| 6 | หน้ารายละเอียดหาดสมิหลา | การ์ด "สภาพตอนนี้" มีความสูงคลื่นตรงกับที่ Open-Meteo ตอบ และข้อความกำกับ |
| 7 | หน้ารายละเอียดน้ำตกโตนงาช้าง | การ์ดแสดงฝน |
| 8 | ตัดการเชื่อมต่อ Open-Meteo | ไม่มีการ์ด ไม่มี error |
| 9 | ปลอมคลื่น 1.6 ม. | หน้าแรกขึ้นแถบเตือน "คลื่นแรง · ไม่ควรลงเล่นน้ำ" |
| 10 | console | ไม่มี error |

- [ ] **Step 3: README** อัปเดตจำนวนเทสต์ (`pass 215`, `utils/` 209 เทสต์, `data/` 6 เทสต์) และเพิ่มแถวผลตรวจข้อ 1, 2, 4, 6, 8, 9 ในตาราง "สถานะการตรวจสอบ" เพิ่มแถวในตาราง "ทำอะไรได้บ้าง": `| ถึงปลายทาง | สภาพคลื่นและฝนตอนนี้ (ชายหาด น้ำตก) และแถบเตือนเมื่อคลื่นแรง | บทที่ 8 |`

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README บอกผลตรวจจุดทางการและสภาพอากาศสด"
```
