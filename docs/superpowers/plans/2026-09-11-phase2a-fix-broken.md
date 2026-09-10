# AntacinnHelp ระยะที่ 2 ช่วง A — แก้ของที่พังและไม่ปลอดภัย

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แก้ทุกข้อในหมวด "ของที่พังหรือไม่ปลอดภัย" ของเอกสารออกแบบ (F1–F7) ให้แอปใช้งานได้จริงก่อนเริ่มเพิ่มฟีเจอร์ใหม่

**Architecture:** แก้ในโครงสร้าง 4 ชั้นเดิม ตรรกะใหม่ทุกชิ้น (ตรวจข้อมูล ค้นหา สรุปฤดูกาล สร้างจุดของผู้ใช้) เป็นฟังก์ชันล้วนใน `utils/` ที่มีเทสต์คุม ส่วนสถานะที่ต้องใช้ร่วมกันทุกหน้าจอย้ายไปอยู่ใน React Context ตัวเดียว (`AppDataProvider`)

**Tech Stack:** React Native + Expo SDK 54, `node --test` สำหรับเทสต์, OpenStreetMap เป็นแหล่งพิกัดอ้างอิง

**เอกสารออกแบบ:** `docs/superpowers/specs/2026-09-11-antacinn-help-phase2-design.md` หมวด 2.1 และช่วง A

---

## ภาพรวมไฟล์

| ไฟล์ | สถานะ | หน้าที่ |
|---|---|---|
| `hooks/useUserLocation.js` | แก้ | ยกเลิกการติดตาม GPS แบบไม่ทำให้แอปพัง (F1) |
| `utils/dataValidation.js` | ใหม่ | ตรวจกฎของไฟล์ข้อมูลทั้งสองไฟล์ |
| `tests/dataValidation.test.js` | ใหม่ | พิสูจน์ว่าตัวตรวจจับข้อมูลผิดได้จริง |
| `tests/data.test.js` | ใหม่ | รันตัวตรวจกับไฟล์ข้อมูลจริงทุกครั้งที่ `npm test` |
| `data/riskPoints.json` | แก้ | พิกัดทั้ง 12 จุดตาม OpenStreetMap (F2) |
| `data/SOURCES.md` | ใหม่ | ที่มาของพิกัดทุกจุด ตรวจซ้ำได้ |
| `constants/config.js` | แก้ | เพิ่ม `DISTANCE.DESTINATION_RADIUS` |
| `utils/routeAnalysis.js` | แก้ | นับจุดใกล้ปลายทางด้วย แม้ห่างถนนเกินเกณฑ์ |
| `tests/routeAnalysis.test.js` | แก้ | เพิ่ม 2 เทสต์ |
| `data/presetRoutes.json` | แก้ | ปลายทางใหม่ และเส้นทางสำรองจากถนนจริง |
| `screens/RoutePlannerScreen.js` | แก้ | ส่งรัศมีปลายทางเข้าไป |
| `utils/search.js` | ใหม่ | ค้นหาเรียงความเกี่ยวข้อง (F3) |
| `tests/search.test.js` | ใหม่ | |
| `hooks/useRiskPoints.js` | แก้ | ใช้ `utils/search.js` |
| `utils/season.js` | ใหม่ | ข้อความแถบฤดูกาลที่หัวข้อกับเนื้อความไม่ขัดกัน (F4) |
| `tests/season.test.js` | ใหม่ | |
| `screens/HomeScreen.js` | แก้ | ใช้ `utils/season.js` และแก้หัวข้อชนกันบนมือถือ (F6) |
| `utils/userPoint.js` | ใหม่ | สร้างจุดของผู้ใช้ กฎ verified: false มีเทสต์คุม |
| `tests/userPoint.test.js` | ใหม่ | |
| `hooks/AppDataProvider.js` | ใหม่ | ข้อมูลกลางที่ทุกหน้าจอเห็นตรงกัน (F7) |
| `hooks/useSavedPoints.js` | แก้ | อ่านจาก Provider หน้าตาเดิม |
| `App.js` | แก้ | ครอบแอปด้วย Provider |
| `README.md` | แก้ | กติกา id ใหม่ และสถานะข้อมูล |

จำนวนเทสต์: เดิม 64 → หลังจบแผนนี้ **103** (dataValidation 18 + data 2 + routeAnalysis เพิ่ม 2 + search 7 + season 5 + userPoint 5)

---

## Task 1: แก้จอขาวหลังออกจากโหมดเดินทาง (F1)

**Files:**
- Modify: `hooks/useUserLocation.js`

**ที่มา:** ตรวจในเบราว์เซอร์แล้วพบ `TypeError: LocationEventEmitter.removeSubscription is not a function` ตอนกดหยุดโหมดเดินทาง error เกิดขณะ React ถอดหน้าจอ ทั้งแอปจึงจอขาว สาเหตุอยู่ใน `node_modules/expo-location/build/LocationSubscribers.js:50` บนเว็บ `LocationEventEmitter` เป็น `EventEmitter` แบบใหม่ที่ไม่มีเมธอดนี้ (บนมือถือเป็น `LegacyEventEmitter` ที่มี จึงไม่พัง) และบรรทัดก่อนหน้านั้น (`ExpoLocation.removeWatchAsync(id)`) ยกเลิก watch ของเบราว์เซอร์ไปแล้ว การดัก error จึงปลอดภัย GPS หยุดจริง

hook นี้ต้องใช้ React และอุปกรณ์จริง จึงไม่มีเทสต์หน่วย ตรวจด้วยเบราว์เซอร์ใน Task 11

- [ ] **Step 1: เพิ่มฟังก์ชันยกเลิกแบบปลอดภัย**

ใน `hooks/useUserLocation.js` แทรกฟังก์ชันนี้ถัดจากบรรทัด `import { DISTANCE } from '../constants/config';`

```javascript

/**
 * ยกเลิกการติดตามตำแหน่งโดยไม่ให้แอปพัง
 *
 * ทำไมต้องมีฟังก์ชันนี้:
 * expo-location 19.0.8 บนเว็บมีบั๊ก ตอนยกเลิกการติดตามจะเรียก
 * LocationEventEmitter.removeSubscription ซึ่งไม่มีอยู่จริงบนเว็บ แล้ว throw error
 * error นั้นเกิดตอน React กำลังถอดหน้าจอ ทำให้ทั้งแอปจอขาวทันทีที่ออกจากโหมดเดินทาง
 *
 * ดัก error นี้ได้อย่างปลอดภัย เพราะไลบรารียกเลิก watch ของเบราว์เซอร์ไปแล้ว
 * ก่อนถึงบรรทัดที่ throw (ดู node_modules/expo-location/build/LocationSubscribers.js)
 * GPS จึงหยุดทำงานจริง ไม่มีการกินแบตค้าง
 */
function removeSubscriptionSafely(subscription) {
  try {
    subscription.remove();
  } catch (error) {
    // บั๊กที่รู้จักแล้วข้างต้น ไม่ต้องทำอะไร ส่วน error อื่นยังแจ้งไว้เพื่อให้เห็นตอนพัฒนา
    if (!String(error && error.message).includes('removeSubscription')) {
      console.warn('ยกเลิกการติดตามตำแหน่งไม่สำเร็จ:', error.message);
    }
  }
}
```

- [ ] **Step 2: ใช้ฟังก์ชันนี้แทน `.remove()` ทั้งสองจุด**

แก้จุดที่ 1 (กรณีหน้าจอถูกถอดระหว่างรอ):

```javascript
        if (isCancelled) {
          subscription.remove();
        } else {
```

เป็น

```javascript
        if (isCancelled) {
          removeSubscriptionSafely(subscription);
        } else {
```

แก้จุดที่ 2 (cleanup ของ useEffect):

```javascript
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
```

เป็น

```javascript
      if (subscriptionRef.current) {
        removeSubscriptionSafely(subscriptionRef.current);
        subscriptionRef.current = null;
      }
```

- [ ] **Step 3: ตรวจว่าไม่มี `.remove()` ตรง ๆ หลงเหลือ**

Run: `grep -n "\.remove()" hooks/useUserLocation.js`
Expected: บรรทัดเดียว คือ `subscription.remove();` ที่อยู่ใน `removeSubscriptionSafely`

- [ ] **Step 4: เทสต์เดิมต้องยังผ่าน**

Run: `npm test`
Expected: `pass 64` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add hooks/useUserLocation.js
git commit -m "fix: แก้แอปจอขาวทั้งแอปหลังออกจากโหมดเดินทางบนเว็บ

expo-location 19.0.8 บนเว็บเรียก LocationEventEmitter.removeSubscription
ซึ่งไม่มีใน EventEmitter แบบใหม่ error เกิดตอนถอดหน้าจอจึงพังทั้งแอป
ดัก error นี้อย่างปลอดภัยเพราะไลบรารียกเลิก watch ของเบราว์เซอร์ไปแล้วก่อนบรรทัดที่ throw"
```

---

## Task 2: ตัวตรวจความถูกต้องของไฟล์ข้อมูล (TDD)

**Files:**
- Create: `utils/dataValidation.js`
- Test: `tests/dataValidation.test.js`

**ทำไมต้องมี:** ไฟล์ข้อมูลกรอกด้วยมือ และทีมจะกรอกเพิ่มหลังลงพื้นที่ การพิมพ์ผิดเล็กน้อย (เดือน 13, severity สะกดผิด, ปี ค.ศ. แทน พ.ศ.) ทำให้คะแนนเพี้ยนเงียบ ๆ ตัวตรวจนี้คืนรายการปัญหาภาษาไทยที่บอกทันทีว่าจุดไหนผิดเรื่องอะไร

- [ ] **Step 1: เขียนเทสต์ก่อน**

`tests/dataValidation.test.js`:

```javascript
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
```

- [ ] **Step 2: รันเทสต์ ต้องแดง**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/dataValidation.test.js`
Expected: FAIL ด้วย `Cannot find module ... utils/dataValidation.js`

- [ ] **Step 3: เขียนตัวตรวจ**

`utils/dataValidation.js`:

