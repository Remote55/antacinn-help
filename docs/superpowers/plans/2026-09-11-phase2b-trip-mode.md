# AntacinnHelp ระยะที่ 2 ช่วง B — โหมดเดินทางที่ไม่ต้องมองจอ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้โหมดเดินทางเตือนด้วยเสียงพูดภาษาไทยและการสั่นตามที่เอกสารกำหนด บอกระยะถึงจุดเสี่ยงถัดไป "ตามเส้นทาง" และมีโหมดจำลองการเดินทางสำหรับนำเสนอและทดสอบโดยไม่ต้องขับรถจริง

**Architecture:** คณิตศาสตร์ใหม่ทั้งหมด (ตำแหน่งบนเส้นทาง ตำแหน่งเสมือน ประโยคที่พูด) เป็นฟังก์ชันล้วนใน `utils/` ที่มีเทสต์คุม ส่วนที่ต้องใช้ React (ตัวจับเวลาจำลอง เสียงพูด ตรรกะเตือน) เป็น hook แยกไฟล์ละหน้าที่ หน้าจอโหมดเดินทางรับตำแหน่งได้สองแหล่ง (GPS จริง หรือเสมือน) ในรูปแบบเดียวกัน ตรรกะการเตือนเดิม (`evaluateTripAlerts`) จึงไม่ต้องแก้

**Tech Stack:** React Native + Expo SDK 54, `expo-speech` (ใหม่), `Vibration` ของ React Native, `node --test`

**เอกสารออกแบบ:** `docs/superpowers/specs/2026-09-11-antacinn-help-phase2-design.md` ช่วง B และหมวด 4.3

**ปรับจากเอกสารออกแบบหนึ่งจุด:** เอกสารออกแบบเขียนไว้เป็นฟังก์ชันเดียว `buildAlertMessage(point, distanceM, { alongRoute })` แผนนี้แยกเป็นสองฟังก์ชันที่ชัดกว่า คือ `buildAlertMessage` (เตือนเมื่อเข้าใกล้ พูดแทรกได้ พร้อมสั่น) และ `buildHeadsUpMessage` (บอกจุดถัดไปล่วงหน้าตามเส้นทาง ต่อคิว ไม่สั่น) เพราะสองอย่างนี้มีกฎการพูดต่างกัน การเตือนเข้าใกล้ต้องไม่ถูกตัดกลางประโยคโดยการบอกล่วงหน้า

---

## ภาพรวมไฟล์

| ไฟล์ | สถานะ | หน้าที่ |
|---|---|---|
| `utils/routeProgress.js` | ใหม่ | ผู้ใช้อยู่ตรงไหนของเส้นทาง จุดเสี่ยงถัดไป สถานะสำหรับแสดงผล |
| `tests/routeProgress.test.js` | ใหม่ | 13 เทสต์ |
| `utils/routeAnalysis.js` | แก้ | ใช้ `locateOnRoute` แทนการเขียนคณิตศาสตร์ซ้ำ (เทสต์เดิม 17 ข้อต้องยังผ่าน) |
| `utils/simulation.js` | ใหม่ | ตำแหน่งเสมือนเมื่อวิ่งไปได้ระยะหนึ่ง |
| `tests/simulation.test.js` | ใหม่ | 10 เทสต์ |
| `utils/alertMessage.js` | ใหม่ | ประโยคที่พูดเตือน |
| `tests/alertMessage.test.js` | ใหม่ | 10 เทสต์ |
| `constants/config.js` | แก้ | เพิ่ม `SIMULATION` และคำเตือนทั่วไปของแต่ละประเภทอันตราย |
| `hooks/useSimulatedLocation.js` | ใหม่ | ตัวจับเวลาที่เลื่อนตำแหน่งเสมือน |
| `hooks/useVoiceAlerts.js` | ใหม่ | พูดภาษาไทย สั่น ปิดเสียง ตรวจว่ามีเสียงไทยไหม |
| `hooks/useTripAlerts.js` | ใหม่ | ย้ายตรรกะเตือนออกจากหน้าจอ |
| `components/TripAlertCard.js` | ใหม่ | การ์ดเตือนที่นับถอยหลังสด |
| `components/NextRiskPanel.js` | ใหม่ | "จุดเสี่ยงถัดไป อีก X กม. ตามเส้นทาง" |
| `components/SimulationControls.js` | ใหม่ | เล่น หยุด เริ่มใหม่ ความเร็ว แถบความคืบหน้า |
| `screens/TripModeScreen.js` | เขียนใหม่ | ประกอบทุกชิ้นเข้าด้วยกัน |
| `screens/RoutePlannerScreen.js` | แก้ | ปุ่มจำลองและปุ่ม GPS ส่งเส้นทางไปให้โหมดเดินทาง |
| `app.json` | แก้ | สิทธิ์ `VIBRATE` บน Android |
| `package.json` | แก้ | เพิ่ม `expo-speech` และคำสั่ง `check:imports` |
| `scripts/check-imports.mjs` | ใหม่ | ตรวจว่าทุก import หาไฟล์และชื่อเจอ ใช้ก่อนอัปโหลดขึ้น Snack |

จำนวนเทสต์: 103 → **136**

---

## Task 1: ตำแหน่งบนเส้นทาง (TDD)

**Files:**
- Create: `utils/routeProgress.js`
- Test: `tests/routeProgress.test.js`
- Modify: `utils/routeAnalysis.js`

- [ ] **Step 1: เขียนเทสต์ก่อน**

`tests/routeProgress.test.js`:

```javascript
/**
 * เทสต์ของ utils/routeProgress.js
 *
 * โจทย์ (เอกสารบทที่ 5.2): บอกผู้ใช้ว่า "อีก 4.2 กิโลเมตรข้างหน้าจะถึงจุดเสี่ยง"
 * ระยะนี้ต้องวัดตามถนน ไม่ใช่เส้นตรง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locateOnRoute, nextRiskOnRoute, describeRouteStatus } from '../utils/routeProgress.js';

/** เส้นทางทดสอบ: วิ่งตรงขึ้นเหนือจาก lat 7.00 ถึง 7.04 ที่ lng 100.5 ช่วงละประมาณ 1,112 ม. */
const straightRoute = [
  { lat: 7.0, lng: 100.5 },
  { lat: 7.01, lng: 100.5 },
  { lat: 7.02, lng: 100.5 },
  { lat: 7.03, lng: 100.5 },
  { lat: 7.04, lng: 100.5 },
];

/** จุดเสี่ยงบนเส้นทางในรูปแบบเดียวกับที่ findRiskPointsAlongRoute คืนมา */
const onRoute = [
  { point: { id: 'a', name: 'จุด ก' }, distanceAlongRouteM: 500 },
  { point: { id: 'b', name: 'จุด ข' }, distanceAlongRouteM: 4200 },
];

test('locateOnRoute: จุดบนเส้นทางพอดี ห่างเส้นทาง 0 และระยะสะสมถูกต้อง', () => {
  const result = locateOnRoute(straightRoute, { lat: 7.02, lng: 100.5 });
  assert.ok(result.offRouteM < 1, `ห่างเส้นทาง ${result.offRouteM}`);
  assert.ok(Math.abs(result.alongM - 2224) < 30, `ระยะสะสม ${result.alongM}`);
});

test('locateOnRoute: จุดข้างทาง บอกทั้งระยะห่างและตำแหน่งตามเส้นทาง', () => {
  // 0.005 องศาลองจิจูดที่ละติจูด 7 ประมาณ 552 ม. และอยู่กลางช่วงที่สอง (1.5 ช่วง = 1,668 ม.)
  const result = locateOnRoute(straightRoute, { lat: 7.015, lng: 100.505 });
  assert.ok(Math.abs(result.offRouteM - 552) < 20, `ห่างเส้นทาง ${result.offRouteM}`);
  assert.ok(Math.abs(result.alongM - 1668) < 30, `ระยะสะสม ${result.alongM}`);
});

test('locateOnRoute: ก่อนถึงต้นทาง ระยะสะสมเป็น 0', () => {
  const result = locateOnRoute(straightRoute, { lat: 6.99, lng: 100.5 });
  assert.equal(result.alongM, 0);
  assert.ok(Math.abs(result.offRouteM - 1112) < 20, `ห่างเส้นทาง ${result.offRouteM}`);
});

test('locateOnRoute: เลยปลายทาง ระยะสะสมเท่าความยาวทั้งเส้น', () => {
  const result = locateOnRoute(straightRoute, { lat: 7.05, lng: 100.5 });
  assert.ok(Math.abs(result.alongM - 4448) < 40, `ระยะสะสม ${result.alongM}`);
  assert.ok(Math.abs(result.offRouteM - 1112) < 20, `ห่างเส้นทาง ${result.offRouteM}`);
});

test('locateOnRoute: ข้อมูลไม่พอ คืน null ไม่พัง', () => {
  assert.equal(locateOnRoute([{ lat: 7.0, lng: 100.5 }], { lat: 7.0, lng: 100.5 }), null);
  assert.equal(locateOnRoute(straightRoute, null), null);
});

test('nextRiskOnRoute: ได้จุดถัดไปพร้อมระยะที่เหลือตามเส้นทาง', () => {
  const next = nextRiskOnRoute(onRoute, 0);
  assert.equal(next.item.point.id, 'a');
  assert.equal(next.remainingM, 500);
});

test('nextRiskOnRoute: ผ่านจุดแรกแล้ว ได้จุดที่สอง', () => {
  const next = nextRiskOnRoute(onRoute, 600);
  assert.equal(next.item.point.id, 'b');
  assert.equal(next.remainingM, 3600);
});

test('nextRiskOnRoute: อยู่ตรงจุดพอดี นับว่าผ่านแล้ว', () => {
  assert.equal(nextRiskOnRoute(onRoute, 500).item.point.id, 'b');
});

test('nextRiskOnRoute: ผ่านครบทุกจุด หรือไม่มีจุดเลย คืน null', () => {
  assert.equal(nextRiskOnRoute(onRoute, 5000), null);
  assert.equal(nextRiskOnRoute([], 0), null);
});

test('describeRouteStatus: อยู่บนเส้นทาง บอกจุดถัดไปและระยะตามเส้นทาง', () => {
  const status = describeRouteStatus(straightRoute, onRoute, { lat: 7.0, lng: 100.5 }, 300);
  assert.equal(status.kind, 'next');
  assert.equal(status.point.id, 'a');
  assert.ok(Math.abs(status.remainingM - 500) < 5, `เหลือ ${status.remainingM}`);
});

test('describeRouteStatus: ออกนอกเส้นทางเกินเกณฑ์ บอกว่าออกนอกเส้นทาง', () => {
  // 0.01 องศาลองจิจูด ประมาณ 1,104 ม. เกินเกณฑ์ 300 ม.
  const status = describeRouteStatus(straightRoute, onRoute, { lat: 7.02, lng: 100.51 }, 300);
  assert.equal(status.kind, 'offRoute');
  assert.ok(Math.abs(status.offRouteM - 1104) < 30, `ห่าง ${status.offRouteM}`);
});

test('describeRouteStatus: ผ่านทุกจุดแล้ว', () => {
  const status = describeRouteStatus(straightRoute, onRoute, { lat: 7.04, lng: 100.5 }, 300);
  assert.equal(status.kind, 'done');
});

test('describeRouteStatus: ยังไม่มีตำแหน่ง คืน null', () => {
  assert.equal(describeRouteStatus(straightRoute, onRoute, null, 300), null);
});
```

