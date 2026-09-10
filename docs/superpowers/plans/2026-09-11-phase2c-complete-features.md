# ระยะที่ 2 ช่วง C — ทำฟีเจอร์ตามเอกสารให้ครบ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ผู้ใช้เลือกต้นทางปลายทางเองได้ เห็นการ์ดสถานที่ยอดนิยมพร้อมจำนวนจุดเสี่ยงรอบ ๆ เก็บรายการโปรดได้ และแยกข้อมูลทางการออกจากข้อมูลที่ยังไม่ยืนยันด้วยป้ายที่ต่างกันชัดเจน (S2, S4, S5, S6 ในเอกสารออกแบบ)

**Architecture:** คงโครงสร้าง 4 ชั้นเดิม ตรรกะใหม่ทั้งหมดอยู่ใน `utils/` ที่มีเทสต์ (`places.js`, `routeRequest.js`, `favorites.js`) หน้าจอแค่เรียกใช้ สถานที่อยู่ในไฟล์ข้อมูลใหม่ `data/places.json` ที่ตรวจพิกัดกับ OpenStreetMap และมีกฎตรวจใน `npm test` รายการโปรดเก็บใน `AppDataProvider` ตัวเดิมเพื่อให้ทุกหน้าจอเห็นพร้อมกัน

**Tech Stack:** React Native + Expo SDK 54, react-native-web, AsyncStorage, `node --test`

**อ้างอิง:** `docs/superpowers/specs/2026-09-11-antacinn-help-phase2-design.md` ช่วง C และข้อ 5 (การจัดการข้อผิดพลาด)

---

## สิ่งที่พบระหว่างเตรียมแผน (ต้องแก้ก่อน)

`Alert.alert` ของ react-native-web เป็นฟังก์ชันว่าง (`node_modules/react-native-web/dist/exports/Alert/index.js` มีแค่ `static alert() {}`)
บนเว็บจึง **ไม่มีข้อความเตือนสักอัน** ในหน้าบันทึกจุด และ **ปุ่มลบจุดใช้ไม่ได้เลย** เพราะการลบต้องกดยืนยันในกล่องที่ไม่เคยขึ้นมา → Task 1

## โครงสร้างไฟล์

| ไฟล์ | สร้าง/แก้ | หน้าที่ |
|---|---|---|
| `components/dialogs.js` | สร้าง | กล่องข้อความและกล่องยืนยันที่ใช้ได้ทั้งมือถือและเว็บ |
| `constants/config.js` | แก้ | `SERVICE_AREA`, ระยะใหม่ 3 ค่า, `STORAGE_KEYS.FAVORITES`, `VERIFIED_TEXT` |
| `constants/theme.js` | แก้ | `COLORS.verifiedBackground` |
| `utils/geo.js` | แก้ | `isInServiceArea` (ย้ายมาจาก dataValidation) |
| `utils/dataValidation.js` | แก้ | ใช้ `isInServiceArea` จาก geo, เพิ่ม `validatePlaces` |
| `data/places.json` | สร้าง | สถานที่ยอดนิยม 18 แห่ง พิกัดจาก OpenStreetMap |
| `data/SOURCES.md` | แก้ | ที่มาของพิกัดสถานที่ |
| `utils/search.js` | แก้ | export `normalizeText` ให้ไฟล์อื่นใช้ซ้ำ |
| `utils/places.js` | สร้าง | `summarizeRisksNearPlace`, `searchPlaces` |
| `utils/routeRequest.js` | สร้าง | `buildRouteRequest`, `placeToEndpoint`, `myLocationToEndpoint` |
| `utils/routing.js` | แก้ | ไม่มีเส้นทางสำรอง → เส้นตรงพร้อม `source: 'straight'` |
| `utils/favorites.js` | สร้าง | `toggleFavoriteId`, `pickFavoritePoints` |
| `hooks/AppDataProvider.js` | แก้ | เก็บรายการโปรด |
| `hooks/useFavorites.js` | สร้าง | อ่านและสลับรายการโปรด |
| `hooks/usePlaces.js` | สร้าง | สถานที่พร้อมสรุปจุดเสี่ยงรอบ ๆ |
| `components/VerificationBadge.js` | สร้าง | ป้าย "✓ ข้อมูลทางการ" / "⚠️ ยังไม่ยืนยัน" |
| `components/Disclaimer.js` | แก้ | เพิ่มแบบ `verified` |
| `components/RiskPointCard.js` | แก้ | ใช้ `VerificationBadge` |
| `components/PlaceCard.js` | สร้าง | การ์ดสถานที่ |
| `components/RouteEndpoints.js` | สร้าง | แถบต้นทาง/ปลายทาง/ปุ่มสลับ |
| `components/PlacePicker.js` | สร้าง | รายการสถานที่ให้เลือกพร้อมช่องค้นหา |
| `components/AppMap.web.js`, `AppMap.native.js` | แก้ | prop ใหม่ `highlight` |
| `screens/SavePointScreen.js`, `components/EmergencyButton.js` | แก้ | ใช้ `dialogs.js` |
| `screens/RiskDetailScreen.js` | แก้ | ปุ่ม ☆ รายการโปรด และป้ายยืนยัน |
| `screens/HomeScreen.js` | แก้ | รายการโปรด การ์ดสถานที่ ผลค้นหาสถานที่ |
| `screens/MapScreen.js` | แก้ | รับ `focusPlaceId` จากหน้าแรก |
| `screens/RoutePlannerScreen.js` | แก้ | เลือกต้นทางปลายทางเอง |
| `screens/TripModeScreen.js` | แก้ | เสนอโหมดจำลองเมื่อใช้ GPS ไม่ได้ |
| `tests/*.test.js` | สร้าง/แก้ | เทสต์ใหม่ 35 ข้อ (138 → 173) |

---

## Task 1: กล่องข้อความที่ใช้ได้บนเว็บ

**Files:**
- Create: `components/dialogs.js`
- Modify: `screens/SavePointScreen.js`
- Modify: `components/EmergencyButton.js`

- [ ] **Step 1: สร้าง `components/dialogs.js`**

```javascript
/**
 * กล่องข้อความและกล่องยืนยัน ที่ใช้ได้ทั้งมือถือและเว็บ
 *
 * ทำไมต้องมี: Alert.alert ของ react-native-web เป็นฟังก์ชันว่าง ไม่ทำอะไรเลย
 * (ดู node_modules/react-native-web/dist/exports/Alert/index.js)
 * บนเว็บข้อความเตือนทุกอันจึงหายเงียบ และปุ่มที่ต้องกดยืนยันก่อน เช่น ปุ่มลบ จะใช้ไม่ได้เลย
 *
 * วิธีแก้: บนเว็บใช้ window.alert / window.confirm ของเบราว์เซอร์ บนมือถือใช้ Alert.alert ตามเดิม
 */

import { Alert, Platform } from 'react-native';

function joinText(title, message) {
  return message ? `${title}\n\n${message}` : title;
}

/** แจ้งข้อความ มีปุ่มตกลงปุ่มเดียว */
export function showMessage(title, message) {
  if (Platform.OS === 'web') {
    window.alert(joinText(title, message));
    return;
  }
  Alert.alert(title, message);
}

/**
 * ถามยืนยันก่อนทำสิ่งที่ย้อนกลับไม่ได้ เช่น ลบข้อมูล
 * @param options.onConfirm เรียกเมื่อผู้ใช้กดยืนยันเท่านั้น
 */
export function confirmAction({ title, message, confirmLabel, onConfirm }) {
  if (Platform.OS === 'web') {
    if (window.confirm(joinText(title, message))) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'ยกเลิก', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
```

- [ ] **Step 2: ใช้ใน `screens/SavePointScreen.js`**

แทนที่บรรทัด import

```javascript
import {
  View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet,
} from 'react-native';
```

ด้วย

```javascript
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
```

และเพิ่มหลัง `import FilterChips from '../components/FilterChips';`

```javascript
import { showMessage, confirmAction } from '../components/dialogs';
```

แทนที่ทุก `Alert.alert(` ที่มีสองอาร์กิวเมนต์ด้วย `showMessage(` (4 ที่: ดึงพิกัดไม่สำเร็จ, กรอกชื่อไม่ครบ, กรอกพิกัดไม่ครบ, บันทึกแล้ว)

แทนที่ฟังก์ชัน `handleDelete` ทั้งฟังก์ชันด้วย

```javascript
  function handleDelete(point) {
    confirmAction({
      title: 'ลบจุดนี้?',
      message: point.name,
      confirmLabel: 'ลบ',
      onConfirm: () => removePoint(point.id),
    });
  }
```

- [ ] **Step 3: ใช้ใน `components/EmergencyButton.js`**

แทนที่ `import { Text, Pressable, Linking, Alert, StyleSheet } from 'react-native';` ด้วย

```javascript
import { Text, Pressable, Linking, StyleSheet } from 'react-native';
import { showMessage } from './dialogs';
```

แทนที่ `Alert.alert(` ทั้งสองที่ด้วย `showMessage(`

- [ ] **Step 4: ตรวจ**

Run: `npm run check:imports`
Expected: `OK: ทุก import หาไฟล์เจอ และทุกชื่อมีอยู่จริง`

Run: `grep -rn "Alert\." screens components hooks`
Expected: เจอเฉพาะใน `components/dialogs.js`

- [ ] **Step 5: Commit**

```bash
git add components/dialogs.js screens/SavePointScreen.js components/EmergencyButton.js
git commit -m "fix: บนเว็บไม่มีข้อความเตือนและลบจุดที่บันทึกไม่ได้

Alert.alert ของ react-native-web เป็นฟังก์ชันว่าง กล่องยืนยันการลบจึงไม่เคยขึ้น
แก้ด้วย components/dialogs.js ที่ใช้ window.alert/confirm บนเว็บ"
```

---

## Task 2: ย้ายกรอบพื้นที่ให้บริการไปใช้ร่วมกัน

หน้าวางแผนเส้นทางต้องรู้ว่า "ตำแหน่งของฉัน" อยู่ในพื้นที่ที่แอปมีข้อมูลหรือไม่ ตอนนี้ฟังก์ชันนี้ซ่อนอยู่ใน `dataValidation.js`

**Files:**
- Modify: `constants/config.js`
- Modify: `utils/geo.js`
- Modify: `utils/dataValidation.js`
- Test: `tests/geo.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** ต่อท้าย `tests/geo.test.js` และเพิ่ม `isInServiceArea,` ในรายการ import จาก `'../utils/geo.js'`

```javascript
test('isInServiceArea: หาดใหญ่และสงขลาอยู่ในพื้นที่ กรุงเทพฯ ไม่อยู่', () => {
  assert.equal(isInServiceArea({ lat: 7.0086, lng: 100.498 }), true); // ม.อ.หาดใหญ่
  assert.equal(isInServiceArea({ lat: 7.21549, lng: 100.59581 }), true); // หาดสมิหลา
  assert.equal(isInServiceArea({ lat: 13.7563, lng: 100.5018 }), false); // กรุงเทพฯ
});

test('isInServiceArea: สลับ lat กับ lng ต้องหลุดกรอบ', () => {
  assert.equal(isInServiceArea({ lat: 100.498, lng: 7.0086 }), false);
});

test('isInServiceArea: ไม่มีพิกัดหรือพิกัดไม่ใช่ตัวเลข คืน false ไม่พัง', () => {
  assert.equal(isInServiceArea(null), false);
  assert.equal(isInServiceArea({ lat: '7.0', lng: 100.5 }), false);
});
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL `isInServiceArea is not a function` (หรือ SyntaxError เรื่อง export ที่ไม่มี)

- [ ] **Step 3: ย้ายค่าคงที่และฟังก์ชัน**

ใน `constants/config.js` เพิ่มก่อน `/** ตำแหน่งเริ่มต้นของแผนที่ ...`

```javascript
/**
 * กรอบพื้นที่ให้บริการของแอป (หาดใหญ่ เมืองสงขลา และสะพานติณสูลานนท์ฝั่งสิงหนคร)
 * กว้างพอให้ครอบน้ำตกโตนงาช้าง (ทิศตะวันตก) และสะพานติณสูลานนท์ (ทิศเหนือ)
 * ใช้สองงาน: ตรวจไฟล์ข้อมูล (พิกัดหลุดกรอบ = พิมพ์ผิด)
 * และตรวจว่าตำแหน่งผู้ใช้อยู่ในพื้นที่ที่แอปมีข้อมูลหรือไม่
 */
export const SERVICE_AREA = { minLat: 6.85, maxLat: 7.3, minLng: 100.15, maxLng: 100.7 };
```

ใน `utils/geo.js` เพิ่มหลังคอมเมนต์หัวไฟล์

```javascript
import { SERVICE_AREA } from '../constants/config.js';
```

และต่อท้ายไฟล์

```javascript
/**
 * พิกัดอยู่ในพื้นที่ให้บริการของแอปหรือไม่
 *
 * แอปมีข้อมูลจุดเสี่ยงเฉพาะหาดใหญ่–สงขลา ตำแหน่งนอกกรอบนี้วางแผนเส้นทางไปก็ไม่ได้ประโยชน์
 * คืน false ถ้าไม่มีพิกัด หรือพิกัดไม่ใช่ตัวเลข (เช่น พิมพ์ผิดในไฟล์ข้อมูล)
 */
export function isInServiceArea(coordinate, area = SERVICE_AREA) {
  return Boolean(
    coordinate &&
      Number.isFinite(coordinate.lat) &&
      Number.isFinite(coordinate.lng) &&
      coordinate.lat >= area.minLat &&
      coordinate.lat <= area.maxLat &&
      coordinate.lng >= area.minLng &&
      coordinate.lng <= area.maxLng
  );
}
```

ใน `utils/dataValidation.js` แทนที่ `import { haversineMeters } from './geo.js';` ด้วย

```javascript
import { haversineMeters, isInServiceArea } from './geo.js';
```

แล้วลบทั้งก้อน `SERVICE_AREA` (คอมเมนต์ + `export const SERVICE_AREA = ...`) และทั้งฟังก์ชัน `function isInServiceArea(coordinate) { ... }` ออก

- [ ] **Step 4: รันเทสต์**