```javascript
/**
 * ตรวจความถูกต้องของไฟล์ข้อมูล data/riskPoints.json และ data/presetRoutes.json
 *
 * ทำไมต้องมี:
 * ไฟล์ข้อมูลกรอกด้วยมือ และทีมจะกรอกเพิ่มเรื่อย ๆ หลังลงพื้นที่
 * การพิมพ์ผิดเล็กน้อย เช่น เดือน 13 หรือ severity สะกดผิด ทำให้คะแนนเพี้ยนเงียบ ๆ โดยไม่มี error
 * ฟังก์ชันนี้คืนรายการปัญหาเป็นภาษาไทยที่อ่านแล้วรู้ทันทีว่าต้องแก้ตรงไหน
 *
 * ใช้ผ่านเทสต์ tests/data.test.js ซึ่งรันทุกครั้งที่สั่ง npm test
 */

import { HAZARD_TYPES, CATEGORIES, SEVERITY_WEIGHTS } from '../constants/config.js';
import { haversineMeters } from './geo.js';

/** คำนำหน้า id ของแต่ละอำเภอ คำนำหน้าต้องตรงกับฟิลด์ district เสมอ */
export const DISTRICT_PREFIXES = {
  'hy-': 'หาดใหญ่',
  'sk-': 'เมืองสงขลา',
  'sn-': 'สิงหนคร',
};

/**
 * กรอบพื้นที่ให้บริการของแอป
 * กว้างพอให้ครอบน้ำตกโตนงาช้าง (ทิศตะวันตก) และสะพานติณสูลานนท์ (ทิศเหนือ)
 * ถ้ามีจุดหลุดกรอบนี้ แปลว่าพิมพ์พิกัดผิด เช่น สลับ lat กับ lng
 */
export const SERVICE_AREA = { minLat: 6.85, maxLat: 7.3, minLng: 100.15, maxLng: 100.7 };

/** คำที่บอกว่าแหล่งอ้างอิงเป็นหน่วยงานทางการ ใช้ตรวจจุดที่ตั้ง verified: true */
const OFFICIAL_SOURCE_KEYWORDS = ['กระทรวง', 'กรม', 'สำนักงาน', 'data.go.th', 'datagov', 'ThaiRSC', 'สภ.', 'ศปถ'];

/** ข้อความที่แปลว่า "ยังไม่ได้กรอกข้อมูลจริง" */
const PLACEHOLDER_TEXT = 'รอกรอกข้อมูลจริง';

const HAZARD_TYPE_IDS = HAZARD_TYPES.map((t) => t.id);
const CATEGORY_IDS = Object.values(CATEGORIES);
const SEVERITY_KEYS = Object.keys(SEVERITY_WEIGHTS);

function isInServiceArea(coordinate) {
  return Boolean(
    coordinate &&
      Number.isFinite(coordinate.lat) &&
      Number.isFinite(coordinate.lng) &&
      coordinate.lat >= SERVICE_AREA.minLat &&
      coordinate.lat <= SERVICE_AREA.maxLat &&
      coordinate.lng >= SERVICE_AREA.minLng &&
      coordinate.lng <= SERVICE_AREA.maxLng
  );
}

function isIntegerBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * ตรวจจุดเสี่ยงทั้งไฟล์
 * @returns อาเรย์ข้อความปัญหา ถ้าข้อมูลถูกต้องทั้งหมดจะได้อาเรย์ว่าง
 */
export function validateRiskPoints(points) {
  if (!Array.isArray(points)) return ['ข้อมูลจุดเสี่ยงต้องเป็นอาเรย์'];

  const errors = [];
  const seenIds = new Set();

  points.forEach((point, index) => {
    const label = point && point.id ? point.id : `ลำดับที่ ${index + 1}`;
    const problem = (message) => errors.push(`${label}: ${message}`);

    if (!point || typeof point.id !== 'string' || point.id === '') {
      problem('ไม่มี id');
      return;
    }
    if (seenIds.has(point.id)) problem('id ซ้ำกับจุดอื่น');
    seenIds.add(point.id);

    const prefix = Object.keys(DISTRICT_PREFIXES).find((p) => point.id.startsWith(p));
    if (!prefix) {
      problem(`id ต้องขึ้นต้นด้วย ${Object.keys(DISTRICT_PREFIXES).join(' ')}`);
    } else if (point.district !== DISTRICT_PREFIXES[prefix]) {
      problem(`คำนำหน้า ${prefix} หมายถึงอำเภอ${DISTRICT_PREFIXES[prefix]} แต่ district เป็น "${point.district}"`);
    }

    if (typeof point.name !== 'string' || point.name.trim() === '') problem('ไม่มีชื่อ');
    if (!CATEGORY_IDS.includes(point.category)) problem(`category "${point.category}" ไม่รู้จัก`);
    if (!HAZARD_TYPE_IDS.includes(point.type)) problem(`type "${point.type}" ไม่รู้จัก`);
    if (!isInServiceArea(point.coordinate)) {
      problem('พิกัดอยู่นอกพื้นที่ให้บริการ (ตรวจว่าสลับ lat กับ lng หรือพิมพ์ผิดหรือไม่)');
    }

    const incidents = Array.isArray(point.incidents) ? point.incidents : null;
    if (!incidents) problem('incidents ต้องเป็นอาเรย์');
    (incidents || []).forEach((incident, i) => {
      const where = `incidents[${i}]`;
      if (!isIntegerBetween(incident.year, 2540, 2575)) problem(`${where}.year ต้องเป็นปี พ.ศ. 2540–2575`);
      if (!SEVERITY_KEYS.includes(incident.severity)) problem(`${where}.severity ต้องเป็น ${SEVERITY_KEYS.join(' / ')}`);
      if (!Number.isInteger(incident.count) || incident.count < 1) problem(`${where}.count ต้องเป็นจำนวนเต็มตั้งแต่ 1`);
    });

    (point.peakMonths || []).forEach((m) => {
      if (!isIntegerBetween(m, 1, 12)) problem(`peakMonths มีค่า ${m} ต้องเป็น 1–12`);
    });
    (point.peakHours || []).forEach((h) => {
      if (!isIntegerBetween(h, 0, 23)) problem(`peakHours มีค่า ${h} ต้องเป็น 0–23`);
    });

    if (!Array.isArray(point.emergency) || point.emergency.length === 0 || point.emergency.some((e) => !e.tel)) {
      problem('emergency ต้องมีอย่างน้อยหนึ่งเบอร์');
    }

    const source = typeof point.source === 'string' ? point.source : '';
    if (source.trim() === '') problem('source ห้ามว่าง (เอกสารบทที่ 6.2 กำหนดเป็นฟิลด์บังคับ)');
    if (incidents && incidents.length > 0 && source.includes(PLACEHOLDER_TEXT)) {
      problem('มีตัวเลขเหตุการณ์แต่ source ยังเป็นข้อความรอกรอก ต้องระบุแหล่งอ้างอิงจริง');
    }

    if (typeof point.verified !== 'boolean') problem('verified ต้องเป็น true หรือ false');
    if (point.verified === true) {
      const isOfficial = OFFICIAL_SOURCE_KEYWORDS.some((k) => source.includes(k));
      if (!isOfficial || source.includes(PLACEHOLDER_TEXT)) {
        problem('ตั้ง verified: true ได้เฉพาะเมื่อ source เป็นหน่วยงานทางการ (นิยามใน UNVERIFIED_TEXT)');
      }
    }
  });

  return errors;
}

/**
 * ตรวจเส้นทางสำเร็จรูป
 * @returns อาเรย์ข้อความปัญหา ถ้าถูกต้องทั้งหมดจะได้อาเรย์ว่าง
 */
export function validatePresetRoutes(routes) {
  if (!Array.isArray(routes)) return ['ข้อมูลเส้นทางต้องเป็นอาเรย์'];

  const errors = [];
  const seenIds = new Set();

  routes.forEach((route, index) => {
    const label = route && route.id ? route.id : `ลำดับที่ ${index + 1}`;
    const problem = (message) => errors.push(`${label}: ${message}`);

    if (!route || !route.id) {
      problem('ไม่มี id');
      return;
    }
    if (seenIds.has(route.id)) problem('id ซ้ำกับเส้นทางอื่น');
    seenIds.add(route.id);

    for (const end of ['origin', 'destination']) {
      if (!isInServiceArea(route[end])) problem(`${end} อยู่นอกพื้นที่ให้บริการ`);
      if (!route[end] || !route[end].name) problem(`${end} ไม่มีชื่อ`);
    }

    const fallback = route.fallbackCoordinates;
    if (!Array.isArray(fallback) || fallback.length < 2) {
      problem('fallbackCoordinates ต้องมีอย่างน้อย 2 จุด');
      return;
    }
    if (fallback.some((c) => !isInServiceArea(c))) problem('fallbackCoordinates มีจุดอยู่นอกพื้นที่ให้บริการ');

    // เส้นทางสำรองต้องเริ่มและจบใกล้ต้นทางปลายทางจริง ไม่งั้นตอนออฟไลน์จะลากเส้นไปคนละที่
    if (isInServiceArea(route.origin) && haversineMeters(fallback[0], route.origin) > 1000) {
      problem('จุดแรกของ fallbackCoordinates ห่างต้นทางเกิน 1 กม.');
    }
    const last = fallback[fallback.length - 1];
    if (isInServiceArea(route.destination) && haversineMeters(last, route.destination) > 1000) {
      problem('จุดสุดท้ายของ fallbackCoordinates ห่างปลายทางเกิน 1 กม.');
    }
  });

  return errors;
}
```

- [ ] **Step 4: รันเทสต์ ต้องผ่าน**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/dataValidation.test.js`
Expected: `pass 18` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/dataValidation.js tests/dataValidation.test.js
git commit -m "feat: เพิ่มตัวตรวจความถูกต้องของไฟล์ข้อมูล พร้อมเทสต์ 18 ข้อ

จับได้ทั้ง id ซ้ำ คำนำหน้าไม่ตรงอำเภอ พิกัดสลับ lat/lng severity สะกดผิด
ปี ค.ศ. แทน พ.ศ. เดือน 13 และการตั้ง verified: true โดยไม่มีแหล่งทางการ"
```

---

## Task 3: รันตัวตรวจกับไฟล์ข้อมูลจริง

**Files:**
- Create: `tests/data.test.js`

- [ ] **Step 1: เขียนเทสต์**

`tests/data.test.js`:

```javascript
/**
 * ตรวจไฟล์ข้อมูลจริงของแอปด้วยกฎใน utils/dataValidation.js
 *
 * ถ้าเทสต์นี้แดง แปลว่ามีคนกรอกข้อมูลผิด ข้อความจะบอกว่าจุดไหนผิดเรื่องอะไร
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRiskPoints, validatePresetRoutes } from '../utils/dataValidation.js';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

test('data/riskPoints.json ผ่านกฎทุกข้อ', () => {
  const errors = validateRiskPoints(readJson('../data/riskPoints.json'));
  assert.deepEqual(errors, [], 'ปัญหาที่พบ:\n' + errors.join('\n'));
});

test('data/presetRoutes.json ผ่านกฎทุกข้อ', () => {
  const errors = validatePresetRoutes(readJson('../data/presetRoutes.json'));
  assert.deepEqual(errors, [], 'ปัญหาที่พบ:\n' + errors.join('\n'));
});
```