- [ ] **Step 2: รันเทสต์ ต้องแดง**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/routeProgress.test.js`
Expected: FAIL ด้วย `Cannot find module ... utils/routeProgress.js`

- [ ] **Step 3: เขียนโค้ด**

`utils/routeProgress.js`:

```javascript
/**
 * ผู้ใช้อยู่ตรงไหนของเส้นทาง และจุดเสี่ยงถัดไปอยู่ห่างเท่าไหร่ "ตามเส้นทาง"
 *
 * เอกสารบทที่ 5.2 ยกตัวอย่างข้อความเตือนว่า "อีก 4.2 กิโลเมตรข้างหน้าจะถึงจุดเสี่ยง"
 * ระยะแบบนี้ต้องวัดตามถนนที่จะขับจริง ไม่ใช่ระยะเส้นตรง
 * เพราะถนนคดเคี้ยว จุดที่ห่างเส้นตรง 1 กม. อาจต้องขับอีก 3 กม. กว่าจะถึง
 *
 * วิธีการ: ฉายตำแหน่งลงบนแต่ละช่วงถนน เลือกช่วงที่ใกล้ที่สุด
 * แล้วบวก ระยะสะสมถึงต้นช่วง + ระยะที่เดินเข้าไปในช่วงนั้น (t × ความยาวช่วง)
 *
 * การบวก t × ความยาวช่วง สำคัญมาก ถ้าใช้แค่ระยะสะสมถึงต้นช่วงเฉย ๆ
 * จุดที่อยู่ปลายช่วงจะได้ค่าเท่ากับจุดที่อยู่ต้นช่วงเดียวกัน ซึ่งผิด
 */

import { haversineMeters, projectOnSegment } from './geo.js';

/**
 * @param routeCoordinates อาเรย์ของ { lat, lng } เรียงจากต้นทางไปปลายทาง
 * @param position { lat, lng } ตำแหน่งที่ต้องการหา
 * @returns { alongM, offRouteM }
 *   alongM = ระยะตามเส้นทางจากต้นทาง มาถึงจุดบนถนนที่ใกล้ตำแหน่งนี้ที่สุด
 *   offRouteM = ตำแหน่งนี้ห่างจากเส้นทางกี่เมตร
 *   คืน null ถ้าเส้นทางมีไม่ถึง 2 จุด หรือไม่มีตำแหน่ง
 */
export function locateOnRoute(routeCoordinates, position) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2 || !position) return null;

  let cumulativeM = 0;
  let bestOffRouteM = Infinity;
  let bestAlongM = 0;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const start = routeCoordinates[i];
    const end = routeCoordinates[i + 1];
    const segmentLengthM = haversineMeters(start, end);
    const { distanceM, t } = projectOnSegment(position, start, end);

    // ใช้ < ไม่ใช่ <= จุดที่ตกบนรอยต่อพอดีจึงเลือกช่วงแรกที่เจอ (ได้ระยะสะสมเท่ากันทั้งสองแบบอยู่แล้ว)
    if (distanceM < bestOffRouteM) {
      bestOffRouteM = distanceM;
      bestAlongM = cumulativeM + t * segmentLengthM;
    }
    cumulativeM += segmentLengthM;
  }

  return { alongM: bestAlongM, offRouteM: bestOffRouteM };
}

/**
 * จุดเสี่ยงถัดไปที่ผู้ใช้ยังไปไม่ถึง
 * @param pointsOnRoute ผลจาก findRiskPointsAlongRoute (เรียงตามระยะสะสมแล้ว)
 * @param alongM ผู้ใช้วิ่งมาได้กี่เมตรแล้วตามเส้นทาง
 * @returns { item, remainingM } หรือ null ถ้าผ่านทุกจุดแล้ว
 */
export function nextRiskOnRoute(pointsOnRoute, alongM) {
  const next = (pointsOnRoute || []).find((item) => item.distanceAlongRouteM > alongM);
  return next ? { item: next, remainingM: next.distanceAlongRouteM - alongM } : null;
}

/**
 * สรุปสถานะบนเส้นทางสำหรับแสดงบนหน้าจอโหมดเดินทาง
 * @param offRouteThresholdM ห่างเส้นทางเกินนี้ถือว่าออกนอกเส้นทาง
 * @returns null ถ้ายังไม่มีตำแหน่ง หรือหนึ่งในสามแบบ
 *   { kind: 'next', point, remainingM, alongM }  ยังมีจุดเสี่ยงข้างหน้า
 *   { kind: 'offRoute', offRouteM }               ออกนอกเส้นทางที่วางแผนไว้
 *   { kind: 'done', alongM }                      ผ่านจุดเสี่ยงบนเส้นทางครบแล้ว
 */
export function describeRouteStatus(routeCoordinates, pointsOnRoute, position, offRouteThresholdM) {
  const located = locateOnRoute(routeCoordinates, position);
  if (!located) return null;

  if (located.offRouteM > offRouteThresholdM) {
    return { kind: 'offRoute', offRouteM: located.offRouteM };
  }

  const next = nextRiskOnRoute(pointsOnRoute, located.alongM);
  if (!next) return { kind: 'done', alongM: located.alongM };

  return { kind: 'next', point: next.item.point, remainingM: next.remainingM, alongM: located.alongM };
}
```

- [ ] **Step 4: รันเทสต์ ต้องผ่าน**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/routeProgress.test.js`
Expected: `pass 13` `fail 0`

- [ ] **Step 5: ให้ routeAnalysis ใช้ locateOnRoute แทนการเขียนคณิตศาสตร์ซ้ำ**

ใน `utils/routeAnalysis.js` แทนที่

```javascript
import { haversineMeters, projectOnSegment, clamp } from './geo.js';
```

ด้วย

```javascript
import { haversineMeters, clamp } from './geo.js';
import { locateOnRoute } from './routeProgress.js';
```

แล้วแทนที่ตั้งแต่บรรทัด `  // คำนวณความยาวและระยะทางสะสมของแต่ละ segment ไว้ล่วงหน้า` จนถึงบรรทัด `  // เรียงตามลำดับที่จะขับผ่าน ไม่ใช่ตามความใกล้` (ไม่รวมบรรทัดนี้) ด้วย

```javascript
  const matches = [];

  for (const point of riskPoints) {
    // ฉายจุดเสี่ยงลงเส้นทาง ได้ทั้งระยะห่างจากถนนและระยะสะสมจากต้นทาง
    // (คณิตศาสตร์อยู่ใน routeProgress.js ใช้ร่วมกับการหาตำแหน่งผู้ใช้ในโหมดเดินทาง)
    const { alongM, offRouteM } = locateOnRoute(routeCoordinates, point.coordinate);

    // ไกลเกินเกณฑ์ = ไม่ถือว่าอยู่บนเส้นทางนี้ ยกเว้นอยู่ใกล้ปลายทาง
    const isNearRoute = offRouteM <= thresholdMeters;
    const isNearDestination =
      destinationRadiusM > 0 && haversineMeters(point.coordinate, destination) <= destinationRadiusM;
    if (!isNearRoute && !isNearDestination) continue;

    matches.push({
      point,
      distanceFromRouteM: Math.round(offRouteM),
      // ค่านี้ใช้ทั้งเรียงลำดับ และใช้บอกผู้ใช้ว่า "อีกกี่กิโลเมตรข้างหน้า"
      distanceAlongRouteM: Math.round(alongM),
    });
  }

```

- [ ] **Step 6: เทสต์เดิมของ routeAnalysis ต้องผ่านทั้ง 17 ข้อ (พิสูจน์ว่าการย้ายโค้ดไม่เปลี่ยนผลลัพธ์)**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/routeAnalysis.test.js`
Expected: `pass 17` `fail 0`

Run: `grep -n "projectOnSegment\|segmentLengths\|cumulativeDistances" utils/routeAnalysis.js`
Expected: ไม่มีผลลัพธ์ (คณิตศาสตร์ซ้ำถูกลบออกหมดแล้ว)

- [ ] **Step 7: Commit**

```bash
git add utils/routeProgress.js tests/routeProgress.test.js utils/routeAnalysis.js
git commit -m "feat: หาตำแหน่งบนเส้นทางและจุดเสี่ยงถัดไปตามระยะถนน