Run: `npm test`
Expected: `pass 141` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add constants/config.js utils/geo.js utils/dataValidation.js tests/geo.test.js
git commit -m "refactor: ย้ายกรอบพื้นที่ให้บริการไป config และ geo ให้หน้าจอใช้ได้"
```

---

## Task 3: ไฟล์สถานที่ยอดนิยม `data/places.json`

พิกัดทุกแห่งค้นจาก OpenStreetMap (Nominatim และ Overpass) เมื่อ 2026-09-11 ตารางที่มาอยู่ใน Step 6

**Files:**
- Create: `data/places.json`
- Modify: `utils/dataValidation.js`
- Modify: `data/SOURCES.md`
- Test: `tests/dataValidation.test.js`, `tests/data.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** ต่อท้าย `tests/dataValidation.test.js` และเพิ่ม `validatePlaces` ในรายการ import

```javascript
/** สถานที่ที่ถูกต้องทุกฟิลด์ ใช้เป็นฐานแล้วค่อยแก้ทีละฟิลด์ให้ผิด */
function validPlace(overrides = {}) {
  return {
    id: 'place-test',
    name: 'สถานที่ทดสอบ',
    emoji: '📍',
    district: 'หาดใหญ่',
    coordinate: { lat: 7.0, lng: 100.47 },
    ...overrides,
  };
}

test('สถานที่: ถูกต้องทุกฟิลด์ ต้องไม่มีปัญหาเลย', () => {
  assert.deepEqual(validatePlaces([validPlace()]), []);
});

test('สถานที่: id ซ้ำ หรือไม่ขึ้นต้นด้วย place- ต้องถูกจับได้', () => {
  assertHasError(validatePlaces([validPlace(), validPlace()]), 'id ซ้ำ');
  assertHasError(validatePlaces([validPlace({ id: 'hy-test' })]), 'place-');
});

test('สถานที่: ไม่มีชื่อ หรือไม่มี emoji ต้องถูกจับได้', () => {
  assertHasError(validatePlaces([validPlace({ name: '  ' })]), 'ไม่มีชื่อ');
  assertHasError(validatePlaces([validPlace({ emoji: '' })]), 'emoji');
});

test('สถานที่: อำเภอนอกพื้นที่ของแอป ต้องถูกจับได้', () => {
  assertHasError(validatePlaces([validPlace({ district: 'สะเดา' })]), 'district');
});

test('สถานที่: สลับ lat กับ lng ต้องถูกจับได้', () => {
  assertHasError(validatePlaces([validPlace({ coordinate: { lat: 100.47, lng: 7.0 } })]), 'นอกพื้นที่');
});
```

ต่อท้าย `tests/data.test.js` และเพิ่ม `validatePlaces` ในรายการ import

```javascript
test('data/places.json ผ่านกฎทุกข้อ', () => {
  const errors = validatePlaces(readJson('../data/places.json'));
  assert.deepEqual(errors, [], 'ปัญหาที่พบ:\n' + errors.join('\n'));
});
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL `validatePlaces` ไม่มีอยู่

- [ ] **Step 3: เพิ่ม `validatePlaces`** ต่อท้าย `utils/dataValidation.js`

```javascript
/** คำนำหน้า id ของสถานที่ แยกจากจุดเสี่ยงให้เห็นชัดว่าเป็นคนละชุดข้อมูล */
const PLACE_ID_PREFIX = 'place-';
const KNOWN_DISTRICTS = Object.values(DISTRICT_PREFIXES);

/**
 * ตรวจสถานที่ยอดนิยม (data/places.json)
 * @returns อาเรย์ข้อความปัญหา ถ้าถูกต้องทั้งหมดจะได้อาเรย์ว่าง
 */
export function validatePlaces(places) {
  if (!Array.isArray(places)) return ['ข้อมูลสถานที่ต้องเป็นอาเรย์'];

  const errors = [];
  const seenIds = new Set();

  places.forEach((place, index) => {
    const label = place && place.id ? place.id : `ลำดับที่ ${index + 1}`;
    const problem = (message) => errors.push(`${label}: ${message}`);

    if (!place || typeof place.id !== 'string' || place.id === '') {
      problem('ไม่มี id');
      return;
    }
    if (!place.id.startsWith(PLACE_ID_PREFIX)) problem(`id ต้องขึ้นต้นด้วย ${PLACE_ID_PREFIX}`);
    if (seenIds.has(place.id)) problem('id ซ้ำกับสถานที่อื่น');
    seenIds.add(place.id);

    if (typeof place.name !== 'string' || place.name.trim() === '') problem('ไม่มีชื่อ');
    if (typeof place.emoji !== 'string' || place.emoji.trim() === '') problem('ไม่มี emoji');
    if (!KNOWN_DISTRICTS.includes(place.district)) {
      problem(`district ต้องเป็น ${KNOWN_DISTRICTS.join(' / ')}`);
    }
    if (!isInServiceArea(place.coordinate)) {
      problem('พิกัดอยู่นอกพื้นที่ให้บริการ (ตรวจว่าสลับ lat กับ lng หรือพิมพ์ผิดหรือไม่)');
    }
  });

  return errors;
}
```

แก้คอมเมนต์หัวไฟล์บรรทัดแรกเป็น `ตรวจความถูกต้องของไฟล์ข้อมูลในโฟลเดอร์ data/ (จุดเสี่ยง เส้นทางสำเร็จรูป สถานที่)`

- [ ] **Step 4: สร้าง `data/places.json`**

```json
[
  { "id": "place-psu", "name": "ม.อ.หาดใหญ่", "emoji": "🎓", "district": "หาดใหญ่", "coordinate": { "lat": 7.00966, "lng": 100.49596 } },
  { "id": "place-kimyong", "name": "ตลาดกิมหยง", "emoji": "🛍️", "district": "หาดใหญ่", "coordinate": { "lat": 7.00844, "lng": 100.46999 } },
  { "id": "place-leegardens", "name": "ลีการ์เดนส์ พลาซ่า", "emoji": "🏙️", "district": "หาดใหญ่", "coordinate": { "lat": 7.00585, "lng": 100.4717 } },
  { "id": "place-hatyai-station", "name": "สถานีรถไฟชุมทางหาดใหญ่", "emoji": "🚆", "district": "หาดใหญ่", "coordinate": { "lat": 7.00394, "lng": 100.46758 } },
  { "id": "place-hatyai-bus", "name": "สถานีขนส่งหาดใหญ่", "emoji": "🚌", "district": "หาดใหญ่", "coordinate": { "lat": 6.9947, "lng": 100.48198 } },
  { "id": "place-hatyai-airport", "name": "ท่าอากาศยานนานาชาติหาดใหญ่", "emoji": "✈️", "district": "หาดใหญ่", "coordinate": { "lat": 6.9364, "lng": 100.39399 } },
  { "id": "place-central-hatyai", "name": "เซ็นทรัลเฟสติวัล หาดใหญ่", "emoji": "🛒", "district": "หาดใหญ่", "coordinate": { "lat": 6.99191, "lng": 100.48282 } },
  { "id": "place-hatyai-park", "name": "สวนสาธารณะเทศบาลนครหาดใหญ่", "emoji": "🌳", "district": "หาดใหญ่", "coordinate": { "lat": 7.04241, "lng": 100.51195 } },
  { "id": "place-khlonghae", "name": "ตลาดน้ำคลองแห", "emoji": "🛶", "district": "หาดใหญ่", "coordinate": { "lat": 7.04618, "lng": 100.47382 } },
  { "id": "place-wat-hatyai-nai", "name": "วัดหาดใหญ่ใน (พระนอน)", "emoji": "🙏", "district": "หาดใหญ่", "coordinate": { "lat": 7.00364, "lng": 100.4536 } },
  { "id": "place-tonngachang", "name": "น้ำตกโตนงาช้าง", "emoji": "💦", "district": "หาดใหญ่", "coordinate": { "lat": 6.94664, "lng": 100.23193 } },
  { "id": "place-samila", "name": "หาดสมิหลา (รูปปั้นนางเงือก)", "emoji": "🏖️", "district": "เมืองสงขลา", "coordinate": { "lat": 7.21549, "lng": 100.59581 } },
  { "id": "place-chalatat", "name": "หาดชลาทัศน์", "emoji": "🌊", "district": "เมืองสงขลา", "coordinate": { "lat": 7.1941, "lng": 100.60922 } },
  { "id": "place-khao-tang-kuan", "name": "เขาตังกวน", "emoji": "⛰️", "district": "เมืองสงขลา", "coordinate": { "lat": 7.2108, "lng": 100.58923 } },
  { "id": "place-songkhla-oldtown", "name": "ย่านเมืองเก่าสงขลา", "emoji": "🏮", "district": "เมืองสงขลา", "coordinate": { "lat": 7.19536, "lng": 100.58987 } },
  { "id": "place-songkhla-aquarium", "name": "สงขลาอะควาเรียม", "emoji": "🐠", "district": "เมืองสงขลา", "coordinate": { "lat": 7.22492, "lng": 100.58004 } },
  { "id": "place-songkhla-zoo", "name": "สวนสัตว์สงขลา", "emoji": "🐘", "district": "เมืองสงขลา", "coordinate": { "lat": 7.1416, "lng": 100.60594 } },
  { "id": "place-koyo-institute", "name": "สถาบันทักษิณคดีศึกษา เกาะยอ", "emoji": "🏛️", "district": "เมืองสงขลา", "coordinate": { "lat": 7.18073, "lng": 100.5427 } }
]
```

- [ ] **Step 5: รันเทสต์**

Run: `npm test`
Expected: `pass 147` `fail 0`

- [ ] **Step 6: บันทึกที่มาใน `data/SOURCES.md`** เพิ่มก่อนหัวข้อ `## ตัวเลขเหตุการณ์`

```markdown
## สถานที่ยอดนิยม (`places.json`)

ค้นจาก OpenStreetMap เมื่อ 2026-09-11 (Nominatim ค้นด้วยชื่อ จำกัดกรอบพื้นที่ให้บริการ และ Overpass สำหรับที่ Nominatim หาไม่เจอ)
อำเภอตรวจจากที่อยู่ที่ Nominatim คืนมา

| id | พิกัด | อ้างอิง OpenStreetMap |
|---|---|---|
| place-psu | 7.00966, 100.49596 | มหาวิทยาลัยสงขลานครินทร์ (node 841335886) |
| place-kimyong | 7.00844, 100.46999 | ตลาดกิมหยง (way 1454417618) ตำแหน่งเดียวกับจุดเสี่ยง hy-kimyong-01 |
| place-leegardens | 7.00585, 100.47170 | Lee Gardens Plaza (way 384529910) |
| place-hatyai-station | 7.00394, 100.46758 | สถานีรถไฟชุมทางหาดใหญ่ (way 101939902) |
| place-hatyai-bus | 6.99470, 100.48198 | สถานีขนส่งหาดใหญ่ (way 148939909) |
| place-hatyai-airport | 6.93640, 100.39399 | อาคารผู้โดยสาร ท่าอากาศยานนานาชาติหาดใหญ่ (way 310488889) ใช้อาคารผู้โดยสาร ไม่ใช้กึ่งกลางสนามบินซึ่งอยู่กลางรันเวย์ |
| place-central-hatyai | 6.99191, 100.48282 | เซ็นทรัลเฟสติวัล หาดใหญ่ (node 4367171791) |
| place-hatyai-park | 7.04241, 100.51195 | สวนสาธารณะเทศบาลนครหาดใหญ่ (way 499047184) |
| place-khlonghae | 7.04618, 100.47382 | Khlong Hae Floating Market (way 1156247874) |
| place-wat-hatyai-nai | 7.00364, 100.45360 | วัดหาดใหญ่ใน (node 1680667266) |
| place-tonngachang | 6.94664, 100.23193 | น้ำตกโตนงาช้าง (node 1668830908) ตำแหน่งเดียวกับจุดเสี่ยง |
| place-samila | 7.21549, 100.59581 | รูปปั้นนางเงือก (node 2506674446) ตำแหน่งเดียวกับจุดเสี่ยง |
| place-chalatat | 7.19410, 100.60922 | ถนนชลาทัศน์ช่วงกลาง (way 496657038) ตำแหน่งเดียวกับจุดเสี่ยง |
| place-khao-tang-kuan | 7.21080, 100.58923 | ยอดเขาตังกวน (node 2506660318) |
| place-songkhla-oldtown | 7.19536, 100.58987 | Songkhla Old Town (node 6909338386) |
| place-songkhla-aquarium | 7.22492, 100.58004 | Songkhla Aquarium (relation 13274783) |
| place-songkhla-zoo | 7.14160, 100.60594 | สวนสัตว์สงขลา (way 457997122) |
| place-koyo-institute | 7.18073, 100.54270 | สถาบันทักษิณคดีศึกษา มหาวิทยาลัยทักษิณ (way 1458179464) |
```

- [ ] **Step 7: Commit**

```bash
git add data/places.json data/SOURCES.md utils/dataValidation.js tests/dataValidation.test.js tests/data.test.js
git commit -m "data: สถานที่ยอดนิยม 18 แห่ง พิกัดจาก OpenStreetMap พร้อมกฎตรวจ"
```

---

## Task 4: สรุปจุดเสี่ยงรอบสถานที่ และค้นหาสถานที่

**Files:**
- Modify: `utils/search.js`
- Create: `utils/places.js`
- Modify: `constants/config.js`
- Test: `tests/places.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/places.test.js`