- [ ] **Step 2: รันเทสต์กับข้อมูลปัจจุบัน**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/data.test.js`
Expected: `pass 2` `fail 0` ข้อมูลปัจจุบันผ่านกฎโครงสร้างอยู่แล้ว (ปัญหาพิกัดผิดตรวจด้วยกฎอัตโนมัติไม่ได้ เพราะพิกัดผิดทั้ง 12 จุดยังอยู่ในพื้นที่ให้บริการ จึงแก้ด้วยการอ้างอิง OpenStreetMap ใน Task 4)

- [ ] **Step 3: Commit**

```bash
git add tests/data.test.js
git commit -m "test: ตรวจไฟล์ข้อมูลจริงทุกครั้งที่รัน npm test"
```

---

## Task 4: แก้พิกัดทั้ง 12 จุดตาม OpenStreetMap (F2)

**Files:**
- Modify: `data/riskPoints.json`
- Create: `data/SOURCES.md`

**ที่มา:** เทียบกับ OpenStreetMap เมื่อ 2026-09-11 พบพิกัดคลาดสูงสุด 11.2 กม. โหมดเดินทางเตือนที่ 500 ม. จุดที่ผิดเกินนั้นจึงไม่มีทางเตือนที่สถานที่จริง ค่าใหม่ทุกค่ามาจากองค์ประกอบใน OpenStreetMap ที่ระบุไว้ใน `data/SOURCES.md` ใครก็ตรวจซ้ำได้

- [ ] **Step 1: แก้บรรทัด coordinate ทีละจุด**

แต่ละบรรทัดเดิมไม่ซ้ำกัน แก้ได้ด้วยการแทนที่ตรง ๆ

| id | บรรทัดเดิม | บรรทัดใหม่ |
|---|---|---|
| hy-lopburi-01 | `"coordinate": { "lat": 7.0300, "lng": 100.4600 },` | `"coordinate": { "lat": 7.03530, "lng": 100.45579 },` |
| sk-kanjanavanit-01 | `"coordinate": { "lat": 7.1780, "lng": 100.6070 },` | `"coordinate": { "lat": 7.16966, "lng": 100.61189 },` |
| hy-khokhohong-01 | `"coordinate": { "lat": 7.0060, "lng": 100.5010 },` | `"coordinate": { "lat": 7.04433, "lng": 100.51790 },` |
| hy-mandarin-01 | `"coordinate": { "lat": 7.0090, "lng": 100.4720 },` | `"coordinate": { "lat": 7.00591, "lng": 100.46991 },` |
| hy-niphat3-01 | `"coordinate": { "lat": 7.0080, "lng": 100.4740 },` | `"coordinate": { "lat": 7.00385, "lng": 100.47082 },` |
| sk-smila-01 | `"coordinate": { "lat": 7.1975, "lng": 100.5960 },` | `"coordinate": { "lat": 7.21549, "lng": 100.59581 },` |
| sk-samila-cape-01 | `"coordinate": { "lat": 7.2050, "lng": 100.5930 },` | `"coordinate": { "lat": 7.20664, "lng": 100.60080 },` |
| hy-tonngachang-01 | `"coordinate": { "lat": 6.9530, "lng": 100.3330 },` | `"coordinate": { "lat": 6.94664, "lng": 100.23193 },` |
| hy-kimyong-01 | `"coordinate": { "lat": 7.0090, "lng": 100.4750 },` | `"coordinate": { "lat": 7.00844, "lng": 100.46999 },` |
| hy-psu-gate-01 | `"coordinate": { "lat": 7.0086, "lng": 100.4980 },` | `"coordinate": { "lat": 7.01318, "lng": 100.49500 },` |
| sk-chalatat-01 | `"coordinate": { "lat": 7.1830, "lng": 100.6020 },` | `"coordinate": { "lat": 7.19410, "lng": 100.60922 },` |

- [ ] **Step 2: แก้สะพานติณสูลานนท์ (id อำเภอ ชื่อ และพิกัด)**

สะพานมีสองช่วง ช่วงที่ 1 และเกาะยออยู่ใน อ.เมืองสงขลา แต่ **ช่วงที่ 2 อยู่ใน อ.สิงหนคร** (reverse geocode จาก OpenStreetMap) ข่าวคมชัดลึกระบุว่าเหตุบาดเจ็บสาหัสเกิด "บนสะพานช่วงที่ 2" จึงวางจุดที่กลางช่วงที่ 2 และบอกอำเภอตามจริง แทนที่จะฝืนให้อยู่ในเมืองสงขลา

แทนที่

```json
    "id": "sk-tinsulanon-01",
    "name": "สะพานติณสูลานนท์",
    "category": "road",
    "type": "crash",
    "district": "เมืองสงขลา",
    "coordinate": { "lat": 7.2170, "lng": 100.5410 },
```

ด้วย

```json
    "id": "sn-tinsulanon-01",
    "name": "สะพานติณสูลานนท์ ช่วงที่ 2 (เกาะยอ–สิงหนคร)",
    "category": "road",
    "type": "crash",
    "district": "สิงหนคร",
    "coordinate": { "lat": 7.19000, "lng": 100.54743 },
```

และเติมความจริงว่าข่าวเหตุตกปลาไม่ระบุช่วง แทนที่

```json
"note": "ชาวบ้านนั่งตกปลาอยู่บนสะพาน ถูกรถกระบะพุ่งชนเสียชีวิต 2 ราย (11 มิ.ย. 2560 ช่วงบ่าย)"
```

ด้วย

```json
"note": "ชาวบ้านนั่งตกปลาอยู่บนสะพาน ถูกรถกระบะพุ่งชนเสียชีวิต 2 ราย (11 มิ.ย. 2560 ช่วงบ่าย) ข่าวไม่ระบุว่าช่วงไหนของสะพาน"
```

- [ ] **Step 3: ตรวจว่าย้ายไปจริงทั้ง 12 จุด**

Run:
```bash
node -e "const p=require('./data/riskPoints.json'); const old=['7.03,100.46','7.178,100.607','7.006,100.501','7.009,100.472','7.008,100.474','7.1975,100.596','7.205,100.593','6.953,100.333','7.009,100.475','7.0086,100.498','7.183,100.602','7.217,100.541']; const left=p.filter(x=>old.includes(x.coordinate.lat+','+x.coordinate.lng)); console.log('จุด:',p.length,'| ยังเป็นพิกัดเดิม:',left.length, left.map(x=>x.id).join(','))"
```
Expected: `จุด: 12 | ยังเป็นพิกัดเดิม: 0`

- [ ] **Step 4: สร้างไฟล์บันทึกที่มาของพิกัด**

`data/SOURCES.md`:

```markdown
# ที่มาของข้อมูลในโฟลเดอร์ data/

ไฟล์นี้บันทึกว่าตัวเลขและพิกัดในแอปมาจากไหน ใครก็ตามตรวจซ้ำได้

## พิกัดจุดเสี่ยง (`riskPoints.json`)

ตรวจกับ OpenStreetMap เมื่อ 2026-09-11 ด้วย Nominatim และ Overpass API
พิกัดเดิมเป็นค่าประมาณจากแผนระยะที่ 1 และคลาดสูงสุด 11.2 กม.
โหมดเดินทางเตือนที่ 500 ม. จุดที่คลาดเกินนั้นจึงไม่มีทางเตือนที่สถานที่จริง

| id | ย้ายไป | อ้างอิง OpenStreetMap | ย้ายจากเดิม |
|---|---|---|---|
| hy-lopburi-01 | 7.03530, 100.45579 | จุดบนถนนลพบุรีราเมศวร์ที่ใกล้จุดเดิมที่สุด (จุดเดิมไม่ได้อยู่บนถนน) | 751 ม. |
| sk-kanjanavanit-01 | 7.16966, 100.61189 | ถนนกาญจนวณิชย์ช่วงตรงหน้า มรภ.สงขลา (way 886390629) | 1,073 ม. |
| hy-khokhohong-01 | 7.04433, 100.51790 | ถนนขึ้นเขาจากสวนสาธารณะเทศบาลนครหาดใหญ่ไปยอดเขาบันใดนาง (338 ม.) ที่ 80% ของทาง ช่วงบนที่ข่าวระบุว่ารถแหกโค้งตอนลงเขา เส้นทางจาก OSRM | 4,600 ม. |
| hy-mandarin-01 | 7.00591, 100.46991 | แยก ถ.ประชาธิปัตย์ × ถ.นิพัทธ์อุทิศ 2 (node 617233014) อยู่กลางสามแยกที่ห่างกันไม่เกิน 150 ม. OpenStreetMap ไม่มีชื่อ "แมนดาริน" | 414 ม. |
| hy-niphat3-01 | 7.00385, 100.47082 | ถนนนิพัทธ์อุทิศ 3 | 580 ม. |
| sk-smila-01 | 7.21549, 100.59581 | รูปปั้นนางเงือก (node 2506674446) | 2,001 ม. |
| sk-samila-cape-01 | 7.20664, 100.60080 | แหลมสมิลา (way 243244853) | 880 ม. |
| hy-tonngachang-01 | 6.94664, 100.23193 | น้ำตกโตนงาช้าง (waterfall) | 11,178 ม. |
| hy-kimyong-01 | 7.00844, 100.46999 | ตลาดกิมหยง (marketplace) | 556 ม. |
| hy-psu-gate-01 | 7.01318, 100.49500 | ประตู ม.อ. ที่อยู่บนถนนกาญจนวณิชย์ (barrier=gate ห่างถนน 4 ม.) ใกล้จุดเดิมที่สุด | 607 ม. |
| sk-chalatat-01 | 7.19410, 100.60922 | ถนนชลาทัศน์ช่วงกลาง (way 496657038) จุดเดิมอยู่ในแผ่นดินห่างชายหาด | 1,469 ม. |
| sn-tinsulanon-01 | 7.19000, 100.54743 | กลางสะพานช่วงที่ 2 (way 27167386) อยู่ใน อ.สิงหนคร เดิมใช้ id `sk-tinsulanon-01` | 3,085 ม. |

## ตัวเลขเหตุการณ์