ใช้คณิตศาสตร์ชุดเดียวกับการหาจุดเสี่ยงบนเส้นทาง จึงย้ายไปไว้ที่ routeProgress.js
แล้วให้ routeAnalysis เรียกใช้แทนการเขียนซ้ำ เทสต์เดิม 17 ข้อยังผ่าน"
```

---

## Task 2: คณิตศาสตร์ของโหมดจำลอง (TDD)

**Files:**
- Modify: `constants/config.js`
- Create: `utils/simulation.js`
- Test: `tests/simulation.test.js`

- [ ] **Step 1: เพิ่มค่าคงที่ของโหมดจำลอง**

ใน `constants/config.js` แทรกก้อนนี้ถัดจากบรรทัด `};` ที่ปิด `DISTANCE`

```javascript

/**
 * โหมดจำลองการเดินทาง สำหรับนำเสนอและทดสอบโดยไม่ต้องขับรถจริง
 * (เอกสารบทที่ 7.3 กังวลว่าต้องเตรียมวิดีโอสำรอง เพราะสาธิตโหมดเดินทางในห้องไม่ได้)
 */
export const SIMULATION = {
  /** ความเร็วรถสมมติ กม./ชม. */
  SPEED_KMH: 60,
  /** ตัวเร่งเวลาที่ให้เลือก ×1 คือเวลาจริง */
  SPEED_UPS: [1, 10, 30],
  /** ค่าเริ่มต้น ×10 เพราะเส้นทางหาดใหญ่–สงขลา 28 กม. ที่เวลาจริงใช้ 28 นาที นานเกินไปสำหรับนำเสนอ */
  DEFAULT_SPEED_UP: 10,
  /**
   * เลื่อนตำแหน่งทุก 250 มิลลิวินาที
   * ที่ ×30 ขยับจังหวะละ 125 ม. น้อยกว่ารัศมีเตือน 500 ม. มาก จึงไม่วิ่งข้ามจุดเสี่ยงไปโดยไม่เตือน
   */
  TICK_MS: 250,
};
```

- [ ] **Step 2: เขียนเทสต์ก่อน**

`tests/simulation.test.js`:

```javascript
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
```

- [ ] **Step 3: รันเทสต์ ต้องแดง**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/simulation.test.js`
Expected: FAIL ด้วย `Cannot find module ... utils/simulation.js`

- [ ] **Step 4: เขียนโค้ด**

`utils/simulation.js`:

```javascript
/**
 * คณิตศาสตร์ของโหมดจำลองการเดินทาง
 *
 * ทำไมต้องมีโหมดจำลอง:
 * เอกสารบทที่ 7.3 เขียนไว้ว่าต้องเตรียมวิดีโอสำรองสำหรับนำเสนอ เพราะทดสอบโหมดเดินทางต้องขับรถจริง
 * โหมดจำลองให้คนขับเสมือนวิ่งตามเส้นทางจริง แล้วใช้ตรรกะเตือนชุดเดียวกับ GPS จริงทุกอย่าง
 * จึงสาธิตในห้องเรียนได้ และทดสอบฟีเจอร์เตือนได้โดยไม่ต้องออกไปขับรถ
 */

import { haversineMeters } from './geo.js';

/**
 * ตำแหน่งบนเส้นทาง เมื่อวิ่งมาได้ระยะหนึ่ง
 * @returns { lat, lng } ถ้าระยะติดลบได้จุดเริ่ม ถ้าเกินความยาวเส้นทางได้จุดสุดท้าย
 *          คืน null ถ้าไม่มีเส้นทาง
 */
export function positionAtDistance(routeCoordinates, distanceM) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) return null;

  const first = routeCoordinates[0];
  // !(distanceM > 0) ครอบคลุมทั้งค่าติดลบ ศูนย์ และค่าที่ไม่ใช่ตัวเลข
  if (routeCoordinates.length === 1 || !(distanceM > 0)) return { lat: first.lat, lng: first.lng };

  let remainingM = distanceM;
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const start = routeCoordinates[i];
    const end = routeCoordinates[i + 1];
    const segmentLengthM = haversineMeters(start, end);

    if (remainingM <= segmentLengthM) {
      // อยู่ในช่วงนี้ หาตำแหน่งตามสัดส่วนของระยะที่เหลือ
      // ช่วงถนนสั้นระดับไม่กี่ร้อยเมตร การเฉลี่ยพิกัดตรง ๆ คลาดน้อยมาก
      const t = segmentLengthM === 0 ? 0 : remainingM / segmentLengthM;
      return {
        lat: start.lat + t * (end.lat - start.lat),
        lng: start.lng + t * (end.lng - start.lng),
      };
    }
    remainingM -= segmentLengthM;
  }

  const last = routeCoordinates[routeCoordinates.length - 1];
  return { lat: last.lat, lng: last.lng };
}

/**
 * ระยะที่วิ่งได้ในหนึ่งจังหวะของการจำลอง
 * @param speedKmh ความเร็วรถสมมติ (กม./ชม.)
 * @param speedUp ตัวเร่งเวลา เช่น 10 = เร็วกว่าเวลาจริง 10 เท่า
 * @param tickMs ความยาวหนึ่งจังหวะ (มิลลิวินาที)
 */
export function metersPerTick(speedKmh, speedUp, tickMs) {
  return (speedKmh / 3.6) * speedUp * (tickMs / 1000);
}
```

- [ ] **Step 5: รันเทสต์ ต้องผ่าน**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/simulation.test.js`
Expected: `pass 10` `fail 0`

- [ ] **Step 6: Commit**

```bash
git add constants/config.js utils/simulation.js tests/simulation.test.js
git commit -m "feat: คณิตศาสตร์ของโหมดจำลองการเดินทาง

หาตำแหน่งเสมือนเมื่อวิ่งตามเส้นทางไปได้ระยะหนึ่ง พร้อมเทสต์ที่กันไม่ให้ความเร่ง
สูงเกินจนวิ่งข้ามจุดเสี่ยงไปโดยไม่เตือน"
```

---

## Task 3: ประโยคที่พูดเตือน (TDD)

**Files:**
- Modify: `constants/config.js`
- Create: `utils/alertMessage.js`
- Test: `tests/alertMessage.test.js`

- [ ] **Step 1: เพิ่มคำเตือนทั่วไปของแต่ละประเภทอันตราย**

ใช้กับจุดที่ยังไม่มีคำแนะนำ (8 จุดยังว่าง) คำเหล่านี้เป็นข้อปฏิบัติทั่วไป ไม่ใช่ตัวเลขสถิติ

ใน `constants/config.js` แทนที่

```javascript
export const HAZARD_TYPES = [
  { id: 'drowning', label: 'จมน้ำ',       icon: '🌊' },
  { id: 'crash',    label: 'อุบัติเหตุรถ', icon: '🚗' },
  { id: 'fall',     label: 'ลื่น/ตก',      icon: '⛰️' },
  { id: 'crime',    label: 'อาชญากรรม',   icon: '👤' },
];
```

ด้วย

```javascript
export const HAZARD_TYPES = [
  { id: 'drowning', label: 'จมน้ำ',       icon: '🌊', spokenAdvice: 'อย่าลงเล่นน้ำเมื่อคลื่นแรง' },
  { id: 'crash',    label: 'อุบัติเหตุรถ', icon: '🚗', spokenAdvice: 'ลดความเร็ว' },
  { id: 'fall',     label: 'ลื่น/ตก',      icon: '⛰️', spokenAdvice: 'ระวังลื่น' },
  { id: 'crime',    label: 'อาชญากรรม',   icon: '👤', spokenAdvice: 'ระวังทรัพย์สิน' },
];
```

- [ ] **Step 2: เขียนเทสต์ก่อน**

`tests/alertMessage.test.js`:

```javascript
/**
 * เทสต์ของ utils/alertMessage.js
 *
 * ประโยคพวกนี้ถูกพูดออกเสียงขณะผู้ใช้ขับรถ ต้องสั้น ชัด และไม่แม่นเกินจริง
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speakableDistance, buildAlertMessage, buildHeadsUpMessage } from '../utils/alertMessage.js';

test('speakableDistance: ต่ำกว่า 1 กม. ปัดเป็นหลักร้อยเมตร', () => {
  assert.equal(speakableDistance(437), '400 เมตร');
  assert.equal(speakableDistance(250), '300 เมตร');
});

test('speakableDistance: ไม่ต่ำกว่า 100 เมตร', () => {
  assert.equal(speakableDistance(49), '100 เมตร');
});

test('speakableDistance: ปัดแล้วถึง 1,000 เปลี่ยนเป็นกิโลเมตร', () => {
  assert.equal(speakableDistance(960), '1 กิโลเมตร');
});

test('speakableDistance: กิโลเมตรทศนิยมหนึ่งตำแหน่ง และไม่พูด .0', () => {
  assert.equal(speakableDistance(4230), '4.2 กิโลเมตร');
  assert.equal(speakableDistance(2000), '2 กิโลเมตร');
});

test('speakableDistance: ค่าผิดปกติไม่พัง', () => {
  assert.equal(speakableDistance(NaN), 'ใกล้ ๆ นี้');
  assert.equal(speakableDistance(-5), 'ใกล้ ๆ นี้');
});

const beach = {
  name: 'หาดชลาทัศน์',
  type: 'drowning',
  riskLevel: { label: 'เสี่ยง' },
  advice: ['ถ้าเห็นธงแดงห้ามลงน้ำเด็ดขาด เหตุเสียชีวิตปี 2563 เกิดจากการฝ่าธงแดงลงไปเล่น'],
};

test('buildAlertMessage: บอกระยะ ชื่อ ระดับ และประโยคหลักของคำแนะนำ', () => {
  assert.equal(
    buildAlertMessage(beach, 310),
    'ระวัง! อีกประมาณ 300 เมตร หาดชลาทัศน์ ระดับเสี่ยง ถ้าเห็นธงแดงห้ามลงน้ำเด็ดขาด'
  );
});

test('buildAlertMessage: พูดแค่ประโยคแรกของคำแนะนำ ไม่พูดทั้งย่อหน้า', () => {
  // ภาษาไทยเว้นวรรคระหว่างประโยค ท่อนหลังเป็นเหตุผลประกอบ ฟังแล้วยาวเกินขณะขับรถ
  assert.ok(!buildAlertMessage(beach, 310).includes('2563'));
});

test('buildAlertMessage: จุดที่ยังไม่มีคำแนะนำ ใช้คำเตือนทั่วไปตามประเภทอันตราย', () => {
  const road = { name: 'แยกแมนดาริน', type: 'crash', riskLevel: { label: 'เฝ้าระวัง' }, advice: [] };
  assert.ok(buildAlertMessage(road, 500).endsWith('ลดความเร็ว'), buildAlertMessage(road, 500));
});

test('buildAlertMessage: จุดที่ไม่มีระดับความเสี่ยง ไม่พัง และไม่พูดคำว่าระดับ', () => {
  const message = buildAlertMessage({ name: 'จุดผู้ใช้', type: 'fall' }, 200);
  assert.ok(message.includes('จุดผู้ใช้'));
  assert.ok(!message.includes('ระดับ'));
});

test('buildHeadsUpMessage: บอกระยะตามเส้นทางแบบที่เอกสารบทที่ 5.2 ยกตัวอย่าง', () => {
  assert.equal(
    buildHeadsUpMessage({ name: 'สะพานติณสูลานนท์' }, 4230),
    'จุดเสี่ยงถัดไป สะพานติณสูลานนท์ อีก 4.2 กิโลเมตร ข้างหน้า'
  );
});
```

- [ ] **Step 3: รันเทสต์ ต้องแดง**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/alertMessage.test.js`
Expected: FAIL ด้วย `Cannot find module ... utils/alertMessage.js`

- [ ] **Step 4: เขียนโค้ด**

`utils/alertMessage.js`:

```javascript
/**
 * ประโยคที่แอปพูดออกเสียงในโหมดเดินทาง
 *
 * เอกสารวัตถุประสงค์ข้อ 4 และบทที่ 3 กำหนดว่าผู้ใช้ต้อง "รับทราบการแจ้งเตือนได้โดยไม่ต้องมองหน้าจอ"
 * เพราะผู้ใช้กำลังขับรถหรือขี่มอเตอร์ไซค์ ประโยคจึงต้องสั้นพอให้ฟังจบก่อนถึงจุด
 * (ที่ 60 กม./ชม. วิ่ง 500 เมตรใช้เวลา 30 วินาที)
 */