```javascript
/**
 * เทสต์ของ utils/places.js
 *
 * โจทย์ (เอกสารบทที่ 4): การ์ดสถานที่ยอดนิยมในหน้าแรก
 * บอกว่ารอบสถานที่มีจุดเสี่ยงกี่จุด และจุดที่อันตรายที่สุดอยู่ระดับไหน
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRisksNearPlace, searchPlaces } from '../utils/places.js';

const samila = {
  id: 'place-samila',
  name: 'หาดสมิหลา (รูปปั้นนางเงือก)',
  district: 'เมืองสงขลา',
  coordinate: { lat: 7.21549, lng: 100.59581 },
};

/** จุดเสี่ยงห่างจากหาดสมิหลาไปทางเหนือหรือใต้ (0.009 องศาละติจูด ≈ 1,000 ม.) */
function riskPointAt(id, latOffset, riskScore) {
  return {
    id,
    coordinate: { lat: 7.21549 + latOffset, lng: 100.59581 },
    riskScore,
    riskLevel: { id: 'test', label: 'ทดสอบ', color: '#000000' },
  };
}

const points = [
  riskPointAt('near-low', 0.0045, 10), // ≈ 500 ม.
  riskPointAt('mid-high', -0.0135, 60), // ≈ 1,500 ม.
  riskPointAt('far', 0.027, 90), // ≈ 3,000 ม. นอกรัศมี 2 กม.
];

test('นับเฉพาะจุดในรัศมี และบอกจุดที่อันตรายที่สุด', () => {
  const summary = summarizeRisksNearPlace(samila, points, 2000);
  assert.equal(summary.count, 2);
  assert.equal(summary.highest.id, 'mid-high');
});

test('รายการจุดรอบสถานที่เรียงจากใกล้ไปไกล พร้อมระยะ', () => {
  const { nearby } = summarizeRisksNearPlace(samila, points, 2000);
  assert.deepEqual(nearby.map((item) => item.point.id), ['near-low', 'mid-high']);
  assert.ok(Math.abs(nearby[0].distanceM - 500) < 10, `ระยะ ${nearby[0].distanceM}`);
});

test('ไม่มีจุดในรัศมี: นับได้ 0 และไม่มีจุดอันตรายที่สุด (ห้ามตีความว่าปลอดภัย)', () => {
  const summary = summarizeRisksNearPlace(samila, [points[2]], 2000);
  assert.equal(summary.count, 0);
  assert.equal(summary.highest, null);
  assert.deepEqual(summary.nearby, []);
});

test('คะแนนเท่ากัน เลือกจุดที่ใกล้กว่าเป็นจุดอันตรายที่สุด', () => {
  const tie = [riskPointAt('b-far', 0.009, 50), riskPointAt('a-near', 0.0045, 50)];
  assert.equal(summarizeRisksNearPlace(samila, tie, 2000).highest.id, 'a-near');
});

const places = [
  { id: 'place-psu', name: 'ม.อ.หาดใหญ่', district: 'หาดใหญ่' },
  { id: 'place-samila', name: 'หาดสมิหลา (รูปปั้นนางเงือก)', district: 'เมืองสงขลา' },
  { id: 'place-chalatat', name: 'หาดชลาทัศน์', district: 'เมืองสงขลา' },
  { id: 'place-kimyong', name: 'ตลาดกิมหยง', district: 'หาดใหญ่' },
];

test('ค้นสถานที่: คำค้นว่าง หรือมีแต่ช่องว่าง ได้ผลว่าง', () => {
  assert.deepEqual(searchPlaces(places, ''), []);
  assert.deepEqual(searchPlaces(places, '   '), []);
});

test('ค้นสถานที่ "หาด": ชายหาดขึ้นก่อน ตามด้วยที่มีคำนี้กลางชื่อ แล้วค่อยเป็นที่ตรงแค่อำเภอ', () => {
  const ids = searchPlaces(places, 'หาด').map((p) => p.id);
  assert.deepEqual(ids, ['place-samila', 'place-chalatat', 'place-psu', 'place-kimyong']);
});

test('ค้นสถานที่: ไม่สนช่องว่าง "หาด ชลาทัศน์" หาเจอ', () => {
  assert.equal(searchPlaces(places, 'หาด ชลาทัศน์')[0].id, 'place-chalatat');
});

test('ค้นสถานที่ด้วยชื่ออำเภอ: "สงขลา" ได้สถานที่ในเมืองสงขลา', () => {
  assert.deepEqual(searchPlaces(places, 'สงขลา').map((p) => p.id), ['place-samila', 'place-chalatat']);
});
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL หาไฟล์ `utils/places.js` ไม่เจอ

- [ ] **Step 3: export ตัวทำความสะอาดข้อความใน `utils/search.js`**

แทนที่ `function normalize(text) {` ด้วย `export function normalizeText(text) {` แล้วแทนที่การเรียก `normalize(` ที่เหลือทั้งไฟล์ด้วย `normalizeText(` (4 ที่)

- [ ] **Step 4: สร้าง `utils/places.js`**

```javascript
/**
 * สถานที่ท่องเที่ยวยอดนิยม: สรุปจุดเสี่ยงรอบสถานที่ และค้นหาสถานที่
 *
 * เอกสารบทที่ 4 กำหนดให้หน้าแรกมี "การ์ดสถานที่ยอดนิยม"
 * การ์ดแต่ละใบบอกว่ารอบสถานที่นั้นมีจุดเสี่ยงกี่จุด และจุดที่อันตรายที่สุดอยู่ระดับไหน
 * ผู้ใช้จะได้รู้ก่อนไปว่าที่นั่นต้องระวังแค่ไหน
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { haversineMeters } from './geo.js';
import { normalizeText } from './search.js';

/**
 * @param place สถานที่จาก data/places.json ต้องมี coordinate
 * @param points จุดเสี่ยงที่มี riskScore และ riskLevel แล้ว (จาก useRiskPoints)
 * @param radiusM รัศมีที่นับ หน่วยเมตร
 * @returns {
 *   count    จำนวนจุดเสี่ยงในรัศมี
 *   highest  จุดที่คะแนนความเสี่ยงสูงที่สุด ถ้าเท่ากันเอาจุดที่ใกล้กว่า / null ถ้าไม่มีจุดในรัศมี
 *   nearby   [{ point, distanceM }] เรียงจากใกล้ไปไกล
 * }
 */
export function summarizeRisksNearPlace(place, points, radiusM) {
  const nearby = (points || [])
    .map((point) => ({ point, distanceM: haversineMeters(place.coordinate, point.coordinate) }))
    .filter((item) => item.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);

  // วนจากใกล้ไปไกล และแทนที่เฉพาะเมื่อคะแนน "มากกว่า" จุดที่ใกล้กว่าจึงชนะเมื่อคะแนนเท่ากัน
  let highest = null;
  for (const item of nearby) {
    if (!highest || (item.point.riskScore || 0) > (highest.riskScore || 0)) highest = item.point;
  }

  return { count: nearby.length, highest, nearby };
}

/**
 * ให้คะแนนความเกี่ยวข้อง
 *   3 = ชื่อขึ้นต้นด้วยคำค้น   2 = ชื่อมีคำค้นอยู่ข้างใน   1 = ตรงกับอำเภออย่างเดียว
 */
function placeRelevance(place, query) {
  const name = normalizeText(place.name);
  if (name.startsWith(query)) return 3;
  if (name.includes(query)) return 2;
  if (normalizeText(place.district).includes(query)) return 1;
  return 0;
}

/**
 * ค้นสถานที่จากชื่อหรืออำเภอ เรียงตามความเกี่ยวข้อง คะแนนเท่ากันคงลำดับเดิมของไฟล์ข้อมูล
 * @returns สถานที่ที่ตรง ถ้าไม่ได้พิมพ์อะไรคืนอาเรย์ว่าง
 */
export function searchPlaces(places, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || !Array.isArray(places)) return [];

  return places
    .map((place, index) => ({ place, index, score: placeRelevance(place, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.place);
}
```

- [ ] **Step 5: เพิ่มระยะใหม่ใน `constants/config.js`** ใน `DISTANCE` ต่อจาก `REACHED_TOLERANCE: 30,`

```javascript
  /** นับจุดเสี่ยงรอบสถานที่ยอดนิยมในรัศมีนี้ (การ์ดสถานที่ในหน้าแรก) */
  PLACE_RISK_RADIUS: 2000,
  /**
   * ต้นทางปลายทางที่ผู้ใช้เลือกเอง ห่างจากปลายของเส้นทางแนะนำไม่เกินนี้ ถือว่าเป็นเส้นทางเดียวกัน
   * จะได้ใช้เส้นทางสำรองออฟไลน์ของเส้นนั้นได้เมื่อไม่มีอินเทอร์เน็ต
   * ใช้ค่าเดียวกับเกณฑ์ "อยู่บนเส้นทาง" ห่างไม่เกินนี้ถือว่าอยู่บนถนนเส้นเดียวกัน
   */
  PRESET_MATCH_RADIUS: 300,
  /** ต้นทางกับปลายทางใกล้กันไม่เกินนี้ ถือว่าเป็นที่เดียวกัน ไม่ต้องหาเส้นทาง */
  SAME_PLACE: 100,
```

- [ ] **Step 6: รันเทสต์**

Run: `npm test`
Expected: `pass 155` `fail 0` (search.test.js 7 ข้อเดิมยังผ่าน)

- [ ] **Step 7: Commit**

```bash
git add utils/search.js utils/places.js constants/config.js tests/places.test.js
git commit -m "feat: สรุปจุดเสี่ยงรอบสถานที่ และค้นหาสถานที่เรียงตามความเกี่ยวข้อง"
```

---

## Task 5: คำขอเส้นทางจากต้นทางปลายทางที่เลือกเอง

**Files:**
- Create: `utils/routeRequest.js`
- Test: `tests/routeRequest.test.js`, `tests/data.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/routeRequest.test.js`

```javascript
/**
 * เทสต์ของ utils/routeRequest.js
 *
 * โจทย์ (เอกสารตาราง 3.1): ผู้ใช้ "เลือกต้นทางปลายทาง" เอง
 * ถ้าบังเอิญตรงกับเส้นทางแนะนำ ต้องได้เส้นทางสำรองออฟไลน์ของเส้นนั้นด้วย
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRouteRequest,
  placeToEndpoint,
  myLocationToEndpoint,
  MY_LOCATION_NAME,
} from '../utils/routeRequest.js';

const presets = [
  {
    id: 'psu-to-samila',
    label: 'ม.อ.หาดใหญ่ → หาดสมิหลา',
    origin: { lat: 7.0086, lng: 100.498, name: 'ม.อ.หาดใหญ่' },
    destination: { lat: 7.21549, lng: 100.59581, name: 'หาดสมิหลา' },
    fallbackCoordinates: [
      { lat: 7.0086, lng: 100.498 },
      { lat: 7.1, lng: 100.55 },
      { lat: 7.21549, lng: 100.59581 },
    ],
  },
];

const psuPlace = { name: 'ม.อ.หาดใหญ่', lat: 7.00966, lng: 100.49596 }; // ห่างต้นทางของเส้นแนะนำ ≈ 254 ม.
const samila = { name: 'หาดสมิหลา (รูปปั้นนางเงือก)', lat: 7.21549, lng: 100.59581 };
const kimyong = { name: 'ตลาดกิมหยง', lat: 7.00844, lng: 100.46999 };

test('เลือกไม่ครบ บอกให้เลือกให้ครบ', () => {
  const result = buildRouteRequest(null, samila, presets);
  assert.equal(result.request, null);
  assert.match(result.problem, /ให้ครบ/);
});

test('ต้นทางกับปลายทางเป็นที่เดียวกัน สร้างเส้นทางไม่ได้', () => {
  const result = buildRouteRequest(samila, { ...samila, name: 'ที่เดิม' }, presets);
  assert.equal(result.request, null);
  assert.match(result.problem, /ที่เดียวกัน/);
});

test('ตรงกับเส้นทางแนะนำ (ห่างไม่เกิน 300 ม.) ได้เส้นทางสำรองออฟไลน์ของเส้นนั้น', () => {
  const { request, problem } = buildRouteRequest(psuPlace, samila, presets);
  assert.equal(problem, null);
  assert.equal(request.id, 'psu-to-samila');
  assert.deepEqual(request.fallbackCoordinates, presets[0].fallbackCoordinates);
});

test('ชื่อเส้นทางใช้ชื่อที่ผู้ใช้เลือก และหาเส้นทางจากพิกัดที่ผู้ใช้เลือก', () => {
  const { request } = buildRouteRequest(psuPlace, samila, presets);
  assert.equal(request.label, 'ม.อ.หาดใหญ่ → หาดสมิหลา (รูปปั้นนางเงือก)');
  assert.equal(request.origin, psuPlace);
  assert.equal(request.destination, samila);
});

test('เลือกกลับทิศ ใช้เส้นทางสำรองเส้นเดิมแบบกลับลำดับ โดยไม่แก้ของเดิม', () => {
  const { request } = buildRouteRequest(samila, psuPlace, presets);
  assert.equal(request.id, 'psu-to-samila-reverse');
  assert.deepEqual(request.fallbackCoordinates, [...presets[0].fallbackCoordinates].reverse());
  assert.deepEqual(presets[0].fallbackCoordinates[0], { lat: 7.0086, lng: 100.498 });
});

test('ไม่ตรงกับเส้นทางแนะนำ ได้คำขอแบบเลือกเองที่ไม่มีเส้นทางสำรอง', () => {
  const { request } = buildRouteRequest(kimyong, samila, presets);
  assert.equal(request.id, 'custom');
  assert.equal(request.fallbackCoordinates, undefined);
});

test('ห่างเกิน 300 ม. ไม่นับว่าตรงกับเส้นทางแนะนำ', () => {
  // 0.0036 องศาละติจูด ≈ 400 ม. จากต้นทางของเส้นแนะนำ
  const tooFar = { name: 'ไกลเกินไป', lat: 7.0086 + 0.0036, lng: 100.498 };
  assert.equal(buildRouteRequest(tooFar, samila, presets).request.id, 'custom');
});

test('แปลงสถานที่และตำแหน่ง GPS เป็นต้นทางปลายทาง', () => {
  assert.deepEqual(
    placeToEndpoint({ name: 'ก', emoji: '🏖️', coordinate: { lat: 7.1, lng: 100.5 } }),
    { name: 'ก', lat: 7.1, lng: 100.5, emoji: '🏖️' }
  );
  const me = myLocationToEndpoint({ lat: 7.0, lng: 100.4, accuracy: 12 });
  assert.equal(me.name, MY_LOCATION_NAME);
  assert.equal(me.isMyLocation, true);
  assert.equal(me.accuracy, undefined);
});
```

ต่อท้าย `tests/data.test.js` และเพิ่ม import สองบรรทัดนี้ใต้ import เดิม

```javascript
import { haversineMeters } from '../utils/geo.js';
import { DISTANCE } from '../constants/config.js';
```

```javascript
test('ต้นทางและปลายทางของเส้นทางแนะนำทุกเส้น มีสถานที่ในรายการอยู่ใกล้ ๆ', () => {
  // ผู้ใช้ที่เลือกต้นทางปลายทางเองจากรายการสถานที่ ต้องได้ใช้เส้นทางสำรองออฟไลน์ของเส้นทางแนะนำด้วย
  const places = readJson('../data/places.json');
  const routes = readJson('../data/presetRoutes.json');
  const tooFar = [];
  for (const route of routes) {
    for (const end of ['origin', 'destination']) {
      const nearestM = Math.min(...places.map((place) => haversineMeters(place.coordinate, route[end])));
      if (nearestM > DISTANCE.PRESET_MATCH_RADIUS) {
        tooFar.push(`${route.id} ${end} ห่างสถานที่ที่ใกล้ที่สุด ${Math.round(nearestM)} ม.`);
      }
    }
  }
  assert.deepEqual(tooFar, []);
});
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL หาไฟล์ `utils/routeRequest.js` ไม่เจอ

- [ ] **Step 3: สร้าง `utils/routeRequest.js`**

```javascript
/**
 * สร้าง "คำขอเส้นทาง" จากต้นทางและปลายทางที่ผู้ใช้เลือก
 *
 * คำขอเส้นทางคือของที่ส่งให้ getRouteWithFallback ใน utils/routing.js
 * รูปแบบ: { id, label, origin, destination, fallbackCoordinates? }
 *
 * ถ้าต้นทางปลายทางที่เลือกตรงกับเส้นทางแนะนำเส้นใดเส้นหนึ่ง (ห่างไม่เกิน 300 ม.)
 * จะแนบเส้นทางสำรองออฟไลน์ของเส้นนั้นไปด้วย ผู้ใช้ที่ไม่มีอินเทอร์เน็ตจึงยังเห็นเส้นทางบนถนนจริง
 * เลือกกลับทิศ (เช่น หาดสมิหลา → ม.อ.) ก็ใช้เส้นทางสำรองเส้นเดิมแบบกลับลำดับได้
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

import { haversineMeters } from './geo.js';
import { DISTANCE } from '../constants/config.js';

/** ชื่อที่แสดงเมื่อใช้ตำแหน่งปัจจุบันเป็นต้นทาง */
export const MY_LOCATION_NAME = 'ตำแหน่งของฉัน';

/** แปลงสถานที่จาก data/places.json เป็นต้นทางหรือปลายทาง */
export function placeToEndpoint(place) {
  return { name: place.name, lat: place.coordinate.lat, lng: place.coordinate.lng, emoji: place.emoji };
}

/** แปลงตำแหน่งจาก GPS เป็นต้นทาง (ไม่เก็บค่าอื่นของ GPS เช่น ความแม่นยำ) */
export function myLocationToEndpoint(coordinate) {
  return { name: MY_LOCATION_NAME, lat: coordinate.lat, lng: coordinate.lng, emoji: '📍', isMyLocation: true };
}

function isNear(a, b) {
  return haversineMeters(a, b) <= DISTANCE.PRESET_MATCH_RADIUS;
}

/**
 * @param origin { name, lat, lng }
 * @param destination { name, lat, lng }
 * @param presetRoutes รายการจาก data/presetRoutes.json
 * @returns { request, problem }
 *   request = คำขอเส้นทาง หรือ null ถ้าสร้างไม่ได้
 *   problem = ข้อความภาษาไทยบอกผู้ใช้ว่าทำไมสร้างไม่ได้ หรือ null ถ้าสร้างได้
 */
export function buildRouteRequest(origin, destination, presetRoutes = []) {
  if (!origin || !destination) {
    return { request: null, problem: 'เลือกต้นทางและปลายทางให้ครบก่อน' };
  }
  if (haversineMeters(origin, destination) <= DISTANCE.SAME_PLACE) {
    return { request: null, problem: 'ต้นทางกับปลายทางเป็นที่เดียวกัน กรุณาเลือกปลายทางใหม่' };
  }

  const label = `${origin.name} → ${destination.name}`;

  for (const preset of presetRoutes) {
    if (isNear(origin, preset.origin) && isNear(destination, preset.destination)) {
      const request = { id: preset.id, label, origin, destination, fallbackCoordinates: preset.fallbackCoordinates };
      return { request, problem: null };
    }
    if (isNear(origin, preset.destination) && isNear(destination, preset.origin)) {
      // [...] ก่อน reverse เพราะ reverse แก้อาเรย์เดิม ถ้าไม่คัดลอกจะทำให้เส้นทางแนะนำกลับทิศไปด้วย
      const fallbackCoordinates = [...preset.fallbackCoordinates].reverse();
      const request = { id: `${preset.id}-reverse`, label, origin, destination, fallbackCoordinates };
      return { request, problem: null };
    }
  }

  return { request: { id: 'custom', label, origin, destination }, problem: null };
}
```

- [ ] **Step 4: รันเทสต์**

Run: `npm test`
Expected: `pass 164` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/routeRequest.js tests/routeRequest.test.js tests/data.test.js
git commit -m "feat: สร้างคำขอเส้นทางจากต้นทางปลายทางที่เลือกเอง ใช้เส้นทางสำรองของเส้นแนะนำได้"
```

---

## Task 6: ไม่มีเส้นทางสำรอง ต้องบอกว่าเป็นเส้นตรง

เอกสารออกแบบข้อ 5: *"สำหรับต้นทางปลายทางที่เลือกเอง ถ้าไม่มีเส้นทางสำรองให้ลากเส้นตรงพร้อมบอกว่าเป็นค่าประมาณ"*

**Files:**
- Modify: `utils/routing.js`
- Test: `tests/routing.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/routing.test.js`

```javascript
/**
 * เทสต์ของ utils/routing.js
 *
 * ไม่ต่ออินเทอร์เน็ตจริง: แทน fetch ด้วยของปลอม เพื่อจำลองทั้งตอน OSRM ตอบปกติและตอนล่ม
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getRouteWithFallback } from '../utils/routing.js';

const realFetch = globalThis.fetch;
const realWarn = console.warn;

afterEach(() => {
  globalThis.fetch = realFetch;
  console.warn = realWarn;
});

const origin = { lat: 7.0086, lng: 100.498, name: 'ม.อ.หาดใหญ่' };
const destination = { lat: 7.21549, lng: 100.59581, name: 'หาดสมิหลา' };

/** ทำให้ fetch ล้มเหลวเหมือนไม่มีอินเทอร์เน็ต และปิดข้อความเตือนไม่ให้รกผลเทสต์ */
function simulateOffline() {
  globalThis.fetch = async () => {
    throw new Error('ไม่มีอินเทอร์เน็ต');
  };
  console.warn = () => {};
}

test('OSRM ตอบปกติ: ได้เส้นทางจริง และสลับ [lng, lat] เป็น { lat, lng }', async () => {
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{ distance: 28400, duration: 1860, geometry: { coordinates: [[100.498, 7.0086], [100.59581, 7.21549]] } }],
      }),
    };
  };

  const result = await getRouteWithFallback({ origin, destination });

  assert.equal(result.source, 'osrm');
  assert.deepEqual(result.coordinates, [{ lat: 7.0086, lng: 100.498 }, { lat: 7.21549, lng: 100.59581 }]);
  assert.equal(result.distanceM, 28400);
  // OSRM ต้องการลำดับ lng,lat
  assert.ok(requestedUrl.includes('100.498,7.0086;100.59581,7.21549'), requestedUrl);
});

test('ไม่มีอินเทอร์เน็ต และมีเส้นทางสำรอง: ใช้เส้นทางสำรองที่เก็บในเครื่อง', async () => {
  simulateOffline();
  const fallbackCoordinates = [origin, { lat: 7.1, lng: 100.55 }, destination];
  const result = await getRouteWithFallback({ origin, destination, fallbackCoordinates });
  assert.equal(result.source, 'offline');
  assert.equal(result.coordinates, fallbackCoordinates);
  assert.equal(result.distanceM, null);
});

test('ไม่มีอินเทอร์เน็ต และไม่มีเส้นทางสำรอง: ได้เส้นตรง และบอกชัดว่าเป็นเส้นตรง', async () => {
  simulateOffline();
  const result = await getRouteWithFallback({ origin, destination });
  assert.equal(result.source, 'straight');
  assert.deepEqual(result.coordinates, [{ lat: 7.0086, lng: 100.498 }, { lat: 7.21549, lng: 100.59581 }]);
});

test('OSRM ตอบว่าหาเส้นทางไม่ได้ ก็ใช้เส้นทางสำรองเหมือนกัน ไม่พัง', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ code: 'NoRoute', routes: [] }) });
  console.warn = () => {};
  const result = await getRouteWithFallback({ origin, destination, fallbackCoordinates: [origin, destination] });
  assert.equal(result.source, 'offline');
});
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL เทสต์เส้นตรง ได้ `'offline'` แทน `'straight'`

- [ ] **Step 3: แก้ `getRouteWithFallback` ใน `utils/routing.js`** แทนที่ทั้งคอมเมนต์และฟังก์ชันด้วย

```javascript
/**
 * ขอเส้นทาง โดยพยายามใช้ OSRM ก่อน ถ้าไม่ได้ค่อยใช้ของสำรอง
 *
 * นี่คือฟังก์ชันที่หน้าจอควรเรียกใช้ ไม่ใช่ fetchRouteFromOsrm โดยตรง
 * เพราะฟังก์ชันนี้รับประกันว่าจะได้เส้นทางเสมอ ไม่มีทาง throw
 *
 * @param routeRequest { origin, destination, fallbackCoordinates? }
 *   ได้จาก data/presetRoutes.json โดยตรง หรือจาก buildRouteRequest ใน utils/routeRequest.js
 * @returns { coordinates, distanceM, durationS, source }
 *   source = 'osrm'     เส้นทางจริงบนถนน จากอินเทอร์เน็ต
 *          | 'offline'  เส้นทางสำรองที่เก็บไว้ในเครื่อง (ถนนจริงแบบลดรายละเอียด)
 *          | 'straight' เส้นตรงระหว่างต้นทางกับปลายทาง ไม่ใช่ถนนจริง
 *                       ใช้เมื่อไม่มีอินเทอร์เน็ตและเส้นทางนี้ไม่มีข้อมูลสำรอง
 */
export async function getRouteWithFallback(routeRequest) {
  const { origin, destination, fallbackCoordinates } = routeRequest;

  try {
    return await fetchRouteFromOsrm(origin, destination);
  } catch (error) {
    // ไม่ throw ต่อ เพราะแอปต้องใช้งานได้แม้ไม่มีอินเทอร์เน็ต (ตามเอกสารบทที่ 6.2)
    console.warn('ดึงเส้นทางจาก OSRM ไม่สำเร็จ ใช้เส้นทางสำรองแทน:', error.message);

    // ของสำรองไม่มีข้อมูลระยะทาง/เวลาจริง ส่ง null ไปให้หน้าจอตัดสินใจว่าจะซ่อนหรือแสดงอะไร
    if (Array.isArray(fallbackCoordinates) && fallbackCoordinates.length >= 2) {
      return makeRouteResult(fallbackCoordinates, null, null, 'offline');
    }

    const straightLine = [
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    ];
    return makeRouteResult(straightLine, null, null, 'straight');
  }
}
```

- [ ] **Step 4: รันเทสต์**

Run: `npm test`
Expected: `pass 168` `fail 0`

- [ ] **Step 5: Commit**

```bash
git add utils/routing.js tests/routing.test.js
git commit -m "feat: เส้นทางที่ไม่มีข้อมูลสำรอง ใช้เส้นตรงและบอกชัดว่าไม่ใช่ถนนจริง"
```

---

## Task 7: รายการโปรด (ข้อมูล)

**Files:**
- Create: `utils/favorites.js`
- Create: `hooks/useFavorites.js`
- Modify: `constants/config.js`
- Modify: `hooks/AppDataProvider.js`
- Test: `tests/favorites.test.js`

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว** สร้าง `tests/favorites.test.js`

```javascript
/**
 * เทสต์ของ utils/favorites.js
 *
 * โจทย์ (เอกสารตาราง 6.1): AsyncStorage เก็บ "รายการโปรด" ของผู้ใช้
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleFavoriteId, pickFavoritePoints } from '../utils/favorites.js';

test('กดครั้งแรกเพิ่มเข้ารายการ ไว้บนสุดเพราะเพิ่งสนใจล่าสุด', () => {
  assert.deepEqual(toggleFavoriteId(['a'], 'b'), ['b', 'a']);
});

test('กดซ้ำเอาออกจากรายการ', () => {
  assert.deepEqual(toggleFavoriteId(['b', 'a'], 'b'), ['a']);
});

test('ไม่แก้อาเรย์เดิม (React ต้องได้อาเรย์ใหม่ถึงจะวาดหน้าจอใหม่)', () => {
  const ids = ['a'];
  toggleFavoriteId(ids, 'b');
  assert.deepEqual(ids, ['a']);
});

test('ข้อมูลในเครื่องเสีย (ไม่ใช่อาเรย์) เริ่มจากรายการว่าง ไม่พัง', () => {
  assert.deepEqual(toggleFavoriteId(null, 'a'), ['a']);
});

test('แปลง id เป็นจุดเสี่ยงตามลำดับที่บันทึก ข้ามจุดที่หาไม่เจอ', () => {
  const points = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const picked = pickFavoritePoints(['c', 'ถูกลบไปแล้ว', 'a'], points);
  assert.deepEqual(picked.map((p) => p.id), ['c', 'a']);
});
```

- [ ] **Step 2: รันให้เห็นว่าล้มเหลว**

Run: `npm test`
Expected: FAIL หาไฟล์ `utils/favorites.js` ไม่เจอ

- [ ] **Step 3: สร้าง `utils/favorites.js`**

```javascript
/**
 * รายการโปรด: เก็บเป็นอาเรย์ของ id จุดเสี่ยง (เอกสารตาราง 6.1)
 *
 * เก็บแค่ id ไม่เก็บทั้งจุด เพราะคะแนนความเสี่ยงเปลี่ยนตามเดือนและเวลา
 * ถ้าเก็บทั้งจุด คะแนนในรายการโปรดจะค้างเป็นค่าตอนกดบันทึก
 *
 * ไฟล์นี้เป็นฟังก์ชันบริสุทธิ์ — ห้าม import react
 */

/**
 * เพิ่มถ้ายังไม่มี (ไว้บนสุด) หรือเอาออกถ้ามีอยู่แล้ว
 * @returns อาเรย์ใหม่เสมอ ไม่แก้อาเรย์เดิม
 */
export function toggleFavoriteId(ids, id) {
  const current = Array.isArray(ids) ? ids : [];
  return current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
}

/**
 * แปลง id เป็นจุดเสี่ยงตามลำดับที่บันทึก
 * ข้าม id ที่หาไม่เจอ เช่น จุดที่ผู้ใช้บันทึกเองแล้วลบทิ้งไปแล้ว
 */
export function pickFavoritePoints(ids, points) {
  const pointById = new Map((points || []).map((point) => [point.id, point]));
  return (ids || []).map((id) => pointById.get(id)).filter(Boolean);
}
```

- [ ] **Step 4: รันเทสต์**

Run: `npm test`
Expected: `pass 173` `fail 0`

- [ ] **Step 5: คีย์ใหม่ใน `constants/config.js`** แทนที่

```javascript
export const STORAGE_KEYS = {
  SAVED_POINTS: '@antacinn/saved_points',
};
```

ด้วย

```javascript
export const STORAGE_KEYS = {
  SAVED_POINTS: '@antacinn/saved_points',
  FAVORITES: '@antacinn/favorites',
};
```

- [ ] **Step 6: เก็บรายการโปรดใน `hooks/AppDataProvider.js`**

แก้คอมเมนต์หัวไฟล์บรรทัด `วิธีแก้:` ให้ต่อท้ายว่า `ใช้กับทั้งจุดที่บันทึกเองและรายการโปรด`

แทนที่ `import { buildUserPoint } from '../utils/userPoint';` ด้วย

```javascript
import { buildUserPoint } from '../utils/userPoint';
import { toggleFavoriteId } from '../utils/favorites';
```

เพิ่มหลังบรรทัด `const savedPointsRef = useRef([]);`

```javascript

  const [favoriteIds, setFavoriteIds] = useState([]);
  const favoriteIdsRef = useRef([]);
```

แทนที่ก้อน

```javascript
  // โหลดครั้งเดียวตอนเปิดแอป
  useEffect(() => {
    reloadSavedPoints();
  }, [reloadSavedPoints]);
```

ด้วย

```javascript
  /** อ่านรายการโปรดจากเครื่อง */
  const reloadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      const ids = raw ? JSON.parse(raw) : [];
      favoriteIdsRef.current = Array.isArray(ids) ? ids : [];
      setFavoriteIds(favoriteIdsRef.current);
    } catch (error) {
      console.warn('อ่านรายการโปรดไม่สำเร็จ:', error.message);
    }
  }, []);

  // โหลดครั้งเดียวตอนเปิดแอป
  useEffect(() => {
    reloadSavedPoints();
    reloadFavorites();
  }, [reloadSavedPoints, reloadFavorites]);

  /** อัปเดตรายการโปรดทุกหน้าจอทันที แล้วค่อยเขียนลงเครื่อง */
  const persistFavorites = useCallback(async (ids) => {
    favoriteIdsRef.current = ids;
    setFavoriteIds(ids);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
    } catch (error) {
      console.warn('บันทึกรายการโปรดไม่สำเร็จ:', error.message);
    }
  }, []);

  const toggleFavorite = useCallback(
    (id) => persistFavorites(toggleFavoriteId(favoriteIdsRef.current, id)),
    [persistFavorites]
  );
```

แทนที่ `removePoint` ทั้งก้อนด้วย

```javascript
  const removePoint = useCallback(
    async (id) => {
      await persistSavedPoints(savedPointsRef.current.filter((p) => p.id !== id));
      // จุดที่ลบไปแล้วต้องไม่ค้างอยู่ในรายการโปรด
      if (favoriteIdsRef.current.includes(id)) {
        await persistFavorites(favoriteIdsRef.current.filter((favoriteId) => favoriteId !== id));
      }
    },
    [persistSavedPoints, persistFavorites]
  );
```

แทนที่ `value` ทั้งก้อนด้วย

```javascript
  const value = useMemo(
    () => ({
      savedPoints,
      isSavedPointsLoading,
      addPoint,
      removePoint,
      reloadSavedPoints,
      favoriteIds,
      toggleFavorite,
    }),
    [savedPoints, isSavedPointsLoading, addPoint, removePoint, reloadSavedPoints, favoriteIds, toggleFavorite]
  );
```

- [ ] **Step 7: สร้าง `hooks/useFavorites.js`**

```javascript
/**
 * รายการโปรดของผู้ใช้ (เอกสารตาราง 6.1)
 *
 * ข้อมูลจริงอยู่ใน AppDataProvider กดดาวในหน้ารายละเอียด หน้าแรกเห็นทันที
 */

import { useCallback } from 'react';
import { useAppData } from './AppDataProvider';

export function useFavorites() {
  const { favoriteIds, toggleFavorite } = useAppData();
  const isFavorite = useCallback((id) => favoriteIds.includes(id), [favoriteIds]);
  return { favoriteIds, isFavorite, toggleFavorite };
}
```

- [ ] **Step 8: ตรวจ**

Run: `npm test` → `pass 173` `fail 0`
Run: `npm run check:imports` → `OK`

- [ ] **Step 9: Commit**

```bash
git add utils/favorites.js hooks/useFavorites.js hooks/AppDataProvider.js constants/config.js tests/favorites.test.js
git commit -m "feat: เก็บรายการโปรดในเครื่อง ใช้ร่วมกันทุกหน้าจอ"
```

---

## Task 8: ป้ายข้อมูลทางการ และปุ่มรายการโปรดในหน้ารายละเอียด

**Files:**
- Modify: `constants/theme.js`, `constants/config.js`
- Create: `components/VerificationBadge.js`
- Modify: `components/Disclaimer.js`, `components/RiskPointCard.js`
- Modify: `screens/RiskDetailScreen.js`

- [ ] **Step 1: สีและข้อความ**

`constants/theme.js` ใน `COLORS` ต่อจาก `userLocation: '#1E88E5',`

```javascript

  /** พื้นป้าย "ข้อมูลทางการ" ใช้ฟ้าอ่อนคู่กับสีหลัก ไม่ใช้สีเขียว เพราะสีเขียวสื่อว่า "ปลอดภัย" */
  verifiedBackground: '#E3F2FD',
```

`constants/config.js` ต่อท้ายไฟล์

```javascript

/** ข้อความสำหรับจุดที่ยืนยันจากเอกสารทางการแล้ว (เอกสารบทที่ 6.2: แสดงสัญลักษณ์ที่แตกต่างกัน) */
export const VERIFIED_TEXT =
  'ข้อมูลจุดนี้มาจากเอกสารทางการของหน่วยงานรัฐ ดูแหล่งอ้างอิงด้านล่าง ' +
  'ตัวเลขนับเฉพาะเหตุที่มีการรายงาน จำนวนจริงอาจสูงกว่านี้';
```

- [ ] **Step 2: สร้าง `components/VerificationBadge.js`**

```javascript
/**
 * ป้ายบอกว่าข้อมูลจุดนี้ยืนยันจากเอกสารทางการแล้วหรือยัง
 *
 * เอกสารบทที่ 6.2 กำหนดว่าข้อมูลที่ยืนยันแล้วต้อง "แสดงสัญลักษณ์ที่แตกต่างกัน"
 * ใช้ทั้งในการ์ดจุดเสี่ยงและหน้ารายละเอียด ให้หน้าตาเหมือนกันทั้งแอป
 *
 * จงใจไม่ใช้สีเขียวกับป้าย "ข้อมูลทางการ" เพราะสีเขียวสื่อว่าปลอดภัย
 * ข้อมูลทางการแปลว่า "เชื่อถือได้" ไม่ได้แปลว่าปลอดภัย
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function VerificationBadge({ verified }) {
  if (verified) {
    return (
      <View style={styles.verifiedBox}>
        <Text style={styles.verifiedText}>✓ ข้อมูลทางการ</Text>
      </View>
    );
  }
  return <Text style={styles.unverifiedText}>⚠️ ยังไม่ยืนยัน</Text>;
}

const styles = StyleSheet.create({
  verifiedBox: {
    backgroundColor: COLORS.verifiedBackground,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: FONT_SIZES.small,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  unverifiedText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
});
```

- [ ] **Step 3: ใช้ใน `components/RiskPointCard.js`**

เพิ่ม `import VerificationBadge from './VerificationBadge';` ต่อจาก `import RiskBadge from './RiskBadge';`

แทนที่

```javascript
        {/* จุดที่ยังไม่ยืนยันแหล่งที่มา ต้องบอกให้ชัด ไม่ให้เข้าใจผิดว่าเป็นสถิติทางการ */}
        {!point.verified && <Text style={styles.unverified}>⚠️ ยังไม่ยืนยัน</Text>}
```

ด้วย

```javascript
        {/* บอกทุกจุดว่ายืนยันจากเอกสารทางการแล้วหรือยัง ไม่ให้เข้าใจผิดว่าเป็นสถิติทางการ */}
        <VerificationBadge verified={point.verified} />
```

และลบสไตล์ `unverified` ออกจาก `StyleSheet.create`

- [ ] **Step 4: เพิ่มแบบ `verified` ใน `components/Disclaimer.js`** แทนที่ทั้งไฟล์ด้วย

```javascript
/**
 * แถบข้อความกำกับ
 *
 * ตามเอกสารข้อ 7.4: ต้องแสดงข้อความปฏิเสธความรับผิดชอบในหน้าหลักและหน้ารายละเอียด
 * เพื่อชี้แจงว่าแอปนี้เป็นเครื่องมือประกอบการตัดสินใจ ไม่ใช่ระบบเตือนภัยทางการ
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DISCLAIMER_TEXT, UNVERIFIED_TEXT, VERIFIED_TEXT } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const TEXTS = {
  general: DISCLAIMER_TEXT,
  unverified: UNVERIFIED_TEXT,
  verified: '✓ ' + VERIFIED_TEXT,
};

/**
 * @param variant 'general'    = ข้อความปฏิเสธความรับผิดชอบทั่วไป
 *                'unverified' = เตือนว่าจุดนี้ยังไม่ยืนยันแหล่งที่มา
 *                'verified'   = บอกว่าจุดนี้มาจากเอกสารทางการ (สีฟ้า ไม่ใช่สีเตือน)
 */
export default function Disclaimer({ variant = 'general' }) {
  return (
    <View style={[styles.box, variant === 'verified' && styles.verifiedBox]}>
      <Text style={styles.text}>{TEXTS[variant] || DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.warningBackground,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warningBorder,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  verifiedBox: {
    backgroundColor: COLORS.verifiedBackground,
    borderLeftColor: COLORS.primary,
  },
  text: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    lineHeight: 20,
  },
});
```

- [ ] **Step 5: หน้ารายละเอียด `screens/RiskDetailScreen.js`**

แทนที่บรรทัด import ของ react-native และ components ด้วย

```javascript
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RiskBadge from '../components/RiskBadge';
import VerificationBadge from '../components/VerificationBadge';
import Disclaimer from '../components/Disclaimer';
import EmergencyButton from '../components/EmergencyButton';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { useFavorites } from '../hooks/useFavorites';
```

แทนที่

```javascript
  const { findPointById } = useRiskPoints();
  const point = findPointById(pointId);
```

ด้วย

```javascript
  const { findPointById } = useRiskPoints();
  const { isFavorite, toggleFavorite } = useFavorites();
  const point = findPointById(pointId);
```

แทนที่

```javascript
        <View style={styles.badgeRow}>
          <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} size="large" />
        </View>

        {/* จุดที่ยังไม่ยืนยันแหล่งที่มา ต้องเตือนก่อนที่ผู้ใช้จะอ่านสถิติ */}
        {!point.verified && <Disclaimer variant="unverified" />}