- **รายงานข่าว** ทุกรายการระบุสำนักข่าวและวันที่ไว้ในฟิลด์ `source` ของแต่ละจุด
  ตามนิยามใน `UNVERIFIED_TEXT` ของทีม ข่าวยังไม่นับเป็นการยืนยัน จุดเหล่านี้จึงเป็น `verified: false`
- ข่าวรายงานเฉพาะเหตุที่รุนแรง ตัวเลขจึงเป็น **ค่าขั้นต่ำ** จำนวนจริงสูงกว่านี้เสมอ

## เส้นทางสำเร็จรูป (`presetRoutes.json`)

`fallbackCoordinates` สร้างจากเส้นทางจริงของ OSRM เมื่อ 2026-09-11
แล้วลดจำนวนจุดด้วยวิธี Douglas–Peucker โดยคลาดจากถนนจริงไม่เกิน 60 ม.
(เกณฑ์ "อยู่บนเส้นทาง" ของแอปคือ 300 ม. จึงยังนับจุดเสี่ยงได้ถูกต้องแม้ไม่มีอินเทอร์เน็ต)

## ข้อมูลภาพรวมระดับอำเภอ

"สถิติอุบัติเหตุทางถนนในพื้นที่จังหวัดสงขลา" สำนักงานจังหวัดสงขลา (data.go.th ชุด `dpm08`)
เป็นข้อมูลระดับอำเภอ ใช้ใส่เป็นเหตุการณ์ของจุดใดจุดหนึ่งไม่ได้ ดูตัวเลขใน README.md
```

- [ ] **Step 5: รันเทสต์ทั้งหมด**

Run: `npm test`
Expected: `pass 84` `fail 0` (64 เดิม + 18 + 2)

- [ ] **Step 6: Commit**

```bash
git add data/riskPoints.json data/SOURCES.md
git commit -m "fix: แก้พิกัดจุดเสี่ยงทั้ง 12 จุดให้ตรงกับ OpenStreetMap

พิกัดเดิมเป็นค่าประมาณ คลาดสูงสุด 11.2 กม. (โตนงาช้าง) โหมดเดินทางเตือนที่ 500 ม.
จุดที่คลาดเกินนั้นจึงไม่มีทางเตือนที่สถานที่จริง ทุกค่าใหม่อ้างอิงองค์ประกอบใน
OpenStreetMap ที่บันทึกไว้ใน data/SOURCES.md

สะพานติณสูลานนท์ย้ายไปช่วงที่ 2 ตามที่ข่าวระบุ ซึ่งอยู่ใน อ.สิงหนคร
จึงเปลี่ยน id เป็น sn-tinsulanon-01 และบอกอำเภอตามจริง"
```

---

## Task 5: นับจุดเสี่ยงใกล้ปลายทางด้วย (TDD)

**Files:**
- Modify: `utils/routeAnalysis.js`
- Modify: `constants/config.js`
- Test: `tests/routeAnalysis.test.js`

**ที่มา:** หลังแก้พิกัด น้ำตกโตนงาช้างอยู่ห่างจุดสุดท้ายที่รถเข้าถึง (ลานจอดรถ) 375 ม. เกินเกณฑ์ "อยู่บนเส้นทาง" 300 ม. ผลคือเส้นทาง "หาดใหญ่ → น้ำตกโตนงาช้าง" จะไม่แสดงอันตรายของตัวน้ำตกเลย ซึ่งเป็นจุดที่อันตรายที่สุดของเส้นทางนั้น

- [ ] **Step 1: เขียนเทสต์ก่อน**

เพิ่มท้ายไฟล์ `tests/routeAnalysis.test.js`:

```javascript

test('จุดเลยปลายทางไปเกินเกณฑ์ ต้องไม่ถูกนับ ถ้าไม่ได้ขอรัศมีปลายทาง', () => {
  // จุดนี้อยู่เลยปลายเส้นทาง (lat 7.04) ไปทางเหนือ 0.0035 องศา ประมาณ 389 เมตร
  const points = [makePoint('waterfall', 7.0435, 100.5)];
  assert.equal(findRiskPointsAlongRoute(straightRoute, points, 300).length, 0);
});

test('destinationRadiusM: จุดใกล้ปลายทางต้องถูกนับ แม้ห่างถนนเกินเกณฑ์', () => {
  // สถานการณ์จริง: น้ำตกโตนงาช้างอยู่ห่างจุดสุดท้ายที่รถเข้าถึง 375 เมตร
  // ถ้าไม่มีกฎนี้ เส้นทางไปน้ำตกจะไม่แสดงอันตรายของตัวน้ำตกเลย
  const points = [makePoint('waterfall', 7.0435, 100.5)];
  const result = findRiskPointsAlongRoute(straightRoute, points, 300, { destinationRadiusM: 500 });
  assert.equal(result.length, 1);
  // อยู่ปลายทาง ระยะสะสมจึงเท่ากับความยาวเส้นทางทั้งเส้น (ประมาณ 4,448 ม.)
  assert.ok(Math.abs(result[0].distanceAlongRouteM - 4448) < 60, `ได้ ${result[0].distanceAlongRouteM}`);
  assert.ok(Math.abs(result[0].distanceFromRouteM - 389) < 30, `ได้ ${result[0].distanceFromRouteM}`);
});
```

- [ ] **Step 2: รันเทสต์ ต้องแดงหนึ่งข้อ**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/routeAnalysis.test.js`
Expected: `pass 16` `fail 1` ข้อที่แดงคือ `destinationRadiusM: จุดใกล้ปลายทางต้องถูกนับ...` (ได้ `0 !== 1`)

- [ ] **Step 3: เพิ่มตัวเลือกรัศมีปลายทาง**

ใน `utils/routeAnalysis.js` แทนที่หัวฟังก์ชัน

```javascript
export function findRiskPointsAlongRoute(routeCoordinates, riskPoints, thresholdMeters) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return [];
  if (!Array.isArray(riskPoints) || riskPoints.length === 0) return [];
```

ด้วย

```javascript
export function findRiskPointsAlongRoute(routeCoordinates, riskPoints, thresholdMeters, options = {}) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return [];
  if (!Array.isArray(riskPoints) || riskPoints.length === 0) return [];

  // รัศมีรอบปลายทาง: จุดเสี่ยงที่อยู่ในรัศมีนี้จากจุดสุดท้ายของเส้นทาง นับว่าอยู่บนเส้นทางด้วย
  // จำเป็นเพราะสถานที่ท่องเที่ยวหลายแห่งรถเข้าไม่ถึงตัวจุดพอดี
  // เช่น น้ำตกโตนงาช้างอยู่ห่างลานจอดรถ 375 เมตร เกินเกณฑ์ปกติ 300 เมตร
  const { destinationRadiusM = 0 } = options;
  const destination = routeCoordinates[routeCoordinates.length - 1];
```

แล้วแทนที่

```javascript
    // ไกลเกินเกณฑ์ = ไม่ถือว่าอยู่บนเส้นทางนี้
    if (closestDistance > thresholdMeters) continue;
```

ด้วย

```javascript
    // ไกลเกินเกณฑ์ = ไม่ถือว่าอยู่บนเส้นทางนี้ ยกเว้นอยู่ใกล้ปลายทาง
    const isNearRoute = closestDistance <= thresholdMeters;
    const isNearDestination =
      destinationRadiusM > 0 && haversineMeters(point.coordinate, destination) <= destinationRadiusM;
    if (!isNearRoute && !isNearDestination) continue;
```

(ไม่ต้องคำนวณระยะสะสมแยกสำหรับกรณีใกล้ปลายทาง จุดที่อยู่เลยปลายเส้นทางจะฉายลงที่ปลาย segment สุดท้ายพอดี ระยะสะสมจึงเท่ากับความยาวทั้งเส้นอยู่แล้ว)

แก้คำอธิบายเหนือฟังก์ชันด้วย: หาบรรทัด `@param thresholdMeters` ในคอมเมนต์เหนือ `findRiskPointsAlongRoute` แล้วเพิ่มบรรทัดนี้ต่อท้ายบรรทัดนั้น

```javascript
 * @param options.destinationRadiusM (ไม่บังคับ) นับจุดที่อยู่ในรัศมีนี้จากปลายทางด้วย
```

- [ ] **Step 4: เพิ่มค่าคงที่รัศมีปลายทาง**

ใน `constants/config.js` แทนที่

```javascript
  /** รัศมีกรองหยาบ ๆ ด้วยกรอบสี่เหลี่ยม ก่อนคำนวณ Haversine จริง */
  BOUNDING_BOX_FILTER: 2000,
};
```

ด้วย

```javascript
  /** รัศมีกรองหยาบ ๆ ด้วยกรอบสี่เหลี่ยม ก่อนคำนวณ Haversine จริง */
  BOUNDING_BOX_FILTER: 2000,
  /**
   * จุดเสี่ยงที่อยู่ในรัศมีนี้จากปลายทาง นับว่าอยู่บนเส้นทางด้วย
   * เพราะสถานที่ท่องเที่ยวหลายแห่งรถเข้าไม่ถึงตัวจุดพอดี เช่น น้ำตกอยู่ห่างลานจอดรถ
   * ใช้ค่าเดียวกับระยะเริ่มเตือน ถ้าระยะนี้ถูกเตือนในโหมดเดินทาง ก็ควรเห็นตอนวางแผนด้วย
   */
  DESTINATION_RADIUS: 500,
};
```

- [ ] **Step 5: รันเทสต์ ต้องผ่านทั้งหมด**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/routeAnalysis.test.js`
Expected: `pass 17` `fail 0`

- [ ] **Step 6: Commit**

```bash
git add utils/routeAnalysis.js constants/config.js tests/routeAnalysis.test.js
git commit -m "feat: นับจุดเสี่ยงที่อยู่ใกล้ปลายทางว่าอยู่บนเส้นทางด้วย