import { HAZARD_TYPES } from '../constants/config.js';

/**
 * ปัดระยะให้พูดง่ายและไม่ดูแม่นเกินจริง
 * GPS มือถือคลาดได้ 10–20 เมตร (เอกสารบทที่ 5.3) การพูดว่า "อีก 437 เมตร" จึงให้ความรู้สึกแม่นเกินจริง
 *   ต่ำกว่า 1 กม. ปัดเป็นหลักร้อยเมตร ขั้นต่ำ 100 เมตร
 *   ตั้งแต่ 1 กม. บอกเป็นกิโลเมตร ทศนิยมหนึ่งตำแหน่ง
 */
export function speakableDistance(distanceM) {
  if (!Number.isFinite(distanceM) || distanceM < 0) return 'ใกล้ ๆ นี้';

  if (distanceM < 1000) {
    const rounded = Math.max(100, Math.round(distanceM / 100) * 100);
    if (rounded < 1000) return `${rounded} เมตร`;
  }

  const km = (distanceM / 1000).toFixed(1).replace(/\.0$/, '');
  return `${km} กิโลเมตร`;
}

/**
 * ท่อนแรกของคำแนะนำ
 * ภาษาไทยเว้นวรรคระหว่างประโยค ท่อนแรกจึงเป็นประโยคหลักพอดี ท่อนหลังมักเป็นเหตุผลประกอบ
 */
function firstClause(text) {
  return String(text || '').trim().split(/\s+/)[0] || '';
}

/** คำเตือนทั่วไปตามประเภทอันตราย ใช้เมื่อจุดนั้นยังไม่มีคำแนะนำของตัวเอง */
function fallbackAdvice(type) {
  const hazard = HAZARD_TYPES.find((t) => t.id === type);
  return hazard ? hazard.spokenAdvice : 'โปรดระมัดระวัง';
}

/**
 * เตือนเมื่อเข้าใกล้จุดเสี่ยง (ระยะเส้นตรง)
 * ตัวอย่าง: "ระวัง! อีกประมาณ 300 เมตร หาดชลาทัศน์ ระดับเสี่ยง ถ้าเห็นธงแดงห้ามลงน้ำเด็ดขาด"
 */
export function buildAlertMessage(point, distanceM) {
  const level = point.riskLevel ? `ระดับ${point.riskLevel.label}` : '';
  const advice = firstClause((point.advice || [])[0]) || fallbackAdvice(point.type);
  return ['ระวัง!', `อีกประมาณ ${speakableDistance(distanceM)}`, point.name, level, advice]
    .filter(Boolean)
    .join(' ');
}

/**
 * บอกล่วงหน้าว่าจุดเสี่ยงถัดไปบนเส้นทางคืออะไร อยู่ห่างกี่กิโลเมตรตามถนน (เอกสารบทที่ 5.2)
 * ตัวอย่าง: "จุดเสี่ยงถัดไป สะพานติณสูลานนท์ อีก 4.2 กิโลเมตร ข้างหน้า"
 */
export function buildHeadsUpMessage(point, remainingM) {
  return `จุดเสี่ยงถัดไป ${point.name} อีก ${speakableDistance(remainingM)} ข้างหน้า`;
}
```

- [ ] **Step 5: รันเทสต์ ต้องผ่าน และเทสต์ทั้งหมด**

Run: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON tests/alertMessage.test.js`
Expected: `pass 10` `fail 0`

Run: `npm test`
Expected: `pass 136` `fail 0`

- [ ] **Step 6: Commit**

```bash
git add constants/config.js utils/alertMessage.js tests/alertMessage.test.js
git commit -m "feat: ประโยคเตือนที่พูดออกเสียงได้ สั้นพอฟังจบก่อนถึงจุด

ปัดระยะเป็นหลักร้อยเมตรเพราะ GPS คลาด 10-20 ม. พูดแค่ประโยคหลักของคำแนะนำ
และมีคำเตือนทั่วไปตามประเภทอันตรายสำหรับจุดที่ยังไม่มีคำแนะนำ"
```

---

## Task 4: ติดตั้ง expo-speech และสิทธิ์การสั่น

**Files:**
- Modify: `package.json` (ผ่านคำสั่งติดตั้ง)
- Modify: `app.json`

- [ ] **Step 1: ติดตั้งด้วยคำสั่งของ Expo (เลือกเวอร์ชันที่ตรงกับ SDK 54 ให้เอง)**

Run: `npx expo install expo-speech`
Expected: `package.json` มีบรรทัด `"expo-speech"` เพิ่มใน `dependencies`

Run: `node -e "console.log(require('./package.json').dependencies['expo-speech'])"`
Expected: พิมพ์เวอร์ชันออกมา (ขึ้นต้นด้วย `~`)

- [ ] **Step 2: ขอสิทธิ์การสั่นบน Android**

Expo Go มีสิทธิ์นี้ในตัว แต่ถ้า build เป็นแอปจริงต้องประกาศไว้ ไม่งั้นมือถือจะไม่สั่นตอนเตือน

ใน `app.json` แทนที่

```json
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
```

ด้วย

```json
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "VIBRATE"
      ]
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore: เพิ่ม expo-speech สำหรับเตือนด้วยเสียง และสิทธิ์การสั่นบน Android"
```

---

## Task 5: hooks ของโหมดเดินทาง

**Files:**
- Create: `hooks/useSimulatedLocation.js`
- Create: `hooks/useVoiceAlerts.js`
- Create: `hooks/useTripAlerts.js`

hook ใช้ React จึงไม่มีเทสต์หน่วย ตรรกะที่เป็นคณิตศาสตร์อยู่ใน `utils/` ที่มีเทสต์แล้ว ส่วนนี้ตรวจในเบราว์เซอร์ใน Task 8

- [ ] **Step 1: ตัวจับเวลาของโหมดจำลอง**

`hooks/useSimulatedLocation.js`:

```javascript
/**
 * ตำแหน่งเสมือนที่วิ่งไปตามเส้นทาง ใช้แทน GPS ในโหมดจำลองการเดินทาง
 *
 * คืนค่าในรูปแบบ { lat, lng } เหมือน useUserLocation ทุกอย่าง
 * หน้าจอโหมดเดินทางจึงสลับแหล่งตำแหน่งได้โดยไม่ต้องแก้ตรรกะการเตือน
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { positionAtDistance, metersPerTick } from '../utils/simulation';
import { calculateRouteLength } from '../utils/routeAnalysis';
import { SIMULATION } from '../constants/config';

/**
 * @param options.routeCoordinates เส้นทางที่จะวิ่งตาม
 * @param options.enabled ถ้า false จะไม่ทำงานเลย (ใช้ตอนอยู่ในโหมด GPS)
 */
export function useSimulatedLocation({ routeCoordinates, enabled }) {
  const totalM = useMemo(() => calculateRouteLength(routeCoordinates || []), [routeCoordinates]);

  const [progressM, setProgressM] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedUp, setSpeedUp] = useState(SIMULATION.DEFAULT_SPEED_UP);

  // เลื่อนตำแหน่งทุกจังหวะขณะกำลังเล่น
  useEffect(() => {
    if (!enabled || !isPlaying || totalM === 0) return undefined;

    const stepM = metersPerTick(SIMULATION.SPEED_KMH, speedUp, SIMULATION.TICK_MS);
    const timer = setInterval(() => {
      setProgressM((current) => Math.min(current + stepM, totalM));
    }, SIMULATION.TICK_MS);

    // หยุดตัวจับเวลาเมื่อหยุดเล่น เปลี่ยนความเร็ว หรือออกจากหน้าจอ
    return () => clearInterval(timer);
  }, [enabled, isPlaying, speedUp, totalM]);

  // ถึงปลายทางแล้วหยุดเอง
  useEffect(() => {
    if (isPlaying && totalM > 0 && progressM >= totalM) setIsPlaying(false);
  }, [isPlaying, progressM, totalM]);

  const location = useMemo(() => {
    if (!enabled || !routeCoordinates || routeCoordinates.length === 0) return null;
    return positionAtDistance(routeCoordinates, progressM);
  }, [enabled, routeCoordinates, progressM]);

  const play = useCallback(() => {
    // ถ้าจบไปแล้ว กดเล่นอีกครั้งให้เริ่มจากต้นทาง
    setProgressM((current) => (current >= totalM ? 0 : current));
    setIsPlaying(true);
  }, [totalM]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const restart = useCallback(() => {
    setProgressM(0);
    setIsPlaying(true);
  }, []);

  return {
    location,
    progressM,
    totalM,
    isPlaying,
    isFinished: totalM > 0 && progressM >= totalM,
    speedUp,
    setSpeedUp,
    play,
    pause,
    restart,
  };
}
```

- [ ] **Step 2: เสียงพูดและการสั่น**

`hooks/useVoiceAlerts.js`:

```javascript
/**
 * เตือนด้วยเสียงพูดภาษาไทยและการสั่น
 *
 * ทำไมต้องมี: เอกสารวัตถุประสงค์ข้อ 4 กำหนดให้ผู้ใช้ "รับทราบการแจ้งเตือนได้โดยไม่จำเป็นต้องมองหน้าจอ"
 * ผู้ใช้กำลังขับขี่ การเตือนด้วยภาพอย่างเดียวไม่ปลอดภัย
 *
 * บนมือถือใช้เสียงอ่านของระบบ (Android และ iOS มีเสียงภาษาไทยในตัว)
 * บนเว็บใช้ Web Speech API ซึ่งมีเสียงไทยหรือไม่ขึ้นกับเครื่อง จึงต้องตรวจก่อนแล้วบอกผู้ใช้
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Speech from 'expo-speech';

/** จังหวะสั่น: สั่น 0.4 วินาที เว้น 0.2 สั่นอีก 0.4 ต่างจากการแจ้งเตือนทั่วไปของมือถือ */
const VIBRATION_PATTERN = [0, 400, 200, 400];

/** ความเร็วการพูด ช้ากว่าปกตินิดหน่อยให้ฟังทันขณะขับรถ (1 = ปกติ) */
const SPEECH_RATE = 0.95;

/** ตรวจว่าเครื่องนี้มีเสียงภาษาไทยไหม */
async function detectThaiVoice() {
  let voices = await Speech.getAvailableVoicesAsync();

  // บนเว็บ รายการเสียงโหลดแบบ async ครั้งแรกอาจได้อาเรย์ว่าง ต้องรอเหตุการณ์ voiceschanged ก่อน
  if (voices.length === 0 && Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    await new Promise((resolve) => {
      window.speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
      setTimeout(resolve, 2000);
    });
    voices = await Speech.getAvailableVoicesAsync();
  }

  return voices.some((voice) => /^th/i.test(voice.language || ''));
}

export function useVoiceAlerts() {
  const [isMuted, setIsMuted] = useState(false);
  // null = ยังตรวจไม่เสร็จ
  const [hasThaiVoice, setHasThaiVoice] = useState(null);
  // เก็บสถานะปิดเสียงใน ref ด้วย ให้ announce อ่านค่าล่าสุดได้โดยไม่ต้องสร้างฟังก์ชันใหม่
  const isMutedRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;
    detectThaiVoice()
      .then((found) => {
        if (!isCancelled) setHasThaiVoice(found);
      })
      .catch(() => {
        if (!isCancelled) setHasThaiVoice(false);
      });

    return () => {
      isCancelled = true;
      // ออกจากหน้าจอแล้วต้องหยุดพูด ไม่งั้นเสียงเตือนค้างต่อทั้งที่ออกจากโหมดเดินทางแล้ว
      Speech.stop();
    };
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (next) Speech.stop();
  }, []);

  /**
   * พูดเตือน
   * @param options.interrupt
   *   true  = ตัดประโยคที่กำลังพูดแล้วพูดทันที พร้อมสั่น (ใช้กับการเตือนเข้าใกล้จุดเสี่ยง)
   *   false = ต่อคิวหลังประโยคที่กำลังพูด ไม่สั่น (ใช้กับการบอกจุดถัดไปล่วงหน้า)
   *   กฎนี้ทำให้การเตือนเข้าใกล้ไม่มีวันถูกตัดกลางประโยคโดยการบอกล่วงหน้า
   */
  const announce = useCallback((text, { interrupt = false } = {}) => {
    if (interrupt) {
      try {
        Vibration.vibrate(VIBRATION_PATTERN);
      } catch (error) {
        // บางเบราว์เซอร์ไม่รองรับการสั่น ไม่เป็นไร ยังมีเสียงและภาพ
      }
    }
    if (isMutedRef.current) return;
    if (interrupt) Speech.stop();
    Speech.speak(text, { language: 'th-TH', rate: SPEECH_RATE });
  }, []);

  /** ให้ผู้ใช้ตรวจว่าได้ยินเสียงก่อนออกเดินทาง */
  const testVoice = useCallback(() => {
    announce('ทดสอบเสียงเตือน ถ้าได้ยินประโยคนี้ แปลว่าพร้อมใช้งาน', { interrupt: true });
  }, [announce]);

  return { announce, isMuted, toggleMute, hasThaiVoice, testVoice };
}
```

- [ ] **Step 3: ย้ายตรรกะเตือนออกจากหน้าจอ**

`hooks/useTripAlerts.js`:

```javascript
/**
 * ตรรกะการเตือนของโหมดเดินทาง แยกออกจากหน้าจอให้หน้าจอเหลือแค่การแสดงผล
 *
 * ทุกครั้งที่ตำแหน่งเปลี่ยน (จาก GPS จริงหรือจากโหมดจำลอง) ประเมินใหม่ว่าควรเตือนอะไร
 * ตัวตัดสินใจจริงคือ evaluateTripAlerts ใน utils/tripAlerts.js ซึ่งมีเทสต์คุมการกันเตือนซ้ำแล้ว
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateTripAlerts } from '../utils/tripAlerts';
import { DISTANCE } from '../constants/config';

const ALERT_CONFIG = {
  triggerM: DISTANCE.ALERT_TRIGGER,
  resetM: DISTANCE.ALERT_RESET,
  boundingBoxM: DISTANCE.BOUNDING_BOX_FILTER,
};

/**
 * @param options.location ตำแหน่งปัจจุบัน { lat, lng } หรือ null
 * @param options.points จุดเสี่ยงทั้งหมด
 * @param options.onNewAlert เรียกเมื่อมีการเตือนใหม่ ส่ง { point, distanceM } ของจุดที่ใกล้ที่สุด
 */
export function useTripAlerts({ location, points, onNewAlert }) {
  // จุดที่อยู่ในระยะเฝ้าระวัง ใช้แสดง "กำลังเฝ้าระวัง N จุด"
  const [nearbyPoints, setNearbyPoints] = useState([]);
  // ประวัติการเตือนในทริปนี้
  const [history, setHistory] = useState([]);

  // เก็บ id ที่เตือนไปแล้วใน ref ไม่ใช่ state ถ้าใช้ state จะทำให้ effect วนซ้ำไม่รู้จบ
  const alertedIdsRef = useRef(new Set());

  // เก็บ callback ล่าสุดใน ref เพื่อไม่ให้การสร้างฟังก์ชันใหม่ทุกครั้งที่หน้าจอวาดใหม่ ไปกระตุ้น effect
  const onNewAlertRef = useRef(onNewAlert);
  onNewAlertRef.current = onNewAlert;

  useEffect(() => {
    if (!location) return;

    const result = evaluateTripAlerts(location, points, alertedIdsRef.current, ALERT_CONFIG);
    alertedIdsRef.current = result.alertedIds;
    setNearbyPoints(result.nearbyPoints);

    if (result.newAlerts.length > 0) {
      // ถ้ามีหลายจุดพร้อมกัน เตือนจุดที่ใกล้ที่สุดก่อน
      const closest = result.newAlerts.reduce((a, b) => (a.distanceM <= b.distanceM ? a : b));
      setHistory((current) => [closest, ...current]);
      if (onNewAlertRef.current) onNewAlertRef.current(closest);
    }
  }, [location, points]);

  /** ล้างสถานะทั้งหมด ใช้ตอนเริ่มการจำลองใหม่ ให้ทุกจุดเตือนได้อีกครั้ง */
  const reset = useCallback(() => {
    alertedIdsRef.current = new Set();
    setHistory([]);
  }, []);

  return { nearbyPoints, history, reset };
}
```