```

ด้วย

```javascript
        <View style={styles.badgeRow}>
          <RiskBadge riskLevel={point.riskLevel} score={point.riskScore} size="large" />
          <VerificationBadge verified={point.verified} />
        </View>

        {/* รายการโปรด (เอกสารตาราง 6.1) กดซ้ำเพื่อเอาออก */}
        <Pressable
          style={[styles.favoriteButton, favorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(point.id)}
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'เอาออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
        >
          <Text style={[styles.favoriteText, favorite && styles.favoriteTextActive]}>
            {favorite ? '★ อยู่ในรายการโปรดแล้ว' : '☆ บันทึกเป็นรายการโปรด'}
          </Text>
        </Pressable>

        {/* บอกก่อนที่ผู้ใช้จะอ่านสถิติ ว่าข้อมูลจุดนี้เชื่อถือได้แค่ไหน */}
        <Disclaimer variant={point.verified ? 'verified' : 'unverified'} />
```

เพิ่มบรรทัดนี้ก่อน `return (` ตัวที่สอง (ต่อจาก `const hazard = ...`)

```javascript
  const favorite = isFavorite(point.id);
```

แทนที่สไตล์ `badgeRow` ด้วย และเพิ่มสไตล์ปุ่มต่อจากนั้น

```javascript
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  favoriteButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  favoriteButtonActive: {
    backgroundColor: COLORS.primary,
  },
  favoriteText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  favoriteTextActive: {
    color: COLORS.white,
  },
```

และแทนที่ `import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';` ด้วย

```javascript
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
```

- [ ] **Step 6: ตรวจ**

Run: `npm test` → `pass 173` `fail 0`
Run: `npm run check:imports` → `OK`

- [ ] **Step 7: Commit**

```bash
git add constants/theme.js constants/config.js components/VerificationBadge.js components/Disclaimer.js components/RiskPointCard.js screens/RiskDetailScreen.js
git commit -m "feat: ป้าย ✓ ข้อมูลทางการ แยกจากยังไม่ยืนยัน และปุ่มรายการโปรดในหน้ารายละเอียด"
```

---

## Task 9: สถานที่ยอดนิยมและรายการโปรดในหน้าแรก

**Files:**
- Create: `hooks/usePlaces.js`
- Create: `components/PlaceCard.js`
- Modify: `screens/HomeScreen.js`

- [ ] **Step 1: สร้าง `hooks/usePlaces.js`**

```javascript
/**
 * สถานที่ท่องเที่ยวยอดนิยม พร้อมสรุปจุดเสี่ยงรอบแต่ละแห่ง
 *
 * ใช้ร่วมกันทั้งการ์ดในหน้าแรก ตัวเลือกต้นทางปลายทาง และการเปิดแผนที่ไปที่สถานที่
 * จำนวนจุดเสี่ยงรอบสถานที่นับรวมจุดที่ผู้ใช้บันทึกเองด้วย เพราะคำนวณจาก useRiskPoints
 */

import { useMemo, useCallback } from 'react';
import placesData from '../data/places.json';
import { useRiskPoints } from './useRiskPoints';
import { summarizeRisksNearPlace, searchPlaces as rankPlaces } from '../utils/places';
import { DISTANCE } from '../constants/config';

export function usePlaces() {
  const { allPoints } = useRiskPoints();

  // เติม risk = { count, highest, nearby } ให้ทุกสถานที่
  const places = useMemo(
    () =>
      placesData.map((place) => ({
        ...place,
        risk: summarizeRisksNearPlace(place, allPoints, DISTANCE.PLACE_RISK_RADIUS),
      })),
    [allPoints]
  );

  const findPlaceById = useCallback((id) => places.find((place) => place.id === id) || null, [places]);

  /** ค้นตามชื่อและอำเภอ เรียงตามความเกี่ยวข้อง (ตรรกะอยู่ใน utils/places.js) */
  const searchPlaces = useCallback((query) => rankPlaces(places, query), [places]);

  return { places, findPlaceById, searchPlaces };
}
```

- [ ] **Step 2: สร้าง `components/PlaceCard.js`**

```javascript
/**
 * การ์ดสถานที่ยอดนิยม (เอกสารบทที่ 4)
 *
 * บอกว่ารอบสถานที่นี้มีจุดเสี่ยงกี่จุด และจุดที่อันตรายที่สุดอยู่ระดับไหน
 * ถ้าไม่มีจุดเสี่ยงในระบบ บอกว่า "ยังไม่มีข้อมูล" ไม่บอกว่าปลอดภัย
 * (เหตุผลเดียวกับที่ห้ามใช้สีเขียว: ไม่มีข้อมูล ไม่ได้แปลว่าปลอดภัย)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import RiskBadge from './RiskBadge';
import { DISTANCE } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const RADIUS_LABEL = `${DISTANCE.PLACE_RISK_RADIUS / 1000} กม.`;

/**
 * @param place สถานที่จาก usePlaces (มี risk แล้ว)
 * @param onShowMap กด "ดูบนแผนที่"
 * @param onNavigate กด "นำทางไปที่นี่"
 * @param style ใช้กำหนดความกว้างเมื่ออยู่ในแถวเลื่อนแนวนอน
 */
export default function PlaceCard({ place, onShowMap, onNavigate, style }) {
  const { count, highest } = place.risk;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{place.emoji}</Text>
        <View style={styles.titleBox}>
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>
          <Text style={styles.district}>{place.district}</Text>
        </View>
      </View>

      {count > 0 ? (
        <View style={styles.riskRow}>
          <Text style={styles.riskText}>
            จุดเสี่ยงรอบ {RADIUS_LABEL} {count} จุด · สูงสุด
          </Text>
          <RiskBadge riskLevel={highest.riskLevel} score={highest.riskScore} />
        </View>
      ) : (
        <Text style={styles.noDataText}>ยังไม่มีข้อมูลจุดเสี่ยงในรัศมี {RADIUS_LABEL}</Text>
      )}

      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={onShowMap} accessibilityRole="button">
          <Text style={styles.secondaryText}>🗺️ ดูบนแผนที่</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={onNavigate} accessibilityRole="button">
          <Text style={styles.primaryText}>นำทางไปที่นี่</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  emoji: {
    fontSize: FONT_SIZES.heading,
  },
  titleBox: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  district: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  riskRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  riskText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  noDataText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.white,
    fontWeight: '600',
  },
});
```

- [ ] **Step 3: แก้ `screens/HomeScreen.js`** แทนที่ทั้งไฟล์ด้วย

```javascript
/**
 * หน้าแรก — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้ยังอยู่บ้าน กำลังวางแผน จึงเน้นให้เห็นภาพรวมเร็วที่สุด:
 *   1. ช่องค้นหา (ได้ทั้งสถานที่และจุดเสี่ยง)
 *   2. แถบสรุปว่าเดือนนี้ต้องระวังอะไรเป็นพิเศษ
 *   3. รายการโปรด (แสดงเมื่อผู้ใช้กดดาวไว้)
 *   4. การ์ดสถานที่ยอดนิยม (เอกสารบทที่ 4)
 *   5. การ์ดจุดที่ควรระวังมากที่สุดตอนนี้
 */

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import RiskPointCard from '../components/RiskPointCard';
import PlaceCard from '../components/PlaceCard';
import Disclaimer from '../components/Disclaimer';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useFavorites } from '../hooks/useFavorites';
import { summarizeSeason } from '../utils/season';
import { pickFavoritePoints } from '../utils/favorites';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const [keyword, setKeyword] = useState('');
  const { allPoints, topRiskPoints, searchPoints } = useRiskPoints();
  const { places, searchPlaces } = usePlaces();
  const { favoriteIds } = useFavorites();

  // หัวข้อและเนื้อความของแถบฤดูกาลมาจากข้อมูลชุดเดียวกัน (utils/season.js) จึงไม่ขัดกัน
  const season = summarizeSeason(allPoints, new Date().getMonth() + 1);
  const favoritePoints = pickFavoritePoints(favoriteIds, allPoints);

  const isSearching = keyword.trim().length > 0;
  const placeResults = searchPlaces(keyword);
  const pointResults = searchPoints(keyword);

  function openDetail(pointId) {
    navigation.navigate('RiskDetail', { pointId });
  }

  // requestId เปลี่ยนทุกครั้งที่กด ปลายทางจึงรู้ว่าเป็นคำขอใหม่ แม้กดสถานที่เดิมซ้ำ
  function showPlaceOnMap(place) {
    navigation.navigate('Map', { focusPlaceId: place.id, requestId: Date.now() });
  }

  function navigateToPlace(place) {
    navigation.navigate('RoutePlanner', { destinationPlaceId: place.id, requestId: Date.now() });
  }

  function renderPlaceCard(place, style) {
    return (
      <PlaceCard
        key={place.id}
        place={place}
        style={style}
        onShowMap={() => showPlaceOnMap(place)}
        onNavigate={() => navigateToPlace(place)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="AntacinnHelp" subtitle="รู้ก่อนไป ว่าตรงไหนต้องระวัง" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.searchBox}
          placeholder="ค้นหาสถานที่ เช่น หาดสมิหลา"
          placeholderTextColor={COLORS.textMuted}
          value={keyword}
          onChangeText={setKeyword}
        />

        {isSearching ? (
          <View style={styles.section}>
            {placeResults.length === 0 && pointResults.length === 0 && (
              <Text style={styles.emptyText}>
                ไม่พบสถานที่หรือจุดเสี่ยงที่ตรงกับคำค้นหา ลองพิมพ์ชื่ออำเภอ เช่น หาดใหญ่
              </Text>
            )}

            {placeResults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>สถานที่ ({placeResults.length})</Text>
                {placeResults.map((place) => renderPlaceCard(place))}
              </>
            )}

            {pointResults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>จุดเสี่ยง ({pointResults.length})</Text>
                {pointResults.map((point) => (
                  <RiskPointCard key={point.id} point={point} onPress={() => openDetail(point.id)} />
                ))}
              </>
            )}
          </View>
        ) : (
          <>
            {/* แถบสรุปความเสี่ยงประจำเดือน ปรับข้อความตามข้อมูลจริง */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{season.title}</Text>
              <Text style={styles.seasonText}>{season.body}</Text>
            </View>

            {favoritePoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⭐ รายการโปรด</Text>
                {favoritePoints.map((point) => (
                  <RiskPointCard key={point.id} point={point} onPress={() => openDetail(point.id)} />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>สถานที่ยอดนิยม</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.placeRow}
              >
                {places.map((place) => renderPlaceCard(place, styles.placeCardInRow))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>จุดที่ควรระวังมากที่สุดตอนนี้</Text>
                <Pressable onPress={() => navigation.navigate('Map')}>
                  <Text style={styles.link}>ดูแผนที่ทั้งหมด</Text>
                </Pressable>
              </View>

              {topRiskPoints.map((point) => (
                <RiskPointCard key={point.id} point={point} onPress={() => openDetail(point.id)} />
              ))}
            </View>
          </>
        )}

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  seasonText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  placeRow: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  placeCardInRow: {
    width: 260,
    marginBottom: 0,
  },
  link: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    // ห้ามลิงก์หดตัว ให้หัวข้อทางซ้ายเป็นฝ่ายขึ้นบรรทัดใหม่แทน
    flexShrink: 0,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
});
```

- [ ] **Step 4: ตรวจ**

Run: `npm run check:imports` → `OK`

- [ ] **Step 5: Commit**

```bash
git add hooks/usePlaces.js components/PlaceCard.js screens/HomeScreen.js
git commit -m "feat: หน้าแรกมีสถานที่ยอดนิยม รายการโปรด และค้นหาได้ทั้งสถานที่และจุดเสี่ยง"
```

---

## Task 10: เปิดแผนที่ไปที่สถานที่

**Files:**
- Modify: `components/AppMap.web.js`, `components/AppMap.native.js`
- Modify: `screens/MapScreen.js`

- [ ] **Step 1: prop `highlight` ใน `components/AppMap.web.js`**

ในคอมเมนต์หัวไฟล์ แทนที่บรรทัด `ห้ามแก้ props ของไฟล์นี้โดยไม่แก้ AppMap.native.js ให้ตรงกัน` ด้วย

```javascript
 * props (ต้องเหมือนกันทั้งสองไฟล์ ห้ามแก้ไฟล์เดียว):
 *   region, markers, polyline, userLocation, highlight, onMarkerPress, style
 *   highlight = { lat, lng, label } หมุดสถานที่ที่ผู้ใช้เลือกดู แสดงชื่อค้างไว้
```

เพิ่ม `highlight = null,` ในรายการ props ต่อจาก `userLocation = null,`

เพิ่ม `const highlightRef = useRef(null);` ต่อจาก `const userMarkerRef = useRef(null);`

เพิ่ม effect ต่อจาก effect "จุดสีฟ้าแสดงตำแหน่งผู้ใช้"

```javascript
  // หมุดสถานที่ที่ผู้ใช้เลือกดู (กด "ดูบนแผนที่" จากการ์ดสถานที่) แสดงชื่อค้างไว้ให้เห็นทันที
  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !mapRef.current) return;

    if (highlightRef.current) {
      highlightRef.current.remove();
      highlightRef.current = null;
    }

    if (highlight) {
      highlightRef.current = L.circleMarker([highlight.lat, highlight.lng], {
        radius: 11,
        color: COLORS.primary,
        weight: 4,
        fillColor: COLORS.white,
        fillOpacity: 1,
      })
        .bindTooltip(highlight.label || '', { permanent: true, direction: 'top', offset: [0, -10] })
        .addTo(mapRef.current);
    }
  }, [isMapReady, highlight]);
```

- [ ] **Step 2: prop `highlight` ใน `components/AppMap.native.js`**

ในคอมเมนต์หัวไฟล์ แทนที่บรรทัด `ห้ามแก้ props ของไฟล์นี้โดยไม่แก้ AppMap.web.js ให้ตรงกัน` ด้วยสามบรรทัดเดียวกับ Step 1

เพิ่ม `highlight = null,` ในรายการ props ต่อจาก `userLocation = null,`

เพิ่มก่อนก้อน "วาดจุดตำแหน่งผู้ใช้เอง"

```javascript
      {/* หมุดสถานที่ที่ผู้ใช้เลือกดู กดแล้วขึ้นชื่อสถานที่ */}
      {highlight && (
        <Marker
          coordinate={{ latitude: highlight.lat, longitude: highlight.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          title={highlight.label}
          zIndex={900}
        >
          <View style={styles.highlight} />
        </Marker>
      )}

```

เพิ่มสไตล์ต่อจาก `pin`

```javascript
  highlight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
```

- [ ] **Step 3: `screens/MapScreen.js` รับคำขอจากหน้าแรก** แทนที่ทั้งไฟล์ด้วย

```javascript
/**
 * หน้าแผนที่ — เห็นภาพรวมว่าบริเวณไหนควรระวัง
 *
 * หมุดจะเปลี่ยนสีตามคะแนนความเสี่ยง ณ เวลาปัจจุบัน
 * เช่น จุดที่อันตรายเฉพาะกลางคืน จะเป็นสีเหลืองตอนกลางวัน แต่แดงตอนกลางคืน
 *
 * เปิดมาจากปุ่ม "ดูบนแผนที่" ของการ์ดสถานที่ได้ด้วย (ส่ง focusPlaceId มาทาง params)
 * แผนที่จะเลื่อนไปที่สถานที่นั้น ซูมให้เห็นจุดเสี่ยงในรัศมี 2 กม. และปักหมุดชื่อสถานที่ไว้
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import FilterChips from '../components/FilterChips';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useUserLocation } from '../hooks/useUserLocation';
import { DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** ซูมตอนเปิดดูสถานที่ ประมาณ 5.5 กม. พอเห็นจุดเสี่ยงรอบสถานที่ในรัศมี 2 กม. */
const PLACE_FOCUS_DELTA = 0.05;

export default function MapScreen({ navigation, route }) {
  const [typeFilter, setTypeFilter] = useState([]);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [highlight, setHighlight] = useState(null);

  const { filteredPoints } = useRiskPoints({ typeFilter });
  const { findPlaceById } = usePlaces();
  const { location, fetchCurrentLocation } = useUserLocation();

  // เปิดมาจากการ์ดสถานที่ในหน้าแรก requestId เปลี่ยนทุกครั้งที่กด จึงกดสถานที่เดิมซ้ำได้
  const params = (route && route.params) || {};
  useEffect(() => {
    if (!params.requestId) return;
    const place = findPlaceById(params.focusPlaceId);
    if (!place) return;

    setHighlight({ lat: place.coordinate.lat, lng: place.coordinate.lng, label: place.name });
    setRegion({
      latitude: place.coordinate.lat,
      longitude: place.coordinate.lng,
      latitudeDelta: PLACE_FOCUS_DELTA,
      longitudeDelta: PLACE_FOCUS_DELTA,
    });
    // ตั้งใจให้ทำงานเฉพาะตอนมีคำขอใหม่ ไม่ใช่ทุกครั้งที่ข้อมูลจุดเสี่ยงเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.requestId]);

  /** แปลงจุดเสี่ยงให้อยู่ในรูปแบบที่ AppMap ต้องการ */
  const markers = filteredPoints.map((point) => ({
    id: point.id,
    lat: point.coordinate.lat,
    lng: point.coordinate.lng,
    color: point.riskLevel.color,
    label: point.name,
  }));

  /** ปุ่มกลับมาที่ตำแหน่งตัวเอง */
  async function goToMyLocation() {
    const coordinate = await fetchCurrentLocation();
    if (coordinate) {
      setRegion({
        latitude: coordinate.lat,
        longitude: coordinate.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.filterBar}>
        <FilterChips selectedIds={typeFilter} onChange={setTypeFilter} />
        <Text style={styles.countText}>แสดง {filteredPoints.length} จุด</Text>
      </View>

      <View style={styles.mapContainer}>
        <AppMap
          region={region}
          markers={markers}
          userLocation={location}
          highlight={highlight}
          onMarkerPress={(pointId) => navigation.navigate('RiskDetail', { pointId })}
        />

        {highlight && (
          <View style={styles.highlightChip}>
            <Text style={styles.highlightText} numberOfLines={1}>
              📍 {highlight.label}
            </Text>
            <Pressable onPress={() => setHighlight(null)} hitSlop={8} accessibilityLabel="ซ่อนหมุดสถานที่">
              <Text style={styles.highlightClose}>✕</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.locateButton} onPress={goToMyLocation}>
          <Text style={styles.locateIcon}>📍</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  mapContainer: {
    flex: 1,
  },
  highlightChip: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  highlightText: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  highlightClose: {
    fontSize: FONT_SIZES.subtitle,
    color: COLORS.textMuted,
  },
  locateButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.lg,
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locateIcon: {
    fontSize: FONT_SIZES.title,
  },
});
```

- [ ] **Step 4: ตรวจ**

Run: `npm run check:imports` → `OK`

- [ ] **Step 5: Commit**

```bash
git add components/AppMap.web.js components/AppMap.native.js screens/MapScreen.js
git commit -m "feat: กด ดูบนแผนที่ จากการ์ดสถานที่ แผนที่เลื่อนไปและปักหมุดชื่อสถานที่"
```

---

## Task 11: เลือกต้นทางปลายทางเองในหน้าวางแผนเส้นทาง

**Files:**
- Create: `components/RouteEndpoints.js`
- Create: `components/PlacePicker.js`
- Modify: `screens/RoutePlannerScreen.js`

- [ ] **Step 1: สร้าง `components/RouteEndpoints.js`**

```javascript
/**
 * แถบต้นทางและปลายทางของหน้าวางแผนเส้นทาง
 *
 * กดที่ช่องไหน หน้าจอจะเปิดรายการสถานที่ให้เลือกสำหรับช่องนั้น
 * ปุ่ม ⇅ สลับต้นทางกับปลายทาง (ขากลับ)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

function EndpointRow({ label, endpoint, isActive, isLocating, onPress }) {
  let text = 'แตะเพื่อเลือก';
  if (isLocating) text = 'กำลังหาตำแหน่งของคุณ...';
  else if (endpoint) text = `${endpoint.emoji || '📌'} ${endpoint.name}`;

  return (
    <Pressable
      style={[styles.row, isActive && styles.rowActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${text}`}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {text}
      </Text>
    </Pressable>
  );
}