หลังแก้พิกัด น้ำตกโตนงาช้างอยู่ห่างลานจอดรถ 375 ม. เกินเกณฑ์ 300 ม.
เส้นทางไปน้ำตกจึงไม่แสดงอันตรายของตัวน้ำตกเลย เพิ่มตัวเลือก destinationRadiusM"
```

---

## Task 6: เส้นทางสำเร็จรูปที่ลากตามถนนจริง

**Files:**
- Modify: `data/presetRoutes.json`
- Modify: `screens/RoutePlannerScreen.js`

**ที่มา:** ปลายทางสองเส้นใช้พิกัดผิดชุดเดียวกับ Task 4 และ `fallbackCoordinates` เดิมเป็นเส้น 7 จุดที่เขียนด้วยมือ ตอนออฟไลน์จึงลากเส้นผ่านทุ่งผ่านทะเลสาบ ค่าใหม่มาจากเส้นทางจริงของ OSRM ลดจุดโดยคลาดจากถนนไม่เกิน 60 ม.

- [ ] **Step 1: เขียนไฟล์ใหม่ทั้งไฟล์**

`data/presetRoutes.json`:

```json
[
  {
    "id": "psu-to-samila",
    "label": "ม.อ.หาดใหญ่ → หาดสมิหลา",
    "origin": { "lat": 7.0086, "lng": 100.498, "name": "ม.อ.หาดใหญ่" },
    "destination": { "lat": 7.21549, "lng": 100.59581, "name": "หาดสมิหลา" },
    "fallbackCoordinates": [
      { "lat": 7.00847, "lng": 100.49808 },
      { "lat": 7.00850, "lng": 100.49373 },
      { "lat": 7.01406, "lng": 100.49504 },
      { "lat": 7.02935, "lng": 100.50198 },
      { "lat": 7.03608, "lng": 100.50224 },
      { "lat": 7.04791, "lng": 100.50438 },
      { "lat": 7.05431, "lng": 100.50740 },
      { "lat": 7.05607, "lng": 100.50930 },
      { "lat": 7.06796, "lng": 100.53838 },
      { "lat": 7.07570, "lng": 100.54899 },
      { "lat": 7.09540, "lng": 100.56526 },
      { "lat": 7.10178, "lng": 100.56780 },
      { "lat": 7.12902, "lng": 100.57518 },
      { "lat": 7.13173, "lng": 100.57908 },
      { "lat": 7.14914, "lng": 100.59674 },
      { "lat": 7.16921, "lng": 100.61158 },
      { "lat": 7.17559, "lng": 100.61408 },
      { "lat": 7.17723, "lng": 100.61367 },
      { "lat": 7.18976, "lng": 100.59531 },
      { "lat": 7.20247, "lng": 100.59172 },
      { "lat": 7.21287, "lng": 100.59028 },
      { "lat": 7.21442, "lng": 100.59575 }
    ]
  },
  {
    "id": "psu-to-kimyong",
    "label": "ม.อ.หาดใหญ่ → ตลาดกิมหยง",
    "origin": { "lat": 7.0086, "lng": 100.498, "name": "ม.อ.หาดใหญ่" },
    "destination": { "lat": 7.00844, "lng": 100.46999, "name": "ตลาดกิมหยง" },
    "fallbackCoordinates": [
      { "lat": 7.00847, "lng": 100.49808 },
      { "lat": 7.00927, "lng": 100.48112 },
      { "lat": 7.00847, "lng": 100.47020 }
    ]
  },
  {
    "id": "hatyai-to-tonngachang",
    "label": "หาดใหญ่ → น้ำตกโตนงาช้าง",
    "origin": { "lat": 7.009, "lng": 100.472, "name": "หาดใหญ่" },
    "destination": { "lat": 6.94664, "lng": 100.23193, "name": "น้ำตกโตนงาช้าง" },
    "fallbackCoordinates": [
      { "lat": 7.00897, "lng": 100.47183 },
      { "lat": 7.01085, "lng": 100.47159 },
      { "lat": 7.01053, "lng": 100.47009 },
      { "lat": 7.00742, "lng": 100.46899 },
      { "lat": 7.00652, "lng": 100.46339 },
      { "lat": 7.00316, "lng": 100.45844 },
      { "lat": 6.99827, "lng": 100.44750 },
      { "lat": 6.99845, "lng": 100.43600 },
      { "lat": 6.99583, "lng": 100.43079 },
      { "lat": 6.99565, "lng": 100.42769 },
      { "lat": 6.99198, "lng": 100.41712 },
      { "lat": 6.98148, "lng": 100.36100 },
      { "lat": 6.97612, "lng": 100.34963 },
      { "lat": 6.97589, "lng": 100.34531 },
      { "lat": 6.97688, "lng": 100.34015 },
      { "lat": 6.97278, "lng": 100.32870 },
      { "lat": 6.97086, "lng": 100.31700 },
      { "lat": 6.96760, "lng": 100.31426 },
      { "lat": 6.96313, "lng": 100.30639 },
      { "lat": 6.96268, "lng": 100.30334 },
      { "lat": 6.96348, "lng": 100.29583 },
      { "lat": 6.95863, "lng": 100.27948 },
      { "lat": 6.95825, "lng": 100.27505 },
      { "lat": 6.95494, "lng": 100.26894 },
      { "lat": 6.94510, "lng": 100.26386 },
      { "lat": 6.93964, "lng": 100.25743 },
      { "lat": 6.94025, "lng": 100.25295 },
      { "lat": 6.94526, "lng": 100.24844 },
      { "lat": 6.94616, "lng": 100.23808 },
      { "lat": 6.94863, "lng": 100.23568 },
      { "lat": 6.94867, "lng": 100.23464 }
    ]
  }
]
```

- [ ] **Step 2: ส่งรัศมีปลายทางเข้าไปในหน้าวางแผนเส้นทาง**

ใน `screens/RoutePlannerScreen.js` แทนที่

```javascript
    ? findRiskPointsAlongRoute(routeResult.coordinates, allPoints, DISTANCE.ON_ROUTE_THRESHOLD)
```

ด้วย

```javascript
    ? findRiskPointsAlongRoute(routeResult.coordinates, allPoints, DISTANCE.ON_ROUTE_THRESHOLD, {
        destinationRadiusM: DISTANCE.DESTINATION_RADIUS,
      })
```

- [ ] **Step 3: ยืนยันกับเส้นทางสำรองจริงว่าน้ำตกถูกนับแล้ว**

Run:
```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --input-type=module -e "import fs from 'node:fs'; const {findRiskPointsAlongRoute}=await import('file:///D:/Antacinn_Help/utils/routeAnalysis.js'); const r=JSON.parse(fs.readFileSync('data/presetRoutes.json','utf8')).find(x=>x.id==='hatyai-to-tonngachang'); const pts=JSON.parse(fs.readFileSync('data/riskPoints.json','utf8')); const a=findRiskPointsAlongRoute(r.fallbackCoordinates,pts,300).map(x=>x.point.id); const b=findRiskPointsAlongRoute(r.fallbackCoordinates,pts,300,{destinationRadiusM:500}).map(x=>x.point.id); console.log('ไม่มีรัศมีปลายทาง:',a.join(',')||'(ไม่มีน้ำตก)'); console.log('มีรัศมีปลายทาง  :',b.join(','));"
```
Expected: บรรทัดแรกไม่มี `hy-tonngachang-01` บรรทัดที่สองมี `hy-tonngachang-01`

- [ ] **Step 4: รันเทสต์ทั้งหมด (รวมตัวตรวจเส้นทาง)**

Run: `npm test`
Expected: `pass 86` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add data/presetRoutes.json screens/RoutePlannerScreen.js
git commit -m "fix: เส้นทางสำเร็จรูปใช้ปลายทางที่ถูกต้องและลากตามถนนจริงตอนออฟไลน์

เส้นทางสำรองเดิม 7 จุดเขียนด้วยมือ ลากผ่านทุ่งและทะเลสาบ ตอนนี้สร้างจาก OSRM
แล้วลดจุดโดยคลาดจากถนนไม่เกิน 60 ม. และส่งรัศมีปลายทางให้เส้นทางไปน้ำตก
แสดงอันตรายของตัวน้ำตกได้"
```

---

## Task 7: ค้นหาเรียงความเกี่ยวข้อง (F3, TDD)

**Files:**
- Create: `utils/search.js`
- Test: `tests/search.test.js`
- Modify: `hooks/useRiskPoints.js`

**ที่มา:** ค้น "หาด" ได้ 9 ผลแต่เป็นชายหาดแค่ 3 เพราะคำว่า "หาดใหญ่" มีคำว่า "หาด" ทุกจุดในอำเภอหาดใหญ่จึงติดมาหมด และไม่ได้เรียงลำดับ

- [ ] **Step 1: เขียนเทสต์ก่อน**

`tests/search.test.js`:

```javascript
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
```

- [ ] **Step 2: รันเทสต์ ต้องแดง**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/search.test.js`
Expected: FAIL ด้วย `Cannot find module ... utils/search.js`

- [ ] **Step 3: เขียนตัวค้นหา**

`utils/search.js`:

```javascript
/**
 * ค้นหาจุดเสี่ยงจากคำที่ผู้ใช้พิมพ์ แล้วเรียงตามความเกี่ยวข้อง
 *
 * ปัญหาที่ไฟล์นี้แก้:
 * ค้นคำว่า "หาด" (ชายหาด) แล้วเดิมได้ทุกจุดในอำเภอหาดใหญ่ติดมาด้วย
 * เพราะคำว่า "หาดใหญ่" มีคำว่า "หาด" อยู่ ผลที่ได้เป็นชายหาดแค่ 3 จาก 9 รายการ และไม่เรียงลำดับ
 *
 * วิธีแก้: ให้คะแนนความเกี่ยวข้องเป็นขั้น แล้วเรียงจากมากไปน้อย
 *   4 = ชื่อขึ้นต้นด้วยคำค้น        เช่น "หาด" → "หาดสมิหลา..."
 *   3 = ชื่อมีคำค้นอยู่ข้างใน       เช่น "หาด" → "...เลี่ยงเมืองหาดใหญ่"
 *   2 = ตรงกับประเภทอันตราย        เช่น "จมน้ำ" → ทุกจุดประเภทจมน้ำ
 *   1 = ตรงกับชื่ออำเภออย่างเดียว   เช่น "หาด" → จุดในอำเภอหาดใหญ่
 * ถ้าคะแนนเท่ากัน จุดที่อันตรายกว่าขึ้นก่อน
 */

import { HAZARD_TYPES } from '../constants/config.js';

/**
 * ทำให้ข้อความพร้อมเทียบ: ตัดช่องว่างทุกตัวออก และทำตัวอักษรอังกฤษเป็นตัวเล็ก
 * ตัดช่องว่างเพราะภาษาไทยเว้นวรรคไม่แน่นอน "หาด สมิหลา" กับ "หาดสมิหลา" ต้องหาเจอเหมือนกัน
 */
function normalize(text) {
  return String(text || '').replace(/\s+/g, '').toLowerCase();
}