- [ ] **Step 4: เทสต์เดิมต้องยังผ่าน**

Run: `npm test`
Expected: `pass 136` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add hooks/useSimulatedLocation.js hooks/useVoiceAlerts.js hooks/useTripAlerts.js
git commit -m "feat: hooks ของโหมดเดินทาง จำลองตำแหน่ง พูดเตือน และตรรกะเตือน

การเตือนเข้าใกล้พูดแทรกได้พร้อมสั่น การบอกล่วงหน้าต่อคิวเท่านั้น
จึงไม่มีวันตัดการเตือนสำคัญกลางประโยค"
```

---

## Task 6: ชิ้นส่วนหน้าจอโหมดเดินทาง

**Files:**
- Create: `components/TripAlertCard.js`
- Create: `components/NextRiskPanel.js`
- Create: `components/SimulationControls.js`

- [ ] **Step 1: การ์ดเตือนที่นับถอยหลังสด**

`components/TripAlertCard.js`:

```javascript
/**
 * การ์ดเตือนตัวใหญ่ในโหมดเดินทาง
 *
 * ออกแบบให้อ่านได้ในหนึ่งวินาทีขณะขับขี่: ตัวอักษรใหญ่ สีตามระดับความเสี่ยง
 * ระยะที่แสดงคำนวณใหม่ทุกครั้งที่ตำแหน่งเปลี่ยน จึงนับถอยหลังจริง
 * (เดิมค้างที่ค่าตอนเริ่มเตือน ขยับเข้าใกล้แล้วตัวเลขไม่ลด)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { formatDistance } from '../utils/format';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function TripAlertCard({ point, liveDistanceM, onPress, onDismiss }) {
  return (
    <Pressable style={[styles.card, { backgroundColor: point.riskLevel.color }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>⚠️ ระวัง!</Text>
        <Text style={styles.distance}>อีก {formatDistance(liveDistanceM)}</Text>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityLabel="ปิดการเตือน">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.name}>{point.name}</Text>
      <Text style={styles.meta}>
        {point.riskLevel.label} · {point.riskScore}
      </Text>
      <Text style={styles.hint}>แตะเพื่อดูรายละเอียด</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: SPACING.md,
    marginBottom: 0,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
  distance: {
    color: COLORS.white,
    fontSize: FONT_SIZES.alert,
    fontWeight: 'bold',
  },
  close: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
  },
  name: {
    color: COLORS.white,
    fontSize: FONT_SIZES.title,
    fontWeight: '600',
  },
  meta: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    opacity: 0.9,
  },
  hint: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    opacity: 0.8,
  },
});
```

- [ ] **Step 2: แถบจุดเสี่ยงถัดไป**

`components/NextRiskPanel.js`:

```javascript
/**
 * แถบบอกจุดเสี่ยงถัดไปบนเส้นทาง (เอกสารบทที่ 5.2 "อีก 4.2 กิโลเมตรข้างหน้าจะถึงจุดเสี่ยง")
 *
 * แสดงเฉพาะเมื่อเริ่มโหมดเดินทางจากหน้าวางแผนเส้นทาง
 * @param status ผลจาก describeRouteStatus ใน utils/routeProgress.js
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistance } from '../utils/format';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function NextRiskPanel({ status }) {
  if (!status) return null;

  if (status.kind === 'offRoute') {
    return (
      <View style={[styles.panel, styles.warning]}>
        <Text style={styles.text}>
          ออกนอกเส้นทางที่วางแผนไว้ {formatDistance(status.offRouteM)} กำลังเตือนด้วยระยะเส้นตรงแทน
        </Text>
      </View>
    );
  }

  if (status.kind === 'done') {
    return (
      <View style={styles.panel}>
        <Text style={styles.text}>ผ่านจุดเสี่ยงบนเส้นทางครบแล้ว</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>จุดเสี่ยงถัดไป</Text>
      <Text style={styles.name} numberOfLines={1}>
        {status.point.name}
      </Text>
      <Text style={styles.distance}>อีก {formatDistance(status.remainingM)} ตามเส้นทาง</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warning: {
    backgroundColor: COLORS.warningBackground,
    borderColor: COLORS.warningBorder,
  },
  label: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  name: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  distance: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  text: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
});
```

- [ ] **Step 3: ปุ่มควบคุมการจำลอง**

`components/SimulationControls.js`:

```javascript
/**
 * ปุ่มควบคุมโหมดจำลองการเดินทาง: เล่น/หยุด เริ่มใหม่ เลือกความเร็ว และแถบความคืบหน้า
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { formatDistance } from '../utils/format';
import { SIMULATION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function SimulationControls({
  isPlaying,
  isFinished,
  speedUp,
  progressM,
  totalM,
  onPlay,
  onPause,
  onRestart,
  onSpeedChange,
}) {
  const percent = totalM > 0 ? Math.min(100, (progressM / totalM) * 100) : 0;
  const playLabel = isPlaying ? '⏸ หยุดชั่วคราว' : isFinished ? '▶ เล่นอีกครั้ง' : '▶ เล่นต่อ';

  return (
    <View style={styles.box}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {formatDistance(progressM)} / {formatDistance(totalM)} · จำลองที่ {SIMULATION.SPEED_KMH} กม./ชม.
      </Text>

      <View style={styles.row}>
        <Pressable style={styles.mainButton} onPress={isPlaying ? onPause : onPlay}>
          <Text style={styles.mainButtonText}>{playLabel}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onRestart}>
          <Text style={styles.secondaryText}>↺ เริ่มใหม่</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {SIMULATION.SPEED_UPS.map((value) => {
          const isSelected = value === speedUp;
          return (
            <Pressable
              key={value}
              style={[styles.speedChip, isSelected && styles.speedChipSelected]}
              onPress={() => onSpeedChange(value)}
            >
              <Text style={[styles.speedText, isSelected && styles.speedTextSelected]}>×{value}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  mainButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  mainButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingHorizontal: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  speedChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  speedText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  speedTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add components/TripAlertCard.js components/NextRiskPanel.js components/SimulationControls.js
git commit -m "feat: ชิ้นส่วนหน้าจอโหมดเดินทาง การ์ดเตือนนับถอยหลัง แถบจุดถัดไป ปุ่มจำลอง"
```

---

## Task 7: ประกอบหน้าจอโหมดเดินทาง และปุ่มในหน้าวางแผนเส้นทาง

**Files:**
- Rewrite: `screens/TripModeScreen.js`
- Modify: `screens/RoutePlannerScreen.js`

- [ ] **Step 1: เขียนหน้าจอโหมดเดินทางใหม่ทั้งไฟล์**

แทนที่เนื้อหาทั้งไฟล์ `screens/TripModeScreen.js` ด้วย:

```javascript
/**
 * โหมดเดินทาง — ระยะ "ระหว่างการเดินทาง"
 *
 * ติดตามตำแหน่งแล้วเตือนอัตโนมัติเมื่อเข้าใกล้จุดเสี่ยงในระยะ 500 เมตร
 * เตือนทั้งภาพ เสียงพูดภาษาไทย และการสั่น ให้ผู้ใช้รับทราบได้โดยไม่ต้องมองจอ
 * (เอกสารวัตถุประสงค์ข้อ 4 และบทที่ 3)
 *
 * ตำแหน่งมาได้สองแหล่ง ตรรกะการเตือนไม่รู้และไม่สนว่ามาจากไหน:
 *   mode 'gps'      ตำแหน่งจริงจาก GPS
 *   mode 'simulate' ตำแหน่งเสมือนที่วิ่งตามเส้นทาง (สำหรับนำเสนอและทดสอบ)
 *
 * ถ้าเริ่มจากหน้าวางแผนเส้นทาง จะรู้ด้วยว่าผู้ใช้อยู่ตรงไหนของเส้นทาง
 * และบอก "จุดเสี่ยงถัดไป อีกกี่กิโลเมตรตามเส้นทาง" (เอกสารบทที่ 5.2)
 *
 * ข้อจำกัด: ต้องเปิดแอปค้างไว้ เพราะ Expo Go ไม่รองรับการติดตามตำแหน่งแบบเบื้องหลัง
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import TripAlertCard from '../components/TripAlertCard';
import NextRiskPanel from '../components/NextRiskPanel';
import SimulationControls from '../components/SimulationControls';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useUserLocation } from '../hooks/useUserLocation';
import { useSimulatedLocation } from '../hooks/useSimulatedLocation';
import { useTripAlerts } from '../hooks/useTripAlerts';
import { useVoiceAlerts } from '../hooks/useVoiceAlerts';
import { findRiskPointsAlongRoute } from '../utils/routeAnalysis';
import { describeRouteStatus } from '../utils/routeProgress';
import { buildAlertMessage, buildHeadsUpMessage } from '../utils/alertMessage';
import { haversineMeters } from '../utils/geo';
import { formatDistance } from '../utils/format';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** เลื่อนกล้องตามผู้ใช้เมื่อขยับห่างกลางจอเกินระยะนี้ ไม่เลื่อนทุกจังหวะให้แผนที่กระตุก */
const RECENTER_DISTANCE_M = 150;