/**
 * @param activeTarget 'origin' | 'destination' | null ช่องที่กำลังเลือกอยู่ (ไฮไลต์ไว้)
 * @param isLocating กำลังหาตำแหน่ง GPS เพื่อใช้เป็นต้นทาง
 */
export default function RouteEndpoints({
  origin,
  destination,
  activeTarget,
  isLocating,
  onPressOrigin,
  onPressDestination,
  onSwap,
}) {
  return (
    <View style={styles.box}>
      <View style={styles.rows}>
        <EndpointRow
          label="ต้นทาง"
          endpoint={origin}
          isActive={activeTarget === 'origin'}
          isLocating={isLocating}
          onPress={onPressOrigin}
        />
        <EndpointRow
          label="ปลายทาง"
          endpoint={destination}
          isActive={activeTarget === 'destination'}
          onPress={onPressDestination}
        />
      </View>
      <Pressable
        style={styles.swapButton}
        onPress={onSwap}
        accessibilityRole="button"
        accessibilityLabel="สลับต้นทางกับปลายทาง"
      >
        <Text style={styles.swapText}>⇅</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  rows: {
    flex: 1,
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  rowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  rowLabel: {
    width: 56,
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  rowValue: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapText: {
    fontSize: FONT_SIZES.title,
    color: COLORS.primary,
  },
});
```

- [ ] **Step 2: สร้าง `components/PlacePicker.js`**

```javascript
/**
 * รายการสถานที่ให้เลือกเป็นต้นทางหรือปลายทาง พร้อมช่องค้นหา
 *
 * ไม่ค้นหาที่อยู่อิสระทางอินเทอร์เน็ต (geocoding) ตามเอกสารออกแบบระยะที่ 2 ข้อ 7
 * เพราะนโยบายของ Nominatim ไม่ให้แอปเรียกใช้หนัก และแอปต้องใช้งานออฟไลน์ได้
 * จึงเลือกจากรายการสถานที่ที่คัดและตรวจพิกัดไว้แล้วใน data/places.json
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { searchPlaces } from '../utils/places';
import { MY_LOCATION_NAME } from '../utils/routeRequest';
import { DISTANCE } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

const RADIUS_LABEL = `${DISTANCE.PLACE_RISK_RADIUS / 1000} กม.`;

/**
 * @param places สถานที่จาก usePlaces
 * @param showMyLocation แสดงตัวเลือก "ตำแหน่งของฉัน" ไว้บนสุด (ใช้กับช่องต้นทาง)
 */
export default function PlacePicker({ title, places, showMyLocation, onSelectPlace, onSelectMyLocation, onCancel }) {
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;
  const results = isSearching ? searchPlaces(places, query) : places;

  return (
    <View style={styles.box}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchBox}
        placeholder="พิมพ์ชื่อสถานที่ เช่น สมิหลา"
        placeholderTextColor={COLORS.textMuted}
        value={query}
        onChangeText={setQuery}
        autoFocus
      />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {showMyLocation && !isSearching && (
          <Pressable style={styles.row} onPress={onSelectMyLocation} accessibilityRole="button">
            <Text style={styles.emoji}>📍</Text>
            <View style={styles.rowText}>
              <Text style={styles.name}>{MY_LOCATION_NAME}</Text>
              <Text style={styles.meta}>ใช้ตำแหน่งจาก GPS ของเครื่อง</Text>
            </View>
          </Pressable>
        )}

        {results.map((place) => (
          <Pressable
            key={place.id}
            style={styles.row}
            onPress={() => onSelectPlace(place)}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{place.emoji}</Text>
            <View style={styles.rowText}>
              <Text style={styles.name}>{place.name}</Text>
              <Text style={styles.meta}>
                {place.district} · จุดเสี่ยงรอบ {RADIUS_LABEL} {place.risk.count} จุด
              </Text>
            </View>
          </Pressable>
        ))}

        {isSearching && results.length === 0 && (
          <Text style={styles.emptyText}>
            ไม่พบสถานที่ที่ตรงกับคำค้นหา แอปมีเฉพาะสถานที่ยอดนิยมในหาดใหญ่และเมืองสงขลา
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cancelText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  list: {
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  emoji: {
    fontSize: FONT_SIZES.title,
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  meta: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    paddingVertical: SPACING.md,
  },
});
```

- [ ] **Step 3: แก้ `screens/RoutePlannerScreen.js`** แทนที่ทั้งไฟล์ด้วย

```javascript
/**
 * หน้าวางแผนเส้นทาง — ระยะ "ก่อนเดินทาง"
 *
 * ผู้ใช้เลือกต้นทางกับปลายทาง แล้วเห็นล่วงหน้าว่าจะเจอจุดเสี่ยงอะไรบ้างระหว่างทาง
 * เรียงตามลำดับที่จะขับผ่านจริง ไม่ใช่เรียงตามความใกล้เส้นทาง
 *
 * เลือกได้สองแบบ (เอกสารตาราง 3.1 และบทที่ 4 "เลือกต้นทางปลายทาง"):
 *   - เส้นทางแนะนำ: กดชิปเดียวได้ทั้งต้นทางและปลายทาง
 *   - เลือกเอง: ต้นทางเป็น "ตำแหน่งของฉัน" หรือสถานที่ใดก็ได้ ปลายทางเป็นสถานที่ใดก็ได้
 *
 * เปิดมาจากปุ่ม "นำทางไปที่นี่" ในหน้าแรกได้ด้วย (ส่ง destinationPlaceId มาทาง params)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMap from '../components/AppMap';
import RiskPointCard from '../components/RiskPointCard';
import RiskBadge from '../components/RiskBadge';
import RouteEndpoints from '../components/RouteEndpoints';
import PlacePicker from '../components/PlacePicker';
import presetRoutes from '../data/presetRoutes.json';
import { useRiskPoints } from '../hooks/useRiskPoints';
import { usePlaces } from '../hooks/usePlaces';
import { useUserLocation } from '../hooks/useUserLocation';
import { getRouteWithFallback } from '../utils/routing';
import { buildRouteRequest, placeToEndpoint, myLocationToEndpoint } from '../utils/routeRequest';
import { findRiskPointsAlongRoute, calculateRouteRiskScore } from '../utils/routeAnalysis';
import { getRiskLevel } from '../utils/riskScore';
import { isInServiceArea } from '../utils/geo';
import { formatDistance, formatDuration } from '../utils/format';
import { DISTANCE, DEFAULT_REGION } from '../constants/config';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

/** บอกผู้ใช้ตรง ๆ เมื่อเส้นทางไม่ได้มาจากอินเทอร์เน็ต จะได้ไม่เข้าใจผิดว่าเป็นเส้นทางจริง */
const ROUTE_SOURCE_NOTES = {
  offline: '⚠️ เชื่อมต่ออินเทอร์เน็ตไม่ได้ กำลังแสดงเส้นทางโดยประมาณที่เก็บไว้ในเครื่อง',
  straight:
    '⚠️ เชื่อมต่ออินเทอร์เน็ตไม่ได้ และเส้นทางนี้ไม่มีข้อมูลสำรองในเครื่อง ' +
    'กำลังแสดงเส้นตรงระหว่างต้นทางกับปลายทาง ซึ่งไม่ใช่ถนนจริง จุดเสี่ยงที่แสดงเป็นเพียงค่าประมาณ',
};

/** จัดกล้องให้เห็นทั้งต้นทางและปลายทาง */
function regionFor(origin, destination) {
  if (!origin || !destination) return DEFAULT_REGION;
  return {
    latitude: (origin.lat + destination.lat) / 2,
    longitude: (origin.lng + destination.lng) / 2,
    latitudeDelta: Math.abs(origin.lat - destination.lat) * 2 + 0.05,
    longitudeDelta: Math.abs(origin.lng - destination.lng) * 2 + 0.05,
  };
}

export default function RoutePlannerScreen({ navigation, route }) {
  const [origin, setOrigin] = useState(presetRoutes[0].origin);
  const [destination, setDestination] = useState(presetRoutes[0].destination);
  const [pickerTarget, setPickerTarget] = useState(null); // 'origin' | 'destination' | null
  const [isLocating, setIsLocating] = useState(false);
  const [locationNote, setLocationNote] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { allPoints } = useRiskPoints();
  const { places, findPlaceById } = usePlaces();
  const { fetchCurrentLocation } = useUserLocation();

  // ต้นทางหรือปลายทางเปลี่ยน = คำขอเส้นทางใหม่
  // ถ้าตรงกับเส้นทางแนะนำ คำขอจะมีเส้นทางสำรองออฟไลน์ติดมาด้วย (utils/routeRequest.js)
  const { request: routeRequest, problem: routeProblem } = useMemo(
    () => buildRouteRequest(origin, destination, presetRoutes),
    [origin, destination]
  );

  // ดึงเส้นทางใหม่ทุกครั้งที่คำขอเปลี่ยน
  useEffect(() => {
    if (!routeRequest) {
      setRouteResult(null);
      setIsLoading(false);
      return undefined;
    }

    let isCancelled = false;
    setIsLoading(true);
    getRouteWithFallback(routeRequest).then((result) => {
      // ผู้ใช้เปลี่ยนต้นทางปลายทางระหว่างรอ ผลของคำขอเก่าต้องไม่มาทับของใหม่
      if (!isCancelled) {
        setRouteResult(result);
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [routeRequest]);

  /** ใช้ตำแหน่งปัจจุบันเป็นต้นทาง ถ้าหาไม่ได้หรืออยู่นอกพื้นที่ บอกผู้ใช้และคงต้นทางเดิมไว้ */
  async function pickMyLocationAsOrigin() {
    setPickerTarget(null);
    setLocationNote(null);
    setIsLocating(true);
    const coordinate = await fetchCurrentLocation();
    setIsLocating(false);

    if (!coordinate) {
      setLocationNote(
        'หาตำแหน่งปัจจุบันไม่ได้ (ไม่ได้รับอนุญาต หรือสัญญาณ GPS ไม่พอ) ' +
          'จึงยังใช้ต้นทางเดิม แตะช่องต้นทางเพื่อเลือกสถานที่แทน'
      );
      return;
    }
    if (!isInServiceArea(coordinate)) {
      setLocationNote(
        'ตำแหน่งของคุณอยู่นอกพื้นที่หาดใหญ่–สงขลาที่แอปมีข้อมูล ' +
          'จึงยังใช้ต้นทางเดิม แตะช่องต้นทางเพื่อเลือกสถานที่แทน'
      );
      return;
    }
    setOrigin(myLocationToEndpoint(coordinate));
  }

  function selectPlace(place) {
    const endpoint = placeToEndpoint(place);
    if (pickerTarget === 'origin') setOrigin(endpoint);
    else setDestination(endpoint);
    setPickerTarget(null);
  }

  function selectPreset(preset) {
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setLocationNote(null);
  }

  function swapEndpoints() {
    setOrigin(destination);
    setDestination(origin);
  }

  // เปิดมาจากปุ่ม "นำทางไปที่นี่" ในหน้าแรก: ปลายทางเป็นสถานที่นั้น ต้นทางเป็นตำแหน่งปัจจุบัน
  // requestId เปลี่ยนทุกครั้งที่กด จึงกดสถานที่เดิมซ้ำได้
  const params = (route && route.params) || {};
  useEffect(() => {
    if (!params.requestId) return;
    const place = findPlaceById(params.destinationPlaceId);
    if (!place) return;

    setPickerTarget(null);
    setDestination(placeToEndpoint(place));
    pickMyLocationAsOrigin();
    // ตั้งใจให้ทำงานเฉพาะตอนมีคำขอใหม่จากหน้าแรก ไม่ใช่ทุกครั้งที่ข้อมูลเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.requestId]);

  // หาจุดเสี่ยงบนเส้นทาง เรียงตามลำดับที่จะขับผ่าน
  const pointsOnRoute = routeResult
    ? findRiskPointsAlongRoute(routeResult.coordinates, allPoints, DISTANCE.ON_ROUTE_THRESHOLD, {
        destinationRadiusM: DISTANCE.DESTINATION_RADIUS,
      })
    : [];

  // คะแนนความปลอดภัยรวมของเส้นทาง ตามที่เอกสารบทที่ 4 กำหนดให้หน้านี้ต้องแสดง
  const routeRiskScore = calculateRouteRiskScore(pointsOnRoute);
  const routeRiskLevel = getRiskLevel(routeRiskScore);

  const markers = pointsOnRoute.map((item) => ({
    id: item.point.id,
    lat: item.point.coordinate.lat,
    lng: item.point.coordinate.lng,
    color: item.point.riskLevel.color,
    label: item.point.name,
  }));

  /** ส่งเส้นทางไปให้โหมดเดินทาง เพื่อให้รู้ว่าผู้ใช้อยู่ตรงไหนของเส้นทาง */
  function startTrip(mode) {
    if (!routeResult || !routeRequest) return;
    navigation.navigate('TripMode', {
      mode,
      routeCoordinates: routeResult.coordinates,
      routeLabel: routeRequest.label,
    });
  }

  const canStart = Boolean(routeResult) && !isLoading;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <RouteEndpoints
        origin={origin}
        destination={destination}
        activeTarget={pickerTarget}
        isLocating={isLocating}
        onPressOrigin={() => setPickerTarget('origin')}
        onPressDestination={() => setPickerTarget('destination')}
        onSwap={swapEndpoints}
      />
      {locationNote && <Text style={styles.locationNote}>{locationNote}</Text>}

      {pickerTarget ? (
        <PlacePicker
          title={pickerTarget === 'origin' ? 'เลือกต้นทาง' : 'เลือกปลายทาง'}
          places={places}
          showMyLocation={pickerTarget === 'origin'}
          onSelectPlace={selectPlace}
          onSelectMyLocation={pickMyLocationAsOrigin}
          onCancel={() => setPickerTarget(null)}
        />
      ) : (
        <>
          {/* เส้นทางแนะนำ: ทางลัดที่มีเส้นทางสำรองออฟไลน์ */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Text style={styles.chipHint}>แนะนำ</Text>
            {presetRoutes.map((preset) => {
              const isSelected = Boolean(routeRequest) && routeRequest.id === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => selectPreset(preset)}
                >
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.mapContainer}>
            <AppMap
              region={regionFor(origin, destination)}
              markers={markers}
              polyline={routeResult ? routeResult.coordinates : null}
            />
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {routeProblem ? (
              <Text style={styles.problemText}>{routeProblem}</Text>
            ) : isLoading || !routeResult ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>กำลังหาเส้นทาง...</Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>พบจุดเสี่ยง {pointsOnRoute.length} จุดบนเส้นทางนี้</Text>
                  {routeResult.distanceM !== null && (
                    <Text style={styles.summaryMeta}>
                      {formatDistance(routeResult.distanceM)} · {formatDuration(routeResult.durationS)}
                    </Text>
                  )}

                  {/* คะแนนความปลอดภัยรวมของทั้งเส้นทาง */}
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>คะแนนความเสี่ยงรวมของเส้นทาง</Text>
                    <RiskBadge riskLevel={routeRiskLevel} score={routeRiskScore} />
                  </View>
                </View>

                {ROUTE_SOURCE_NOTES[routeResult.source] && (
                  <Text style={styles.offlineNote}>{ROUTE_SOURCE_NOTES[routeResult.source]}</Text>
                )}

                {pointsOnRoute.map((item) => (
                  <RiskPointCard
                    key={item.point.id}
                    point={item.point}
                    distanceLabel={formatDistance(item.distanceAlongRouteM)}
                    onPress={() => navigation.navigate('RiskDetail', { pointId: item.point.id })}
                  />
                ))}

                <View style={styles.startRow}>
                  {/* โหมดจำลอง: สาธิตการเตือนได้โดยไม่ต้องขับรถจริง (แก้ปัญหาในเอกสารบทที่ 7.3) */}
                  <Pressable
                    style={[styles.startButton, !canStart && styles.startButtonDisabled]}
                    disabled={!canStart}
                    onPress={() => startTrip('simulate')}
                  >
                    <Text style={styles.startButtonText}>▶ จำลองการเดินทาง</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.startButton, styles.gpsButton, !canStart && styles.startButtonDisabled]}
                    disabled={!canStart}
                    onPress={() => startTrip('gps')}
                  >
                    <Text style={styles.startButtonText}>📍 เริ่มจริงด้วย GPS</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  locationNote: {
    fontSize: FONT_SIZES.small,
    color: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  chipRow: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipHint: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  chipLabelSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  mapContainer: {
    height: 240,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  problemText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingBox: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  summaryRow: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  summaryText: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryMeta: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  offlineNote: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
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
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.subtitle,
    fontWeight: 'bold',
  },
});
```

- [ ] **Step 4: โหมดเดินทางเสนอโหมดจำลองเมื่อใช้ GPS ไม่ได้** (เอกสารออกแบบข้อ 5: *"ผู้ใช้ไม่ให้สิทธิ์ตำแหน่ง → เสนอโหมดจำลองแทน"*)

ใน `screens/TripModeScreen.js` แทนที่

```javascript
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
```

ด้วย

```javascript
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {/* ใช้ GPS ไม่ได้แต่มีเส้นทางอยู่แล้ว เสนอให้ดูการเตือนแบบจำลองแทน */}
      {errorMessage && routeCoordinates && (
        <Pressable style={styles.fallbackButton} onPress={() => navigation.setParams({ mode: 'simulate' })}>
          <Text style={styles.fallbackButtonText}>▶ ใช้โหมดจำลองการเดินทางแทน</Text>
        </Pressable>
      )}
```

และเพิ่มสไตล์ต่อจาก `errorText`

```javascript
  fallbackButton: {
    marginHorizontal: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  fallbackButtonText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
```

เปลี่ยน `mode` ผ่าน params แล้ว hook GPS ถูกปิด hook จำลองถูกเปิด และ effect เล่นอัตโนมัติทำงานเอง ไม่ต้องแก้ตรรกะอื่น

- [ ] **Step 5: ตรวจ**

Run: `npm test` → `pass 173` `fail 0`
Run: `npm run check:imports` → `OK`

- [ ] **Step 6: Commit**

```bash
git add components/RouteEndpoints.js components/PlacePicker.js screens/RoutePlannerScreen.js screens/TripModeScreen.js
git commit -m "feat: เลือกต้นทางปลายทางเองได้ ต้นทางใช้ตำแหน่งปัจจุบันได้ เส้นทางแนะนำยังเป็นทางลัด"
```

---

## Task 12: ตรวจของจริงในเบราว์เซอร์และอัปเดต README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: build ทั้งสองแพลตฟอร์ม**

Run: `npx expo export --platform web` → `Exported: dist`
Run: `grep -c "react-native-maps" dist/_expo/static/js/web/*.js` → `0`
Run: `npx expo export --platform android --output-dir <scratchpad>/android-export` → `Exported`

- [ ] **Step 2: ตรวจที่ขนาดมือถือ 375×812**

เปิดด้วย `cd dist && python -m http.server 8750` ปลอม `navigator.geolocation` ให้คืนตำแหน่งที่กำหนดได้ (`getCurrentPosition` และ `watchPosition`) และครอบ `window.alert` / `window.confirm` ให้บันทึกข้อความลงอาเรย์แทนการเปิดกล่องจริง

| # | ตรวจ | เกณฑ์ผ่าน |
|---|---|---|
| 1 | หน้าแรก | มีหัวข้อ "สถานที่ยอดนิยม" การ์ด 18 ใบ การ์ดหาดสมิหลาบอกจำนวนจุดเสี่ยงรอบ 2 กม. ตรงกับที่คำนวณจากไฟล์ข้อมูล |
| 2 | ค้นหา "หาด" | มีหัวข้อ "สถานที่" ชายหาดสองแห่งขึ้นก่อน และหัวข้อ "จุดเสี่ยง" ต่อท้าย |
| 3 | การ์ดหาดชลาทัศน์ → "🗺️ ดูบนแผนที่" | ไปแท็บแผนที่ มีแถบ "📍 หาดชลาทัศน์" และป้ายชื่อบนแผนที่ |
| 4 | การ์ดหาดชลาทัศน์ → "นำทางไปที่นี่" (GPS ปลอมที่ ม.อ.) | ต้นทาง "📍 ตำแหน่งของฉัน" ปลายทาง "🌊 หาดชลาทัศน์" เส้นทางโหลดได้ และมีหาดชลาทัศน์ในรายการจุดเสี่ยง |
| 5 | GPS ปฏิเสธสิทธิ์ แล้วเลือก "ตำแหน่งของฉัน" | ขึ้นข้อความ "หาตำแหน่งปัจจุบันไม่ได้" ต้นทางเดิมยังอยู่ |
| 6 | GPS ปลอมที่กรุงเทพฯ | ขึ้นข้อความ "อยู่นอกพื้นที่" |
| 7 | แตะช่องปลายทาง พิมพ์ "สมิ" | หาดสมิหลาขึ้นอันดับแรก เลือกแล้วเส้นทางโหลดใหม่ |
| 8 | ต้นทาง ม.อ. ปลายทาง หาดสมิหลา (เลือกเองจากรายการ) | ชิป "ม.อ.หาดใหญ่ → หาดสมิหลา" ถูกไฮไลต์ |
| 9 | ⇅ สลับ | ต้นทางกับปลายทางสลับกัน เส้นทางโหลดใหม่ |
| 10 | ตัดการเชื่อมต่อ OSRM แล้วเลือก ตลาดกิมหยง → หาดชลาทัศน์ | ขึ้นข้อความ "ซึ่งไม่ใช่ถนนจริง" |
| 11 | ต้นทางกับปลายทางเป็นที่เดียวกัน | ขึ้น "ต้นทางกับปลายทางเป็นที่เดียวกัน" ไม่มีปุ่มเริ่มเดินทาง |
| 12 | เลือกเอง แล้วกด "▶ จำลองการเดินทาง" | โหมดเดินทางแสดงชื่อเส้นทางตามที่เลือก |
| 13 | หน้ารายละเอียดน้ำตกโตนงาช้าง กด ☆ | ปุ่มเป็น "★ อยู่ในรายการโปรดแล้ว" หน้าแรกมี "⭐ รายการโปรด" โหลดหน้าใหม่ยังอยู่ กดอีกครั้งหายไป |
| 14 | หน้าบันทึก กดบันทึกโดยไม่กรอกชื่อ | `window.alert` ถูกเรียกด้วย "กรอกข้อมูลไม่ครบ" |
| 15 | บันทึกจุด แล้วกดลบ (confirm ตอบตกลง) | จุดหายจากรายการ |
| 16 | การ์ดจุดเสี่ยงทุกใบ | มีป้าย "⚠️ ยังไม่ยืนยัน" (ป้าย "✓ ข้อมูลทางการ" ตรวจในช่วง D หลังเพิ่มจุดทางการ) |
| 17 | โหมดเดินทาง GPS ที่ถูกปฏิเสธสิทธิ์ | มีปุ่ม "▶ ใช้โหมดจำลองการเดินทางแทน" กดแล้วแถบความคืบหน้าวิ่ง |
| 18 | console | ไม่มี error |

ทุกข้อต้องผ่าน ข้อไหนไม่ผ่านให้แก้แล้วตรวจใหม่

- [ ] **Step 3: อัปเดต README**

ในหัวข้อ "รันเทสต์คณิตศาสตร์" แทนที่ `pass 138` ด้วย `pass 173`

ในตาราง "โครงสร้าง" แทนที่แถว `utils/` และ `data/` ด้วย

```markdown
| `utils/` | คณิตศาสตร์ล้วน **ห้าม import react เด็ดขาด** | 169 เทสต์ |
| `data/` | จุดเสี่ยง สถานที่ยอดนิยม เส้นทางสำรองออฟไลน์ และที่มาของข้อมูล (`SOURCES.md`) | 4 เทสต์ ตรวจทุกไฟล์ตามกติกา |
```

ในตาราง "สถานะการตรวจสอบ" แทนที่ `| เทสต์ทั้งหมด | 138/138 ผ่าน (รวมตรวจไฟล์ข้อมูล) |` ด้วย `| เทสต์ทั้งหมด | 173/173 ผ่าน (รวมตรวจไฟล์ข้อมูล) |` แก้จำนวนบรรทัด import ในแถว `npm run check:imports` ตามผลจริง และต่อท้ายตารางด้วย

```markdown
| การ์ดสถานที่ยอดนิยม 18 แห่ง | จำนวนจุดเสี่ยงรอบ 2 กม. ตรงกับที่คำนวณจากไฟล์ข้อมูล |
| นำทางไปหาดชลาทัศน์จากตำแหน่งปัจจุบัน | ได้เส้นทางจริงและเห็นจุดเสี่ยงบนเส้นทาง |
| ไม่มีอินเทอร์เน็ต + เส้นทางที่ไม่มีข้อมูลสำรอง | บอกชัดว่าเป็นเส้นตรง ไม่ใช่ถนนจริง |
| รายการโปรด | กดดาวแล้วขึ้นหน้าแรกทันที และยังอยู่หลังโหลดหน้าใหม่ |
| ลบจุดที่บันทึกเองบนเว็บ | ลบได้ (เดิมลบไม่ได้เพราะกล่องยืนยันไม่ขึ้น) |
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README บอกผลตรวจการเลือกต้นทางปลายทาง สถานที่ยอดนิยม และรายการโปรด"
```