function relevance(point, query) {
  const name = normalize(point.name);
  if (name.startsWith(query)) return 4;
  if (name.includes(query)) return 3;

  const hazard = HAZARD_TYPES.find((t) => t.id === point.type);
  if (hazard && normalize(hazard.label).includes(query)) return 2;

  if (normalize(point.district).includes(query)) return 1;
  return 0;
}

/**
 * @param points จุดเสี่ยงที่มี riskScore แล้ว (จาก useRiskPoints)
 * @param query คำที่ผู้ใช้พิมพ์
 * @returns จุดที่ตรง เรียงตามความเกี่ยวข้อง ถ้าไม่ได้พิมพ์อะไรคืนอาเรย์ว่าง
 */
export function searchPoints(points, query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery || !Array.isArray(points)) return [];

  return points
    .map((point) => ({ point, score: relevance(point, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.point.riskScore || 0) - (a.point.riskScore || 0))
    .map((item) => item.point);
}
```

- [ ] **Step 4: รันเทสต์ ต้องผ่าน**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/search.test.js`
Expected: `pass 7` `fail 0`

- [ ] **Step 5: ใช้ตัวค้นหาใหม่ใน useRiskPoints**

ใน `hooks/useRiskPoints.js` เพิ่ม import ต่อจากบรรทัด `import { calculateRiskScore, getRiskLevel } from '../utils/riskScore';`

```javascript
import { searchPoints as rankSearchResults } from '../utils/search';
```

แล้วแทนที่

```javascript
  /** ค้นหาตามชื่อ ใช้กับช่องค้นหาในหน้าแรก */
  const searchPoints = useMemo(() => {
    return (keyword) => {
      const trimmed = (keyword || '').trim().toLowerCase();
      if (!trimmed) return [];
      return allPoints.filter(
        (point) =>
          point.name.toLowerCase().includes(trimmed) ||
          point.district.toLowerCase().includes(trimmed)
      );
    };
  }, [allPoints]);
```

ด้วย

```javascript
  /** ค้นหาตามชื่อ ประเภทอันตราย และอำเภอ เรียงตามความเกี่ยวข้อง (ตรรกะอยู่ใน utils/search.js) */
  const searchPoints = useMemo(() => {
    return (keyword) => rankSearchResults(allPoints, keyword);
  }, [allPoints]);
```

- [ ] **Step 6: Commit**

```bash
git add utils/search.js tests/search.test.js hooks/useRiskPoints.js
git commit -m "fix: ค้นหาเรียงตามความเกี่ยวข้อง ค้น \"หาด\" แล้วได้ชายหาดขึ้นก่อน

เดิมคำว่า หาดใหญ่ มีคำว่า หาด อยู่ ทุกจุดในอำเภอหาดใหญ่จึงติดมา (ชายหาด 3 จาก 9)
ตอนนี้ให้คะแนน ชื่อขึ้นต้น > ชื่อมีคำ > ประเภทอันตราย > อำเภอ และไม่สนช่องว่าง"
```

---

## Task 8: แถบฤดูกาลที่หัวข้อไม่ขัดกับเนื้อความ (F4, TDD)

**Files:**
- Create: `utils/season.js`
- Test: `tests/season.test.js`
- Modify: `screens/HomeScreen.js`

**ที่มา:** หัวข้อเขียนตายตัว "ช่วงกันยายนนี้ต้องระวังเป็นพิเศษ" แต่เนื้อความบอก "เดือนนี้ไม่มีจุดใดที่อยู่ในช่วงเสี่ยงสูงเป็นพิเศษ"

- [ ] **Step 1: เขียนเทสต์ก่อน**

`tests/season.test.js`:

```javascript
/**
 * เทสต์ของ utils/season.js
 *
 * บั๊กที่เทสต์นี้กันไม่ให้กลับมา: หัวข้อบอก "ต้องระวังเป็นพิเศษ" ทุกเดือน
 * แม้เนื้อความจะบอกว่าเดือนนั้นไม่มีจุดใดอยู่ในช่วงเสี่ยง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSeason, THAI_MONTHS } from '../utils/season.js';

const beach = { name: 'หาดชลาทัศน์', peakMonths: [12, 1] };
const road = { name: 'ทางขึ้นเขาคอหงส์', peakMonths: [] };

test('เดือนที่มีจุดอยู่ในช่วงเสี่ยง: หัวข้อต้องบอกให้ระวังเป็นพิเศษ และระบุชื่อจุด', () => {
  const result = summarizeSeason([beach, road], 12);
  assert.equal(result.title, 'ช่วงธันวาคมนี้ต้องระวังเป็นพิเศษ');
  assert.ok(result.body.includes('หาดชลาทัศน์'), result.body);
  assert.equal(result.pointsInPeak.length, 1);
});

test('เดือนที่ไม่มีจุดอยู่ในช่วงเสี่ยง: หัวข้อต้องไม่บอกว่าระวังเป็นพิเศษ', () => {
  const result = summarizeSeason([beach, road], 9);
  assert.ok(!result.title.includes('เป็นพิเศษ'), `หัวข้อ: ${result.title}`);
  assert.ok(result.body.includes('ไม่มีจุดใด'), result.body);
  assert.equal(result.pointsInPeak.length, 0);
});

test('จุดเยอะ แสดงชื่อแค่ 3 จุด ที่เหลือบอกเป็นจำนวน', () => {
  const many = ['ก', 'ข', 'ค', 'ง', 'จ'].map((name) => ({ name, peakMonths: [1] }));
  const result = summarizeSeason(many, 1);
  assert.ok(result.body.includes('ก, ข, ค และอีก 2 จุด'), result.body);
});

test('จุดที่ไม่มีฟิลด์ peakMonths ต้องไม่พัง', () => {
  const result = summarizeSeason([{ name: 'จุดผู้ใช้' }], 5);
  assert.equal(result.pointsInPeak.length, 0);
});

test('ชื่อเดือนครบ 12 เดือน เริ่มที่มกราคม', () => {
  assert.equal(THAI_MONTHS.length, 12);
  assert.equal(THAI_MONTHS[0], 'มกราคม');
  assert.equal(THAI_MONTHS[11], 'ธันวาคม');
});
```

- [ ] **Step 2: รันเทสต์ ต้องแดง**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/season.test.js`
Expected: FAIL ด้วย `Cannot find module ... utils/season.js`

- [ ] **Step 3: เขียนตัวสรุปฤดูกาล**

`utils/season.js`:

```javascript
/**
 * สร้างข้อความ "แถบสรุปความเสี่ยงประจำเดือน" ในหน้าแรก (ตามเอกสารบทที่ 4)
 *
 * ปัญหาเดิม: หัวข้อเขียนตายตัวว่า "ช่วงนี้ต้องระวังเป็นพิเศษ" ทุกเดือน
 * แต่เนื้อความบางเดือนบอกว่า "ไม่มีจุดใดอยู่ในช่วงเสี่ยงสูงเป็นพิเศษ" ผู้ใช้อ่านแล้วงง
 * ตอนนี้หัวข้อกับเนื้อความมาจากข้อมูลชุดเดียวกัน จึงไม่มีทางขัดกัน
 */

/** ชื่อเดือนภาษาไทย (index 0 = มกราคม) */
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** แสดงชื่อจุดไม่เกินเท่านี้ ที่เหลือบอกเป็นจำนวน เพื่อไม่ให้แถบยาวเกินจอมือถือ */
const MAX_NAMES = 3;

/**
 * @param points จุดเสี่ยงทั้งหมด
 * @param month เดือน 1–12
 * @returns { title, body, pointsInPeak }
 */
export function summarizeSeason(points, month) {
  const monthName = THAI_MONTHS[month - 1] || '';
  const pointsInPeak = (points || []).filter((point) => (point.peakMonths || []).includes(month));

  if (pointsInPeak.length === 0) {
    return {
      title: `ภาพรวมเดือน${monthName}`,
      body: 'เดือนนี้ไม่มีจุดใดอยู่ในช่วงเสี่ยงสูงของปี แต่ยังควรระวังตามปกติ',
      pointsInPeak,
    };
  }

  const names = pointsInPeak.slice(0, MAX_NAMES).map((p) => p.name);
  const remaining = pointsInPeak.length - names.length;
  const nameText = names.join(', ') + (remaining > 0 ? ` และอีก ${remaining} จุด` : '');

  return {
    title: `ช่วง${monthName}นี้ต้องระวังเป็นพิเศษ`,
    body: `${pointsInPeak.length} จุดอยู่ในช่วงเสี่ยงสูงของปี: ${nameText}`,
    pointsInPeak,
  };
}
```

- [ ] **Step 4: รันเทสต์ ต้องผ่าน**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/season.test.js`
Expected: `pass 5` `fail 0`

- [ ] **Step 5: ใช้ในหน้าแรก**

ใน `screens/HomeScreen.js` เพิ่ม import ต่อจากบรรทัด `import { useRiskPoints } from '../hooks/useRiskPoints';`

```javascript
import { summarizeSeason } from '../utils/season';
```

ลบค่าคงที่ชื่อเดือนออกทั้งก้อน (ย้ายไปอยู่ใน `utils/season.js` แล้ว):

```javascript
/** ชื่อเดือนภาษาไทย ใช้แสดงในแถบสรุป (index 0 = มกราคม) */
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

```

แทนที่

```javascript
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const monthName = THAI_MONTHS[currentMonth - 1];

  // นับว่ามีกี่จุดที่เดือนนี้เป็นเดือนเสี่ยงสูง
  const pointsPeakingThisMonth = allPoints.filter((point) =>
    (point.peakMonths || []).includes(currentMonth)
  );
```

ด้วย

```javascript
  // หัวข้อและเนื้อความของแถบฤดูกาลมาจากข้อมูลชุดเดียวกัน (utils/season.js) จึงไม่ขัดกัน
  const season = summarizeSeason(allPoints, new Date().getMonth() + 1);
```

แทนที่

```javascript
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ช่วง{monthName}นี้ต้องระวังเป็นพิเศษ</Text>
              <Text style={styles.seasonText}>
                {pointsPeakingThisMonth.length > 0
                  ? `มี ${pointsPeakingThisMonth.length} จุดที่อยู่ในช่วงเสี่ยงสูงของปี ควรเพิ่มความระมัดระวัง`
                  : 'เดือนนี้ไม่มีจุดใดที่อยู่ในช่วงเสี่ยงสูงเป็นพิเศษ แต่ยังควรระวังตามปกติ'}
              </Text>
            </View>
```

ด้วย

```javascript
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{season.title}</Text>
              <Text style={styles.seasonText}>{season.body}</Text>
            </View>
```

- [ ] **Step 6: Commit**

```bash
git add utils/season.js tests/season.test.js screens/HomeScreen.js
git commit -m "fix: แถบฤดูกาลในหน้าแรกไม่พูดขัดกันเองอีก

เดิมหัวข้อบอก ต้องระวังเป็นพิเศษ ทุกเดือน แม้เนื้อความจะบอกว่าไม่มีจุดใดอยู่ในช่วงเสี่ยง
ตอนนี้ทั้งสองส่วนสร้างจากข้อมูลชุดเดียวกัน และบอกชื่อจุดที่เข้าช่วงเสี่ยงด้วย"
```

---

## Task 9: หัวข้อชนกับลิงก์บนจอมือถือ (F6)

**Files:**
- Modify: `screens/HomeScreen.js`

**ที่มา:** ที่ความกว้าง 375 px หัวข้อ "จุดที่ควรระวังมากที่สุดตอนนี้" กับลิงก์ "ดูแผนที่ทั้งหมด" ติดกันไม่มีช่องว่าง เพราะแถวไม่มี `gap` และลิงก์ถูกบีบได้

- [ ] **Step 1: เพิ่มระยะห่างและห้ามบีบลิงก์**

ใน `screens/HomeScreen.js` แทนที่

```javascript
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
```

ด้วย

```javascript
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
```

และแทนที่

```javascript
  link: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
  },
```

ด้วย

```javascript
  link: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    // ห้ามลิงก์หดตัว ให้หัวข้อทางซ้ายเป็นฝ่ายขึ้นบรรทัดใหม่แทน
    flexShrink: 0,
  },
```

- [ ] **Step 2: Commit**

```bash
git add screens/HomeScreen.js
git commit -m "fix: หัวข้อกับลิงก์ดูแผนที่ทั้งหมดไม่ชนกันบนจอมือถือ"
```

(ตรวจด้วยตาในเบราว์เซอร์ที่ 375 px ใน Task 11)

---

## Task 10: ข้อมูลกลางที่ทุกหน้าจอเห็นตรงกัน (F7)

**Files:**
- Create: `utils/userPoint.js`
- Test: `tests/userPoint.test.js`
- Create: `hooks/AppDataProvider.js`
- Modify: `hooks/useSavedPoints.js`
- Modify: `App.js`

**ที่มา:** ทุกหน้าจอเรียก `useSavedPoints` แยกกัน แต่ละหน้าจอจึงถือ `useState` สำเนาของตัวเอง ไม่มีการโหลดใหม่ตอนกลับมาที่หน้าจอ และแท็บด้านล่างไม่ถูกปิดเมื่อสลับ บันทึกจุดในแท็บ "บันทึก" แล้วแท็บ "แผนที่" ที่เปิดค้างไว้จะไม่เห็นจนกว่าจะเปิดแอปใหม่

- [ ] **Step 1: เขียนเทสต์ของตัวสร้างจุดผู้ใช้ก่อน**

แยกการสร้างข้อมูลจุดออกจาก hook เป็นฟังก์ชันล้วน เพื่อเทสต์ได้ว่ากฎ "จุดของผู้ใช้ต้องเป็น verified: false เสมอ" ไม่มีวันถูกละเมิด

`tests/userPoint.test.js`:

```javascript
/**
 * เทสต์ของ utils/userPoint.js
 *
 * กฎของโปรเจค (เอกสารบทที่ 6.3): จุดที่ผู้ใช้บันทึกเองต้องไม่มีทางสับสนกับข้อมูลที่มีแหล่งอ้างอิง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUserPoint, USER_POINT_SOURCE } from '../utils/userPoint.js';

const input = {
  name: '  ทางโค้งหน้าบ้าน  ',
  type: 'crash',
  description: ' รถเร็วมาก ',
  coordinate: { lat: 7.0, lng: 100.47 },
};
const fixedNow = new Date('2026-09-11T10:00:00.000Z');

test('จุดที่ผู้ใช้บันทึกต้องเป็น verified: false เสมอ', () => {
  assert.equal(buildUserPoint(input, fixedNow).verified, false);
});

test('source ต้องบอกชัดว่าไม่ใช่สถิติทางการ', () => {
  assert.equal(buildUserPoint(input, fixedNow).source, USER_POINT_SOURCE);
});

test('id ขึ้นต้นด้วย user- และไม่ซ้ำกันเมื่อบันทึกคนละเวลา', () => {
  const a = buildUserPoint(input, fixedNow);
  const b = buildUserPoint(input, new Date(fixedNow.getTime() + 1));
  assert.ok(a.id.startsWith('user-'));
  assert.notEqual(a.id, b.id);
});

test('ตัดช่องว่างหัวท้ายของชื่อและรายละเอียด และไม่มีตัวเลขเหตุการณ์', () => {
  const point = buildUserPoint(input, fixedNow);
  assert.equal(point.name, 'ทางโค้งหน้าบ้าน');
  assert.deepEqual(point.advice, ['รถเร็วมาก']);
  assert.deepEqual(point.incidents, []);
});

test('ไม่ใส่รายละเอียด ต้องได้คำแนะนำว่าง ไม่ใช่ข้อความว่าง', () => {
  const point = buildUserPoint({ ...input, description: '   ' }, fixedNow);
  assert.deepEqual(point.advice, []);
});
```

- [ ] **Step 2: รันเทสต์ ต้องแดง**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/userPoint.test.js`
Expected: FAIL ด้วย `Cannot find module ... utils/userPoint.js`

- [ ] **Step 3: เขียนตัวสร้างจุดผู้ใช้**

`utils/userPoint.js`:

```javascript
/**
 * สร้างข้อมูลจุดเสี่ยงที่ผู้ใช้บันทึกเอง
 *
 * แยกออกมาเป็นฟังก์ชันล้วนเพื่อให้เทสต์ได้ว่ากฎสำคัญของโปรเจคไม่มีวันถูกละเมิด:
 * จุดที่ผู้ใช้บันทึกเองต้องเป็น verified: false เสมอ และ source ต้องบอกชัดว่าไม่ใช่สถิติทางการ
 * (ตามเอกสารบทที่ 6.3 เพื่อไม่ให้สับสนกับข้อมูลที่มีแหล่งอ้างอิง)
 */

import { CATEGORIES, DEFAULT_EMERGENCY } from '../constants/config.js';

export const USER_POINT_SOURCE = 'บันทึกโดยผู้ใช้เอง ไม่ใช่ข้อมูลสถิติทางการ';
export const USER_POINT_DISTRICT = 'บันทึกโดยผู้ใช้';

/**
 * @param input.name ชื่อจุด
 * @param input.type ประเภทอันตราย (id ใน HAZARD_TYPES)
 * @param input.description รายละเอียด จะกลายเป็นคำแนะนำข้อแรก
 * @param input.coordinate { lat, lng }
 * @param now เวลาที่บันทึก (ใส่ได้เพื่อทดสอบ)
 */
export function buildUserPoint({ name, type, description, coordinate }, now = new Date()) {
  const trimmedDescription = (description || '').trim();
  return {
    id: 'user-' + now.getTime(),
    name: (name || '').trim(),
    category: CATEGORIES.ROAD,
    type,
    district: USER_POINT_DISTRICT,
    coordinate,
    incidents: [],
    peakMonths: [],
    peakHours: [],
    advice: trimmedDescription ? [trimmedDescription] : [],
    emergency: [DEFAULT_EMERGENCY],
    source: USER_POINT_SOURCE,
    verified: false,
    isUserCreated: true,
    createdAt: now.toISOString(),
  };
}
```

- [ ] **Step 4: รันเทสต์ ต้องผ่าน**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/userPoint.test.js`
Expected: `pass 5` `fail 0`

- [ ] **Step 5: สร้าง Provider ข้อมูลกลาง**

`hooks/AppDataProvider.js`:

```javascript
/**
 * ข้อมูลที่ต้องใช้ร่วมกันทั้งแอป เก็บไว้ที่เดียว
 *
 * ปัญหาที่ไฟล์นี้แก้:
 * เดิมทุกหน้าจอเรียก useSavedPoints แยกกัน แต่ละหน้าจอจึงถือสำเนาของตัวเอง
 * แท็บด้านล่างไม่ถูกปิดเมื่อสลับไปมา พอบันทึกจุดใหม่ในแท็บ "บันทึก"
 * แท็บ "แผนที่" ที่เปิดค้างไว้จะไม่เห็นจุดนั้นจนกว่าจะปิดแอปแล้วเปิดใหม่
 *
 * วิธีแก้: เก็บข้อมูลไว้ใน React Context ที่ครอบทั้งแอป หน้าจอไหนแก้ ทุกหน้าจอเห็นทันที
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { buildUserPoint } from '../utils/userPoint';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [savedPoints, setSavedPoints] = useState([]);
  const [isSavedPointsLoading, setIsSavedPointsLoading] = useState(true);

  // เก็บค่าล่าสุดไว้ใน ref ด้วย เพื่อให้การเพิ่มหรือลบติดกันเร็ว ๆ ไม่ทำงานบนข้อมูลเก่า
  const savedPointsRef = useRef([]);

  /** อ่านข้อมูลจากเครื่องขึ้นมาใส่ state */
  const reloadSavedPoints = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_POINTS);
      const points = raw ? JSON.parse(raw) : [];
      savedPointsRef.current = points;
      setSavedPoints(points);
    } catch (error) {
      // อ่านไม่ได้ให้เริ่มจากรายการว่าง ดีกว่าทำให้แอปพัง
      console.warn('อ่านจุดที่บันทึกไว้ไม่สำเร็จ:', error.message);
      savedPointsRef.current = [];
      setSavedPoints([]);
    } finally {
      setIsSavedPointsLoading(false);
    }
  }, []);

  // โหลดครั้งเดียวตอนเปิดแอป
  useEffect(() => {
    reloadSavedPoints();
  }, [reloadSavedPoints]);

  /** อัปเดตทุกหน้าจอทันที แล้วค่อยเขียนลงเครื่อง */
  const persistSavedPoints = useCallback(async (points) => {
    savedPointsRef.current = points;
    setSavedPoints(points);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_POINTS, JSON.stringify(points));
    } catch (error) {
      console.warn('บันทึกจุดลงเครื่องไม่สำเร็จ:', error.message);
    }
  }, []);

  const addPoint = useCallback(
    async (input) => {
      const newPoint = buildUserPoint(input);
      await persistSavedPoints([...savedPointsRef.current, newPoint]);
      return newPoint;
    },
    [persistSavedPoints]
  );

  const removePoint = useCallback(
    async (id) => {
      await persistSavedPoints(savedPointsRef.current.filter((p) => p.id !== id));
    },
    [persistSavedPoints]
  );

  const value = useMemo(
    () => ({ savedPoints, isSavedPointsLoading, addPoint, removePoint, reloadSavedPoints }),
    [savedPoints, isSavedPointsLoading, addPoint, removePoint, reloadSavedPoints]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/** ใช้ในหน้าจอหรือ hook อื่นเพื่อเข้าถึงข้อมูลกลาง */
export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData ต้องใช้ภายใน <AppDataProvider> (ดู App.js)');
  }
  return context;
}
```

- [ ] **Step 6: ให้ useSavedPoints อ่านจาก Provider (หน้าตาเดิม)**

แทนที่เนื้อหาทั้งไฟล์ `hooks/useSavedPoints.js` ด้วย:

```javascript
/**
 * จัดการจุดเสี่ยงที่ผู้ใช้บันทึกเอง เก็บไว้ในเครื่อง (AsyncStorage)
 *
 * ทำไมต้องเก็บในเครื่อง ไม่ส่งขึ้นเซิร์ฟเวอร์:
 * โปรเจคนี้ไม่มีระบบหลังบ้าน (ตามขอบเขตในเอกสารบทที่ 6.2)
 * แต่การออกแบบฟีเจอร์นี้ไว้ตั้งแต่ต้น ทำให้ต่อยอดเป็นระบบ Crowdsourcing ได้ในอนาคต
 *
 * ข้อมูลจริงอยู่ใน AppDataProvider เพื่อให้ทุกหน้าจอเห็นข้อมูลชุดเดียวกันทันที
 * hook นี้คงหน้าตาเดิมไว้ หน้าจอที่เรียกใช้อยู่แล้วจึงไม่ต้องแก้อะไร
 */

import { useAppData } from './AppDataProvider';

export function useSavedPoints() {
  const { savedPoints, isSavedPointsLoading, addPoint, removePoint, reloadSavedPoints } = useAppData();
  return { savedPoints, isLoading: isSavedPointsLoading, addPoint, removePoint, reload: reloadSavedPoints };
}
```

- [ ] **Step 7: ครอบแอปด้วย Provider**

ใน `App.js` แทนที่

```javascript
 * ไฟล์นี้ทำแค่ 3 อย่าง คือครอบ SafeArea, ครอบ NavigationContainer และเรียก RootNavigator
```

ด้วย

```javascript
 * ไฟล์นี้ทำแค่ 4 อย่าง คือครอบ SafeArea, ครอบข้อมูลกลาง (AppDataProvider),
 * ครอบ NavigationContainer และเรียก RootNavigator
```

เพิ่ม import ต่อจากบรรทัด `import RootNavigator from './navigation/RootNavigator';`

```javascript
import { AppDataProvider } from './hooks/AppDataProvider';
```

แทนที่

```javascript
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
```

ด้วย

```javascript
    <SafeAreaProvider>
      {/* ข้อมูลกลางต้องครอบ NavigationContainer เพื่อให้ทุกหน้าจอเห็นข้อมูลชุดเดียวกัน */}
      <AppDataProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AppDataProvider>
    </SafeAreaProvider>
```

- [ ] **Step 8: รันเทสต์ทั้งหมด**

Run: `npm test`
Expected: `pass 103` `fail 0`

- [ ] **Step 9: Commit**

```bash
git add utils/userPoint.js tests/userPoint.test.js hooks/AppDataProvider.js hooks/useSavedPoints.js App.js
git commit -m "fix: จุดที่บันทึกใหม่โผล่ทุกหน้าจอทันที ไม่ต้องเปิดแอปใหม่

เดิมแต่ละหน้าจอถือสำเนาจุดที่บันทึกของตัวเอง แท็บที่เปิดค้างไว้จึงไม่เห็นจุดใหม่
ย้ายข้อมูลไปไว้ใน AppDataProvider ตัวเดียว useSavedPoints คงหน้าตาเดิม
แยกการสร้างจุดของผู้ใช้เป็นฟังก์ชันล้วนที่มีเทสต์คุมกฎ verified: false"
```

---

## Task 11: ตรวจของจริงในเบราว์เซอร์ และอัปเดตเอกสาร

**Files:**
- Modify: `README.md`

- [ ] **Step 1: ไม่ให้ไฟล์ build หลุดเข้า git**

เพิ่มบรรทัดนี้ท้ายไฟล์ `.gitignore` (โฟลเดอร์ `dist/` คือที่ `expo export` เขียนผลลัพธ์ลงไปโดยค่าเริ่มต้น)

```
dist/
```

- [ ] **Step 2: เทสต์และ build**

Run: `npm test`
Expected: `pass 103` `fail 0`

Run: `npx expo export --platform web`
Expected: บรรทัดสุดท้ายเป็น `Exported: dist` ไม่มี error

Run (ตรวจว่า react-native-maps ไม่หลุดเข้าบันเดิลเว็บ): `grep -c "react-native-maps" dist/_expo/static/js/web/*.js`
Expected: `0`

- [ ] **Step 3: ตรวจในเบราว์เซอร์ที่ขนาดมือถือ 375×812**

เปิดผลลัพธ์ด้วย `cd dist && python -m http.server 8750` แล้วเข้า `http://127.0.0.1:8750` ตรวจทีละข้อ ข้อที่ต้องใช้ตำแหน่งให้ใช้ GPS ปลอม คือแทน `navigator.geolocation` ด้วยอ็อบเจกต์ที่มี `getCurrentPosition` และ `watchPosition` คืนพิกัดที่กำหนดเอง

| # | ตรวจ | เกณฑ์ผ่าน |
|---|---|---|
| 1 | พิมพ์ "หาด" ในหน้าแรก | สองผลแรกคือ หาดชลาทัศน์ และ หาดสมิหลา |
| 2 | แถบฤดูกาล (ทดสอบในเดือนกันยายน) | หัวข้อ "ภาพรวมเดือนกันยายน" ไม่มีคำว่า "เป็นพิเศษ" |
| 3 | หัวข้อ "จุดที่ควรระวังมากที่สุดตอนนี้" | ลิงก์ "ดูแผนที่ทั้งหมด" ไม่ติดกับหัวข้อ |
| 4 | แท็บแผนที่ | หมุด 12 จุด หมุดโตนงาช้างอยู่ที่ลองจิจูดประมาณ 100.232 |
| 5 | แท็บเส้นทาง เลือก "หาดใหญ่ → น้ำตกโตนงาช้าง" | รายการจุดเสี่ยงมีน้ำตกโตนงาช้าง |
| 6 | เข้าโหมดเดินทาง แล้วกดหยุด | หน้าจอไม่ขาว console ไม่มี `removeSubscription` |
| 7 | บันทึกจุดใหม่ในแท็บบันทึก แล้วสลับไปแท็บแผนที่ | หมุดเพิ่มเป็น 13 ทันทีโดยไม่ต้องโหลดหน้าใหม่ |
| 8 | โหลดหน้าเว็บใหม่ | หมุดยังเป็น 13 (ข้อมูลถูกเก็บลงเครื่องจริง) |

ทุกข้อต้องผ่าน ข้อไหนไม่ผ่านให้แก้แล้วตรวจใหม่ก่อนไปขั้นต่อไป

- [ ] **Step 4: บอกในแผนระยะที่ 1 ว่าค่าข้อมูลถูกแก้แล้ว**

แผนระยะที่ 1 มี JSON ของข้อมูลชุดเดิม (พิกัดผิด) ใครที่เปิดแผนนั้นต้องรู้ว่าไม่ใช่ค่าปัจจุบัน
ใน `docs/superpowers/plans/2026-09-05-antacinn-help-app.md` แทรกบรรทัดนี้ต่อจากหัวข้อบรรทัดแรกของไฟล์

```markdown

> **หมายเหตุ (2026-09-11):** ค่าในไฟล์ข้อมูล (`riskPoints.json`, `presetRoutes.json`) ของแผนนี้ถูกแก้ในระยะที่ 2 แล้ว
> พิกัดเดิมในแผนนี้คลาดสูงสุด 11 กม. ให้ถือไฟล์ใน repo เป็นค่าจริง ดูที่มาใน `data/SOURCES.md`
```

- [ ] **Step 5: อัปเดต README**

ใน `README.md` แทนที่

```markdown
**4 จาก 12 จุด** กรอกข้อมูลเหตุการณ์จริงที่มีแหล่งอ้างอิงแล้ว ได้แก่
ทางขึ้นเขาคอหงส์ · หาดชลาทัศน์ · น้ำตกโตนงาช้าง · สะพานติณสูลานนท์
```

ด้วย

```markdown
**4 จาก 12 จุด** กรอกข้อมูลเหตุการณ์จริงที่มีแหล่งอ้างอิงแล้ว ได้แก่
ทางขึ้นเขาคอหงส์ · หาดชลาทัศน์ · น้ำตกโตนงาช้าง · สะพานติณสูลานนท์ ช่วงที่ 2

**พิกัดทุกจุดตรวจกับ OpenStreetMap แล้ว** (2026-09-11) ที่มาของแต่ละจุดอยู่ใน `data/SOURCES.md`

### กติกาการตั้ง id

ขึ้นต้นด้วยตัวย่ออำเภอ ตามด้วยชื่อสถานที่และลำดับ คำนำหน้าต้องตรงกับฟิลด์ `district` เสมอ
(`npm test` ตรวจให้อัตโนมัติ)

| คำนำหน้า | อำเภอ |
|---|---|
| `hy-` | หาดใหญ่ |
| `sk-` | เมืองสงขลา |
| `sn-` | สิงหนคร (ใช้กับสะพานติณสูลานนท์ช่วงที่ 2 ซึ่งข้ามไปฝั่งสิงหนคร) |
| `user-` | จุดที่ผู้ใช้บันทึกเอง (สร้างโดยแอป ไม่อยู่ในไฟล์ข้อมูล) |
```

และแทนที่บรรทัดจำนวนเทสต์

```markdown
ต้องได้ `pass 64` `fail 0`
```

ด้วย

```markdown
ต้องได้ `pass 103` `fail 0` (รวมการตรวจความถูกต้องของไฟล์ข้อมูล)
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore README.md docs/superpowers/plans/2026-09-05-antacinn-help-app.md
git commit -m "docs: README บอกกติกา id ใหม่ (sn-) และที่มาของพิกัด ไม่ให้ dist/ หลุดเข้า git"
```