export default function TripModeScreen({ navigation, route }) {
  const params = (route && route.params) || {};
  const mode = params.mode === 'simulate' ? 'simulate' : 'gps';
  const routeCoordinates = params.routeCoordinates || null;
  const routeLabel = params.routeLabel || null;

  const { allPoints } = useRiskPoints();

  // เรียก hook ทั้งสองแบบเสมอ (กฎของ React ห้ามเรียก hook แบบมีเงื่อนไข) แต่เปิดใช้แค่แบบเดียว
  const gps = useUserLocation({ watch: mode === 'gps' });
  const simulation = useSimulatedLocation({ routeCoordinates, enabled: mode === 'simulate' });
  const location = mode === 'simulate' ? simulation.location : gps.location;

  const voice = useVoiceAlerts();
  const { announce } = voice;
  const [currentAlert, setCurrentAlert] = useState(null);

  // เตือนเมื่อเข้าใกล้จุดเสี่ยง: ภาพ + เสียงพูด (แทรกได้) + สั่น
  const handleNewAlert = useCallback(
    (alert) => {
      setCurrentAlert(alert);
      announce(buildAlertMessage(alert.point, alert.distanceM), { interrupt: true });
    },
    [announce]
  );

  const trip = useTripAlerts({ location, points: allPoints, onNewAlert: handleNewAlert });

  // จุดเสี่ยงบนเส้นทาง คำนวณด้วยกฎเดียวกับหน้าวางแผนเส้นทาง
  const pointsOnRoute = useMemo(() => {
    if (!routeCoordinates) return [];
    return findRiskPointsAlongRoute(routeCoordinates, allPoints, DISTANCE.ON_ROUTE_THRESHOLD, {
      destinationRadiusM: DISTANCE.DESTINATION_RADIUS,
    });
  }, [routeCoordinates, allPoints]);

  const routeStatus = useMemo(() => {
    if (!routeCoordinates || !location) return null;
    return describeRouteStatus(routeCoordinates, pointsOnRoute, location, DISTANCE.ON_ROUTE_THRESHOLD);
  }, [routeCoordinates, pointsOnRoute, location]);

  // บอกล่วงหน้าเมื่อจุดเสี่ยงถัดไปเปลี่ยน (เช่น เพิ่งผ่านจุดหนึ่งไป) พูดครั้งเดียวต่อจุด
  const lastHeadsUpIdRef = useRef(null);
  useEffect(() => {
    if (!routeStatus || routeStatus.kind !== 'next') return;
    if (routeStatus.point.id === lastHeadsUpIdRef.current) return;
    lastHeadsUpIdRef.current = routeStatus.point.id;
    // ถ้าอยู่ในระยะเตือนแล้ว ไม่ต้องบอกล่วงหน้า การเตือนเข้าใกล้จะพูดเอง
    if (routeStatus.remainingM > DISTANCE.ALERT_TRIGGER) {
      announce(buildHeadsUpMessage(routeStatus.point, routeStatus.remainingM));
    }
  }, [routeStatus, announce]);

  // ระยะในการ์ดเตือนคำนวณจากตำแหน่งล่าสุดเสมอ จึงนับถอยหลังจริง
  const liveDistanceM =
    currentAlert && location ? haversineMeters(location, currentAlert.point.coordinate) : null;

  // ผ่านจุดไปไกลเกินระยะล้างสถานะแล้ว ปิดการ์ดเอง ไม่ต้องให้ผู้ใช้ละมือไปกดปิดขณะขับรถ
  useEffect(() => {
    if (liveDistanceM !== null && liveDistanceM > DISTANCE.ALERT_RESET) setCurrentAlert(null);
  }, [liveDistanceM]);

  // เปิดหน้าจอในโหมดจำลองแล้วเริ่มวิ่งเลย ผู้ใช้กดเลือกโหมดจำลองมาแล้ว
  const { play } = simulation;
  useEffect(() => {
    if (mode === 'simulate') play();
  }, [mode, play]);

  function restartSimulation() {
    trip.reset();
    lastHeadsUpIdRef.current = null;
    setCurrentAlert(null);
    simulation.restart();
  }

  // กล้องตามผู้ใช้ แต่ขยับเมื่อห่างกลางจอเกิน 150 ม. เท่านั้น
  const [mapCenter, setMapCenter] = useState(null);
  useEffect(() => {
    if (!location) return;
    if (!mapCenter || haversineMeters(mapCenter, location) > RECENTER_DISTANCE_M) {
      setMapCenter({ lat: location.lat, lng: location.lng });
    }
  }, [location, mapCenter]);

  const region = mapCenter
    ? { latitude: mapCenter.lat, longitude: mapCenter.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  const markers = trip.nearbyPoints.map((item) => ({
    id: item.point.id,
    lat: item.point.coordinate.lat,
    lng: item.point.coordinate.lng,
    color: item.point.riskLevel.color,
    label: item.point.name,
  }));

  const errorMessage = mode === 'gps' ? gps.errorMessage : null;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.statusBar}>
        <View style={styles.statusTextBox}>
          <Text style={styles.statusText}>กำลังเฝ้าระวัง {trip.nearbyPoints.length} จุด</Text>
          <Text style={styles.modeText} numberOfLines={1}>
            {mode === 'simulate' ? 'จำลองการเดินทาง' : 'GPS'}
            {routeLabel ? ` · ${routeLabel}` : ''}
          </Text>
        </View>
        <Pressable style={styles.iconButton} onPress={voice.testVoice} accessibilityLabel="ทดสอบเสียงเตือน">
          <Text style={styles.iconButtonText}>ทดสอบเสียง</Text>
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={voice.toggleMute}
          accessibilityLabel={voice.isMuted ? 'เปิดเสียงเตือน' : 'ปิดเสียงเตือน'}
        >
          <Text style={styles.muteText}>{voice.isMuted ? '🔇' : '🔊'}</Text>
        </Pressable>
      </View>

      {voice.hasThaiVoice === false && (
        <Text style={styles.noteText}>เครื่องนี้ไม่มีเสียงภาษาไทย แอปจะเตือนด้วยภาพและการสั่นแทน</Text>
      )}
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {!location && !errorMessage && <Text style={styles.noteText}>กำลังรอสัญญาณ GPS...</Text>}

      {currentAlert && liveDistanceM !== null && (
        <TripAlertCard
          point={currentAlert.point}
          liveDistanceM={liveDistanceM}
          onPress={() => navigation.navigate('RiskDetail', { pointId: currentAlert.point.id })}
          onDismiss={() => setCurrentAlert(null)}
        />
      )}

      <NextRiskPanel status={routeStatus} />

      <View style={styles.mapContainer}>
        <AppMap region={region} markers={markers} polyline={routeCoordinates} userLocation={location} />
      </View>

      {mode === 'simulate' && (
        <SimulationControls
          isPlaying={simulation.isPlaying}
          isFinished={simulation.isFinished}
          speedUp={simulation.speedUp}
          progressM={simulation.progressM}
          totalM={simulation.totalM}
          onPlay={simulation.play}
          onPause={simulation.pause}
          onRestart={restartSimulation}
          onSpeedChange={simulation.setSpeedUp}
        />
      )}

      <ScrollView style={styles.historyBox} contentContainerStyle={styles.history}>
        <Text style={styles.historyTitle}>แจ้งเตือนไปแล้ว</Text>
        {trip.history.length === 0 ? (
          <Text style={styles.emptyText}>ยังไม่มีการแจ้งเตือนในทริปนี้</Text>
        ) : (
          trip.history.map((alert, index) => (
            <View key={`${alert.point.id}-${index}`} style={styles.historyRow}>
              <Text style={styles.historyName} numberOfLines={1}>
                {alert.point.name}
              </Text>
              <Text style={styles.historyDistance}>{formatDistance(alert.distanceM)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.stopButton} onPress={() => navigation.goBack()}>
        <Text style={styles.stopButtonText}>หยุดโหมดเดินทาง</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  statusTextBox: {
    flex: 1,
  },
  statusText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modeText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  iconButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  iconButtonText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  muteText: {
    fontSize: FONT_SIZES.title,
  },
  noteText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.danger,
    padding: SPACING.md,
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
    marginTop: SPACING.sm,
  },
  historyBox: {
    maxHeight: 140,
  },
  history: {
    padding: SPACING.md,
  },
  historyTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  historyName: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  historyDistance: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  stopButton: {
    backgroundColor: COLORS.danger,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  stopButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
```

- [ ] **Step 2: หน้าวางแผนเส้นทางส่งเส้นทางไปให้โหมดเดินทาง พร้อมปุ่มจำลอง**

ใน `screens/RoutePlannerScreen.js` แทรกฟังก์ชันนี้ถัดจากก้อน `const region = { ... };`

```javascript

  /** ส่งเส้นทางไปให้โหมดเดินทาง เพื่อให้รู้ว่าผู้ใช้อยู่ตรงไหนของเส้นทาง */
  function startTrip(mode) {
    if (!routeResult) return;
    navigation.navigate('TripMode', {
      mode,
      routeCoordinates: routeResult.coordinates,
      routeLabel: selectedRoute.label,
    });
  }
```

แทนที่

```javascript
            <Pressable
              style={styles.startButton}
              onPress={() => navigation.navigate('TripMode')}
            >
              <Text style={styles.startButtonText}>เริ่มโหมดเดินทาง</Text>
            </Pressable>
```

ด้วย

```javascript
            <View style={styles.startRow}>
              {/* โหมดจำลอง: สาธิตการเตือนได้โดยไม่ต้องขับรถจริง (แก้ปัญหาในเอกสารบทที่ 7.3) */}
              <Pressable
                style={[styles.startButton, !routeResult && styles.startButtonDisabled]}
                disabled={!routeResult}
                onPress={() => startTrip('simulate')}
              >
                <Text style={styles.startButtonText}>▶ จำลองการเดินทาง</Text>
              </Pressable>
              <Pressable
                style={[styles.startButton, styles.gpsButton, !routeResult && styles.startButtonDisabled]}
                disabled={!routeResult}
                onPress={() => startTrip('gps')}
              >
                <Text style={styles.startButtonText}>📍 เริ่มจริงด้วย GPS</Text>
              </Pressable>
            </View>
```

แทนที่ style ของปุ่มเดิม

```javascript
  startButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
```

ด้วย

```javascript
  startRow: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  gpsButton: {
    backgroundColor: COLORS.primaryDark,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
```

- [ ] **Step 3: เทสต์**

Run: `npm test`
Expected: `pass 136` `fail 0`

- [ ] **Step 4: Commit**

```bash
git add screens/TripModeScreen.js screens/RoutePlannerScreen.js
git commit -m "feat: โหมดเดินทางเตือนด้วยเสียงและการสั่น บอกระยะตามเส้นทาง และจำลองการเดินทางได้

ตามเอกสารวัตถุประสงค์ข้อ 4 ที่ให้รับรู้การเตือนโดยไม่ต้องมองจอ บทที่ 5.2 ที่ให้บอก
อีกกี่กิโลเมตรข้างหน้า และแก้ปัญหาบทที่ 7.3 ที่สาธิตโหมดเดินทางในห้องไม่ได้"
```

---

## Task 8: ตรวจของจริงในเบราว์เซอร์

**Files:**
- Create: `scripts/check-imports.mjs`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: เครื่องมือตรวจ import ทั้งโปรเจค**

Metro build ผ่านได้แม้จะ import ชื่อที่ไม่มีอยู่จริง ค่าที่ได้จะเป็น `undefined` แล้วไปพังตอนผู้ใช้กดปุ่มนั้น
หน้าจอโหมดเดินทางใหม่ import จาก 13 ไฟล์ จึงควรมีเครื่องมือตรวจที่ทีมใช้ซ้ำได้ก่อนอัปโหลดขึ้น Snack ทุกครั้ง

`scripts/check-imports.mjs`:

```javascript
/**
 * ตรวจว่าทุกบรรทัด import ในโปรเจคหาไฟล์เจอ และชื่อที่ import มามีอยู่จริงในไฟล์ปลายทาง
 *
 * ทำไมต้องมี: Metro build ผ่านได้แม้ import ชื่อที่ไม่มีอยู่จริง ค่าที่ได้จะเป็น undefined
 * แล้วไปพังตอนผู้ใช้กดปุ่มนั้น การตรวจนี้จับได้ตั้งแต่ก่อนอัปโหลดขึ้น Snack
 *
 * วิธีใช้: npm run check:imports
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'docs', 'dist', '.expo', 'scripts']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const relative = (file) => path.relative(ROOT, file).split(path.sep).join('/');

/** หาไฟล์ปลายทางแบบเดียวกับ Metro: ชื่อตรง, .js, .json, .native.js, .web.js, /index.js */
function resolveImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, base + '.js', base + '.json', base + '.native.js', base + '.web.js', path.join(base, 'index.js')];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

function exportedNames(file) {
  const source = fs.readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of source.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/gm)) names.add(m[1]);
  for (const m of source.matchAll(/^export\s+const\s+([A-Za-z0-9_]+)/gm)) names.add(m[1]);
  for (const m of source.matchAll(/^export\s*\{([^}]+)\}/gm)) {
    for (const piece of m[1].split(',')) {
      const name = piece.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  if (/^export\s+default/m.test(source)) names.add('default');
  return names;
}

const problems = [];
let importCount = 0;

for (const file of walk(ROOT)) {
  const source = fs.readFileSync(file, 'utf8');
  // [^;]*? กันไม่ให้ส่วนหน้าของบรรทัด import หนึ่งไปจับคู่กับ path ของบรรทัดถัดไป
  for (const m of source.matchAll(/^import\s+([^;]*?)\s+from\s+['"](\.[^'"]+)['"]\s*;/gm)) {
    importCount++;
    const [, clause, specifier] = m;
    const target = resolveImport(file, specifier);
    if (!target) {
      problems.push(`${relative(file)}: หาไฟล์ "${specifier}" ไม่เจอ`);
      continue;
    }
    if (target.endsWith('.json')) continue;

    const named = clause.match(/\{([^}]*)\}/);
    if (!named) continue;
    const available = exportedNames(target);
    for (const piece of named[1].split(',')) {
      const name = piece.trim().split(/\s+as\s+/)[0].trim();
      if (name && !available.has(name)) {
        problems.push(`${relative(file)}: "${name}" ไม่มีอยู่ใน ${relative(target)}`);
      }
    }
  }
}

console.log(`ตรวจ import ${importCount} บรรทัด`);
if (problems.length === 0) {
  console.log('OK: ทุก import หาไฟล์เจอ และทุกชื่อมีอยู่จริง');
} else {
  console.log(`พบปัญหา ${problems.length} จุด:`);
  for (const p of problems) console.log('  ' + p);
  process.exitCode = 1;
}
```

ใน `package.json` แทนที่

```json
  "scripts": {
    "test": "node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \"tests/*.test.js\""
  },
```

ด้วย

```json
  "scripts": {
    "test": "node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \"tests/*.test.js\"",
    "check:imports": "node scripts/check-imports.mjs"
  },
```

Run: `npm run check:imports`
Expected: บรรทัดสุดท้าย `OK: ทุก import หาไฟล์เจอ และทุกชื่อมีอยู่จริง` และ exit code 0

```bash
git add scripts/check-imports.mjs package.json
git commit -m "chore: เครื่องมือตรวจว่าทุก import หาไฟล์และชื่อเจอ ใช้ก่อนอัปโหลดขึ้น Snack

Metro build ผ่านได้แม้ import ชื่อที่ไม่มีอยู่จริง แล้วไปพังตอนผู้ใช้กดปุ่มนั้น"
```

- [ ] **Step 2: build**

Run: `npx expo export --platform web`
Expected: `Exported: dist`

Run: `grep -c "react-native-maps" dist/_expo/static/js/web/*.js`
Expected: `0`

- [ ] **Step 3: ตรวจที่ขนาดมือถือ 375×812**

เปิดด้วย `cd dist && python -m http.server 8750` ก่อนเริ่ม ให้ดักคำพูดของแอปโดยครอบ `speechSynthesis.speak` ให้บันทึก `utterance.text` ลงอาเรย์ `window.__spoken` ก่อนเรียกของจริง

| # | ตรวจ | เกณฑ์ผ่าน |
|---|---|---|
| 1 | แท็บเส้นทาง | เห็นปุ่ม "▶ จำลองการเดินทาง" และ "📍 เริ่มจริงด้วย GPS" |
| 2 | กด "▶ จำลองการเดินทาง" บนเส้นทาง ม.อ. → หาดสมิหลา | เปิดโหมดเดินทาง แถบความคืบหน้าวิ่งเอง ตัวเลข "x / 30.5 กม." เพิ่มขึ้น |
| 3 | ประโยคแรกที่พูด | ขึ้นต้นด้วย "จุดเสี่ยงถัดไป" และลงท้าย "ข้างหน้า" (บอกล่วงหน้า) |
| 4 | เลือก ×30 แล้วรอจนจบ | `window.__spoken` มีประโยค "ระวัง! อีกประมาณ" ครบทุกจุดบนเส้นทาง เรียงตามลำดับที่ขับผ่าน |
| 5 | ระหว่างมีการ์ดเตือน อ่านระยะสองครั้งห่างกัน 1 วินาที | ตัวเลขเปลี่ยน (นับถอยหลังจริง) |
| 6 | แถบจุดเสี่ยงถัดไป | ขึ้น "จุดเสี่ยงถัดไป" ระหว่างทาง และ "ผ่านจุดเสี่ยงบนเส้นทางครบแล้ว" ตอนจบ |
| 7 | กด "↺ เริ่มใหม่" | ประวัติการเตือนว่าง และประโยคบอกล่วงหน้าพูดอีกครั้ง |
| 8 | กด 🔇 แล้วเริ่มใหม่ | ไม่มีประโยคใหม่ใน `window.__spoken` |
| 9 | กด "หยุดโหมดเดินทาง" | กลับหน้าวางแผนเส้นทาง ไม่จอขาว |
| 10 | โหมด GPS ปลอมตำแหน่งให้ห่างเส้นทาง 1 กม. | แถบขึ้น "ออกนอกเส้นทางที่วางแผนไว้" |
| 11 | console | ไม่มี error |

ทุกข้อต้องผ่าน ข้อไหนไม่ผ่านให้แก้แล้วตรวจใหม่

- [ ] **Step 4: อัปเดต README และ Commit**

ในตาราง "สถานะการตรวจสอบ" ของ `README.md` แทนที่บรรทัด

```markdown
| เทสต์ทั้งหมด | 103/103 ผ่าน (รวมตรวจไฟล์ข้อมูล) |
```

ด้วย

```markdown
| เทสต์ทั้งหมด | 136/136 ผ่าน (รวมตรวจไฟล์ข้อมูล) |
| จำลองการเดินทาง ม.อ. → หาดสมิหลา | พูดเตือนภาษาไทยครบทุกจุดบนเส้นทาง เรียงตามลำดับที่ขับผ่าน |
```

และแทนที่

```markdown
ต้องได้ `pass 103` `fail 0` (รวมการตรวจความถูกต้องของไฟล์ข้อมูล)
```

ด้วย

```markdown
ต้องได้ `pass 136` `fail 0` (รวมการตรวจความถูกต้องของไฟล์ข้อมูล)
```

```bash
git add README.md
git commit -m "docs: README บอกผลตรวจโหมดเดินทางแบบจำลองและเสียงเตือน"
```
